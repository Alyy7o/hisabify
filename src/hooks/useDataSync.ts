import { useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { useStore } from '@/store/useStore';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export function useDataSync() {
    const { user } = useAuth();
    const {
        wallets,
        transactions,
        setWallets,
        setTransactions
    } = useStore();

    useEffect(() => {
        if (!user) return;

        const syncData = async () => {
            try {
                // 1. Fetch data from Supabase
                const { data: dbWallets, error: walletsError } = await supabase
                    .from('wallets')
                    .select('*')
                    .eq('user_id', user.id);

                if (walletsError) throw walletsError;

                const { data: dbTransactions, error: transactionsError } = await supabase
                    .from('transactions')
                    .select('*')
                    .eq('user_id', user.id);

                if (transactionsError) throw transactionsError;

                // 2. Check for local data that needs to be synced (Guest -> Login transition)
                // We assume any wallet/transaction in local store that is NOT in DB needs to be uploaded
                // HOWEVER, strictly speaking, we should only upload if it was created locally.
                // For simplicity, we'll upload everything from local that isn't in DB if DB is empty,
                // OR we can just merge.

                // Strategy: "Smart Merge"
                // If DB is empty, upload all local data.
                // If DB has data, we append local data that isn't connected yet? 
                // Risk: Duplication.
                // Safer Strategy for "Guest -> Login":
                // If we detect local data and the user just logged in:
                // We upload local data to the server.

                let newWallets = [...(dbWallets || [])];
                let newTransactions = [...(dbTransactions || [])];
                let hasChanges = false;

                // Simple check: If local has data but DB result is empty (or smaller), implies we might have guest data
                const localWalletsToUpload = wallets.filter(w => !dbWallets?.find(dw => dw.id === w.id));
                const localTransactionsToUpload = transactions.filter(t => !dbTransactions?.find(dt => dt.id === t.id));

                if (localWalletsToUpload.length > 0) {
                    const walletsPayload = localWalletsToUpload.map(w => ({
                        ...w,
                        user_id: user.id,
                        // Ensure types match DB
                        created_at: new Date().toISOString() // Assuming w.createdAt handles this?
                    }));

                    // Remove client-side only fields or format them if needed
                    const cleanWallets = walletsPayload.map(({ id, name, type, balance, currency, icon, color }) => ({
                        id, user_id: user.id, name, type, balance, currency, icon, color
                    }));

                    const { error: uploadError } = await supabase.from('wallets').upsert(cleanWallets);
                    if (uploadError) console.error('Error syncing wallets:', uploadError);
                    else {
                        hasChanges = true;
                        toast.success(`Synced ${localWalletsToUpload.length} wallets to cloud`);
                    }
                }

                if (localTransactionsToUpload.length > 0) {
                    const cleanTransactions = localTransactionsToUpload.map(({ id, walletId, amount, type, categoryId, reason, date, notes }) => ({
                        id,
                        user_id: user.id,
                        wallet_id: walletId,
                        amount,
                        type,
                        category_id: categoryId,
                        reason,
                        date: new Date(date).toISOString(),
                        notes
                    }));

                    const { error: uploadError } = await supabase.from('transactions').upsert(cleanTransactions);
                    if (uploadError) console.error('Error syncing transactions:', uploadError);
                    else {
                        hasChanges = true;
                        toast.success(`Synced ${localTransactionsToUpload.length} transactions to cloud`);
                    }
                }

                // 3. If we uploaded new data, refuse the fetch to get the complete set
                if (hasChanges) {
                    const { data: finalWallets } = await supabase.from('wallets').select('*').eq('user_id', user.id);
                    const { data: finalTransactions } = await supabase.from('transactions').select('*').eq('user_id', user.id);

                    // Map keys from snake_case (DB) to camelCase (Store)
                    if (finalWallets) {
                        const mappedWallets = finalWallets.map((w: any) => ({
                            ...w,
                            createdAt: w.created_at ? new Date(w.created_at) : new Date(),
                        }));
                        setWallets(mappedWallets);
                    }
                    if (finalTransactions) {
                        const mappedTransactions = finalTransactions.map((t: any) => ({
                            ...t,
                            walletId: t.wallet_id,
                            categoryId: t.category_id,
                            date: new Date(t.date),
                        }));
                        setTransactions(mappedTransactions);
                    }
                } else {
                    // Just set what we fetched, but mapped
                    const mappedWallets = (dbWallets || []).map((w: any) => ({
                        ...w,
                        createdAt: w.created_at ? new Date(w.created_at) : new Date(),
                    }));
                    setWallets(mappedWallets);

                    const mappedTransactions = (dbTransactions || []).map((t: any) => ({
                        ...t,
                        walletId: t.wallet_id,
                        categoryId: t.category_id,
                        date: new Date(t.date),
                    }));
                    setTransactions(mappedTransactions);
                }

            } catch (error) {
                console.error('Data sync failed:', error);
                toast.error('Failed to sync data');
            }
        };

        syncData();
    }, [user]); // Run on user change (login)

    return null;
}
