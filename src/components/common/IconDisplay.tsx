import {
    Utensils,
    Car,
    FileText,
    ShoppingBag,
    Film,
    Stethoscope,
    Banknote,
    Laptop,
    TrendingUp,
    Box,
    Wallet,
    CreditCard,
    Landmark,
    PiggyBank,
    Coins,
    HelpCircle,
    Heart,
    ArrowRightLeft
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Map of icon names to Lucide components
export const iconMap: Record<string, any> = {
    // Categories
    'Utensils': Utensils,
    'Car': Car,
    'FileText': FileText,
    'ShoppingBag': ShoppingBag,
    'Film': Film,
    'Stethoscope': Heart, // Remapped to Heart
    'Heart': Heart,
    'Banknote': Banknote,
    'Laptop': Laptop,
    'TrendingUp': TrendingUp,
    'Box': Box,
    'ArrowRightLeft': ArrowRightLeft,

    // Legacy Emoji Support
    '🍔': Utensils,
    '🚗': Car,
    '📄': FileText,
    '🛍️': ShoppingBag,
    '🎬': Film,
    '⚕️': Heart, // Remapped to Heart
    '💵': Banknote,
    '💻': Laptop,
    '📈': TrendingUp,
    '📦': Box,

    // Wallets
    'Wallet': Wallet,
    'CreditCard': CreditCard,
    'Landmark': Landmark,
    'PiggyBank': PiggyBank,
    'Coins': Coins,
    // More Legacy Emoji Support
    '🏦': Landmark,
    '💳': CreditCard,
    '🐖': PiggyBank,
    '👛': Wallet,
    '💰': Coins,
    '💸': Banknote,
};

interface IconDisplayProps {
    icon: string;
    className?: string;
}

export const IconDisplay = ({ icon, className }: IconDisplayProps) => {
    const IconComponent = iconMap[icon];

    // If it's an emoji (or not found in map), render as text
    if (!IconComponent) {
        // Render text/emoji with better alignment
        return (
            <span className={cn("flex items-center justify-center text-base leading-none", className)}>
                {icon || <HelpCircle className="w-5 h-5" />}
            </span>
        );
    }

    return <IconComponent className={cn("w-5 h-5", className)} />;
};
