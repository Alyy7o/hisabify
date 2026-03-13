import { MoreVertical, Pencil, Trash2, ArrowRightLeft } from 'lucide-react';
import { IconDisplay } from '@/components/common/IconDisplay';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useStore } from '@/store/useStore';
import { Wallet } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';

interface WalletCardProps {
  wallet: Wallet;
  onClick?: () => void;
  compact?: boolean;
  onEdit?: (wallet: Wallet) => void;
  onTransfer?: (wallet: Wallet) => void;
}

export function WalletCard({ wallet, onClick, compact = false, onEdit, onTransfer }: WalletCardProps) {
  const { deleteWallet } = useStore();

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-PK', { // Changed to en-PK for Rs formatting
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0, // Simplified for PKR usually
    }).format(amount);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this wallet?')) {
      deleteWallet(wallet.id);
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.(wallet);
  };

  const handleTransfer = (e: React.MouseEvent) => {
    e.stopPropagation();
    onTransfer?.(wallet);
  };

  if (compact) {
    return (
      <Card
        className="p-3 cursor-pointer hover:shadow-md transition-all duration-200 animate-fade-in border-border/50"
        onClick={onClick}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 overflow-hidden"
            style={{ backgroundColor: wallet.color + '20', color: wallet.color }}
          >
            <IconDisplay icon={wallet.icon} className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{wallet.name}</p>
            <p className="text-xs text-muted-foreground capitalize">{wallet.type}</p>
          </div>
          <div className="flex items-center gap-2">
            <p className={cn(
              "font-semibold text-sm",
              wallet.balance >= 0 ? "text-success" : "text-destructive"
            )}>
              {formatCurrency(wallet.balance, wallet.currency)}
            </p>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-6 w-6 p-0" onClick={(e) => e.stopPropagation()}>
                  <span className="sr-only">Open menu</span>
                  <MoreVertical className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleEdit}>
                  <Pencil className="mr-2 h-3.5 w-3.5" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleTransfer}>
                  <ArrowRightLeft className="mr-2 h-3.5 w-3.5" />
                  Transfer
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDelete} className="text-destructive focus:text-destructive">
                  <Trash2 className="mr-2 h-3.5 w-3.5" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card
      className="p-4 cursor-pointer hover:shadow-lg transition-all duration-200 animate-fade-in border-border/50 group relative"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center text-xl group-hover:scale-110 transition-transform overflow-hidden"
          style={{ backgroundColor: wallet.color + '20', color: wallet.color }}
        >
          <IconDisplay icon={wallet.icon} className="w-6 h-6" />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs px-2 py-1 rounded-full bg-secondary text-secondary-foreground capitalize">
            {wallet.type}
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0" onClick={(e) => e.stopPropagation()}>
                <span className="sr-only">Open menu</span>
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleEdit}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleTransfer}>
                <ArrowRightLeft className="mr-2 h-4 w-4" />
                Transfer
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDelete} className="text-destructive focus:text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
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
