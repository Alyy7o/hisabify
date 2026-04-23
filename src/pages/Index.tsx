import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useStore } from '@/store/useStore';
import { useAuth } from '@/components/auth/AuthContext';
import { WalletCard } from '@/components/wallet/WalletCard';
import { TransactionItem } from '@/components/transaction/TransactionItem';
import { AddWalletDialog } from '@/components/wallet/AddWalletDialog';
import { EditTransactionDialog } from '@/components/transaction/EditTransactionDialog';
import { TrendingUp, TrendingDown, Wallet, Plus, ArrowRight, ArrowRightLeft, HandCoins, Eye, EyeOff } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

export default function Index() {
  const navigate = useNavigate();
  const { wallets, transactions, getTotalBalance, getMonthlyExpenses, getMonthlyIncome } = useStore();
  const { user } = useAuth();
  const [showAddWallet, setShowAddWallet] = useState(false);
  const [editingWallet, setEditingWallet] = useState<any>(null);
  const [editingTransaction, setEditingTransaction] = useState<any>(null);
  const [showBalance, setShowBalance] = useState(() => {
    const storedValue = localStorage.getItem('dashboard-show-balance');
    return storedValue ? storedValue === 'true' : true;
  });
  const { t, i18n } = useTranslation();

  useEffect(() => {
    localStorage.setItem('dashboard-show-balance', String(showBalance));
  }, [showBalance]);

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
            <h1 className="text-2xl font-bold text-foreground">{i18n.language === 'ur' ? 'حساب فائی' : 'Hisabify'}</h1>
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
            </div>
            <div className="flex items-center gap-3">
              <div className="relative inline-flex min-h-9 items-center">
                <p
                  className={cn(
                    "text-3xl font-bold tracking-tight transition-all duration-200 ease-in-out",
                    showBalance ? "opacity-100 translate-y-0 scale-100" : "pointer-events-none absolute opacity-0 -translate-y-1 scale-95"
                  )}
                >
                  {formatCurrency(totalBalance)}
                </p>
                <p
                  className={cn(
                    "text-3xl font-bold tracking-tight transition-all duration-200 ease-in-out",
                    showBalance ? "pointer-events-none absolute opacity-0 translate-y-1 scale-95" : "opacity-100 translate-y-0 scale-100"
                  )}
                >
                  ********
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowBalance((value) => !value)}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-primary-foreground/80 transition-colors hover:bg-primary-foreground/10 hover:text-primary-foreground"
                aria-label={showBalance ? 'Hide balance' : 'Show balance'}
              >
                {showBalance ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
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
                  <p className="text-xs text-primary-foreground/70">{t('dashboard.expense')}</p>
                  <p className="text-sm font-semibold">{formatCurrency(monthlyExpenses)}</p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3 animate-fade-in" style={{ animationDelay: '100ms' }}>
          <button
            type="button"
            className="h-auto py-5 px-4 rounded-xl border border-border bg-card hover:bg-success/10 hover:border-success/50 transition-all flex flex-col items-center gap-2"
            onClick={() => navigate('/add?type=income')}
          >
            <TrendingUp className="w-5 h-5 text-success" />
            <span className="text-sm font-medium">{t('dashboard.add_income')}</span>
          </button>
          <button
            type="button"
            className="h-auto py-5 px-4 rounded-xl border border-border bg-card hover:bg-destructive/10 hover:border-destructive/50 transition-all flex flex-col items-center gap-2"
            onClick={() => navigate('/add?type=expense')}
          >
            <TrendingDown className="w-5 h-5 text-destructive" />
            <span className="text-sm font-medium">{t('dashboard.add_expense')}</span>
          </button>
          <button
            type="button"
            className="h-auto py-5 px-4 rounded-xl border border-border bg-card hover:bg-primary/10 hover:border-primary/50 transition-all flex flex-col items-center gap-2"
            onClick={() => navigate('/wallets?transfer=1')}
          >
            <ArrowRightLeft className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium">Transfer</span>
          </button>
          <button
            type="button"
            className="h-auto py-5 px-4 rounded-xl border border-border bg-card hover:bg-primary/10 hover:border-primary/50 transition-all flex flex-col items-center gap-2"
            onClick={() => navigate('/settlements')}
          >
            <HandCoins className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium">Settlements</span>
          </button>
        </div>

        {/* Wallets Section */}
        <section className="space-y-3 animate-fade-in" style={{ animationDelay: '220ms' }}>
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
                <WalletCard
                  key={wallet.id}
                  wallet={wallet}
                  compact
                  onEdit={(w) => setEditingWallet(w)}
                />
              ))}
            </div>
          )}
        </section>

        {/* Recent Transactions */}
        <section className="space-y-3 animate-fade-in" style={{ animationDelay: '320ms' }}>
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

      <AddWalletDialog
        open={showAddWallet || !!editingWallet}
        onOpenChange={(open) => {
          setShowAddWallet(open);
          if (!open) setEditingWallet(null);
        }}
        initialData={editingWallet}
      />
      <EditTransactionDialog
        open={!!editingTransaction}
        onOpenChange={(open) => !open && setEditingTransaction(null)}
        transaction={editingTransaction}
      />
    </AppLayout>
  );
}
