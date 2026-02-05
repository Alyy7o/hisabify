import { Link, useLocation } from 'react-router-dom';
import { Home, Wallet, PlusCircle, BarChart3, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/', icon: Home, label: 'Home' },
  { path: '/wallets', icon: Wallet, label: 'Wallets' },
  { path: '/add', icon: PlusCircle, label: 'Add' },
  { path: '/analytics', icon: BarChart3, label: 'Analytics' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

export function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border pb-safe">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {navItems.map(({ path, icon: Icon, label }) => {
          const isActive = location.pathname === path;
          const isAddButton = path === '/add';
          
          return (
            <Link
              key={path}
              to={path}
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-3 py-2 transition-all duration-200",
                isAddButton 
                  ? "relative -top-4" 
                  : isActive 
                    ? "text-primary" 
                    : "text-muted-foreground hover:text-foreground"
              )}
            >
              {isAddButton ? (
                <div className="flex items-center justify-center w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all duration-200 hover:scale-105">
                  <Icon className="w-7 h-7" />
                </div>
              ) : (
                <>
                  <Icon className={cn("w-5 h-5 transition-transform", isActive && "scale-110")} />
                  <span className={cn("text-xs font-medium", isActive && "font-semibold")}>
                    {label}
                  </span>
                </>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
