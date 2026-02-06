import { AppLayout } from '@/components/layout/AppLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  User,
  Palette,
  Download,
  Shield,
  HelpCircle,
  ChevronRight,
  Trash2,
  Smartphone,
  Moon,
  Sun,
  LogOut,
  LogIn,
  Globe,
  FileText
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { useAuth } from '@/components/auth/AuthContext';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { useNavigate } from 'react-router-dom';
import { usePWA } from '@/components/pwa/PWAContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function Settings() {
  const { t, i18n } = useTranslation();
  const { wallets, transactions } = useStore();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { isInstallable, isInstalled, installApp } = usePWA();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [showClearDataDialog, setShowClearDataDialog] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleInstall = async () => {
    const installed = await installApp();
    if (installed) {
      toast.success('App installed successfully!');
    } else {
      toast.info('App is already installed or installation is not available');
    }
  };

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang);
    document.dir = lang === 'ur' ? 'rtl' : 'ltr';
  };

  const handleExportCSV = () => {
    try {
      // Define headers
      const headers = ['Date', 'Type', 'Category', 'Amount', 'Wallet', 'Description'];

      // Map transactions to rows
      const rows = transactions
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .map(t => {
          const wallet = wallets.find(w => w.id === t.walletId);
          const category = useStore.getState().categories.find(c => c.id === t.categoryId);
          const description = t.reason.replace(/"/g, '""'); // Escape double quotes

          return [
            new Date(t.date).toLocaleDateString(),
            t.type,
            category?.name || 'Unknown',
            t.amount,
            wallet?.name || 'Unknown',
            `"${description}"` // Wrap description in quotes to handle commas/newlines
          ].join(',');
        });

      // Combine headers and rows
      const csvContent = [headers.join(','), ...rows].join('\n');

      // Create blob and download link
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      const fileName = `hisabify_export_${new Date().toISOString().split('T')[0]}.csv`;

      link.setAttribute('href', url);
      link.setAttribute('download', fileName);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('CSV exported successfully');
    } catch (error) {
      console.error('Export CSV error:', error);
      toast.error('Failed to export CSV');
    }
  };

  const handleExport = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Title
    doc.setFontSize(22);
    doc.text('Hisabify Report', pageWidth / 2, 20, { align: 'center' });

    doc.setFontSize(12);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, pageWidth / 2, 30, { align: 'center' });

    // Summary Section
    const totalBalance = wallets.reduce((sum, w) => sum + w.balance, 0);
    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    doc.setFillColor(240, 240, 240);
    doc.rect(14, 40, pageWidth - 28, 30, 'F');

    doc.setFontSize(14);
    doc.text('Summary', 20, 50);

    doc.setFontSize(10);
    doc.text(`Total Balance: ${totalBalance.toLocaleString()} PKR`, 20, 60);
    doc.text(`Total Income: ${totalIncome.toLocaleString()} PKR`, 80, 60);
    doc.text(`Total Expenses: ${totalExpense.toLocaleString()} PKR`, 140, 60);

    // Transactions Table
    const tableRows = transactions
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .map(t => {
        const wallet = wallets.find(w => w.id === t.walletId);
        const category = useStore.getState().categories.find(c => c.id === t.categoryId);
        return [
          new Date(t.date).toLocaleDateString(),
          t.type.toUpperCase(),
          category?.name || 'Unknown',
          `${t.type === 'income' ? '+' : '-'}${t.amount.toLocaleString()}`,
          wallet?.name || 'Unknown',
          t.reason
        ];
      });

    autoTable(doc, {
      startY: 80,
      head: [['Date', 'Type', 'Category', 'Amount', 'Wallet', 'Description']],
      body: tableRows,
      theme: 'grid',
      headStyles: { fillColor: [0, 0, 0] }, // Black header
      alternateRowStyles: { fillColor: [245, 245, 245] },
      styles: { fontSize: 9 },
    });

    const fileName = `hisabify-report-${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
    toast.success('PDF Report exported successfully');
  };

  const handleClearData = () => {
    setShowClearDataDialog(true);
  };

  const confirmClearData = () => {
    localStorage.removeItem('spendwise-storage');
    window.location.reload();
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Signed out successfully');
      navigate('/login');
    } catch (error) {
      toast.error('Error signing out');
    }
  };

  const settingsGroups = [
    {
      title: t('settings.app'),
      items: [
        {
          id: 'install_app',
          icon: Smartphone,
          label: t('settings.install_app'),
          description: isInstalled ? t('settings.app_installed') : t('settings.add_to_home'),
          action: handleInstall,
          disabled: !isInstallable,
        },
      ],
    },
    {
      title: t('settings.account'),
      items: [
        {
          id: 'profile',
          icon: User,
          label: t('settings.profile'),
          description: user ? user.email : t('settings.guest_mode'),
          action: () => user ? null : navigate('/login'),
        },
        user ? {
          id: 'sign_out',
          icon: LogOut,
          label: t('settings.sign_out'),
          description: t('settings.sign_out_desc'),
          action: handleSignOut,
          destructive: true,
        } : {
          id: 'sign_in',
          icon: LogIn,
          label: t('settings.sign_in'),
          description: t('settings.sign_in_desc'),
          action: () => navigate('/login'),
        },
      ].filter(Boolean),
    },
    {
      title: t('settings.preferences'),
      items: [
        {
          id: 'theme',
          icon: resolvedTheme === 'dark' ? Moon : Sun,
          label: resolvedTheme === 'dark' ? t('settings.dark_mode') : t('settings.light_mode'),
          description: mounted ? (resolvedTheme === 'dark' ? t('settings.on') : t('settings.off')) : 'Loading...',
          action: () => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark'),
          hasToggle: true,
          isToggled: mounted && resolvedTheme === 'dark',
        },
      ],
    },
    {
      title: t('settings.data'),
      items: [
        {
          id: 'export_csv',
          icon: FileText,
          label: t('settings.export_csv'),
          description: t('settings.export_csv_desc'),
          action: handleExportCSV,
        },
        {
          id: 'export_data',
          icon: Download,
          label: t('settings.export_data'),
          description: t('settings.export_desc'),
          action: handleExport,
        },
        // {
        //   id: 'clear_data',
        //   icon: Trash2,
        //   label: t('settings.clear_data'),
        //   description: t('settings.clear_desc'),
        //   action: handleClearData,
        //   destructive: true,
        // },
      ],
    },
    {
      title: t('settings.support'),
      items: [
        {
          id: 'help_faq',
          icon: HelpCircle,
          label: t('settings.help_faq'),
          description: t('settings.help_desc'),
          action: () => navigate('/help'),
        },
        {
          id: 'privacy',
          icon: Shield,
          label: t('settings.privacy'),
          description: t('settings.privacy_desc'),
          action: () => navigate('/privacy'),
        },
      ],
    },

  ];

  return (
    <>
      <AppLayout title={t('settings.title')}>
        <div className="py-4 space-y-6">
          {/* App Info */}
          <Card className="p-4 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 animate-fade-in">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center overflow-hidden shadow-lg shadow-primary/20">
                <img src="/logo.png" alt="Hisabify" className="w-full h-full object-cover" />
              </div>
              <div>
                <h2 className="font-bold text-foreground text-lg">{i18n.language === 'ur' ? 'حساب فائی' : 'Hisabify'}</h2>
                <p className="text-sm text-muted-foreground">Version 1.0.0 • {user ? 'Pro Plan' : 'Guest Mode'}</p>
              </div>
            </div>
          </Card>

          {/* Stats */}
          <Card className="p-4 animate-fade-in" style={{ animationDelay: '50ms' }}>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{wallets.length}</p>
                <p className="text-xs text-muted-foreground">Wallets</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{transactions.length}</p>
                <p className="text-xs text-muted-foreground">Transactions</p>
              </div>
            </div>
          </Card>

          {/* Data Management */}
          {/* <section className="space-y-3 animate-fade-in">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <Download className="w-4 h-4" />
            {t('settings.data_management')}
          </h3>
          <Card className="divide-y divide-border/50">
            <button
              onClick={handleExport}
              className="w-full flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-primary/10 text-primary">
                  <Download className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-sm">{t('settings.export_data')}</p>
                  <p className="text-xs text-muted-foreground">Download all your data</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>

            <button className="w-full flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-primary/10 text-primary">
                  <Download className="w-4 h-4 rotate-180" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-sm">{t('settings.import_data')}</p>
                  <p className="text-xs text-muted-foreground">Restore from backup</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
          </Card>
        </section> */}

          {/* Settings Groups */}
          {settingsGroups.map((group, groupIndex) => (
            <section
              key={group.title}
              className="space-y-2 animate-fade-in"
              style={{ animationDelay: `${100 + groupIndex * 50}ms` }}
            >
              <h3 className="text-sm font-medium text-muted-foreground px-1">{group.title}</h3>
              <Card className="divide-y divide-border">
                {group.items.map((item: any) => {
                  if (item.hasToggle) {
                    return (
                      <div
                        key={item.id}
                        onClick={item.disabled ? undefined : item.action}
                        className={`w-full p-4 flex items-center gap-3 hover:bg-secondary/50 transition-colors text-left cursor-pointer ${item.destructive ? 'text-destructive' : ''
                          } ${item.disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
                      >
                        <item.icon className={`w-5 h-5 ${item.destructive ? 'text-destructive' : 'text-muted-foreground'}`} />
                        <div className="flex-1 min-w-0 text-start">
                          <p className={`font-medium text-sm ${item.destructive ? 'text-destructive' : 'text-foreground'}`}>
                            {item.label}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">{item.description}</p>
                        </div>
                        <div onClick={(e) => e.stopPropagation()}>
                          <Switch checked={item.isToggled} onCheckedChange={item.action} disabled={item.disabled} />
                        </div>
                      </div>
                    );
                  }
                  return (
                    <button
                      key={item.id}
                      onClick={item.action}
                      disabled={item.disabled}
                      className={`w-full p-4 flex items-center gap-3 hover:bg-secondary/50 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed ${item.destructive ? 'text-destructive' : ''
                        }`}
                    >
                      <item.icon className={`w-5 h-5 ${item.destructive ? 'text-destructive' : 'text-muted-foreground'}`} />
                      <div className="flex-1 min-w-0 text-start">
                        <p className={`font-medium text-sm ${item.destructive ? 'text-destructive' : 'text-foreground'}`}>
                          {item.label}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">{item.description}</p>
                      </div>
                      <ChevronRight className={`w-4 h-4 text-muted-foreground shrink-0 ${i18n.language === 'ur' ? 'rotate-180' : ''}`} />
                    </button>
                  );
                })}
              </Card>
            </section>
          ))}

          {/* Footer */}
          <div className="text-center pt-4 pb-8 animate-fade-in" style={{ animationDelay: '400ms' }}>
            <p className="text-xs text-muted-foreground">
              Made with ❤️ for better money management
            </p>
          </div>
        </div>
      </AppLayout>

      <AlertDialog open={showClearDataDialog} onOpenChange={setShowClearDataDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your account
              and remove your data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmClearData} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
