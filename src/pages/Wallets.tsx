import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { useStore } from '@/store/useStore';
import { WalletCard } from '@/components/wallet/WalletCard';
import { AddWalletDialog } from '@/components/wallet/AddWalletDialog';
import { Plus } from 'lucide-react';
import { Card } from '@/components/ui/card';

export default function Wallets() {
  const { wallets, getTotalBalance } = useStore();
  const [showAddWallet, setShowAddWallet] = useState(false);
  const [editingWallet, setEditingWallet] = useState<any>(null); // Use proper type if available

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <AppLayout title="Wallets">
      <div className="py-4 space-y-6">
        {/* Total Balance */}
        <Card className="p-5 bg-secondary/50 border-border/50 animate-fade-in">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Combined Balance</p>
              <p className="text-2xl font-bold text-foreground">{formatCurrency(getTotalBalance())}</p>
            </div>
            <div className="text-right text-sm text-muted-foreground">
              <p>{wallets.length} wallet{wallets.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
        </Card>

        {/* Add Wallet Button */}
        <Button
          onClick={() => setShowAddWallet(true)}
          className="w-full gap-2"
        >
          <Plus className="w-4 h-4" />
          Add New Wallet
        </Button>

        {/* Wallets Grid */}
        {wallets.length === 0 ? (
          <Card className="p-8 border-dashed animate-fade-in">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-3xl">🏦</span>
              </div>
              <div>
                <h3 className="font-semibold text-foreground">No wallets yet</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Add your bank accounts, cash, or cards to start tracking
                </p>
              </div>
            </div>
          </Card>
        ) : (
          <div className="grid gap-3">
            {wallets.map((wallet, index) => (
              <div
                key={wallet.id}
                className="animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <WalletCard wallet={wallet} />
              </div>
            ))}
          </div>
        )}
      </div>

      <AddWalletDialog open={showAddWallet} onOpenChange={setShowAddWallet} />
    </AppLayout>
  );
}
