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
  LogIn
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { useAuth } from '@/components/auth/AuthContext';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { useNavigate } from 'react-router-dom';

export default function Settings() {
  const { wallets, transactions } = useStore();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Listen for install prompt
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      toast.info('App is already installed or installation is not available');
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      toast.success('App installed successfully!');
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  const handleExport = () => {
    const data = {
      wallets,
      transactions,
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `spendwise-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success('Data exported successfully');
  };

  const handleClearData = () => {
    if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
      localStorage.removeItem('spendwise-storage');
      window.location.reload();
    }
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
      title: 'App',
      items: [
        {
          icon: Smartphone,
          label: 'Install App',
          description: isInstalled ? 'App is installed' : 'Add to home screen',
          action: handleInstall,
          disabled: isInstalled,
        },
      ],
    },
    {
      title: 'Account',
      items: [
        {
          icon: User,
          label: 'Profile',
          description: user ? user.email : 'Guest mode (local storage)',
          action: () => user ? null : navigate('/login'),
        },
        user ? {
          icon: LogOut,
          label: 'Sign Out',
          description: 'Log out of your account',
          action: handleSignOut,
          destructive: true,
        } : {
          icon: LogIn,
          label: 'Sign In',
          description: 'Sync your data to the cloud',
          action: () => navigate('/login'),
        },
      ].filter(Boolean),
    },
    {
      title: 'Preferences',
      items: [
        {
          icon: resolvedTheme === 'dark' ? Moon : Sun,
          label: 'Dark Mode',
          description: mounted ? (resolvedTheme === 'dark' ? 'On' : 'Off') : 'Loading...',
          action: () => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark'),
          hasToggle: true,
          isToggled: mounted && resolvedTheme === 'dark',
        },
      ],
    },
    {
      title: 'Data',
      items: [
        {
          icon: Download,
          label: 'Export Data',
          description: 'Download your data as JSON',
          action: handleExport,
        },
        {
          icon: Trash2,
          label: 'Clear All Data',
          description: 'Delete all wallets and transactions',
          action: handleClearData,
          destructive: true,
        },
      ],
    },
    {
      title: 'Support',
      items: [
        {
          icon: HelpCircle,
          label: 'Help & FAQ',
          description: 'Get help with SpendWise',
          action: () => toast.info('Help section coming soon!'),
        },
        {
          icon: Shield,
          label: 'Privacy',
          description: 'Your data stays on your device',
          action: () => toast.info('Your data is stored locally and never leaves your device.'),
        },
      ],
    },
  ];

  return (
    <AppLayout title="Settings">
      <div className="py-4 space-y-6">
        {/* App Info */}
        <Card className="p-4 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 animate-fade-in">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center text-2xl shadow-lg shadow-primary/20">
              💰
            </div>
            <div>
              <h2 className="font-bold text-foreground text-lg">SpendWise</h2>
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

        {/* Settings Groups */}
        {settingsGroups.map((group, groupIndex) => (
          <section
            key={group.title}
            className="space-y-2 animate-fade-in"
            style={{ animationDelay: `${100 + groupIndex * 50}ms` }}
          >
            <h3 className="text-sm font-medium text-muted-foreground px-1">{group.title}</h3>
            <Card className="divide-y divide-border">
              {group.items.map((item: any) => (
                <button
                  key={item.label}
                  onClick={item.action}
                  disabled={item.disabled}
                  className={`w-full p-4 flex items-center gap-3 hover:bg-secondary/50 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed ${item.destructive ? 'text-destructive' : ''
                    }`}
                >
                  <item.icon className={`w-5 h-5 ${item.destructive ? 'text-destructive' : 'text-muted-foreground'}`} />
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium text-sm ${item.destructive ? 'text-destructive' : 'text-foreground'}`}>
                      {item.label}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{item.description}</p>
                  </div>
                  {item.hasToggle ? (
                    <Switch checked={item.isToggled} onCheckedChange={item.action} />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                  )}
                </button>
              ))}
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
  );
}
