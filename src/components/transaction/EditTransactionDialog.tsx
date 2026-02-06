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
import { Transaction } from '@/lib/types';

interface EditTransactionDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    transaction: Transaction | null;
}

export function EditTransactionDialog({ open, onOpenChange, transaction }: EditTransactionDialogProps) {
    const { updateTransaction, wallets, categories, deleteTransaction } = useStore();
    const [type, setType] = useState<'income' | 'expense'>('expense');
    const [walletId, setWalletId] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [amount, setAmount] = useState('');
    const [reason, setReason] = useState('');
    const [notes, setNotes] = useState('');
    const [date, setDate] = useState('');

    useEffect(() => {
        if (transaction) {
            setType(transaction.type);
            setWalletId(transaction.walletId);
            setCategoryId(transaction.categoryId);
            setAmount(transaction.amount.toString());
            setReason(transaction.reason);
            setNotes(transaction.notes || '');
            setDate(new Date(transaction.date).toISOString().split('T')[0]);
        }
    }, [transaction, open]);

    const filteredCategories = categories.filter(
        c => c.type === type || c.type === 'both'
    );

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!transaction || !walletId || !categoryId || !amount || !reason.trim()) return;

        // Amount validation for expense changes could be complex (e.g. if increasing amount)
        // For now, minimal validation or relying on store logic
        if (type === 'expense') {
            const selectedWallet = wallets.find(w => w.id === walletId);
            // Only check if amount increased significantly or wallet changed to one with low balance
            // This is complex because we need to know the *previous* amount to know the net change.
            // Simplified: If switching wallets or increasing amount, ideally we check. 
            // But store update logic handles balance updates.
        }

        updateTransaction(transaction.id, {
            walletId,
            categoryId,
            amount: parseFloat(amount),
            type,
            reason: reason.trim(),
            notes: notes.trim() || undefined,
            date: new Date(date),
        });

        onOpenChange(false);
        toast.success('Transaction updated');
    };

    if (!transaction) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Edit Transaction</DialogTitle>
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
                        <Label htmlFor="edit-wallet">Wallet</Label>
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
                        <Label htmlFor="edit-category">Category</Label>
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
                            <Label htmlFor="edit-amount" className="">Amount</Label>
                            <Input
                                id="edit-amount"
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="0.00"
                                // className="text-lg font-bold h-14 text-center"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2 col-span-1">
                            <Label htmlFor="edit-date">Date</Label>
                            <Input
                                id="edit-date"
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="edit-reason">Description</Label>
                        <Input
                            id="edit-reason"
                            placeholder="What was this for?"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="edit-notes">Notes (optional)</Label>
                        <Textarea
                            id="edit-notes"
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
                        Update {type === 'income' ? 'Income' : 'Expense'}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
