import { ReactNode } from 'react';
import { BottomNav } from './BottomNav';

interface AppLayoutProps {
  children: ReactNode;
  title?: string;
  showNav?: boolean;
}

export function AppLayout({ children, title, showNav = true }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {title && (
        <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border">
          <div className="flex items-center justify-between h-14 px-4 max-w-lg mx-auto">
            <h1 className="text-lg font-semibold text-foreground">{title}</h1>
          </div>
        </header>
      )}
      <main className={`max-w-lg mx-auto ${showNav ? 'pb-24' : 'pb-4'} px-4`}>
        {children}
      </main>
      {showNav && <BottomNav />}
    </div>
  );
}
