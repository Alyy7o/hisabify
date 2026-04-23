import { IconDisplay } from '@/components/common/IconDisplay'; // Import added

// ... (existing imports, but since we can't easily inject imports with replace_file_content without context of the top of the file, I will use multi_replace for the import and the body changes separately if needed, OR just use multi_replace for everything).

// Actually, replace_file_content is better for contiguous blocks, but here I need to add an import at the top AND change the body. 
// I will use multi_replace_file_content to handle both the import and the component updates in one go.

import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { useStore } from '@/store/useStore';
import { DatePickerInput } from '@/components/common/DatePickerInput';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function AddTransaction() {
  const navigate = useNavigate();
  const location = useLocation();
  const { addTransaction, wallets, categories } = useStore();
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [walletId, setWalletId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const typeParam = params.get('type');
    if (typeParam === 'income' || typeParam === 'expense') {
      setType(typeParam);
    }
  }, [location.search]);

  const filteredCategories = categories.filter(
    c => c.type === type || c.type === 'both'
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (wallets.length === 0) {
      toast.error('Please add a wallet first');
      return;
    }

    if (!walletId || !categoryId || !amount || !reason.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

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

    toast.success(`${type === 'income' ? 'Income' : 'Expense'} added successfully`);
    navigate('/');
  };

  return (
    <AppLayout title="Add Transaction">
      <div className="py-4 space-y-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Type Toggle */}
          <Card className="p-1 bg-secondary/50 border-border/50 animate-fade-in">
            <div className="flex">
              <button
                type="button"
                onClick={() => setType('expense')}
                className={cn(
                  "flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all",
                  type === 'expense'
                    ? "bg-destructive text-destructive-foreground shadow-md"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                💸 Expense
              </button>
              <button
                type="button"
                onClick={() => setType('income')}
                className={cn(
                  "flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all",
                  type === 'income'
                    ? "bg-success text-success-foreground shadow-md"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                💰 Income
              </button>
            </div>
          </Card>

          {/* Amount Input */}
          <div className="space-y-2 animate-fade-in" style={{ animationDelay: '50ms' }}>
            <Label htmlFor="amount" className="text-foreground">Amount</Label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg text-muted-foreground">Rs</span>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-10 text-2xl font-bold h-14"
                required
              />
            </div>
          </div>

          {/* Wallet Selection */}
          <div className="space-y-2 animate-fade-in" style={{ animationDelay: '100ms' }}>
            <Label htmlFor="wallet" className="text-foreground">Wallet</Label>
            {wallets.length === 0 ? (
              <Card className="p-4 border-dashed text-center">
                <p className="text-sm text-muted-foreground mb-2">No wallets available</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/wallets')}
                >
                  Add Wallet
                </Button>
              </Card>
            ) : (
              <Select value={walletId} onValueChange={setWalletId} required>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Select wallet" />
                </SelectTrigger>
                <SelectContent>
                  {wallets.map((wallet) => (
                    <SelectItem key={wallet.id} value={wallet.id}>
                      <div className="flex items-center gap-2">
                        <IconDisplay icon={wallet.icon} className="w-5 h-5 text-primary" />
                        <span>{wallet.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Category Selection */}
          <div className="space-y-2 animate-fade-in" style={{ animationDelay: '150ms' }}>
            <Label htmlFor="category" className="text-foreground">Category</Label>
            <Select value={categoryId} onValueChange={setCategoryId} required>
              <SelectTrigger className="h-12">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {filteredCategories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    <div className="flex items-center gap-2">
                      <IconDisplay icon={category.icon} className="w-5 h-5" />
                      <span>{category.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date */}
          <div className="space-y-2 animate-fade-in" style={{ animationDelay: '200ms' }}>
            <Label htmlFor="date" className="text-foreground">Date</Label>
            <DatePickerInput id="date" value={date} onChange={setDate} className="h-12" />
          </div>

          {/* Description */}
          <div className="space-y-2 animate-fade-in" style={{ animationDelay: '250ms' }}>
            <Label htmlFor="reason" className="text-foreground">Description</Label>
            <Input
              id="reason"
              placeholder="What was this for?"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="h-12"
              required
            />
          </div>

          {/* Notes */}
          <div className="space-y-2 animate-fade-in" style={{ animationDelay: '300ms' }}>
            <Label htmlFor="notes" className="text-foreground">Notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="Additional details..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className={cn(
              "w-full h-12 text-base font-semibold animate-fade-in",
              type === 'income' && "bg-success hover:bg-success/90"
            )}
            style={{ animationDelay: '350ms' }}
          >
            Add {type === 'income' ? 'Income' : 'Expense'}
          </Button>
        </form>
      </div>
    </AppLayout>
  );
}
