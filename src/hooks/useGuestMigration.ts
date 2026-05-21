import { useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { useStore } from '@/store/useStore';
import { supabase } from '@/lib/supabase';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

let isMigrating = false;

export function useGuestMigration() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { 
    wallets, transactions, categories, settlements,
    setWallets, setTransactions, setCategories, setSettlements
  } = useStore();

  useEffect(() => {
    if (!user) return;
    if (isMigrating) return;

    // Check if there is guest data to migrate
    const hasGuestData = wallets.length > 0 || transactions.length > 0 || settlements.length > 0;
    
    // If no local data, nothing to migrate. We clear local state to be safe, 
    // although React Query will be the source of truth anyway.
    if (!hasGuestData) {
      // It's already empty, but just ensure categories are default
      return;
    }

    const migrateData = async () => {
      isMigrating = true;
      let toastId;
      try {
        toastId = toast.loading('Syncing your local data to the cloud...');

        // 1. Wallets
        if (wallets.length > 0) {
          const walletsPayload = wallets.map(w => ({
            id: w.id,
            user_id: user.id,
            name: w.name,
            type: w.type,
            balance: w.balance,
            currency: w.currency,
            icon: w.icon,
            color: w.color,
            created_at: w.createdAt instanceof Date ? w.createdAt.toISOString() : new Date().toISOString()
          }));
          const { error } = await supabase.from('wallets').upsert(walletsPayload);
          if (error) throw new Error(`Wallets sync failed: ${error.message}`);
        }

        // 2. Categories (custom categories only, or all to ensure IDs match)
        if (categories.length > 0) {
          const categoriesPayload = categories.map(c => ({
            id: `${user.id}_${c.id}`,
            user_id: user.id,
            name: c.name,
            icon: c.icon,
            color: c.color,
            type: c.type
          }));
          const { error } = await supabase.from('categories').upsert(categoriesPayload);
          if (error) throw new Error(`Categories sync failed: ${error.message}`);
        }

        // 3. Transactions
        if (transactions.length > 0) {
          const transactionsPayload = transactions.map(t => ({
            id: t.id,
            user_id: user.id,
            wallet_id: t.walletId,
            amount: t.amount,
            type: t.type,
            category_id: `${user.id}_${t.categoryId}`,
            reason: t.reason,
            date: t.date instanceof Date ? t.date.toISOString() : new Date(t.date).toISOString(),
            notes: t.notes,
            receipt_url: t.receiptUrl ?? null,
          }));
          const { error } = await supabase.from('transactions').upsert(transactionsPayload);
          if (error) throw new Error(`Transactions sync failed: ${error.message}`);
        }

        // 4. Settlements
        if (settlements.length > 0) {
          const settlementsPayload = settlements.map(s => ({
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
            receipt_url: s.receiptUrl ?? null,
            created_at: s.createdAt instanceof Date ? s.createdAt.toISOString() : new Date().toISOString(),
            updated_at: s.updatedAt instanceof Date ? s.updatedAt.toISOString() : new Date().toISOString()
          }));
          const { error } = await supabase.from('settlements').upsert(settlementsPayload);
          if (error) throw new Error(`Settlements sync failed: ${error.message}`);
        }

        toast.success('All local data synced successfully!', { id: toastId });

        // Clear guest data from Zustand so we don't migrate it again on next login
        setWallets([]);
        setTransactions([]);
        setSettlements([]);
        // We keep categories as they have defaults, or we could reset them to DEFAULT_CATEGORIES.

        // Invalidate React Query to fetch the newly merged data
        queryClient.invalidateQueries();

      } catch (error: any) {
        console.error('Migration failed:', error);
        toast.error(`Migration failed: ${error.message}`, { id: toastId });
      } finally {
        isMigrating = false;
      }
    };

    migrateData();
  }, [user]);

  return null;
}
