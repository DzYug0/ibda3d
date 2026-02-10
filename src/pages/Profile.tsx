import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from '@/hooks/use-toast';
import { User, Mail, Phone, MapPin, Save, Loader2, Package, Shield, LayoutDashboard } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { useLanguage } from '@/i18n/LanguageContext';
import { AddressBook } from '@/components/profile/AddressBook';
import { OrderHistory } from '@/components/profile/OrderHistory';
import { SecuritySettings } from '@/components/profile/SecuritySettings';

// ... imports

interface Profile {
  username: string | null;
  email: string | null;
  avatar_url: string | null;
}

export default function ProfilePage() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [profile, setProfile] = useState<Profile>({ username: null, email: null, avatar_url: null });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from('profiles').select('username, email, avatar_url').eq('user_id', user.id).single().then(({ data }) => {
      if (data) setProfile(data);
      setLoading(false);
    });
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    // Only update username
    const { error } = await supabase.from('profiles').update({ username: profile.username }).eq('user_id', user.id);
    setSaving(false);
    if (error) {
      toast({ title: t.common.error, description: t.profile.updateError, variant: 'destructive' });
    } else {
      toast({ title: t.profile.profileUpdated, description: t.profile.changesSaved });
    }
  };

  if (authLoading) return null;
  if (!user) return <Navigate to="/auth" replace />;

  const displayInitials = profile.username?.substring(0, 2).toUpperCase() || 'U';

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar / User Info */}
          <Card className="md:w-1/3 h-fit">
            <CardHeader className="items-center text-center">
              <Avatar className="h-24 w-24 mb-4">
                <AvatarFallback className="text-3xl bg-primary text-primary-foreground">{displayInitials}</AvatarFallback>
              </Avatar>
              <CardTitle className="text-xl">@{profile.username || 'user'}</CardTitle>
              <CardDescription>{profile.email}</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Phone and address removed from sidebar summary as they are in Address Book now */}
            </CardContent>
          </Card>

          {/* Main Content Areas */}
          <div className="md:w-2/3">
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4 mb-8">
                <TabsTrigger value="overview"><LayoutDashboard className="h-4 w-4 md:mr-2" /><span className="hidden md:inline">Overview</span></TabsTrigger>
                <TabsTrigger value="addresses"><MapPin className="h-4 w-4 md:mr-2" /><span className="hidden md:inline">Addresses</span></TabsTrigger>
                <TabsTrigger value="orders"><Package className="h-4 w-4 md:mr-2" /><span className="hidden md:inline">Orders</span></TabsTrigger>
                <TabsTrigger value="security"><Shield className="h-4 w-4 md:mr-2" /><span className="hidden md:inline">Security</span></TabsTrigger>
              </TabsList>

              <TabsContent value="overview">
                <Card>
                  <CardHeader>
                    <CardTitle>{t.profile.title}</CardTitle>
                    <CardDescription>Update your public profile information.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {loading ? (
                      <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
                    ) : (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="username" className="flex items-center gap-2"><User className="h-4 w-4" /> Username</Label>
                          <Input id="username" value={profile.username || ''} onChange={(e) => setProfile({ ...profile, username: e.target.value })} />
                          <p className="text-xs text-muted-foreground">This is how you will appear publicly (e.g. in reviews).</p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email" className="flex items-center gap-2"><Mail className="h-4 w-4" /> {t.profile.email}</Label>
                          <Input id="email" value={profile.email || ''} disabled className="opacity-60" />
                          <p className="text-xs text-muted-foreground">To change your email, please contact support.</p>
                        </div>

                        <div className="rounded-md bg-muted p-4 text-sm text-muted-foreground">
                          <p>To manage your <strong>Full Name</strong>, <strong>Phone Number</strong>, and <strong>Shipping Addresses</strong>, please go to the <Button variant="link" className="p-0 h-auto font-semibold" onClick={() => document.querySelector('[value="addresses"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true }))}>Addresses</Button> tab.</p>
                        </div>

                        <Button onClick={handleSave} disabled={saving} className="w-full">
                          {saving ? <Loader2 className="h-4 w-4 me-2 animate-spin" /> : <Save className="h-4 w-4 me-2" />}
                          {t.profile.saveChanges}
                        </Button>
                      </>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="addresses">
                <Card>
                  <CardHeader>
                    <CardTitle>Address Book</CardTitle>
                    <CardDescription>Manage your saved addresses for faster checkout.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <AddressBook />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="orders">
                <Card>
                  <CardHeader>
                    <CardTitle>Order History</CardTitle>
                    <CardDescription>View status and details of your past orders.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <OrderHistory />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="security">
                <Card>
                  <CardHeader>
                    <CardTitle>Security Settings</CardTitle>
                    <CardDescription>Manage your password and account security.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <SecuritySettings />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </Layout>
  );
}
