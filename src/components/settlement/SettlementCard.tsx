import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Settlement } from '@/lib/types';
import { format } from 'date-fns';
import { Clock3, Wallet, PlusCircle, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useState } from 'react';

interface SettlementCardProps {
  settlement: Settlement;
  onAddPayment: (settlement: Settlement) => void;
  onEdit: (settlement: Settlement) => void;
  onDelete: (settlement: Settlement) => void;
  onView?: (settlement: Settlement) => void;
}

export function SettlementCard({ settlement, onAddPayment, onEdit, onDelete, onView }: SettlementCardProps) {
  const typeLabel = settlement.kind === 'given' ? 'They owe you' : 'You owe them';
  const amountTone = settlement.kind === 'given' ? 'text-success' : 'text-destructive';
  const progress = settlement.totalAmount > 0
    ? Math.min(100, Math.round((settlement.paidAmount / settlement.totalAmount) * 100))
    : 0;
  const paymentMovements = settlement.movements.filter((movement) => movement.kind === 'payment');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  return (
    <>
      <Card
        className="cursor-pointer p-4 border-border/60 bg-card/80 shadow-sm animate-fade-in transition-shadow hover:shadow-md"
        onClick={() => onView?.(settlement)}
      >
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-foreground truncate">{settlement.personName}</h3>
              <Badge variant={settlement.status === 'completed' ? 'secondary' : 'default'}>
                {settlement.status}
              </Badge>
              <Badge variant="outline">{settlement.kind === 'given' ? 'Given' : 'Received'}</Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1 truncate">{settlement.title}</p>
          </div>
            <div className="text-right flex items-start gap-2">
              <div>
                <p className={cn('text-lg font-bold', amountTone)}>
                  Rs {settlement.remainingAmount.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">{typeLabel}</p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="h-8 w-8 p-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span className="sr-only">Open menu</span>
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {onView && (
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onView(settlement);
                      }}
                    >
                      View details
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(settlement);
                    }}
                  >
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

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock3 className="w-3.5 h-3.5" />
            {format(new Date(settlement.createdAt), 'MMM d, yyyy')}
          </span>
          <span className="flex items-center gap-1">
            <Wallet className="w-3.5 h-3.5" />
            {paymentMovements.length} payment{paymentMovements.length !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Paid: Rs {settlement.paidAmount.toLocaleString()}</span>
            <span>Remaining: Rs {settlement.remainingAmount.toLocaleString()}</span>
          </div>
          <Progress value={progress} />
        </div>

        {paymentMovements.length > 0 && (
          <div className="space-y-2 rounded-lg bg-secondary/30 p-3">
            {paymentMovements.slice(-2).map((movement) => (
              <div key={movement.id} className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Payment</span>
                <span className={cn(movement.direction === 'inflow' ? 'text-success' : 'text-destructive')}>
                  {movement.direction === 'inflow' ? '+' : '-'}Rs {movement.amount.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}

          {settlement.status === 'active' && (
            <Button
              className="w-full gap-2"
              variant="secondary"
              onClick={(e) => {
                e.stopPropagation();
                onAddPayment(settlement);
              }}
            >
              <PlusCircle className="w-4 h-4" />
              Record payment
            </Button>
          )}
        </div>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete settlement?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the settlement record and its payment history from the app.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => onDelete(settlement)}
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