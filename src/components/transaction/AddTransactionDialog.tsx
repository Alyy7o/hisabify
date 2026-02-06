import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useStore } from '@/store/useStore';
import { cn } from '@/lib/utils';

interface AddTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultType?: 'income' | 'expense';
}

export function AddTransactionDialog({ open, onOpenChange, defaultType = 'expense' }: AddTransactionDialogProps) {
  const { addTransaction, wallets, categories } = useStore();
  const [type, setType] = useState<'income' | 'expense'>(defaultType);
  const [walletId, setWalletId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      setType(defaultType);
      setWalletId('');
      setCategoryId('');
      setAmount('');
      setReason('');
      setNotes('');
      setDate(new Date().toISOString().split('T')[0]);
    }
  }, [open, defaultType]);

  const filteredCategories = categories.filter(
    c => c.type === type || c.type === 'both'
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletId || !categoryId || !amount || !reason.trim()) return;

    if (type === 'expense') {
      const selectedWallet = wallets.find(w => w.id === walletId);
      if (selectedWallet && selectedWallet.balance < parseFloat(amount)) {
        toast.error('Insufficient balance in wallet');
        return;
      }
    }

    addTransaction({
      id: crypto.randomUUID(),
      walletId,
      categoryId,
      amount: parseFloat(amount),
      type,
      reason: reason.trim(),
      notes: notes.trim() || undefined,
      date: new Date(date),
    });

    onOpenChange(false);
    toast.success('Transaction added');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Transaction</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type Toggle */}
          <div className="flex bg-secondary rounded-lg p-1">
            <button
              type="button"
              onClick={() => setType('expense')}
              className={cn(
                "flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all",
                type === 'expense'
                  ? "bg-destructive text-destructive-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Expense
            </button>
            <button
              type="button"
              onClick={() => setType('income')}
              className={cn(
                "flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all",
                type === 'income'
                  ? "bg-success text-success-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Income
            </button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="wallet">Wallet</Label>
            <Select value={walletId} onValueChange={setWalletId} required>
              <SelectTrigger>
                <SelectValue placeholder="Select wallet" />
              </SelectTrigger>
              <SelectContent>
                {wallets.map((wallet) => (
                  <SelectItem key={wallet.id} value={wallet.id}>
                    {wallet.icon} {wallet.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {walletId && (
              <p className="text-lg font-medium text-muted-foreground text-center mt-1">
                Balance: {wallets.find(w => w.id === walletId)?.currency} {wallets.find(w => w.id === walletId)?.balance.toLocaleString()}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={categoryId} onValueChange={setCategoryId} required>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {filteredCategories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.icon} {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2 col-span-1">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2 col-span-1">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Description</Label>
            <Input
              id="reason"
              placeholder="What was this for?"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="Additional details..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          <Button
            type="submit"
            className={cn(
              "w-full",
              type === 'income' && "bg-success hover:bg-success/90"
            )}
          >
            Add {type === 'income' ? 'Income' : 'Expense'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

