import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User, ShieldAlert } from 'lucide-react';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

import { useLanguage } from '@/i18n/LanguageContext';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import logo from '@/assets/logo.png';

const emailSchema = z.string().email('Please enter a valid email address');
const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');
const usernameSchema = z.string().min(3, 'Username must be at least 3 characters').regex(/^[a-z0-9_]+$/, 'Username can only contain lowercase letters, numbers, and underscores');

export default function Auth() {
  const [searchParams] = useSearchParams();
  const [isSignUp, setIsSignUp] = useState(searchParams.get('tab') === 'signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; username?: string }>({});
  const [banInfo, setBanInfo] = useState<{ is_banned: boolean; ban_reason: string | null } | null>(null);
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();

  useEffect(() => { if (user) navigate('/'); }, [user, navigate]);
  useEffect(() => { setIsSignUp(searchParams.get('tab') === 'signup'); }, [searchParams]);

  const validateForm = () => {
    const newErrors: { email?: string; password?: string; username?: string } = {};
    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) newErrors.email = emailResult.error.errors[0].message;
    const passwordResult = passwordSchema.safeParse(password);
    if (!passwordResult.success) newErrors.password = passwordResult.error.errors[0].message;
    if (isSignUp) {
      const usernameResult = usernameSchema.safeParse(username);
      if (!usernameResult.success) newErrors.username = usernameResult.error.errors[0].message;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);
    setBanInfo(null);
    try {
      if (isSignUp) {
        const { error } = await signUp(email, password, username);
        if (error) {
          toast.error(error.message.includes('already registered') ? 'This email is already registered.' : error.message);
        } else {
          toast.success('Account created! Please check your email.');
        }
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          // Check if user is banned
          if (error.message.includes('banned') || error.message.includes('Invalid login credentials')) {
            try {
              const { data } = await supabase.functions.invoke('manage-user', {
                body: { action: 'check_ban', userId: email },
              });
              if (data?.is_banned) {
                setBanInfo({ is_banned: true, ban_reason: data.ban_reason });
                return;
              }
            } catch { /* ignore check_ban errors */ }
          }
          toast.error(error.message.includes('Invalid login credentials') ? 'Invalid email or password' : error.message);
        } else {
          toast.success('Welcome back!');
          navigate('/');
        }
      }
    } catch { toast.error('An unexpected error occurred'); }
    finally { setIsLoading(false); }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) toast.error(error.message || 'Failed to sign in with Google');
    } catch { toast.error('An unexpected error occurred'); }
    finally { setIsGoogleLoading(false); }
  };

  return (
    <div className="min-h-screen flex">
      <div className="flex-1 flex items-center justify-center px-4 py-12 relative">
        <div className="absolute top-4 end-4">
          <LanguageSwitcher variant="outline" />
        </div>
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <Link to="/" className="inline-flex items-center gap-2 mb-8">
              <img src={logo} alt="Ibda3D" className="h-12 w-auto" />
            </Link>
            <h1 className="text-3xl font-bold text-foreground">
              {isSignUp ? t.auth.createAccount : t.auth.welcomeBack}
            </h1>
            <p className="mt-2 text-muted-foreground">
              {isSignUp ? t.auth.startShopping : t.auth.signInContinue}
            </p>
          </div>

          {banInfo?.is_banned && (
            <Alert variant="destructive">
              <ShieldAlert className="h-4 w-4" />
              <AlertTitle>Account Suspended</AlertTitle>
              <AlertDescription>
                Your account has been banned and you cannot sign in.
                {banInfo.ban_reason && (
                  <span className="block mt-1"><strong>Reason:</strong> {banInfo.ban_reason}</span>
                )}
                <span className="block mt-1 text-xs">If you believe this is a mistake, please contact support.</span>
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {isSignUp && (
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <div className="relative">
                  <User className="absolute start-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input id="username" type="text" placeholder="username" value={username} onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, '_'))} className="ps-10" />
                </div>
                {errors.username && <p className="text-sm text-destructive">{errors.username}</p>}
                <p className="text-xs text-muted-foreground">Only lowercase letters, numbers, and underscores.</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">{t.auth.email}</Label>
              <div className="relative">
                <Mail className="absolute start-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="ps-10" />
              </div>
              {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{t.auth.password}</Label>
              <div className="relative">
                <Lock className="absolute start-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input id="password" type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="ps-10 pe-10" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={isLoading || isGoogleLoading}>
              {isLoading ? t.auth.pleaseWait : isSignUp ? t.auth.createAccountBtn : t.auth.signInBtn}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">{t.auth.orContinueWith}</span>
            </div>
          </div>

          <Button type="button" variant="outline" className="w-full" size="lg" onClick={handleGoogleSignIn} disabled={isLoading || isGoogleLoading}>
            {isGoogleLoading ? t.auth.connecting : (
              <>
                <svg className="me-2 h-5 w-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                {t.auth.continueWithGoogle}
              </>
            )}
          </Button>

          <div className="text-center">
            <p className="text-muted-foreground">
              {isSignUp ? t.auth.alreadyHaveAccount : t.auth.dontHaveAccount}{' '}
              <button onClick={() => setIsSignUp(!isSignUp)} className="text-primary font-semibold hover:underline">
                {isSignUp ? t.nav.signIn : t.nav.signUp}
              </button>
            </p>
          </div>
        </div>
      </div>

      <div className="hidden lg:flex flex-1 bg-gradient-hero relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center p-12">
          <div className="text-center text-primary-foreground">
            <h2 className="text-4xl font-bold mb-4">{t.auth.heroTitle}</h2>
            <p className="text-xl text-primary-foreground/80 max-w-md">{t.auth.heroSubtitle}</p>
          </div>
        </div>
        <div className="absolute top-20 right-20 w-64 h-64 rounded-full bg-primary-foreground/10 blur-3xl" />
        <div className="absolute bottom-20 left-20 w-96 h-96 rounded-full bg-primary-foreground/10 blur-3xl" />
      </div>
    </div>
  );
}
