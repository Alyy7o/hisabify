import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useRecordSettlementPayment, useWallets } from '@/hooks/useAppData';
import { Settlement } from '@/lib/types';
import { IconDisplay } from '@/components/common/IconDisplay';
import { DatePickerInput } from '@/components/common/DatePickerInput';
import { HandCoins, ArrowDownLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SettlementMovementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settlement: Settlement | null;
}

export function SettlementMovementDialog({ open, onOpenChange, settlement }: SettlementMovementDialogProps) {
  const { data: wallets = [] } = useWallets();
  const recordSettlementPaymentMutation = useRecordSettlementPayment();
  const [useSplit, setUseSplit] = useState(false);
  const [entryType, setEntryType] = useState<'paid' | 'remaining'>('paid');
  const [amountInput, setAmountInput] = useState('');
  const [walletId, setWalletId] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (open && settlement) {
      setUseSplit(false);
      setEntryType('paid');
      setAmountInput('');
      setWalletId(settlement.walletId ?? wallets[0]?.id ?? '');
      setNote('');
      setDate(new Date().toISOString().split('T')[0]);
    }
  }, [open, settlement, wallets]);

  if (!settlement) {
    return null;
  }

  const movementDirection = settlement.kind === 'given' ? 'inflow' : 'outflow';
  const movementLabel = settlement.kind === 'given' ? 'Receive payment' : 'Send payment';

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    let paymentAmount = settlement.remainingAmount;

    if (useSplit) {
      const entered = Number(amountInput);

      if (!Number.isFinite(entered) || entered < 0) {
        toast.error('Enter a valid amount.');
        return;
      }

      if (entryType === 'paid') {
        paymentAmount = entered;
      } else {
        paymentAmount = settlement.remainingAmount - entered;
      }
    }

    if (!Number.isFinite(paymentAmount) || paymentAmount <= 0) {
      toast.error('Enter a valid amount.');
      return;
    }

    if (paymentAmount > settlement.remainingAmount) {
      toast.error('Payment cannot be greater than remaining amount.');
      return;
    }

    if (!walletId) {
      toast.error('Select a wallet.');
      return;
    }

    if (entryType === 'remaining' && useSplit && Number(amountInput) > settlement.remainingAmount) {
      toast.error('Remaining amount cannot be greater than current remaining.');
      return;
    }

    try {
      await recordSettlementPaymentMutation.mutateAsync({
        settlementId: settlement.id,
        amount: paymentAmount,
        walletId,
        note: note.trim() || undefined,
        date: new Date(date),
      });

      toast.success('Settlement updated and transaction added');
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to record payment');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-1rem)] max-w-[calc(100vw-1rem)] sm:w-full sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HandCoins className="w-5 h-5 text-primary" />
            Update settlement
          </DialogTitle>
          <DialogDescription>
            Record payment for {settlement.personName}. This creates a transaction and updates wallet balance.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="rounded-xl border border-border/60 px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-foreground">Split payment</p>
                <p className="text-xs text-muted-foreground">Enable if you want to pay partially.</p>
              </div>
              <button
                type="button"
                onClick={() => setUseSplit((prev) => !prev)}
                className={cn(
                  'rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors',
                  useSplit ? 'border-primary text-primary bg-primary/10' : 'border-border text-muted-foreground'
                )}
              >
                {useSplit ? 'Enabled' : 'Disabled'}
              </button>
            </div>
          </div>

          {useSplit ? (
            <div className="space-y-3 rounded-xl border border-border/60 bg-secondary/20 p-3">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setEntryType('paid')}
                  className={cn(
                    'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    entryType === 'paid' ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground'
                  )}
                >
                  Paid Amount
                </button>
                <button
                  type="button"
                  onClick={() => setEntryType('remaining')}
                  className={cn(
                    'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    entryType === 'remaining' ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground'
                  )}
                >
                  Remaining Amount
                </button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="amountInput">{entryType === 'paid' ? 'Enter paid amount' : 'Enter new remaining amount'}</Label>
                <Input
                  id="amountInput"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={amountInput}
                  onChange={(event) => setAmountInput(event.target.value)}
                  required
                />
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-border/60 bg-secondary/20 p-3 text-sm text-muted-foreground">
              Full remaining amount will be settled now: <span className="font-semibold text-foreground">Rs {settlement.remainingAmount.toLocaleString()}</span>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <div className="rounded-lg bg-secondary/30 px-3 py-2 text-sm text-foreground">
              Remaining before update: Rs {settlement.remainingAmount.toLocaleString()}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="wallet">Wallet</Label>
            <Select value={walletId} onValueChange={setWalletId}>
              <SelectTrigger>
                <SelectValue placeholder="Select wallet" />
              </SelectTrigger>
              <SelectContent>
                {wallets.map((wallet) => (
                  <SelectItem key={wallet.id} value={wallet.id}>
                    <div className="flex items-center gap-2">
                      <IconDisplay icon={wallet.icon} className="w-4 h-4" />
                      {wallet.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <DatePickerInput id="date" value={date} onChange={setDate} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="note">Note</Label>
            <Textarea
              id="note"
              placeholder="Optional repayment note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              rows={3}
            />
          </div>

          <Button type="submit" className="w-full gap-2">
            <ArrowDownLeft className="w-4 h-4" />
            {movementLabel}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}