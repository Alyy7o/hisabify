import { useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/auth/AuthContext';
import { useStore } from '@/store/useStore';
import { Wallet, Transaction, Category, Settlement, SettlementMovement } from '@/lib/types';
import { toast } from 'sonner';

// --- Mappings ---
function mapDbWalletToClient(w: any): Wallet {
  return {
    ...w,
    createdAt: w.created_at ? new Date(w.created_at) : new Date(),
  };
}

function mapClientWalletToDb(w: Wallet, userId: string): any {
  return {
    id: w.id,
    user_id: userId,
    name: w.name,
    type: w.type,
    balance: w.balance,
    currency: w.currency,
    icon: w.icon,
    color: w.color,
    created_at: w.createdAt instanceof Date ? w.createdAt.toISOString() : new Date().toISOString()
  };
}

function mapDbTransactionToClient(t: any, userId: string): Transaction {
  const rawCategoryId = t.category_id.replace(`${userId}_`, '');
  let categoryId = rawCategoryId;
  let toWalletId;
  let type: 'income' | 'expense' | 'transfer' = t.type;
  let notes = t.notes || '';
  
  // Backwards compatibility check: If we previously stored it in category_id (though it failed remotely, it might be in local state)
  if (rawCategoryId.startsWith('transfer_')) {
    categoryId = 'transfer';
    toWalletId = rawCategoryId.replace('transfer_', '');
    type = 'transfer';
  } else if (categoryId === 'transfer' && notes.includes('[DEST:')) {
    type = 'transfer';
    const destMatch = notes.match(/\[DEST:([a-zA-Z0-9-]+)\]/);
    if (destMatch) {
      toWalletId = destMatch[1];
      notes = notes.replace(destMatch[0], '').trim();
    }
  }

  return {
    ...t,
    walletId: t.wallet_id,
    categoryId,
    toWalletId,
    type,
    notes,
    receiptUrl: t.receipt_url ?? undefined,
    date: new Date(t.date),
  };
}

function mapClientTransactionToDb(t: Transaction, userId: string): any {
  let dbCategoryId = `${userId}_${t.categoryId}`;
  
  let notes = t.notes;
  if (t.type === 'transfer' && t.toWalletId) {
     dbCategoryId = `${userId}_transfer`;
     notes = notes ? `${notes}\n\n[DEST:${t.toWalletId}]` : `[DEST:${t.toWalletId}]`;
  }

  return {
    id: t.id,
    user_id: userId,
    wallet_id: t.walletId,
    amount: t.amount,
    type: t.type === 'transfer' ? 'expense' : t.type,
    category_id: dbCategoryId,
    reason: t.reason,
    date: t.date instanceof Date ? t.date.toISOString() : new Date(t.date).toISOString(),
    notes: notes,
    receipt_url: t.receiptUrl ?? null,
  };
}

function mapDbCategoryToClient(c: any, userId: string): Category {
  return {
    ...c,
    id: c.id.replace(`${userId}_`, '')
  };
}

function mapClientCategoryToDb(c: Category, userId: string): any {
  return {
    id: `${userId}_${c.id}`,
    user_id: userId,
    name: c.name,
    icon: c.icon,
    color: c.color,
    type: c.type
  };
}

function mapDbSettlementToClient(s: any): Settlement {
  return {
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
    movements: (s.movements || []).map((m: SettlementMovement) => ({
      ...m,
      date: m.date ? new Date(m.date) : new Date(),
    })),
    receiptUrl: s.receipt_url ?? undefined,
    createdAt: new Date(s.created_at),
    updatedAt: new Date(s.updated_at),
  };
}

/** Single DB transaction: adjust wallet(s) then insert row. Requires migration `create_transaction_with_wallets`. */
async function supabaseRpcCreateTransactionWithWallets(transaction: Transaction, userId: string) {
  const payload = mapClientTransactionToDb(transaction, userId);
  const toWalletId = transaction.type === 'transfer' ? transaction.toWalletId ?? null : null;
  const { error } = await supabase.rpc('create_transaction_with_wallets', {
    p_id: payload.id,
    p_wallet_id: payload.wallet_id,
    p_amount: payload.amount,
    p_type: payload.type,
    p_category_id: payload.category_id,
    p_reason: payload.reason,
    p_date: payload.date,
    p_notes: payload.notes ?? '',
    p_to_wallet_id: toWalletId,
    p_receipt_url: transaction.receiptUrl ?? '',
  });
  if (error) throw error;
}

function mapClientSettlementToDb(s: Settlement, userId: string): any {
  return {
    id: s.id,
    user_id: userId,
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
  };
}

// --- Query Hooks ---

export function useWallets() {
  const { user } = useAuth();
  const guestWallets = useStore(state => state.wallets);
  
  const query = useQuery({
    queryKey: ['wallets', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase.from('wallets').select('*').eq('user_id', user.id);
      if (error) throw error;
      return (data || []).map(mapDbWalletToClient);
    },
    enabled: !!user
  });

  if (!user) {
    return { data: guestWallets, isLoading: false, error: null };
  }
  return query;
}

export function useTransactions() {
  const { user } = useAuth();
  const guestTransactions = useStore(state => state.transactions);
  
  const query = useQuery({
    queryKey: ['transactions', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase.from('transactions').select('*').eq('user_id', user.id);
      if (error) throw error;
      return (data || []).map(t => mapDbTransactionToClient(t, user.id));
    },
    enabled: !!user
  });

  if (!user) {
    return { data: guestTransactions, isLoading: false, error: null };
  }
  return query;
}

export function useCategories() {
  const { user } = useAuth();
  const guestCategories = useStore(state => state.categories);
  
  const query = useQuery({
    queryKey: ['categories', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase.from('categories').select('*').eq('user_id', user.id);
      if (error) throw error;
      return (data || []).map(c => mapDbCategoryToClient(c, user.id));
    },
    enabled: !!user
  });

  if (!user) {
    return { data: guestCategories, isLoading: false, error: null };
  }
  return query;
}

export function useSettlements() {
  const { user } = useAuth();
  const guestSettlements = useStore(state => state.settlements);
  
  const query = useQuery({
    queryKey: ['settlements', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase.from('settlements').select('*').eq('user_id', user.id);
      if (error) throw error;
      return (data || []).map(mapDbSettlementToClient);
    },
    enabled: !!user
  });

  if (!user) {
    return { data: guestSettlements, isLoading: false, error: null };
  }
  return query;
}

// --- Mutation Hooks ---

export function useCreateWallet() {
  const { user } = useAuth();
  const addGuestWallet = useStore(state => state.addWallet);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (wallet: Wallet) => {
      if (!user) {
        addGuestWallet(wallet);
        return wallet;
      }
      const payload = mapClientWalletToDb(wallet, user.id);
      const { error } = await supabase.from('wallets').insert(payload);
      if (error) throw error;
      return wallet;
    },
    onSuccess: () => {
      if (user) queryClient.invalidateQueries({ queryKey: ['wallets', user.id] });
    }
  });
}

export function useUpdateWallet() {
  const { user } = useAuth();
  const updateGuestWallet = useStore(state => state.updateWallet);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string, updates: Partial<Wallet> }) => {
      if (!user) {
        updateGuestWallet(id, updates);
        return;
      }
      
      // Merge with existing for mapping if needed, or just map partial fields.
      // For simplicity, we just convert camelCase to snake_case manually for partial updates.
      const payload: any = {};
      if (updates.name !== undefined) payload.name = updates.name;
      if (updates.type !== undefined) payload.type = updates.type;
      if (updates.balance !== undefined) payload.balance = updates.balance;
      if (updates.currency !== undefined) payload.currency = updates.currency;
      if (updates.icon !== undefined) payload.icon = updates.icon;
      if (updates.color !== undefined) payload.color = updates.color;

      const { error } = await supabase.from('wallets').update(payload).eq('id', id).eq('user_id', user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      if (user) queryClient.invalidateQueries({ queryKey: ['wallets', user.id] });
    }
  });
}

export function useDeleteWallet() {
  const { user } = useAuth();
  const deleteGuestWallet = useStore(state => state.deleteWallet);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!user) {
        deleteGuestWallet(id);
        return;
      }
      const { error } = await supabase.from('wallets').delete().eq('id', id).eq('user_id', user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      if (user) {
        queryClient.invalidateQueries({ queryKey: ['wallets', user.id] });
        queryClient.invalidateQueries({ queryKey: ['transactions', user.id] });
      }
    }
  });
}

export function useCreateTransaction() {
  const { user } = useAuth();
  const addGuestTransaction = useStore(state => state.addTransaction);
  const queryClient = useQueryClient();
  const createInFlightRef = useRef(false);

  return useMutation({
    mutationFn: async (transaction: Transaction) => {
      if (createInFlightRef.current) {
        return transaction;
      }
      createInFlightRef.current = true;

      try {
        if (!user) {
          addGuestTransaction(transaction);
          return transaction;
        }

        await supabaseRpcCreateTransactionWithWallets(transaction, user.id);
        return transaction;
      } finally {
        createInFlightRef.current = false;
      }
    },
    onSuccess: () => {
      if (user) {
        queryClient.invalidateQueries({ queryKey: ['transactions', user.id] });
        queryClient.invalidateQueries({ queryKey: ['wallets', user.id] });
      }
    }
  });
}

export function useUpdateTransaction() {
  const { user } = useAuth();
  const updateGuestTransaction = useStore(state => state.updateTransaction);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string, updates: Partial<Transaction> }) => {
      if (!user) {
        updateGuestTransaction(id, updates);
        return;
      }
      const payload: any = {};
      if (updates.walletId !== undefined) payload.wallet_id = updates.walletId;
      if (updates.amount !== undefined) payload.amount = updates.amount;
      if (updates.type !== undefined) payload.type = updates.type === 'transfer' ? 'expense' : updates.type;
      
      let dbCategoryId = payload.category_id;
      if (updates.categoryId !== undefined) {
        dbCategoryId = `${user.id}_${updates.categoryId}`;
      }
      if (updates.type === 'transfer' && updates.toWalletId) {
        dbCategoryId = `${user.id}_transfer_${updates.toWalletId}`;
      }
      if (dbCategoryId) payload.category_id = dbCategoryId;
      if (updates.reason !== undefined) payload.reason = updates.reason;
      if (updates.date !== undefined) payload.date = updates.date instanceof Date ? updates.date.toISOString() : new Date(updates.date).toISOString();
      if (updates.notes !== undefined) payload.notes = updates.notes;
      if (updates.receiptUrl !== undefined) payload.receipt_url = updates.receiptUrl ?? null;

      // Note: we don't handle balance recalculation here for simplicity, but normally
      // updating a transaction amount/type requires adjusting the wallet balance.
      // This is a known limitation in the current codebase's pushTransactionToSupabase as well.
      
      const { error } = await supabase.from('transactions').update(payload).eq('id', id).eq('user_id', user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      if (user) {
        queryClient.invalidateQueries({ queryKey: ['transactions', user.id] });
        queryClient.invalidateQueries({ queryKey: ['wallets', user.id] });
      }
    }
  });
}

export function useDeleteTransaction() {
  const { user } = useAuth();
  const deleteGuestTransaction = useStore(state => state.deleteTransaction);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!user) {
        deleteGuestTransaction(id);
        return;
      }

      const { error } = await supabase.rpc('delete_transaction_with_wallet_reversal', {
        p_transaction_id: id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      if (user) {
        queryClient.invalidateQueries({ queryKey: ['transactions', user.id] });
        queryClient.invalidateQueries({ queryKey: ['wallets', user.id] });
      }
    }
  });
}

export function useCreateCategory() {
  const { user } = useAuth();
  const addGuestCategory = useStore(state => state.addCategory);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (category: Category) => {
      if (!user) {
        addGuestCategory(category);
        return category;
      }
      const payload = mapClientCategoryToDb(category, user.id);
      const { error } = await supabase.from('categories').insert(payload);
      if (error) throw error;
      return category;
    },
    onSuccess: () => {
      if (user) queryClient.invalidateQueries({ queryKey: ['categories', user.id] });
    }
  });
}

export function useUpdateCategory() {
  const { user } = useAuth();
  const updateGuestCategory = useStore(state => state.updateCategory);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string, updates: Partial<Category> }) => {
      if (!user) {
        updateGuestCategory(id, updates);
        return;
      }
      
      const payload: any = {};
      if (updates.name !== undefined) payload.name = updates.name;
      if (updates.icon !== undefined) payload.icon = updates.icon;
      if (updates.color !== undefined) payload.color = updates.color;
      if (updates.type !== undefined) payload.type = updates.type;

      const { error } = await supabase.from('categories').update(payload).eq('id', `${user.id}_${id}`).eq('user_id', user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      if (user) queryClient.invalidateQueries({ queryKey: ['categories', user.id] });
    }
  });
}

export function useDeleteCategory() {
  const { user } = useAuth();
  const deleteGuestCategory = useStore(state => state.deleteCategory);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!user) {
        deleteGuestCategory(id);
        return;
      }
      const { error } = await supabase.from('categories').delete().eq('id', `${user.id}_${id}`).eq('user_id', user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      if (user) queryClient.invalidateQueries({ queryKey: ['categories', user.id] });
    }
  });
}

export function useCreateSettlement() {
  const { user } = useAuth();
  const addGuestSettlement = useStore(state => state.addSettlement);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settlement: Settlement) => {
      if (!user) {
        addGuestSettlement(settlement);
        return settlement;
      }
      const payload = mapClientSettlementToDb(settlement, user.id);
      const { error } = await supabase.from('settlements').insert(payload);
      if (error) throw error;
      return settlement;
    },
    onSuccess: () => {
      if (user) queryClient.invalidateQueries({ queryKey: ['settlements', user.id] });
    }
  });
}

export function useUpdateSettlement() {
  const { user } = useAuth();
  const updateGuestSettlement = useStore(state => state.updateSettlement);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string, updates: Partial<Settlement> }) => {
      if (!user) {
        updateGuestSettlement(id, updates);
        return;
      }
      
      const payload: any = {};
      if (updates.personName !== undefined) payload.person_name = updates.personName;
      if (updates.title !== undefined) payload.title = updates.title;
      if (updates.kind !== undefined) payload.kind = updates.kind;
      if (updates.totalAmount !== undefined) payload.total_amount = updates.totalAmount;
      if (updates.paidAmount !== undefined) payload.paid_amount = updates.paidAmount;
      if (updates.remainingAmount !== undefined) payload.remaining_amount = updates.remainingAmount;
      if (updates.status !== undefined) payload.status = updates.status;
      if (updates.dueDate !== undefined) payload.due_date = updates.dueDate ? new Date(updates.dueDate).toISOString() : null;
      if (updates.walletId !== undefined) payload.wallet_id = updates.walletId;
      if (updates.notes !== undefined) payload.notes = updates.notes;
      if (updates.splitTotalAmount !== undefined) payload.split_total_amount = updates.splitTotalAmount;
      if (updates.splitPeopleCount !== undefined) payload.split_people_count = updates.splitPeopleCount;
      if (updates.yourShare !== undefined) payload.your_share = updates.yourShare;
      if (updates.movements !== undefined) payload.movements = updates.movements;
      if (updates.receiptUrl !== undefined) payload.receipt_url = updates.receiptUrl ?? null;
      payload.updated_at = new Date().toISOString();

      const { error } = await supabase.from('settlements').update(payload).eq('id', id).eq('user_id', user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      if (user) queryClient.invalidateQueries({ queryKey: ['settlements', user.id] });
    }
  });
}

export function useDeleteSettlement() {
  const { user } = useAuth();
  const deleteGuestSettlement = useStore(state => state.deleteSettlement);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!user) {
        deleteGuestSettlement(id);
        return;
      }
      const { error } = await supabase.from('settlements').delete().eq('id', id).eq('user_id', user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      if (user) queryClient.invalidateQueries({ queryKey: ['settlements', user.id] });
    }
  });
}

export function useRecordSettlementPayment() {
  const { user } = useAuth();
  const recordGuestPayment = useStore(state => state.recordSettlementPayment);
  const queryClient = useQueryClient();
  const paymentInFlightRef = useRef(false);

  return useMutation({
    mutationFn: async ({ settlementId, payload }: {
      settlementId: string;
      payload: {
        amount: number;
        walletId: string;
        date: Date;
        note?: string;
        movementId?: string;
        receiptUrl?: string;
      };
    }) => {
      if (paymentInFlightRef.current) {
        return;
      }
      paymentInFlightRef.current = true;

      try {
        if (!user) {
          recordGuestPayment(settlementId, payload);
          return;
        }

        const { data: settlementData, error: fetchError } = await supabase
          .from('settlements')
          .select('*')
          .eq('id', settlementId)
          .eq('user_id', user.id)
          .single();

        if (fetchError || !settlementData) throw fetchError || new Error('Settlement not found');

        const settlement = mapDbSettlementToClient(settlementData);

        const paymentAmount = payload.amount;
        if (!Number.isFinite(paymentAmount) || paymentAmount <= 0 || paymentAmount > settlement.remainingAmount) {
          throw new Error('Invalid payment amount');
        }

        const movementDirection: SettlementMovement['direction'] = settlement.kind === 'given' ? 'inflow' : 'outflow';
        const transactionType: Transaction['type'] = settlement.kind === 'given' ? 'income' : 'expense';

        const movement: SettlementMovement = {
          id: payload.movementId ?? crypto.randomUUID(),
          settlementId,
          kind: 'payment',
          direction: movementDirection,
          amount: paymentAmount,
          walletId: payload.walletId,
          applyToWallet: true,
          note: payload.note,
          date: payload.date,
          receiptUrl: payload.receiptUrl,
        };

        const updatedMovements = [...settlement.movements, movement];
        const paidAmount = updatedMovements
          .filter((m) => m.kind === 'payment')
          .reduce((sum, m) => sum + m.amount, 0);
        const remainingAmount = Math.max(0, settlement.totalAmount - paidAmount);

        const updatedSettlementDb = {
          movements: updatedMovements,
          paid_amount: paidAmount,
          remaining_amount: remainingAmount,
          status: remainingAmount <= 0 ? 'completed' : 'active',
          updated_at: new Date().toISOString(),
        };

        const { error: updateError } = await supabase
          .from('settlements')
          .update(updatedSettlementDb)
          .eq('id', settlementId)
          .eq('user_id', user.id);

        if (updateError) throw updateError;

        const transaction: Transaction = {
          id: crypto.randomUUID(),
          walletId: payload.walletId,
          categoryId: 'transfer',
          amount: paymentAmount,
          type: transactionType,
          reason: settlement.kind === 'given'
            ? `Settlement received from ${settlement.personName}`
            : `Settlement paid to ${settlement.personName}`,
          notes: payload.note?.trim()
            ? `${settlement.title}\n${payload.note.trim()}`
            : settlement.title,
          date: payload.date,
          receiptUrl: payload.receiptUrl,
        };

        await supabaseRpcCreateTransactionWithWallets(transaction, user.id);
      } finally {
        paymentInFlightRef.current = false;
      }
    },
    onSuccess: () => {
      if (user) {
        queryClient.invalidateQueries({ queryKey: ['settlements', user.id] });
        queryClient.invalidateQueries({ queryKey: ['wallets', user.id] });
        queryClient.invalidateQueries({ queryKey: ['transactions', user.id] });
      }
    }
  });
}
