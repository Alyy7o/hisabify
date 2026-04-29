import { useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { useStore } from '@/store/useStore';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Settlement } from '@/lib/types';

let isSyncing = false;
let lastSyncedUserId: string | null = null;

export function useDataSync() {
    const { user } = useAuth();
    const {
        wallets,
        transactions,
        categories,
        settlements,
        setWallets,
        setTransactions,
        setCategories,
        setSettlements
    } = useStore();

    useEffect(() => {
        if (!user) return;
        if (isSyncing) return;
        if (lastSyncedUserId === user.id) return;

        const syncData = async () => {
            isSyncing = true;
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

                const { data: dbCategories, error: categoriesError } = await supabase
                    .from('categories')
                    .select('*')
                    .eq('user_id', user.id);

                if (categoriesError) throw categoriesError;

                const { data: dbSettlements, error: settlementsError } = await supabase
                    .from('settlements')
                    .select('*')
                    .eq('user_id', user.id);

                if (settlementsError) throw settlementsError;

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
                let categoryUploadFailed = false;
                let settlementUploadFailed = false;
                let walletSyncError: any = null;
                let transactionSyncError: any = null;
                let categorySyncError: any = null;
                let settlementSyncError: any = null;

                // Simple check: If local has data but DB result is empty (or smaller), implies we might have guest data
                const localWalletsToUpload = wallets.filter(w => !dbWallets?.find(dw => dw.id === w.id));
                const localCategoriesToUpload = categories.filter(c => !dbCategories?.find(dc => dc.id === c.id));
                const localTransactionsToUpload = transactions.filter(t => !dbTransactions?.find(dt => dt.id === t.id));
                const localSettlementsToUpload = settlements.filter(s => !dbSettlements?.find(ds => ds.id === s.id));

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
                        walletSyncError = uploadError;
                    } else {
                        hasChanges = true;
                        toast.success(`Synced ${localWalletsToUpload.length} wallets to cloud`);
                    }
                }

                if (localCategoriesToUpload.length > 0) {
                    const categoriesPayload = localCategoriesToUpload.map(c => ({
                        id: `${user.id}_${c.id}`,
                        user_id: user.id,
                        name: c.name,
                        icon: c.icon,
                        color: c.color,
                        type: c.type
                    }));

                    const { error: uploadError } = await supabase.from('categories').upsert(categoriesPayload);
                    if (uploadError) {
                        console.error('Error syncing categories:', uploadError);
                        categoryUploadFailed = true;
                        categorySyncError = uploadError;
                    } else {
                        hasChanges = true;
                        toast.success(`Synced ${localCategoriesToUpload.length} categories to cloud`);
                    }
                }

                if (localSettlementsToUpload.length > 0) {
                    const settlementsPayload = localSettlementsToUpload.map(s => ({
                        id: s.id,
                        user_id: user.id,
                        person_name: s.personName,
                        title: s.title,
                        kind: s.kind,
                        total_amount: s.totalAmount,
                        paid_amount: s.paidAmount,
                        remaining_amount: s.remainingAmount,
                        status: s.status,
                        due_date: s.dueDate ? new Date(s.dueDate).toISOString() : null,
                        wallet_id: s.walletId,
                        notes: s.notes,
                        split_total_amount: s.splitTotalAmount,
                        split_people_count: s.splitPeopleCount,
                        your_share: s.yourShare,
                        movements: s.movements,
                        created_at: s.createdAt ? new Date(s.createdAt).toISOString() : new Date().toISOString(),
                        updated_at: s.updatedAt ? new Date(s.updatedAt).toISOString() : new Date().toISOString()
                    }));

                    const { error: uploadError } = await supabase.from('settlements').upsert(settlementsPayload);
                    if (uploadError) {
                        console.error('Error syncing settlements:', uploadError);
                        settlementUploadFailed = true;
                        settlementSyncError = uploadError;
                    } else {
                        hasChanges = true;
                        toast.success(`Synced ${localSettlementsToUpload.length} settlements to cloud`);
                    }
                }

                if (localTransactionsToUpload.length > 0) {
                    // 2.1 Re-fetch categories to be absolutely sure what we have on server
                    const { data: currentDbCategories } = await supabase
                        .from('categories')
                        .select('id')
                        .eq('user_id', user.id);

                    const validCategoryIds = new Set([
                        ...(currentDbCategories?.map(c => c.id) || []),
                        ...localCategoriesToUpload.map(c => `${user.id}_${c.id}`) // These were just uploaded hopefully
                    ]);

                    // Ensure 'other' category exists if we need to fallback
                    if (!validCategoryIds.has(`${user.id}_other`)) {
                        console.log("Fallback category 'other' missing. Creating it...");
                        const fallbackCategory = {
                            id: `${user.id}_other`,
                            user_id: user.id,
                            name: 'Other',
                            icon: 'Box',
                            color: 'hsl(0, 0%, 50%)',
                            type: 'both'
                        };
                        const { error: fallbackError } = await supabase.from('categories').upsert(fallbackCategory);
                        if (fallbackError) {
                            console.error("Failed to create fallback category:", fallbackError);
                            // If this fails, next upsert might fail too, but we try.
                        } else {
                            validCategoryIds.add(`${user.id}_other`);
                        }
                    }

                    const cleanTransactions = localTransactionsToUpload.map(({ id, walletId, amount, type, categoryId, reason, date, notes }) => {
                        let finalCategoryId = categoryId;
                        let finalNotes = notes || '';

                        if (!validCategoryIds.has(`${user.id}_${categoryId}`)) {
                            console.warn(`Transaction ${id} has orphaned category ${categoryId}. Reassigning to 'other'.`);
                            finalCategoryId = 'other';
                            finalNotes = `${finalNotes} [System: Category was missing, originally ${categoryId}]`.trim();
                        }

                        return {
                            id,
                            user_id: user.id,
                            wallet_id: walletId,
                            amount,
                            type,
                            category_id: `${user.id}_${finalCategoryId}`,
                            reason,
                            date: new Date(date).toISOString(),
                            notes: finalNotes
                        };
                    });

                    const { error: uploadError } = await supabase.from('transactions').upsert(cleanTransactions);
                    if (uploadError) {
                        console.error('Error syncing transactions:', uploadError);
                        transactionUploadFailed = true;
                        transactionSyncError = uploadError;
                    } else {
                        hasChanges = true;
                        toast.success(`Synced ${localTransactionsToUpload.length} transactions to cloud`);

                        // Optional: If we had to fix transactions, maybe alert the user
                        const fixedCount = cleanTransactions.filter(t => t.category_id === 'other' && t.category_id !== localTransactionsToUpload.find(old => old.id === t.id)?.categoryId).length;
                        if (fixedCount > 0) {
                            toast.info(`Fixed ${fixedCount} transactions with missing categories`);
                        }
                    }
                }

                // 3. Logic to update store
                // Ensure we don't proceed to update store if critical syncs failed, but we might want partial updates?
                // Actually, we should probably update what we can.

                if (hasChanges && !walletUploadFailed && !transactionUploadFailed && !categoryUploadFailed && !settlementUploadFailed) {
                    // Perfect sync, fetch authoritative state
                    const { data: finalWallets } = await supabase.from('wallets').select('*').eq('user_id', user.id);
                    const { data: finalCategories } = await supabase.from('categories').select('*').eq('user_id', user.id);
                    const { data: finalTransactions } = await supabase.from('transactions').select('*').eq('user_id', user.id);
                    const { data: finalSettlements } = await supabase.from('settlements').select('*').eq('user_id', user.id);

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
                            categoryId: t.category_id.replace(`${user.id}_`, ''),
                            date: new Date(t.date),
                        }));
                        setTransactions(mappedTransactions);
                    }
                    if (finalCategories) {
                        const mappedCategories = finalCategories.map((c: any) => ({
                            ...c,
                            id: c.id.replace(`${user.id}_`, '')
                        }));
                        setCategories(mappedCategories as any);
                    }
                    if (finalSettlements) {
                        const mappedSettlements: Settlement[] = finalSettlements.map((s: any) => ({
                            id: s.id,
                            personName: s.person_name,
                            title: s.title,
                            kind: s.kind,
                            totalAmount: Number(s.total_amount),
                            paidAmount: Number(s.paid_amount),
                            remainingAmount: Number(s.remaining_amount),
                            status: s.status,
                            dueDate: s.due_date ? new Date(s.due_date) : undefined,
                            walletId: s.wallet_id,
                            notes: s.notes,
                            splitTotalAmount: s.split_total_amount ? Number(s.split_total_amount) : undefined,
                            splitPeopleCount: s.split_people_count ? Number(s.split_people_count) : undefined,
                            yourShare: s.your_share ? Number(s.your_share) : undefined,
                            movements: s.movements || [],
                            createdAt: new Date(s.created_at),
                            updatedAt: new Date(s.updated_at),
                        }));
                        setSettlements(mappedSettlements);
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
                        categoryId: t.category_id ? t.category_id.replace(`${user.id}_`, '') : '',
                        date: new Date(t.date),
                    }));

                    let mergedCategories = (dbCategories || []).map((c: any) => ({
                        ...c,
                        id: c.id.replace(`${user.id}_`, '')
                    }));

                    let mergedSettlements: Settlement[] = (dbSettlements || []).map((s: any) => ({
                        id: s.id,
                        personName: s.person_name,
                        title: s.title,
                        kind: s.kind,
                        totalAmount: Number(s.total_amount),
                        paidAmount: Number(s.paid_amount),
                        remainingAmount: Number(s.remaining_amount),
                        status: s.status,
                        dueDate: s.due_date ? new Date(s.due_date) : undefined,
                        walletId: s.wallet_id,
                        notes: s.notes,
                        splitTotalAmount: s.split_total_amount ? Number(s.split_total_amount) : undefined,
                        splitPeopleCount: s.split_people_count ? Number(s.split_people_count) : undefined,
                        yourShare: s.your_share ? Number(s.your_share) : undefined,
                        movements: s.movements || [],
                        createdAt: new Date(s.created_at),
                        updatedAt: new Date(s.updated_at),
                    }));

                    if (walletUploadFailed) {
                        // Merge missing local wallets back in
                        const missingWallets = localWalletsToUpload.filter(lw => !mergedWallets.find(mw => mw.id === lw.id));
                        mergedWallets = [...mergedWallets, ...missingWallets];
                        toast.error(`Failed to sync wallets: ${walletSyncError?.message || 'Unknown error'}`);
                    }

                    if (categoryUploadFailed) {
                        const missingCategories = localCategoriesToUpload.filter(lc => !mergedCategories.find(mc => mc.id === lc.id));
                        mergedCategories = [...mergedCategories, ...missingCategories];
                        toast.error(`Failed to sync categories: ${categorySyncError?.message || 'Unknown error'}`);
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

                        toast.error(`Failed to sync transactions: ${transactionSyncError?.message || 'Unknown error'}`);
                    }

                    if (settlementUploadFailed) {
                        const missingSettlements = localSettlementsToUpload.filter(ls => !mergedSettlements.find(ms => ms.id === ls.id));
                        mergedSettlements = [...mergedSettlements, ...missingSettlements];
                        toast.error(`Failed to sync settlements: ${settlementSyncError?.message || 'Unknown error'}`);
                    }

                    setWallets(mergedWallets);
                    setCategories(mergedCategories);
                    setTransactions(mergedTransactions);
                    setSettlements(mergedSettlements);
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
            } finally {
                isSyncing = false;
                lastSyncedUserId = user.id;
            }
        };

        syncData();
    }, [user, setWallets, setTransactions, setCategories, setSettlements]);

    return null;
}
