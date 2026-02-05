import { Wallet } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface WalletCardProps {
  wallet: Wallet;
  onClick?: () => void;
  compact?: boolean;
}

export function WalletCard({ wallet, onClick, compact = false }: WalletCardProps) {
  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  if (compact) {
    return (
      <Card 
        className="p-3 cursor-pointer hover:shadow-md transition-all duration-200 animate-fade-in border-border/50"
        onClick={onClick}
      >
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
            style={{ backgroundColor: wallet.color + '20' }}
          >
            {wallet.icon}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{wallet.name}</p>
            <p className="text-xs text-muted-foreground capitalize">{wallet.type}</p>
          </div>
          <p className={cn(
            "font-semibold text-sm",
            wallet.balance >= 0 ? "text-success" : "text-destructive"
          )}>
            {formatCurrency(wallet.balance, wallet.currency)}
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card 
      className="p-4 cursor-pointer hover:shadow-lg transition-all duration-200 animate-fade-in border-border/50 group"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div 
          className="w-12 h-12 rounded-xl flex items-center justify-center text-xl group-hover:scale-110 transition-transform"
          style={{ backgroundColor: wallet.color + '20' }}
        >
          {wallet.icon}
        </div>
        <span className="text-xs px-2 py-1 rounded-full bg-secondary text-secondary-foreground capitalize">
          {wallet.type}
        </span>
      </div>
      <h3 className="font-semibold text-foreground mb-1">{wallet.name}</h3>
      <p className={cn(
        "text-xl font-bold",
        wallet.balance >= 0 ? "text-success" : "text-destructive"
      )}>
        {formatCurrency(wallet.balance, wallet.currency)}
      </p>
    </Card>
  );
}
