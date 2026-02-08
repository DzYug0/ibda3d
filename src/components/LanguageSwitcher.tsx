import { useLanguage } from '@/i18n/LanguageContext';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';

export function LanguageSwitcher({ variant = 'ghost', className = '' }: { variant?: 'ghost' | 'outline'; className?: string }) {
  const { language, setLanguage, t } = useLanguage();

  return (
    <Button
      variant={variant}
      size="sm"
      onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
      className={`gap-1.5 ${className}`}
    >
      <Globe className="h-4 w-4" />
      <span className="text-sm font-medium">{t.language.switchTo}</span>
    </Button>
  );
}
