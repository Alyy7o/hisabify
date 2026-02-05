import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Wallet, Transaction, Category, Budget, Goal, DEFAULT_CATEGORIES } from '@/lib/types';

interface AppState {
  wallets: Wallet[];
  transactions: Transaction[];
  categories: Category[];
  budgets: Budget[];
  goals: Goal[];

  // Bulk Setters (for Sync)
  setWallets: (wallets: Wallet[]) => void;
  setTransactions: (transactions: Transaction[]) => void;

  // Wallet actions
  addWallet: (wallet: Wallet) => void;
  updateWallet: (id: string, wallet: Partial<Wallet>) => void;
  deleteWallet: (id: string) => void;

  // Transaction actions
  addTransaction: (transaction: Transaction) => void;
  updateTransaction: (id: string, transaction: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;

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
      categories: DEFAULT_CATEGORIES,
      budgets: [],
      goals: [],

      // Bulk Setters
      setWallets: (wallets) => set({ wallets }),
      setTransactions: (transactions) => set({ transactions }),

      // Wallet actions
      addWallet: (wallet) => {
        set((state) => ({ wallets: [...state.wallets, wallet] }));
        pushWalletToSupabase(wallet);
      },
      updateWallet: (id, updates) => set((state) => ({
        wallets: state.wallets.map((w) =>
          w.id === id ? { ...w, ...updates } : w
        ),
      })),
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
      updateTransaction: (id, updates) => set((state) => ({
        transactions: state.transactions.map((t) =>
          t.id === id ? { ...t, ...updates } : t
        ),
      })),
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

      // Category actions
      addCategory: (category) => set((state) => ({
        categories: [...state.categories, category]
      })),
      updateCategory: (id, updates) => set((state) => ({
        categories: state.categories.map((c) =>
          c.id === id ? { ...c, ...updates } : c
        ),
      })),
      deleteCategory: (id) => set((state) => ({
        categories: state.categories.filter((c) => c.id !== id),
      })),

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
      name: 'spendwise-storage',
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
      const { id, name, type, balance, currency, icon, color } = wallet;
      const { error } = await import('@/lib/supabase').then(m => m.supabase.from('wallets').upsert({
        id, user_id: session.data.session!.user.id, name, type, balance, currency, icon, color
      }));
      if (error) {
        console.error('Error syncing wallet:', error);
      } else {
        console.log('Wallet synced successfully');
      }
    } else {
      console.log('No user session found, performing local only update');
    }
  } catch (err) {
    console.error('Exception in pushWalletToSupabase:', err);
  }
}

async function pushTransactionToSupabase(transaction: Transaction) {
  try {
    const session = await import('@/lib/supabase').then(m => m.supabase.auth.getSession());
    if (session.data.session?.user) {
      console.log('Pushing transaction to Supabase');
      const { id, walletId, amount, type, categoryId, reason, date, notes } = transaction;
      const { error } = await import('@/lib/supabase').then(m => m.supabase.from('transactions').upsert({
        id,
        user_id: session.data.session!.user.id,
        wallet_id: walletId,
        amount,
        type,
        category_id: categoryId,
        reason,
        date: new Date(date).toISOString(),
        notes
      }));
      if (error) {
        console.error('Error syncing transaction:', error);
      } else {
        console.log('Transaction synced successfully');
      }
    }
  } catch (err) {
    console.error('Exception in pushTransactionToSupabase:', err);
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
