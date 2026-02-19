import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/layout/Layout';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ArrowLeft, FileWarning } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

interface LegalPageProps {
    slug: string;
}

export default function LegalPage({ slug }: LegalPageProps) {
    const { data: page, isLoading, error } = useQuery({
        queryKey: ['legal-page', slug],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('legal_pages')
                .select('*')
                .eq('slug', slug)
                .eq('is_active', true)
                .single();

            if (error) throw error;
            return data;
        },
        staleTime: 1000 * 60 * 60, // 1 hour
    });

    if (isLoading) {
        return (
            <Layout>
                <div className="container mx-auto px-4 py-8 md:py-16 max-w-4xl space-y-6">
                    <Skeleton className="h-10 w-32" />
                    <Skeleton className="h-12 w-3/4" />
                    <div className="space-y-4 pt-8">
                        <Skeleton className="h-6 w-full" />
                        <Skeleton className="h-6 w-full" />
                        <Skeleton className="h-6 w-5/6" />
                        <Skeleton className="h-40 w-full" />
                    </div>
                </div>
            </Layout>
        );
    }

    if (error || !page) {
        return (
            <Layout>
                <div className="container mx-auto px-4 py-16 flex flex-col items-center justify-center text-center max-w-md">
                    <div className="bg-destructive/10 p-4 rounded-full mb-6">
                        <FileWarning className="h-10 w-10 text-destructive" />
                    </div>
                    <h1 className="text-2xl font-bold mb-2">Page Not Found</h1>
                    <p className="text-muted-foreground mb-8">
                        The link you followed may be broken, or the page may have been removed.
                    </p>
                    <Link to="/">
                        <Button>
                            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
                        </Button>
                    </Link>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <Helmet>
                <title>{page.title} | Ibda3D</title>
                <meta name="description" content={page.title} />
            </Helmet>

            <div className="container mx-auto px-4 py-12 md:py-16 max-w-4xl">
                <Link to="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors mb-8">
                    <ArrowLeft className="mr-1 h-3 w-3" /> Back to Home
                </Link>

                <div className="prose prose-lg dark:prose-invert max-w-none prose-headings:font-bold prose-blue">
                    <div dangerouslySetInnerHTML={{ __html: page.content }} />
                </div>

                <div className="mt-16 pt-8 border-t border-border/50 text-xs text-muted-foreground text-center">
                    Last updated: {new Date(page.updated_at).toLocaleDateString()}
                </div>
            </div>
        </Layout>
    );
}
