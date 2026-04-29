import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Wallet, Transaction, Category, Budget, Goal, DEFAULT_CATEGORIES, Settlement, SettlementMovement } from '@/lib/types';
import { toast } from 'sonner';

interface AppState {
  wallets: Wallet[];
  transactions: Transaction[];
  settlements: Settlement[];
  categories: Category[];
  budgets: Budget[];
  goals: Goal[];

  // Bulk Setters (for Sync)
  setWallets: (wallets: Wallet[]) => void;
  setTransactions: (transactions: Transaction[]) => void;
  setSettlements: (settlements: Settlement[]) => void;
  setCategories: (categories: Category[]) => void;

  // Wallet actions
  addWallet: (wallet: Wallet) => void;
  updateWallet: (id: string, wallet: Partial<Wallet>) => void;
  deleteWallet: (id: string) => void;

  // Transaction actions
  addTransaction: (transaction: Transaction) => void;
  updateTransaction: (id: string, transaction: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;

  // Settlement actions
  addSettlement: (settlement: Settlement) => void;
  updateSettlement: (id: string, settlement: Partial<Settlement>) => void;
  deleteSettlement: (id: string) => void;
  recordSettlementPayment: (settlementId: string, payload: {
    amount: number;
    walletId: string;
    date: Date;
    note?: string;
  }) => void;

  // Category actions
  addCategory: (category: Category) => void;
  updateCategory: (id: string, category: Partial<Category>) => void;
  deleteCategory: (id: string) => void;

  // Budget actions
  addBudget: (budget: Budget) => void;
  updateBudget: (id: string, budget: Partial<Budget>) => void;
  deleteBudget: (id: string) => void;

  // Goal actions
  addGoal: (goal: Goal) => void;
  updateGoal: (id: string, goal: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;

  // Computed
  getTotalBalance: () => number;
  getWalletBalance: (walletId: string) => number;
  getMonthlyExpenses: () => number;
  getMonthlyIncome: () => number;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      wallets: [],
      transactions: [],
      settlements: [],
      categories: DEFAULT_CATEGORIES,
      budgets: [],
      goals: [],

      // Bulk Setters
      setWallets: (wallets) => set({ wallets }),
      setTransactions: (transactions) => set({ transactions }),
      setSettlements: (settlements) => set({ settlements }),
      setCategories: (categories) => set({ categories }),

      // Wallet actions
      addWallet: (wallet) => {
        set((state) => ({ wallets: [...state.wallets, wallet] }));
        pushWalletToSupabase(wallet);
      },
      updateWallet: (id, updates) => {
        set((state) => ({
          wallets: state.wallets.map((w) =>
            w.id === id ? { ...w, ...updates } : w
          ),
        }));
        const updatedWallet = get().wallets.find(w => w.id === id);
        if (updatedWallet) pushWalletToSupabase(updatedWallet);
      },
      deleteWallet: (id) => {
        set((state) => ({
          wallets: state.wallets.filter((w) => w.id !== id),
          transactions: state.transactions.filter((t) => t.walletId !== id),
        }));
        deleteWalletFromSupabase(id);
      },

      // Transaction actions
      addTransaction: (transaction) => {
        set((state) => {
          const wallet = state.wallets.find(w => w.id === transaction.walletId);
          if (wallet) {
            const newBalance = transaction.type === 'income'
              ? wallet.balance + transaction.amount
              : wallet.balance - transaction.amount;
            return {
              transactions: [...state.transactions, transaction],
              wallets: state.wallets.map(w =>
                w.id === transaction.walletId
                  ? { ...w, balance: newBalance }
                  : w
              ),
            };
          }
          return { transactions: [...state.transactions, transaction] };
        });
        pushTransactionToSupabase(transaction);
      },
      updateTransaction: (id, updates) => {
        set((state) => ({
          transactions: state.transactions.map((t) =>
            t.id === id ? { ...t, ...updates } : t
          ),
        }));
        const updatedTransaction = get().transactions.find(t => t.id === id);
        if (updatedTransaction) pushTransactionToSupabase(updatedTransaction);
      },
      deleteTransaction: (id) => {
        set((state) => {
          const transaction = state.transactions.find(t => t.id === id);
          if (transaction) {
            const wallet = state.wallets.find(w => w.id === transaction.walletId);
            if (wallet) {
              const adjustment = transaction.type === 'income'
                ? -transaction.amount
                : transaction.amount;
              return {
                transactions: state.transactions.filter(t => t.id !== id),
                wallets: state.wallets.map(w =>
                  w.id === transaction.walletId
                    ? { ...w, balance: w.balance + adjustment }
                    : w
                ),
              };
            }
          }
          return { transactions: state.transactions.filter(t => t.id !== id) };
        });
        deleteTransactionFromSupabase(id);
      },

      // Settlement actions
      addSettlement: (settlement) => {
        set((state) => {
          const normalizedSettlement = normalizeSettlement(settlement);
          return {
            settlements: [...state.settlements, normalizedSettlement],
          };
        });
        const newSettlement = normalizeSettlement(settlement);
        pushSettlementToSupabase(newSettlement);
      },
      updateSettlement: (id, updates) => {
        set((state) => ({
          settlements: state.settlements.map((settlement) => {
            if (settlement.id !== id) {
              return settlement;
            }

            return normalizeSettlement({
              ...settlement,
              ...updates,
              movements: updates.movements ?? settlement.movements,
              updatedAt: new Date(),
            });
          }),
        }));
        const updatedSettlement = get().settlements.find(s => s.id === id);
        if (updatedSettlement) pushSettlementToSupabase(updatedSettlement);
      },
      deleteSettlement: (id) => {
        set((state) => ({
          settlements: state.settlements.filter((settlement) => settlement.id !== id),
        }));
        deleteSettlementFromSupabase(id);
      },
      recordSettlementPayment: (settlementId, payload) => {
        const settlement = get().settlements.find((item) => item.id === settlementId);
        if (!settlement) {
          return;
        }

        const paymentAmount = payload.amount;
        if (!Number.isFinite(paymentAmount) || paymentAmount <= 0 || paymentAmount > settlement.remainingAmount) {
          return;
        }

        const movementDirection: SettlementMovement['direction'] = settlement.kind === 'given' ? 'inflow' : 'outflow';
        const transactionType: Transaction['type'] = settlement.kind === 'given' ? 'income' : 'expense';
        const movement: SettlementMovement = {
          id: crypto.randomUUID(),
          settlementId,
          kind: 'payment',
          direction: movementDirection,
          amount: paymentAmount,
          walletId: payload.walletId,
          applyToWallet: true,
          note: payload.note,
          date: payload.date,
        };

        set((state) => ({
          settlements: state.settlements.map((item) => {
            if (item.id !== settlementId) {
              return item;
            }

            return normalizeSettlement({
              ...item,
              movements: [...item.movements, movement],
              updatedAt: new Date(),
            });
          }),
        }));
        
        const updatedSettlement = get().settlements.find(s => s.id === settlementId);
        if (updatedSettlement) pushSettlementToSupabase(updatedSettlement);

        get().addTransaction({
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
        });
      },

      // Category actions
      addCategory: (category) => {
        set((state) => ({
          categories: [...state.categories, category]
        }));
        pushCategoryToSupabase(category);
      },
      updateCategory: (id, updates) => {
        set((state) => ({
          categories: state.categories.map((c) =>
            c.id === id ? { ...c, ...updates } : c
          ),
        }));
        const updatedCategory = get().categories.find(c => c.id === id);
        if (updatedCategory) pushCategoryToSupabase(updatedCategory);
      },
      deleteCategory: (id) => {
        set((state) => ({
          categories: state.categories.filter((c) => c.id !== id),
        }));
        deleteCategoryFromSupabase(id);
      },

      // Budget actions
      addBudget: (budget) => set((state) => ({
        budgets: [...state.budgets, budget]
      })),
      updateBudget: (id, updates) => set((state) => ({
        budgets: state.budgets.map((b) =>
          b.id === id ? { ...b, ...updates } : b
        ),
      })),
      deleteBudget: (id) => set((state) => ({
        budgets: state.budgets.filter((b) => b.id !== id),
      })),

      // Goal actions
      addGoal: (goal) => set((state) => ({
        goals: [...state.goals, goal]
      })),
      updateGoal: (id, updates) => set((state) => ({
        goals: state.goals.map((g) =>
          g.id === id ? { ...g, ...updates } : g
        ),
      })),
      deleteGoal: (id) => set((state) => ({
        goals: state.goals.filter((g) => g.id !== id),
      })),

      // Computed values
      getTotalBalance: () => {
        return get().wallets.reduce((sum, wallet) => sum + wallet.balance, 0);
      },
      getWalletBalance: (walletId) => {
        const wallet = get().wallets.find(w => w.id === walletId);
        return wallet?.balance ?? 0;
      },
      getMonthlyExpenses: () => {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        return get().transactions
          .filter(t => {
            const date = new Date(t.date);
            return t.type === 'expense' &&
              date.getMonth() === currentMonth &&
              date.getFullYear() === currentYear;
          })
          .reduce((sum, t) => sum + t.amount, 0);
      },
      getMonthlyIncome: () => {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        return get().transactions
          .filter(t => {
            const date = new Date(t.date);
            return t.type === 'income' &&
              date.getMonth() === currentMonth &&
              date.getFullYear() === currentYear;
          })
          .reduce((sum, t) => sum + t.amount, 0);
      },
    }),
    {
      name: 'hisabify-storage',
      // skipHydration REMOVED to fix local persistence
    }
  )
);

// Helper to push to Supabase
async function pushWalletToSupabase(wallet: Wallet) {
  try {
    const session = await import('@/lib/supabase').then(m => m.supabase.auth.getSession());
    if (session.data.session?.user) {
      console.log('Pushing wallet to Supabase:', wallet.name);
      const { id, name, type, balance, currency, icon, color, createdAt } = wallet;
      
      // Safely handle createdAt field conversion
      let created_at: string;
      if (createdAt) {
        try {
          // Handle different formats: Date object, ISO string, or timestamp
          if (createdAt instanceof Date) {
            created_at = createdAt.toISOString();
          } else if (typeof createdAt === 'string') {
            // If it's already an ISO string, use it directly
            created_at = new Date(createdAt).toISOString();
          } else {
            // Fallback to current time
            created_at = new Date().toISOString();
          }
        } catch (dateError) {
          console.warn('Failed to parse createdAt, using current time:', dateError);
          created_at = new Date().toISOString();
        }
      } else {
        created_at = new Date().toISOString();
      }

      const payload = { 
        id, 
        user_id: session.data.session!.user.id, 
        name, 
        type, 
        balance, 
        currency, 
        icon, 
        color,
        created_at
      };

      console.log('Wallet Payload:', JSON.stringify(payload, null, 2));

      const { error } = await import('@/lib/supabase').then(m => m.supabase.from('wallets').upsert(payload));

      if (error) {
        console.error('Error syncing wallet:', error);
        toast.error(`Failed to save wallet: ${error.message}`);
      } else {
        console.log('Wallet synced successfully');
        toast.success('Wallet updated successfully');
      }
    } else {
      console.log('No user session found, performing local only update');
    }
  } catch (err) {
    console.error('Exception in pushWalletToSupabase:', err);
    toast.error('Failed to sync wallet changes. Please check your connection.');
  }
}

async function pushTransactionToSupabase(transaction: Transaction) {
  try {
    const session = await import('@/lib/supabase').then(m => m.supabase.auth.getSession());
    if (session.data.session?.user) {
      console.log('Pushing transaction to Supabase');
      const { id, walletId, amount, type, categoryId, reason, date, notes } = transaction;
      
      // Safely handle date conversion
      let transactionDate: string;
      try {
        if (date instanceof Date) {
          transactionDate = date.toISOString();
        } else if (typeof date === 'string') {
          transactionDate = new Date(date).toISOString();
        } else {
          transactionDate = new Date().toISOString();
        }
      } catch (dateError) {
        console.warn('Failed to parse transaction date, using current time:', dateError);
        transactionDate = new Date().toISOString();
      }

      const payload = {
        id,
        user_id: session.data.session!.user.id,
        wallet_id: walletId,
        amount,
        type,
        category_id: `${session.data.session!.user.id}_${categoryId}`,
        reason,
        date: transactionDate,
        notes
      };

      console.log('Transaction Payload:', JSON.stringify(payload, null, 2));

      const { error } = await import('@/lib/supabase').then(m => m.supabase.from('transactions').upsert(payload));

      if (error) {
        console.error('Initial Transaction Sync Error:', error);
        if (error.code === '23503') { // Foreign key violation (wallet_id not found)
          console.warn('Transaction sync failed: Wallet not found in DB. Attempting to sync wallet first...');
          const wallet = useStore.getState().wallets.find(w => w.id === walletId);

          if (wallet) {
            console.log('Found local wallet, syncing now:', wallet.name);
            await pushWalletToSupabase(wallet);
            // Retry transaction sync
            console.log('Retrying transaction sync...');
            const { error: retryError } = await import('@/lib/supabase').then(m => m.supabase.from('transactions').upsert(payload));

            if (retryError) {
              console.error('Error syncing transaction after wallet retry:', retryError);
              toast.error(`Failed to save transaction: ${retryError.message}`);
            } else {
              console.log('Transaction synced successfully after wallet retry');
              toast.success('Transaction saved successfully');
            }
          } else {
            console.error('Local wallet not found for transaction:', walletId);
            console.log('Available wallets:', useStore.getState().wallets.map(w => w.id));
            toast.error('Cannot save transaction: associated wallet not found');
          }
        } else {
          console.error('Error syncing transaction:', error);
          toast.error(`Failed to save transaction: ${error.message}`);
        }
      } else {
        console.log('Transaction synced successfully');
        toast.success('Transaction saved successfully');
      }
    }
  } catch (err) {
    console.error('Exception in pushTransactionToSupabase:', err);
    toast.error('Failed to sync transaction. Please check your connection.');
  }
}

async function deleteWalletFromSupabase(id: string) {
  const session = await import('@/lib/supabase').then(m => m.supabase.auth.getSession());
  if (session.data.session?.user) {
    await import('@/lib/supabase').then(m => m.supabase.from('wallets').delete().eq('id', id));
  }
}

async function deleteTransactionFromSupabase(id: string) {
  const session = await import('@/lib/supabase').then(m => m.supabase.auth.getSession());
  if (session.data.session?.user) {
    await import('@/lib/supabase').then(m => m.supabase.from('transactions').delete().eq('id', id));
  }
}

function normalizeSettlement(settlement: Settlement): Settlement {
  const paidAmount = settlement.movements
    .filter((movement) => movement.kind === 'payment')
    .reduce((sum, movement) => sum + movement.amount, 0);
  const remainingAmount = Math.max(0, settlement.totalAmount - paidAmount);

  return {
    ...settlement,
    paidAmount,
    remainingAmount,
    status: remainingAmount <= 0 ? 'completed' : 'active',
    updatedAt: settlement.updatedAt ?? new Date(),
  };
}

async function pushCategoryToSupabase(category: Category) {
  try {
    const session = await import('@/lib/supabase').then(m => m.supabase.auth.getSession());
    if (session.data.session?.user) {
      console.log('Pushing category to Supabase:', category.name);
      const { id, name, icon, color, type } = category;
      const payload = {
        id: `${session.data.session!.user.id}_${id}`,
        user_id: session.data.session!.user.id,
        name,
        icon,
        color,
        type
      };

      const { error } = await import('@/lib/supabase').then(m => m.supabase.from('categories').upsert(payload));

      if (error) {
        console.error('Error syncing category:', error);
        toast.error(`Failed to save category: ${error.message}`);
      } else {
        console.log('Category synced successfully');
        toast.success('Category saved successfully');
      }
    }
  } catch (err) {
    console.error('Exception in pushCategoryToSupabase:', err);
    toast.error('Failed to sync category. Please check your connection.');
  }
}

async function deleteCategoryFromSupabase(id: string) {
  const session = await import('@/lib/supabase').then(m => m.supabase.auth.getSession());
  if (session.data.session?.user) {
    await import('@/lib/supabase').then(m => m.supabase.from('categories').delete().eq('id', `${session.data.session!.user.id}_${id}`));
  }
}

async function pushSettlementToSupabase(settlement: Settlement) {
  try {
    const session = await import('@/lib/supabase').then(m => m.supabase.auth.getSession());
    if (session.data.session?.user) {
      console.log('Pushing settlement to Supabase:', settlement.title);
      
      const payload = {
        id: settlement.id,
        user_id: session.data.session!.user.id,
        person_name: settlement.personName,
        title: settlement.title,
        kind: settlement.kind,
        total_amount: settlement.totalAmount,
        paid_amount: settlement.paidAmount,
        remaining_amount: settlement.remainingAmount,
        status: settlement.status,
        due_date: settlement.dueDate ? new Date(settlement.dueDate).toISOString() : null,
        wallet_id: settlement.walletId,
        notes: settlement.notes,
        split_total_amount: settlement.splitTotalAmount,
        split_people_count: settlement.splitPeopleCount,
        your_share: settlement.yourShare,
        movements: settlement.movements,
        created_at: settlement.createdAt ? new Date(settlement.createdAt).toISOString() : new Date().toISOString(),
        updated_at: settlement.updatedAt ? new Date(settlement.updatedAt).toISOString() : new Date().toISOString()
      };

      const { error } = await import('@/lib/supabase').then(m => m.supabase.from('settlements').upsert(payload));

      if (error) {
        console.error('Error syncing settlement:', error);
        toast.error(`Failed to save settlement: ${error.message}`);
      } else {
        console.log('Settlement synced successfully');
      }
    }
  } catch (err) {
    console.error('Exception in pushSettlementToSupabase:', err);
    toast.error('Failed to sync settlement. Please check your connection.');
  }
}

async function deleteSettlementFromSupabase(id: string) {
  const session = await import('@/lib/supabase').then(m => m.supabase.auth.getSession());
  if (session.data.session?.user) {
    await import('@/lib/supabase').then(m => m.supabase.from('settlements').delete().eq('id', id));
  }
}
