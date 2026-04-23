import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Wallet, PlusCircle, BarChart3, Settings, HandCoins } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';

const navItems = [
  { path: '/', icon: Home, label: 'Home' },
  { path: '/wallets', icon: Wallet, label: 'Wallets' },
  { path: '/add', icon: PlusCircle, label: 'Add' },
  { path: '/analytics', icon: BarChart3, label: 'Analytics' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border pb-safe" dir="ltr">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {navItems.map(({ path, icon: Icon, label }) => {
          const isActive = location.pathname === path;
          const isAddButton = path === '/add';

          if (isAddButton) {
            return (
              <button
                key={path}
                type="button"
                onClick={() => setOpen(true)}
                className="relative -top-4 flex flex-col items-center justify-center gap-1 px-3 py-2 transition-all duration-200"
              >
                <div className="flex items-center justify-center w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all duration-200 hover:scale-105">
                  <Icon className="w-7 h-7" />
                </div>
              </button>
            );
          }

          return (
            <Link
              key={path}
              to={path}
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-3 py-2 transition-all duration-200",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className={cn("w-5 h-5 transition-transform", isActive && "scale-110")} />
              <span className={cn("text-xs font-medium", isActive && "font-semibold")}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl">
          <SheetHeader>
            <SheetTitle>Add something</SheetTitle>
            <SheetDescription>Quick actions for money tracking.</SheetDescription>
          </SheetHeader>
          <div className="grid gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                navigate('/add');
              }}
              className="flex items-center gap-3 rounded-2xl border border-border bg-background px-4 py-4 text-left transition-colors hover:bg-secondary"
            >
              <PlusCircle className="w-5 h-5 text-primary" />
              <div>
                <p className="font-medium text-foreground">Add transaction</p>
                <p className="text-sm text-muted-foreground">Income or expense entry</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setOpen(false);
                navigate('/settlements?new=1');
              }}
              className="flex items-center gap-3 rounded-2xl border border-border bg-background px-4 py-4 text-left transition-colors hover:bg-secondary"
            >
              <HandCoins className="w-5 h-5 text-primary" />
              <div>
                <p className="font-medium text-foreground">New settlement</p>
                <p className="text-sm text-muted-foreground">Money with people or split bills</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setOpen(false);
                navigate('/wallets');
              }}
              className="flex items-center gap-3 rounded-2xl border border-border bg-background px-4 py-4 text-left transition-colors hover:bg-secondary"
            >
              <Wallet className="w-5 h-5 text-primary" />
              <div>
                <p className="font-medium text-foreground">Add wallet</p>
                <p className="text-sm text-muted-foreground">Account, cash, or card</p>
              </div>
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </nav>
  );
}
