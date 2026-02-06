import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/components/auth/AuthContext';
import {
  LayoutDashboard,
  Wallet,
  ArrowRightLeft,
  Settings as SettingsIcon,
  LogOut,
  Menu,
  Plus,
  PieChart,
  User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AddTransactionDialog } from '@/components/transaction/AddTransactionDialog';
import { AddWalletDialog } from '@/components/wallet/AddWalletDialog';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { BottomNav } from './BottomNav';
import { LanguageToggle } from '@/components/common/LanguageToggle';

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
  showNav?: boolean; // Restored prop
}

export const AppLayout = ({ children, title, showNav = true }: AppLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut, user } = useAuth(); // Added user
  const { t, i18n } = useTranslation();
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [showAddWallet, setShowAddWallet] = useState(false);

  useEffect(() => {
    document.dir = i18n.language === 'ur' ? 'rtl' : 'ltr';
  }, [i18n.language]);

  const menuItems = [
    { icon: LayoutDashboard, label: t('sidebar.dashboard'), path: '/' },
    { icon: PieChart, label: t('sidebar.analytics'), path: '/analytics' },
    // { icon: ArrowRightLeft, label: t('sidebar.transactions'), path: '/transactions' },
    // { icon: Wallet, label: t('sidebar.wallets'), path: '/wallets' },
    { icon: SettingsIcon, label: t('sidebar.settings'), path: '/settings' },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-background flex w-full">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex w-64 flex-col border-r bg-card/50 backdrop-blur-xl h-screen sticky top-0">
        <div className="p-6 border-b flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center overflow-hidden">
            <img src="/logo.png" alt="Hisabify" className="w-full h-full object-cover" />
          </div>
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
            {i18n.language === 'ur' ? 'حساب فائی' : 'Hisabify'}
          </span>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                location.pathname === item.path
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}

          <div className="pt-4 mt-4 border-t border-border/50">
            <p className="px-4 text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
              {t('common.quick_actions') || 'Quick Actions'}
            </p>
            <button
              onClick={() => setShowAddTransaction(true)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:bg-secondary hover:text-foreground transition-all duration-200"
            >
              <Plus className="w-5 h-5" />
              <span className="font-medium">{t('common.add_transaction') || 'Add Transaction'}</span>
            </button>
            <button
              onClick={() => setShowAddWallet(true)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:bg-secondary hover:text-foreground transition-all duration-200"
            >
              <Wallet className="w-5 h-5" />
              <span className="font-medium">{t('common.add_wallet') || 'Add Wallet'}</span>
            </button>
          </div>
        </nav>

        {user && (
          <div className="p-4 border-t">
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-destructive hover:bg-destructive/10 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">{t('sidebar.signOut')}</span>
            </button>
          </div>
        )}
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen relative">
        {/* ... (keep existing headers and content) ... */}
        {/* Desktop Header for Language Toggle */}
        <header className="hidden md:flex justify-end p-4 absolute top-0 right-0 z-50 pointer-events-none">
          <div className="pointer-events-auto">
            <LanguageToggle />
          </div>
        </header>

        {/* Mobile Header */}
        <header className="md:hidden sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border">
          <div className="flex items-center justify-between h-14 px-4">
            {title && <h1 className="text-lg font-semibold text-foreground">{title}</h1>}
            <LanguageToggle />
          </div>
        </header>

        <main className={cn(
          "flex-1 px-4 py-4 max-w-3xl mx-auto w-full",
          showNav ? "pb-24 md:pb-4" : "pb-4"
        )}>
          {children}
        </main>

        {/* Mobile Bottom Nav */}
        {showNav && (
          <div className="md:hidden">
            <BottomNav />
          </div>
        )}
      </div>

      <AddTransactionDialog
        open={showAddTransaction}
        onOpenChange={setShowAddTransaction}
      />
      <AddWalletDialog
        open={showAddWallet}
        onOpenChange={setShowAddWallet}
      />
    </div>
  );
};
