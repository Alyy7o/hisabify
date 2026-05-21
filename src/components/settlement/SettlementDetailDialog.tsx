import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Settlement } from '@/lib/types';
import { ReceiptViewer } from '@/components/common/ReceiptViewer';
import { cn } from '@/lib/utils';

interface SettlementDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settlement: Settlement | null;
}

export function SettlementDetailDialog({
  open,
  onOpenChange,
  settlement,
}: SettlementDetailDialogProps) {
  if (!settlement) return null;

  const paymentMovements = settlement.movements.filter((m) => m.kind === 'payment');
  const amountTone = settlement.kind === 'given' ? 'text-success' : 'text-destructive';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Settlement details</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-semibold">{settlement.personName}</h3>
              <Badge variant={settlement.status === 'completed' ? 'secondary' : 'default'}>
                {settlement.status}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{settlement.title}</p>
            <p className={cn('mt-2 text-xl font-bold tabular-nums', amountTone)}>
              Remaining: Rs {settlement.remainingAmount.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">
              Paid Rs {settlement.paidAmount.toLocaleString()} of Rs {settlement.totalAmount.toLocaleString()}
            </p>
          </div>

          {settlement.notes && (
            <div>
              <p className="text-xs text-muted-foreground">Notes</p>
              <p className="mt-1 whitespace-pre-wrap text-sm">{settlement.notes}</p>
            </div>
          )}

          <ReceiptViewer receiptUrl={settlement.receiptUrl} label="Settlement receipt" />

          {paymentMovements.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm font-medium">Payment history</p>
              {paymentMovements.map((movement) => (
                <div
                  key={movement.id}
                  className="space-y-2 rounded-lg border border-border/60 bg-secondary/20 p-3"
                >
                  <div className="flex items-center justify-between text-sm">
                    <span>{format(new Date(movement.date), 'PPP')}</span>
                    <span
                      className={cn(
                        'font-semibold tabular-nums',
                        movement.direction === 'inflow' ? 'text-success' : 'text-destructive'
                      )}
                    >
                      {movement.direction === 'inflow' ? '+' : '-'}Rs {movement.amount.toLocaleString()}
                    </span>
                  </div>
                  {movement.note && (
                    <p className="text-xs text-muted-foreground">{movement.note}</p>
                  )}
                  <ReceiptViewer receiptUrl={movement.receiptUrl} label="Payment receipt" />
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
