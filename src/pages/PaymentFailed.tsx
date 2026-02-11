import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { XCircle } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';

export default function PaymentFailed() {
    return (
        <Layout>
            <div className="container mx-auto px-4 py-20 max-w-md text-center">
                <div className="mb-6 flex justify-center">
                    <div className="rounded-full bg-red-100 p-4 dark:bg-red-900/20">
                        <XCircle className="h-16 w-16 text-red-600 dark:text-red-500" />
                    </div>
                </div>

                <h1 className="mb-4 text-3xl font-bold">Payment Failed</h1>
                <p className="mb-8 text-muted-foreground">
                    Something went wrong with your payment. No charges were made.
                </p>

                <div className="space-y-4">
                    <Link to="/checkout">
                        <Button className="w-full" size="lg">
                            Try Again
                        </Button>
                    </Link>
                    <Link to="/contact">
                        <Button variant="outline" className="w-full">
                            Contact Support
                        </Button>
                    </Link>
                </div>
            </div>
        </Layout>
    );
}
