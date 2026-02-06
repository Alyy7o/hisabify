import { useEffect } from 'react';
import { LanguageToggle } from '@/components/common/LanguageToggle';
import { useTranslation } from 'react-i18next';

export const AuthHeader = () => {
    const { i18n } = useTranslation();

    useEffect(() => {
        document.dir = i18n.language === 'ur' ? 'rtl' : 'ltr';
    }, [i18n.language]);

    return (
        <div className="absolute top-0 left-0 w-full p-4 flex items-center justify-between z-10 pointer-events-none">
            <div className="flex items-center gap-2 pointer-events-auto">
                <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center overflow-hidden">
                    <img src="/logo.png" alt="Hisabify" className="w-full h-full object-cover" />
                </div>
                <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60 hidden sm:block">
                    {i18n.language === 'ur' ? 'حساب فائی' : 'Hisabify'}
                </span>
            </div>
            <div className="pointer-events-auto">
                <LanguageToggle />
            </div>
        </div>
    );
};
