import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Transaction } from '@/lib/types';
import { useCategories, useWallets } from '@/hooks/useAppData';
import { ReceiptViewer } from '@/components/common/ReceiptViewer';
import { IconDisplay } from '@/components/common/IconDisplay';
import { ArrowRightLeft, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TransactionDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: Transaction | null;
  onEdit?: (transaction: Transaction) => void;
}

export function TransactionDetailDialog({
  open,
  onOpenChange,
  transaction,
  onEdit,
}: TransactionDetailDialogProps) {
  const { t } = useTranslation();
  const { data: categories = [] } = useCategories();
  const { data: wallets = [] } = useWallets();

  if (!transaction) return null;

  const category = categories.find((c) => c.id === transaction.categoryId);
  const wallet = wallets.find((w) => w.id === transaction.walletId);
  const destWallet = wallets.find((w) => w.id === transaction.toWalletId);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: wallet?.currency || 'PKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Transaction details</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
              style={{ backgroundColor: (category?.color || '#888') + '20' }}
            >
              <IconDisplay icon={category?.icon || 'Box'} className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              {transaction.type === 'transfer' ? (
                <p className="flex items-center gap-1.5 font-semibold">
                  <span className="truncate">{wallet?.name}</span>
                  <ArrowRightLeft className="h-4 w-4 shrink-0" />
                  <span className="truncate">{destWallet?.name}</span>
                </p>
              ) : (
                <p className="font-semibold text-foreground">{transaction.reason}</p>
              )}
              <p
                className={cn(
                  'text-lg font-bold tabular-nums',
                  transaction.type === 'income'
                    ? 'text-success'
                    : transaction.type === 'expense'
                      ? 'text-destructive'
                      : 'text-foreground'
                )}
              >
                {transaction.type === 'income' ? '+' : transaction.type === 'expense' ? '-' : ''}
                {formatCurrency(transaction.amount)}
              </p>
            </div>
          </div>

          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-muted-foreground">{t('common.category')}</dt>
              <dd className="font-medium">{category?.name || 'Other'}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">{t('common.wallet')}</dt>
              <dd className="font-medium">{wallet?.name || '—'}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">{t('common.date')}</dt>
              <dd className="font-medium">{format(new Date(transaction.date), 'PPP')}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Type</dt>
              <dd className="font-medium capitalize">{transaction.type}</dd>
            </div>
          </dl>

          {transaction.notes && (
            <div>
              <p className="text-xs text-muted-foreground">Notes</p>
              <p className="mt-1 whitespace-pre-wrap text-sm">{transaction.notes}</p>
            </div>
          )}

          <ReceiptViewer receiptUrl={transaction.receiptUrl} />

          {onEdit && (
            <Button
              type="button"
              variant="secondary"
              className="w-full gap-2"
              onClick={() => {
                onOpenChange(false);
                onEdit(transaction);
              }}
            >
              <Pencil className="h-4 w-4" />
              Edit transaction
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
