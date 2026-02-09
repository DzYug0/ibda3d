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

interface Profile {
  full_name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
}

export default function ProfilePage() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [profile, setProfile] = useState<Profile>({ full_name: null, email: null, phone: null, address: null });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from('profiles').select('full_name, email, phone, address').eq('user_id', user.id).single().then(({ data }) => {
      if (data) setProfile(data);
      setLoading(false);
    });
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from('profiles').update({ full_name: profile.full_name, phone: profile.phone, address: profile.address }).eq('user_id', user.id);
    setSaving(false);
    if (error) {
      toast({ title: t.common.error, description: t.profile.updateError, variant: 'destructive' });
    } else {
      toast({ title: t.profile.profileUpdated, description: t.profile.changesSaved });
    }
  };

  if (authLoading) return null;
  if (!user) return <Navigate to="/auth" replace />;

  const initials = profile.full_name?.split(' ').map((n) => n[0]).join('').toUpperCase() || '?';

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar / User Info */}
          <Card className="md:w-1/3 h-fit">
            <CardHeader className="items-center text-center">
              <Avatar className="h-24 w-24 mb-4">
                <AvatarFallback className="text-3xl bg-primary text-primary-foreground">{initials}</AvatarFallback>
              </Avatar>
              <CardTitle className="text-xl">{profile.full_name || 'User'}</CardTitle>
              <CardDescription>{profile.email}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground text-center space-y-1">
                {profile.phone && <p>{profile.phone}</p>}
                {profile.address && <p>{profile.address}</p>}
              </div>
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
                    <CardDescription>Update your personal information.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {loading ? (
                      <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
                    ) : (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="name" className="flex items-center gap-2"><User className="h-4 w-4" /> {t.profile.fullName}</Label>
                          <Input id="name" value={profile.full_name || ''} onChange={(e) => setProfile({ ...profile, full_name: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email" className="flex items-center gap-2"><Mail className="h-4 w-4" /> {t.profile.email}</Label>
                          <Input id="email" value={profile.email || ''} disabled className="opacity-60" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone" className="flex items-center gap-2"><Phone className="h-4 w-4" /> {t.profile.phone}</Label>
                          <Input id="phone" value={profile.phone || ''} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="address" className="flex items-center gap-2"><MapPin className="h-4 w-4" /> {t.profile.address} (Default)</Label>
                          <Input id="address" value={profile.address || ''} onChange={(e) => setProfile({ ...profile, address: e.target.value })} />
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
