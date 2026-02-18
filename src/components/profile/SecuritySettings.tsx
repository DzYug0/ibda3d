
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Lock, Mail, ShieldCheck } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export function SecuritySettings() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            toast({ title: 'Error', description: 'Passwords do not match', variant: 'destructive' });
            return;
        }
        if (password.length < 6) {
            toast({ title: 'Error', description: 'Password must be at least 6 characters', variant: 'destructive' });
            return;
        }

        setLoading(true);
        const { error } = await supabase.auth.updateUser({ password: password });

        if (error) {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        } else {
            toast({ title: 'Success', description: 'Password updated successfully' });
            setPassword('');
            setConfirmPassword('');
        }
        setLoading(false);
    };

    return (
        <div className="max-w-xl space-y-8">
            <div>
                <div className="flex items-center gap-2 mb-4">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-bold text-foreground">Change Password</h3>
                </div>
                <form onSubmit={handlePasswordChange} className="space-y-5 bg-card/40 backdrop-blur-sm border border-border/40 rounded-2xl p-6 shadow-sm">
                    <div className="space-y-2">
                        <Label htmlFor="password">New Password</Label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="pl-9 bg-background/50 border-border/50"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirm New Password</Label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="confirmPassword"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="pl-9 bg-background/50 border-border/50"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                    </div>
                    <div className="pt-2">
                        <Button type="submit" disabled={loading} className="w-full sm:w-auto min-w-[160px] rounded-full shadow-lg shadow-primary/20">
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Update Password
                        </Button>
                    </div>
                </form>
            </div>

            <Separator className="bg-border/50" />

            <div>
                <div className="flex items-center gap-2 mb-4">
                    <Mail className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-bold text-foreground">Change Email</h3>
                </div>
                <div className="bg-card/40 backdrop-blur-sm border border-border/40 rounded-2xl p-6 shadow-sm">
                    <EmailChangeForm />
                </div>
            </div>
        </div>
    );
}

function EmailChangeForm() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');

    const handleEmailChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const { error } = await supabase.auth.updateUser({ email: email });

        if (error) {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        } else {
            toast({ title: 'Check your email', description: 'Confirmation links have been sent to both your old and new email addresses.' });
            setEmail('');
        }
        setLoading(false);
    };

    return (
        <form onSubmit={handleEmailChange} className="space-y-5">
            <div className="space-y-2">
                <Label htmlFor="new-email">New Email Address</Label>
                <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                        id="new-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-9 bg-background/50 border-border/50"
                        placeholder="new@example.com"
                        required
                    />
                </div>
                <p className="text-xs text-muted-foreground ml-1">
                    You will need to confirm this change via email on both your current and new addresses.
                </p>
            </div>
            <Button type="submit" disabled={loading} variant="outline" className="w-full sm:w-auto min-w-[160px] rounded-full border-primary/20 hover:bg-primary/5 hover:text-primary">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Email
            </Button>
        </form>
    );
}
