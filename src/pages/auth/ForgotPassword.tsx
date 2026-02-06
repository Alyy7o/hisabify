
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { AuthHeader } from '@/components/auth/AuthHeader';

export default function ForgotPassword() {
    const { t } = useTranslation();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/update-password`,
            });

            if (error) throw error;

            setSent(true);
            toast.success(t('auth.check_email'));
        } catch (error: any) {
            toast.error(error.message || t('auth.error_reset'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center p-4 bg-background relative">
            <AuthHeader />
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold">{t('auth.reset_password')}</CardTitle>
                    <CardDescription>
                        {t('auth.reset_password_desc')}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {sent ? (
                        <div className="text-center space-y-4">
                            <div className="flex justify-center">
                                <div className="rounded-full bg-primary/10 p-3">
                                    <svg
                                        className="h-6 w-6 text-primary"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M5 13l4 4L19 7"
                                        ></path>
                                    </svg>
                                </div>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                {t('auth.link_sent')} <span className="font-medium text-foreground">{email}</span>.
                            </p>
                        </div>
                    ) : (
                        <form onSubmit={handleReset} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">{t('auth.email')}</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="m@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? t('auth.sending_link') : t('auth.send_reset_link')}
                            </Button>
                        </form>
                    )}
                </CardContent>
                <CardFooter>
                    <div className="text-sm text-center w-full text-muted-foreground">
                        {t('auth.remember_password')}{' '}
                        <Link to="/login" className="text-primary hover:underline font-medium">
                            {t('auth.back_to_login')}
                        </Link>
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
}
