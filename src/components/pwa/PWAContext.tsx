import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface PWAContextType {
    deferredPrompt: any;
    isInstalled: boolean;
    installApp: () => Promise<boolean>;
    isInstallable: boolean;
    isIos: boolean;
}

const PWAContext = createContext<PWAContextType | undefined>(undefined);

export function PWAProvider({ children }: { children: ReactNode }) {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isInstalled, setIsInstalled] = useState(false);
    const isIos = /iphone|ipad|ipod/i.test(window.navigator.userAgent) ||
        (window.navigator.userAgent.includes('Mac') && 'ontouchend' in document);

    useEffect(() => {
        // Check if app is already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setIsInstalled(true);
        }

        // Listen for install prompt
        const handler = (e: any) => {
            e.preventDefault();
            console.log('PWA Install Prompt fired'); // Debug log
            setDeferredPrompt(e);
        };

        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const installApp = async () => {
        if (!deferredPrompt) {
            return false;
        }

        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            setDeferredPrompt(null);
            return true;
        }
        return false;
    };

    const value = {
        deferredPrompt,
        isInstalled,
        installApp,
        isInstallable: !!deferredPrompt && !isInstalled,
        isIos,
    };

    return (
        <PWAContext.Provider value={value}>
            {children}
        </PWAContext.Provider>
    );
}

export function usePWA() {
    const context = useContext(PWAContext);
    if (context === undefined) {
        throw new Error('usePWA must be used within a PWAProvider');
    }
    return context;
}
