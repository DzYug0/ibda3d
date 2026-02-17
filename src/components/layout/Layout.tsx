import { Header } from './Header';
import { Footer } from './Footer';
import { WhatsAppButton } from '../ui/WhatsAppButton';
import { PageTransition } from '../ui/PageTransition';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <PageTransition>{children}</PageTransition>
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
}
