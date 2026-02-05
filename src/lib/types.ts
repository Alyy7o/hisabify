export interface Wallet {
  id: string;
  name: string;
  type: 'bank' | 'cash' | 'card' | 'savings';
  balance: number;
  currency: 'PKR' | 'USD';
  icon: string;
  color: string;
  createdAt: Date;
}

export interface Transaction {
  id: string;
  walletId: string;
  amount: number;
  type: 'income' | 'expense';
  categoryId: string;
  reason: string;
  date: Date;
  notes?: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: 'income' | 'expense' | 'both';
}

export interface Budget {
  id: string;
  categoryId: string;
  limitAmount: number;
  month: string;
  spent: number;
}

export interface Goal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  deadline: Date;
  icon: string;
}

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'food', name: 'Food & Dining', icon: '🍔', color: 'hsl(38, 92%, 50%)', type: 'expense' },
  { id: 'transport', name: 'Transport', icon: '🚗', color: 'hsl(220, 70%, 50%)', type: 'expense' },
  { id: 'bills', name: 'Bills & Utilities', icon: '📄', color: 'hsl(0, 72%, 51%)', type: 'expense' },
  { id: 'shopping', name: 'Shopping', icon: '🛍️', color: 'hsl(280, 65%, 60%)', type: 'expense' },
  { id: 'entertainment', name: 'Entertainment', icon: '🎬', color: 'hsl(340, 75%, 55%)', type: 'expense' },
  { id: 'health', name: 'Health', icon: '💊', color: 'hsl(160, 84%, 39%)', type: 'expense' },
  { id: 'salary', name: 'Salary', icon: '💰', color: 'hsl(142, 76%, 36%)', type: 'income' },
  { id: 'freelance', name: 'Freelance', icon: '💻', color: 'hsl(200, 70%, 50%)', type: 'income' },
  { id: 'investment', name: 'Investment', icon: '📈', color: 'hsl(160, 60%, 45%)', type: 'income' },
  { id: 'other', name: 'Other', icon: '📦', color: 'hsl(0, 0%, 50%)', type: 'both' },
];

export const WALLET_ICONS = ['🏦', '💵', '💳', '🐷', '💰', '🪙'];
export const WALLET_COLORS = [
  'hsl(160, 84%, 39%)',
  'hsl(220, 70%, 50%)',
  'hsl(280, 65%, 60%)',
  'hsl(38, 92%, 50%)',
  'hsl(340, 75%, 55%)',
  'hsl(0, 72%, 51%)',
];
