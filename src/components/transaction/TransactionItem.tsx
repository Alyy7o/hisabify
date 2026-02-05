import { Transaction } from '@/lib/types';
import { useStore } from '@/store/useStore';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface TransactionItemProps {
  transaction: Transaction;
  onClick?: () => void;
}

export function TransactionItem({ transaction, onClick }: TransactionItemProps) {
  const { categories, wallets } = useStore();
  
  const category = categories.find(c => c.id === transaction.categoryId);
  const wallet = wallets.find(w => w.id === transaction.walletId);
  
  const formatCurrency = (amount: number) => {
    const currency = wallet?.currency || 'USD';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <Card 
      className="p-3 cursor-pointer hover:shadow-md transition-all duration-200 animate-fade-in border-border/50"
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        <div 
          className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
          style={{ backgroundColor: (category?.color || '#888') + '20' }}
        >
          {category?.icon || '📦'}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{transaction.reason}</p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{category?.name || 'Other'}</span>
            <span>•</span>
            <span>{format(new Date(transaction.date), 'MMM d')}</span>
          </div>
        </div>
        <p className={cn(
          "font-semibold text-sm shrink-0",
          transaction.type === 'income' ? "text-success" : "text-destructive"
        )}>
          {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
        </p>
      </div>
    </Card>
  );
}
