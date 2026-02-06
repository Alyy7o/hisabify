import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useStore } from '@/store/useStore';
import { WALLET_ICONS, WALLET_COLORS, Wallet } from '@/lib/types';
import { cn } from '@/lib/utils';

interface AddWalletDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: Wallet;
}

export function AddWalletDialog({ open, onOpenChange, initialData }: AddWalletDialogProps) {
  const { addWallet, updateWallet } = useStore();
  const [name, setName] = useState('');
  const [type, setType] = useState<'bank' | 'cash' | 'card' | 'savings'>('bank');
  const [balance, setBalance] = useState('');
  const [currency, setCurrency] = useState<'PKR' | 'USD'>('PKR');
  const [selectedIcon, setSelectedIcon] = useState(WALLET_ICONS[0]);
  const [selectedColor, setSelectedColor] = useState(WALLET_COLORS[0]);

  useEffect(() => {
    if (open) {
      if (initialData) {
        setName(initialData.name);
        setType(initialData.type as any); // Cast purely for safety if types misalign slightly
        setBalance(initialData.balance.toString());
        setCurrency(initialData.currency);
        setSelectedIcon(initialData.icon);
        setSelectedColor(initialData.color);
      } else {
        setName('');
        setType('bank');
        setBalance('');
        setCurrency('PKR');
        setSelectedIcon(WALLET_ICONS[0]);
        setSelectedColor(WALLET_COLORS[0]);
      }
    }
  }, [open, initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (initialData) {
      updateWallet(initialData.id, {
        name: name.trim(),
        type,
        balance: parseFloat(balance) || 0,
        currency,
        icon: selectedIcon,
        color: selectedColor,
      });
    } else {
      addWallet({
        id: crypto.randomUUID(),
        name: name.trim(),
        type,
        balance: parseFloat(balance) || 0,
        currency,
        icon: selectedIcon,
        color: selectedColor,
        createdAt: new Date(),
      });
    }

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Edit Wallet' : 'Add New Wallet'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Wallet Name</Label>
            <Input
              id="name"
              placeholder="e.g., Main Bank Account"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Wallet Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bank">Bank Account</SelectItem>
                <SelectItem value="digital_wallet">Digital Wallet</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="card">Credit Card</SelectItem>
                <SelectItem value="savings">Savings</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="balance">Initial Balance</Label>
              <Input
                id="balance"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select value={currency} onValueChange={(v) => setCurrency(v as 'PKR' | 'USD')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PKR">PKR (Rs)</SelectItem>
                  <SelectItem value="USD">USD ($)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Icon</Label>
            <div className="flex gap-2 flex-wrap">
              {WALLET_ICONS.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setSelectedIcon(icon)}
                  className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center text-lg border-2 transition-all",
                    selectedIcon === icon
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex gap-2 flex-wrap">
              {WALLET_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className={cn(
                    "w-8 h-8 rounded-full border-2 transition-all",
                    selectedColor === color
                      ? "border-foreground scale-110"
                      : "border-transparent hover:scale-105"
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <Button type="submit" className="w-full">
            {initialData ? 'Update Wallet' : 'Add Wallet'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
