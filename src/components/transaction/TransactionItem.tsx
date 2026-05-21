import { useState } from 'react';
import { IconDisplay } from '@/components/common/IconDisplay';
import { Transaction } from '@/lib/types';
import { useCategories, useWallets, useDeleteTransaction } from '@/hooks/useAppData';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { MoreVertical, Pencil, Trash2, ArrowRightLeft, Eye, Receipt } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface TransactionItemProps {
  transaction: Transaction;
  onClick?: () => void;
  onEdit?: (transaction: Transaction) => void;
}

export function TransactionItem({ transaction, onClick, onEdit }: TransactionItemProps) {
  const { data: categories = [] } = useCategories();
  const { data: wallets = [] } = useWallets();
  const deleteTransactionMutation = useDeleteTransaction();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const category = categories.find(c => c.id === transaction.categoryId);
  const wallet = wallets.find(w => w.id === transaction.walletId);

  const formatCurrency = (amount: number) => {
    const currency = wallet?.currency || 'USD';
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleDelete = async () => {
    await deleteTransactionMutation.mutateAsync(transaction.id);
    setShowDeleteDialog(false);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.(transaction);
  };

  const destWallet = wallets.find(w => w.id === transaction.toWalletId);

  return (
    <>
      <Card
        className="p-3 cursor-pointer hover:shadow-md transition-all duration-200 animate-fade-in border-border/50 group relative"
        onClick={onClick}
      >
        <div className="flex items-center gap-3">

          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 overflow-hidden"
            style={{ backgroundColor: (category?.color || '#888') + '20' }}
          >
            <IconDisplay icon={category?.icon || 'Box'} className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            {transaction.type === 'transfer' ? (
              <div className="font-medium text-sm truncate flex items-center gap-1.5">
                <span className="truncate max-w-[100px]">{wallet?.name || 'Unknown'}</span>
                <ArrowRightLeft className="w-3 h-3 text-muted-foreground shrink-0" />
                <span className="truncate max-w-[100px]">{destWallet?.name || 'Unknown'}</span>
              </div>
            ) : (
              <p className="font-medium text-sm truncate">{transaction.reason}</p>
            )}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{category?.name || 'Other'}</span>
              <span>•</span>
              <span>{format(new Date(transaction.date), 'MMM d')}</span>
              {transaction.receiptUrl && (
                <Receipt className="h-3 w-3 shrink-0 text-primary" aria-label="Has receipt" />
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <p className={cn(
              "font-semibold text-sm shrink-0 max-w-[100px] sm:max-w-[150px] truncate text-right",
              transaction.type === 'income' ? "text-success" : 
              transaction.type === 'expense' ? "text-destructive" :
              "text-foreground"
            )}>
              {transaction.type === 'income' ? '+' : transaction.type === 'expense' ? '-' : ''}{formatCurrency(transaction.amount)}
            </p>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0" onClick={(e) => e.stopPropagation()}>
                  <span className="sr-only">Open menu</span>
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onClick && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onClick();
                    }}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    View details
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={handleEdit}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDeleteDialog(true);
                  }}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this transaction.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={(e) => e.stopPropagation()}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.stopPropagation();
                handleDelete();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
