import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useStore } from '@/store/useStore';
import { cn } from '@/lib/utils';
import { Settlement, SettlementKind } from '@/lib/types';
import { HandCoins, ArrowDownLeft } from 'lucide-react';

interface AddSettlementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialSettlement?: Settlement | null;
}

type Mode = SettlementKind;

export function AddSettlementDialog({ open, onOpenChange, initialSettlement }: AddSettlementDialogProps) {
  const { addSettlement, updateSettlement } = useStore();
  const [mode, setMode] = useState<Mode>('given');
  const [personName, setPersonName] = useState('');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (open) {
      if (initialSettlement) {
        setMode(initialSettlement.kind);
        setPersonName(initialSettlement.personName);
        setTitle(initialSettlement.title);
        setAmount(String(initialSettlement.totalAmount));
        setDueDate(initialSettlement.dueDate ? new Date(initialSettlement.dueDate).toISOString().split('T')[0] : '');
        setNotes(initialSettlement.notes ?? '');
        setDate(new Date(initialSettlement.createdAt).toISOString().split('T')[0]);
      } else {
        setMode('given');
        setPersonName('');
        setTitle('');
        setAmount('');
        setDueDate('');
        setNotes('');
        setDate(new Date().toISOString().split('T')[0]);
      }
    }
  }, [open, initialSettlement]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    const settlementAmount = Number(amount);

    if (!personName.trim() || !title.trim() || !Number.isFinite(settlementAmount) || settlementAmount <= 0) {
      toast.error('Please fill all required fields.');
      return;
    }

    const settlementId = initialSettlement?.id ?? crypto.randomUUID();

    const settlement: Settlement = {
      id: settlementId,
      personName: personName.trim(),
      title: title.trim(),
      kind: mode,
      totalAmount: settlementAmount,
      paidAmount: 0,
      remainingAmount: settlementAmount,
      status: 'active',
      dueDate: dueDate ? new Date(dueDate) : undefined,
      notes: notes.trim() || undefined,
      createdAt: new Date(date),
      updatedAt: new Date(),
      movements: [],
    };

    if (initialSettlement) {
      updateSettlement(settlementId, settlement);
      toast.success('Settlement updated');
    } else {
      addSettlement(settlement);
      toast.success('Settlement saved');
    }
    onOpenChange(false);
  };

  const amountLabel = mode === 'given' ? 'Amount you gave' : 'Amount you received';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HandCoins className="w-5 h-5 text-primary" />
            {initialSettlement ? 'Edit Settlement' : 'New Settlement'}
          </DialogTitle>
          <DialogDescription>
            Save a future money settlement. Wallet balance changes only when you record payment.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>Settlement Type</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMode('given')}
                className={cn(
                  'flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition-all',
                  mode === 'given'
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground hover:text-foreground'
                )}
              >
                <ArrowDownLeft className="w-4 h-4" />
                I gave money
              </button>
              <button
                type="button"
                onClick={() => setMode('received')}
                className={cn(
                  'flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition-all',
                  mode === 'received'
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground hover:text-foreground'
                )}
              >
                <HandCoins className="w-4 h-4" />
                I received money
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="personName">Person Name</Label>
            <Input
              id="personName"
              placeholder="Who is this with?"
              value={personName}
              onChange={(event) => setPersonName(event.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Details</Label>
            <Input
              id="title"
              placeholder="Loan, pending payment, rent, etc."
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">{amountLabel}</Label>
            <Input
              id="amount"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dueDate">Due Date (optional)</Label>
            <Input
              id="dueDate"
              type="date"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Optional context, reminder, or repayment notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={3}
            />
          </div>

          <Button type="submit" className="w-full">
            Save settlement
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}