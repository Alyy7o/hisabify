export interface Wallet {
  id: string;
  name: string;
  type: 'bank' | 'cash' | 'card' | 'savings' | 'digital_wallet';
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
  type: 'income' | 'expense' | 'transfer';
  categoryId: string;
  toWalletId?: string; // Used when type is 'transfer'
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

export type SettlementKind = 'given' | 'received';
export type SettlementStatus = 'active' | 'completed';
export type SettlementMovementKind = 'initial' | 'payment';
export type SettlementMovementDirection = 'inflow' | 'outflow';

export interface SettlementMovement {
  id: string;
  settlementId: string;
  kind: SettlementMovementKind;
  direction: SettlementMovementDirection;
  amount: number;
  walletId?: string;
  applyToWallet: boolean;
  note?: string;
  date: Date;
}

export interface Settlement {
  id: string;
  personName: string;
  title: string;
  kind: SettlementKind;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  status: SettlementStatus;
  dueDate?: Date;
  walletId?: string;
  notes?: string;
  splitTotalAmount?: number;
  splitPeopleCount?: number;
  yourShare?: number;
  createdAt: Date;
  updatedAt: Date;
  movements: SettlementMovement[];
}

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'food', name: 'Food & Dining', icon: 'Utensils', color: 'hsl(38, 92%, 50%)', type: 'expense' },
  { id: 'transport', name: 'Transport', icon: 'Car', color: 'hsl(220, 70%, 50%)', type: 'expense' },
  { id: 'bills', name: 'Bills & Utilities', icon: 'FileText', color: 'hsl(0, 72%, 51%)', type: 'expense' },
  { id: 'shopping', name: 'Shopping', icon: 'ShoppingBag', color: 'hsl(280, 65%, 60%)', type: 'expense' },
  { id: 'entertainment', name: 'Entertainment', icon: 'Film', color: 'hsl(340, 75%, 55%)', type: 'expense' },
  { id: 'health', name: 'Health', icon: 'Heart', color: 'hsl(160, 84%, 39%)', type: 'expense' },
  { id: 'salary', name: 'Salary', icon: 'Banknote', color: 'hsl(142, 76%, 36%)', type: 'income' },
  { id: 'freelance', name: 'Freelance', icon: 'Laptop', color: 'hsl(200, 70%, 50%)', type: 'income' },
  { id: 'investment', name: 'Investment', icon: 'TrendingUp', color: 'hsl(160, 60%, 45%)', type: 'income' },
  { id: 'transfer', name: 'Transfer', icon: 'ArrowRightLeft', color: 'hsl(210, 20%, 50%)', type: 'both' },
  { id: 'other', name: 'Other', icon: 'Box', color: 'hsl(0, 0%, 50%)', type: 'both' },
];

export const WALLET_ICONS = ['Landmark', 'Banknote', 'CreditCard', 'PiggyBank', 'Coins', 'Wallet'];
export const WALLET_COLORS = [
  'hsl(160, 84%, 39%)', // Green
  'hsl(220, 70%, 50%)', // Blue
  'hsl(280, 65%, 60%)', // Purple/Pink
  'hsl(38, 92%, 50%)',  // Yellow
  'hsl(340, 75%, 55%)', // Red/Pink
  'hsl(0, 72%, 51%)',   // Red
  '#000000',            // Black
  '#ffffff',            // White
  'hsl(0, 0%, 50%)',    // Gray
  // 'hsl(262, 83%, 58%)', // Deep Purple
  'hsl(24, 96%, 53%)',  // Orange
  // 'hsl(173, 58%, 39%)', // Teal
];
