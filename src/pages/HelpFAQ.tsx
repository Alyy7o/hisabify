
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, MessageCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function HelpFAQ() {
    const { t } = useTranslation();

    const faqs = [
        { q: 'q1', a: 'a1' },
        { q: 'q2', a: 'a2' },
        { q: 'q3', a: 'a3' },
        { q: 'q4', a: 'a4' },
    ];

    return (
        <AppLayout title={t('help_page.title')}> 
            <div className="py-4 space-y-6">
                {/* Support Contact */}
                <Card className="bg-primary/5 border-primary/20">
                    <CardContent className="p-6 flex flex-col items-center text-center space-y-4">
                        <div className="p-3 bg-primary/10 rounded-full">
                            <MessageCircle className="w-8 h-8 text-primary" />
                        </div>
                        <div>
                            <h3 className="fontnpm run-bold text-lg">{t('help_page.contact_support')}</h3>
                            <p className="text-sm text-muted-foreground">{t('help_page.contact_desc')}</p>
                        </div>
                        <a
                            href="mailto:alijaved.developer@gmail.com"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
                        >
                            <Mail className="w-4 h-4" />
                            {t('help_page.email_us')}
                        </a>
                    </CardContent>
                </Card>

                {/* FAQs */}
                <div className="space-y-4">
                    <h3 className="font-semibold text-lg px-1">{t('help_page.faq_title')}</h3>
                    <div className="space-y-3">
                        {faqs.map((item, index) => (
                            <Card key={index} className="animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-base font-medium text-primary">
                                        {t(`help_page.${item.q}`)}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        {t(`help_page.${item.a}`)}
                                    </p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
