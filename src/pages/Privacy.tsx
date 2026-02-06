
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function Privacy() {
    const { t } = useTranslation();

    const sections = [
        { title: 'intro_title', text: 'intro_text' },
        { title: 'data_collection_title', text: 'data_collection_text' },
        { title: 'data_usage_title', text: 'data_usage_text' },
        { title: 'security_title', text: 'security_text' },
    ];

    return (
        <AppLayout title={t('privacy_page.title')}>
            <div className="py-4 space-y-6 max-w-2xl mx-auto">
                {/* Header */}
                <div className="text-center space-y-2 mb-8">
                    <div className="inline-flex p-3 bg-primary/10 rounded-full mb-2">
                        <Shield className="w-8 h-8 text-primary" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                        {t('privacy_page.last_updated')}
                    </p>
                </div>

                {/* Sections */}
                <div className="space-y-4">
                    {sections.map((section, index) => (
                        <Card key={index} className="animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-lg font-semibold">
                                    {t(`privacy_page.${section.title}`)}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    {t(`privacy_page.${section.text}`)}
                                </p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </AppLayout>
    );
}
