import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useStore } from '@/store/useStore';
import { useAuth } from '@/components/auth/AuthContext';
import { WalletCard } from '@/components/wallet/WalletCard';
import { TransactionItem } from '@/components/transaction/TransactionItem';
import { AddWalletDialog } from '@/components/wallet/AddWalletDialog';
import { AddTransactionDialog } from '@/components/transaction/AddTransactionDialog';
import { EditTransactionDialog } from '@/components/transaction/EditTransactionDialog';
import { TrendingUp, TrendingDown, Wallet, Plus, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

export default function Index() {
  const { wallets, transactions, getTotalBalance, getMonthlyExpenses, getMonthlyIncome } = useStore();
  const { user } = useAuth();
  const [showAddWallet, setShowAddWallet] = useState(false);
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [defaultTransactionType, setDefaultTransactionType] = useState<'income' | 'expense'>('expense');
  const [editingTransaction, setEditingTransaction] = useState<any>(null);
  const { t } = useTranslation();

  const totalBalance = getTotalBalance();
  const monthlyExpenses = getMonthlyExpenses();
  const monthlyIncome = getMonthlyIncome();

  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <AppLayout title={t('sidebar.dashboard')}>
      <div className="py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between animate-fade-in">
          <div className="space-y-1">
            <p className="text-muted-foreground text-sm">
              {user ? t('dashboard.welcome_back', { name: user.user_metadata?.full_name || user.email?.split('@')[0] }) : t('dashboard.welcome_guest')}
            </p>
            <h1 className="text-2xl font-bold text-foreground">Hisabify</h1>
          </div>
          <div className="flex gap-2">
            {!user && (
              <>
                <Link to="/login">
                  <Button variant="secondary" size="sm">
                    {t('auth.login')}
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button size="sm">
                    {t('auth.signup')}
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Total Balance Card */}
        <Card className="p-6 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground animate-fade-in border-0 shadow-lg shadow-primary/20">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-primary-foreground/80 text-sm font-medium">{t('dashboard.total_balance')}</p>
              <Wallet className="w-5 h-5 text-primary-foreground/60" />
            </div>
            <p className="text-3xl font-bold">{formatCurrency(totalBalance)}</p>
            <div className="flex gap-4 pt-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs text-primary-foreground/70">{t('dashboard.income')}</p>
                  <p className="text-sm font-semibold">{formatCurrency(monthlyIncome)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                  <TrendingDown className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs text-primary-foreground/70">Expenses</p>
                  <p className="text-sm font-semibold">{formatCurrency(monthlyExpenses)}</p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3 animate-fade-in" style={{ animationDelay: '100ms' }}>
          <Button
            variant="outline"
            className="h-auto py-4 flex flex-col gap-2 hover:bg-success/10 hover:border-success hover:text-success transition-all"
            onClick={() => {
              setDefaultTransactionType('income');
              setShowAddTransaction(true);
            }}
          >
            <TrendingUp className="w-5 h-5" />
            <span className="text-sm font-medium">Add Income</span>
          </Button>
          <Button
            variant="outline"
            className="h-auto py-4 flex flex-col gap-2 hover:bg-destructive/10 hover:border-destructive hover:text-destructive transition-all"
            onClick={() => {
              setDefaultTransactionType('expense');
              setShowAddTransaction(true);
            }}
          >
            <TrendingDown className="w-5 h-5" />
            <span className="text-sm font-medium">Add Expense</span>
          </Button>
        </div>

        {/* Wallets Section */}
        <section className="space-y-3 animate-fade-in" style={{ animationDelay: '200ms' }}>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">{t('dashboard.my_wallets')}</h2>
            <Link
              to="/wallets"
              className="text-sm text-primary hover:text-primary/80 flex items-center gap-1"
            >
              {t('dashboard.see_all')} <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {wallets.length === 0 ? (
            <Card
              className="p-6 border-dashed cursor-pointer hover:border-primary hover:bg-primary/5 transition-all"
              onClick={() => setShowAddWallet(true)}
            >
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <Plus className="w-8 h-8" />
                <p className="text-sm font-medium">{t('dashboard.add_first_wallet')}</p>
              </div>
            </Card>
          ) : (
            <div className="grid gap-3">
              {wallets.slice(0, 3).map((wallet) => (
                <WalletCard key={wallet.id} wallet={wallet} compact />
              ))}
            </div>
          )}
        </section>

        {/* Recent Transactions */}
        <section className="space-y-3 animate-fade-in" style={{ animationDelay: '300ms' }}>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">{t('dashboard.recent_transactions')}</h2>
            <Link
              to="/analytics"
              className="text-sm text-primary hover:text-primary/80 flex items-center gap-1"
            >
              {t('dashboard.see_all')} <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {recentTransactions.length === 0 ? (
            <Card className="p-6 border-dashed">
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <p className="text-sm">{t('dashboard.no_transactions_yet')}</p>
                <p className="text-xs">{t('dashboard.start_tracking')}</p>
              </div>
            </Card>
          ) : (
            <div className="space-y-2">
              {recentTransactions.map((transaction) => (
                <TransactionItem
                  key={transaction.id}
                  transaction={transaction}
                  onEdit={(t) => {
                    setEditingTransaction(t);
                  }}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      <AddWalletDialog open={showAddWallet} onOpenChange={setShowAddWallet} />
      <AddTransactionDialog
        open={showAddTransaction}
        onOpenChange={setShowAddTransaction}
        defaultType={defaultTransactionType}
      />
      <EditTransactionDialog
        open={!!editingTransaction}
        onOpenChange={(open) => !open && setEditingTransaction(null)}
        transaction={editingTransaction}
      />
    </AppLayout>
  );
}
