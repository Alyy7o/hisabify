import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Wallet, Transaction, Category, Budget, Goal, DEFAULT_CATEGORIES, Settlement, SettlementMovement } from '@/lib/types';

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
      },
      updateWallet: (id, updates) => {
        set((state) => ({
          wallets: state.wallets.map((w) =>
            w.id === id ? { ...w, ...updates } : w
          ),
        }));
      },
      deleteWallet: (id) => {
        set((state) => ({
          wallets: state.wallets.filter((w) => w.id !== id),
          transactions: state.transactions.filter((t) => t.walletId !== id),
        }));
      },

      // Transaction actions
      addTransaction: (transaction) => {
        set((state) => {
          const newWallets = [...state.wallets];
          
          const sourceIdx = newWallets.findIndex(w => w.id === transaction.walletId);
          if (sourceIdx !== -1) {
            const w = newWallets[sourceIdx];
            let newBalance = w.balance;
            if (transaction.type === 'income') newBalance += transaction.amount;
            else if (transaction.type === 'expense') newBalance -= transaction.amount;
            else if (transaction.type === 'transfer') newBalance -= transaction.amount;
            newWallets[sourceIdx] = { ...w, balance: newBalance };
          }

          if (transaction.type === 'transfer' && transaction.toWalletId) {
            const destIdx = newWallets.findIndex(w => w.id === transaction.toWalletId);
            if (destIdx !== -1) {
              const w = newWallets[destIdx];
              newWallets[destIdx] = { ...w, balance: w.balance + transaction.amount };
            }
          }

          return { transactions: [...state.transactions, transaction], wallets: newWallets };
        });
      },
      updateTransaction: (id, updates) => {
        set((state) => ({
          transactions: state.transactions.map((t) =>
            t.id === id ? { ...t, ...updates } : t
          ),
        }));
      },
      deleteTransaction: (id) => {
        set((state) => {
          const transaction = state.transactions.find(t => t.id === id);
          if (transaction) {
            const newWallets = [...state.wallets];
            
            const sourceIdx = newWallets.findIndex(w => w.id === transaction.walletId);
            if (sourceIdx !== -1) {
              const w = newWallets[sourceIdx];
              let newBalance = w.balance;
              if (transaction.type === 'income') newBalance -= transaction.amount;
              else if (transaction.type === 'expense') newBalance += transaction.amount;
              else if (transaction.type === 'transfer') newBalance += transaction.amount;
              newWallets[sourceIdx] = { ...w, balance: newBalance };
            }

            if (transaction.type === 'transfer' && transaction.toWalletId) {
              const destIdx = newWallets.findIndex(w => w.id === transaction.toWalletId);
              if (destIdx !== -1) {
                const w = newWallets[destIdx];
                newWallets[destIdx] = { ...w, balance: w.balance - transaction.amount };
              }
            }

            return {
              transactions: state.transactions.filter(t => t.id !== id),
              wallets: newWallets,
            };
          }
          return { transactions: state.transactions.filter(t => t.id !== id) };
        });
      },

      // Settlement actions
      addSettlement: (settlement) => {
        set((state) => {
          const normalizedSettlement = normalizeSettlement(settlement);
          return {
            settlements: [...state.settlements, normalizedSettlement],
          };
        });
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
      },
      deleteSettlement: (id) => {
        set((state) => ({
          settlements: state.settlements.filter((settlement) => settlement.id !== id),
        }));
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
      },
      updateCategory: (id, updates) => {
        set((state) => ({
          categories: state.categories.map((c) =>
            c.id === id ? { ...c, ...updates } : c
          ),
        }));
      },
      deleteCategory: (id) => {
        set((state) => ({
          categories: state.categories.filter((c) => c.id !== id),
        }));
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
