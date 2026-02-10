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
                let walletUploadFailed = false;
                let transactionUploadFailed = false;

                // Simple check: If local has data but DB result is empty (or smaller), implies we might have guest data
                const localWalletsToUpload = wallets.filter(w => !dbWallets?.find(dw => dw.id === w.id));
                const localTransactionsToUpload = transactions.filter(t => !dbTransactions?.find(dt => dt.id === t.id));

                if (localWalletsToUpload.length > 0) {
                    const walletsPayload = localWalletsToUpload.map(w => ({
                        ...w,
                        user_id: user.id,
                        // Ensure types match DB
                        created_at: w.createdAt ? new Date(w.createdAt).toISOString() : new Date().toISOString()
                    }));

                    // Remove client-side only fields or format them if needed
                    const cleanWallets = walletsPayload.map(({ id, user_id, name, type, balance, currency, icon, color, created_at }) => ({
                        id, user_id, name, type, balance, currency, icon, color, created_at
                    }));

                    const { error: uploadError } = await supabase.from('wallets').upsert(cleanWallets);
                    if (uploadError) {
                        console.error('Error syncing wallets:', uploadError);
                        walletUploadFailed = true;
                    } else {
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
                    if (uploadError) {
                        console.error('Error syncing transactions:', uploadError);
                        transactionUploadFailed = true;
                    } else {
                        hasChanges = true;
                        toast.success(`Synced ${localTransactionsToUpload.length} transactions to cloud`);
                    }
                }

                // 3. Logic to update store
                if (hasChanges && !walletUploadFailed && !transactionUploadFailed) {
                    // Perfect sync, fetch authoritative state
                    const { data: finalWallets } = await supabase.from('wallets').select('*').eq('user_id', user.id);
                    const { data: finalTransactions } = await supabase.from('transactions').select('*').eq('user_id', user.id);

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
                    // Partial sync or No sync needed.
                    // If upload failed, we MUST MERGE db data with local data to avoid losing local changes.
                    // If no sync needed, we just use db data (which should cover everything, or be empty).

                    let mergedWallets = (dbWallets || []).map((w: any) => ({
                        ...w,
                        createdAt: w.created_at ? new Date(w.created_at) : new Date(),
                    }));

                    let mergedTransactions = (dbTransactions || []).map((t: any) => ({
                        ...t,
                        walletId: t.wallet_id,
                        categoryId: t.category_id,
                        date: new Date(t.date),
                    }));

                    if (walletUploadFailed) {
                        // Merge missing local wallets back in
                        const missingWallets = localWalletsToUpload.filter(lw => !mergedWallets.find(mw => mw.id === lw.id));
                        mergedWallets = [...mergedWallets, ...missingWallets];
                        toast.error("Failed to sync some wallets, keeping local copy.");
                    }

                    if (transactionUploadFailed) {
                        // Merge missing local transactions back in
                        const missingTransactions = localTransactionsToUpload.filter(lt => !mergedTransactions.find(mt => mt.id === lt.id));
                        mergedTransactions = [...mergedTransactions, ...missingTransactions];

                        // Update balances for wallets that exist in DB but don't have this transaction yet
                        missingTransactions.forEach(t => {
                            const walletIndex = mergedWallets.findIndex(w => w.id === t.walletId);
                            if (walletIndex !== -1) {
                                const wallet = mergedWallets[walletIndex];
                                // Only update if this wallet came from DB (meaning it needs the transaction effect applied)
                                // If it's a purely local wallet (newly created and failed to sync), it presumably already has the correct balance from the store state.
                                const isFromDb = dbWallets?.find(dw => dw.id === wallet.id);

                                if (isFromDb) {
                                    const amount = Number(t.amount);
                                    let newBalance = wallet.balance;

                                    if (t.type === 'income') {
                                        newBalance += amount;
                                    } else if (t.type === 'expense') {
                                        newBalance -= amount;
                                    }

                                    mergedWallets[walletIndex] = { ...wallet, balance: newBalance };
                                }
                            }
                        });

                        toast.error("Failed to sync some transactions, keeping local copy.");
                    }

                    setWallets(mergedWallets);
                    setTransactions(mergedTransactions);
                }

            } catch (error: any) {
                console.error('Data sync failed:', error);

                let errorMessage = 'Failed to sync data';
                if (error instanceof Error) {
                    errorMessage = `Sync Error: ${error.message}`;
                } else if (typeof error === 'object' && error !== null && 'message' in error) {
                    errorMessage = `Sync Error: ${(error as any).message}`;
                } else if (typeof error === 'string') {
                    errorMessage = `Sync Error: ${error}`;
                }

                if (errorMessage.includes('Failed to fetch')) {
                    errorMessage = 'Sync Error: Network request failed. Check your connection.';
                }

                toast.error(errorMessage);
            }
        };

        syncData();
    }, [user, setWallets, setTransactions]);

    return null;
}
