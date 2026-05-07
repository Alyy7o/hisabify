import { useState, useEffect } from 'react';
import { IconDisplay } from '@/components/common/IconDisplay';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { DatePickerInput } from '@/components/common/DatePickerInput';
import { useWallets, useCreateTransaction } from '@/hooks/useAppData';
import { cn } from '@/lib/utils';
import { ArrowRightLeft } from 'lucide-react';

interface TransferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultSourceWalletId?: string;
}

export function TransferDialog({ open, onOpenChange, defaultSourceWalletId }: TransferDialogProps) {
  const { data: wallets = [] } = useWallets();
  const createTransactionMutation = useCreateTransaction();
  const [sourceWalletId, setSourceWalletId] = useState('');
  const [destinationWalletId, setDestinationWalletId] = useState('');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('Transfer');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      setSourceWalletId(defaultSourceWalletId || '');
      setDestinationWalletId('');
      setAmount('');
      setReason('Transfer');
      setNotes('');
      setDate(new Date().toISOString().split('T')[0]);
    }
  }, [open, defaultSourceWalletId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceWalletId || !destinationWalletId || !amount || parseFloat(amount) <= 0) {
        toast.error('Please fill in all required fields correctly.');
        return;
    }

    if (sourceWalletId === destinationWalletId) {
        toast.error('Source and destination wallets must be different.');
        return;
    }

    const sourceWallet = wallets.find(w => w.id === sourceWalletId);
    if (sourceWallet && sourceWallet.balance < parseFloat(amount)) {
      toast.error('Insufficient balance in source wallet.');
      return;
    }

    try {
      setIsSubmitting(true);
      // 1. Create a single Transfer transaction
      await createTransactionMutation.mutateAsync({
        id: crypto.randomUUID(),
        walletId: sourceWalletId,
        toWalletId: destinationWalletId,
        categoryId: 'transfer',
        amount: parseFloat(amount),
        type: 'transfer',
        reason: reason.trim(),
        notes: notes.trim(),
        date: new Date(date),
      });

      onOpenChange(false);
      toast.success('Transfer complete!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to complete transfer');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5 text-primary" />
            Transfer Funds
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          
          <div className="space-y-4 bg-secondary/30 p-4 rounded-lg border border-border/50">
             <div className="space-y-2">
                <Label htmlFor="sourceWallet">From (Source Wallet)</Label>
                <Select value={sourceWalletId} onValueChange={setSourceWalletId} required>
                <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Select source wallet" />
                </SelectTrigger>
                <SelectContent>
                    {wallets.map((wallet) => (
                    <SelectItem key={wallet.id} value={wallet.id}>
                        <div className="flex items-center justify-between w-full pr-4">
                           <div className="flex items-center gap-2">
                               <IconDisplay icon={wallet.icon} className="w-4 h-4" />
                               {wallet.name}
                           </div>
                           <span className="text-muted-foreground ml-4">
                               {wallet.currency} {wallet.balance.toLocaleString()}
                           </span>
                        </div>
                    </SelectItem>
                    ))}
                </SelectContent>
                </Select>
            </div>

            <div className="flex justify-center -my-2 relative z-10">
                <div className="bg-background p-1.5 rounded-full border border-border shadow-sm">
                    <ArrowRightLeft className="w-4 h-4 text-muted-foreground rotate-90" />
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="destinationWallet">To (Destination Wallet)</Label>
                <Select value={destinationWalletId} onValueChange={setDestinationWalletId} required>
                <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Select destination wallet" />
                </SelectTrigger>
                <SelectContent>
                    {wallets.map((wallet) => (
                    <SelectItem 
                        key={wallet.id} 
                        value={wallet.id}
                        disabled={wallet.id === sourceWalletId} // Prevent selecting same wallet
                    >
                        <div className="flex items-center justify-between w-full pr-4">
                           <div className="flex items-center gap-2">
                               <IconDisplay icon={wallet.icon} className="w-4 h-4" />
                               {wallet.name}
                           </div>
                           <span className="text-muted-foreground ml-4">
                               {wallet.currency} {wallet.balance.toLocaleString()}
                           </span>
                        </div>
                    </SelectItem>
                    ))}
                </SelectContent>
                </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2 col-span-1">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2 col-span-1">
              <Label htmlFor="date">Date</Label>
              <DatePickerInput id="date" value={date} onChange={setDate} />
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

          <Button type="submit" className="w-full h-11 text-base" disabled={isSubmitting}>
             {isSubmitting ? 'Transferring...' : 'Complete Transfer'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
