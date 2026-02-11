import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { useLanguage } from '@/i18n/LanguageContext';

export default function PaymentSuccess() {
    const [searchParams] = useSearchParams();
    const sessionId = searchParams.get('checkout_id'); // Or whatever Chargily returns
    const { t } = useLanguage();

    return (
        <Layout>
            <div className="container mx-auto px-4 py-20 max-w-md text-center">
                <div className="mb-6 flex justify-center">
                    <div className="rounded-full bg-green-100 p-4 dark:bg-green-900/20">
                        <CheckCircle2 className="h-16 w-16 text-green-600 dark:text-green-500" />
                    </div>
                </div>

                <h1 className="mb-4 text-3xl font-bold">{t.checkout?.orderConfirmed || "Payment Successful!"}</h1>
                <p className="mb-8 text-muted-foreground">
                    Thank you for your purchase. Your order has been confirmed and is being processed.
                </p>

                <div className="space-y-4">
                    <Link to="/profile?tab=orders">
                        <Button className="w-full" size="lg">
                            View Your Order
                        </Button>
                    </Link>
                    <Link to="/">
                        <Button variant="outline" className="w-full">
                            Continue Shopping
                        </Button>
                    </Link>
                </div>
            </div>
        </Layout>
    );
}
