import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from '@/hooks/use-toast';
import { User, Mail, MapPin, Save, Loader2, Package, Shield, LayoutDashboard, Upload, LogOut, Camera } from 'lucide-react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/i18n/LanguageContext';
import { AddressBook } from '@/components/profile/AddressBook';
import { OrderHistory } from '@/components/profile/OrderHistory';
import { SecuritySettings } from '@/components/profile/SecuritySettings';
import { ScrollReveal } from '@/components/ui/ScrollReveal';

interface Profile {
  username: string | null;
  email: string | null;
  avatar_url: string | null;
}

import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

function ProfileContent() {
  const { user, signOut, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile>({ username: null, email: null, avatar_url: null });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      try {
        const { data, error } = await supabase.from('profiles').select('username, email, avatar_url').eq('user_id', user.id).single();
        if (data) setProfile(data);
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    // Only update username
    const { error } = await supabase.from('profiles').update({ username: profile.username }).eq('user_id', user.id);
    setSaving(false);
    if (error) {
      toast({ title: t.common?.error || 'Error', description: t.profile?.updateError || 'Failed to update profile', variant: 'destructive' });
    } else {
      toast({ title: t.profile?.profileUpdated || 'Profile updated', description: t.profile?.changesSaved || 'Changes saved' });
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'Error', description: 'Image must be less than 5MB', variant: 'destructive' });
      return;
    }

    setUploadingAvatar(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      setProfile(prev => ({ ...prev, avatar_url: publicUrl }));
      toast({ title: 'Success', description: 'Profile image updated' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to upload avatar', variant: 'destructive' });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (authLoading) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }
  if (!user) return <Navigate to="/auth" replace />;

  const displayInitials = profile.username?.substring(0, 2).toUpperCase() || (user.email?.substring(0, 2).toUpperCase()) || 'U';

  return (
    <Layout>
      <div className="min-h-[80vh] bg-muted/30 py-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 pointer-events-none" />

        <div className="container mx-auto px-4 max-w-6xl relative z-10">
          <div className="flex flex-col lg:flex-row gap-8">

            {/* Sidebar / User Info */}
            <div className="lg:w-1/3 xl:w-1/4 space-y-6">
              <div className="bg-card/60 backdrop-blur-xl border border-border/50 shadow-sm rounded-3xl p-6 text-center relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-br from-primary/20 via-primary/5 to-transparent opacity-50" />

                <div className="relative z-10 flex flex-col items-center">
                  <div className="relative mb-4 group/avatar">
                    <Avatar className="h-28 w-28 border-4 border-background shadow-xl cursor-pointer">
                      <AvatarImage src={profile.avatar_url || ''} className="object-cover" />
                      <AvatarFallback className="text-3xl bg-primary/10 text-primary font-bold">{displayInitials}</AvatarFallback>
                    </Avatar>

                    <label
                      htmlFor="avatar-upload"
                      className={`absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover/avatar:opacity-100 transition-all cursor-pointer ${uploadingAvatar ? 'opacity-100 bg-black/60' : ''}`}
                    >
                      {uploadingAvatar ? (
                        <Loader2 className="h-8 w-8 text-white animate-spin" />
                      ) : (
                        <Camera className="h-8 w-8 text-white" />
                      )}
                    </label>
                    <input
                      type="file"
                      id="avatar-upload"
                      className="hidden"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      disabled={uploadingAvatar}
                    />
                  </div>

                  <h2 className="text-xl font-bold text-foreground mb-1">{profile.username || 'User'}</h2>
                  <p className="text-sm text-muted-foreground mb-6 break-all max-w-full px-4">{profile.email}</p>

                  <Button
                    variant="outline"
                    className="w-full border-destructive/20 text-destructive hover:bg-destructive/10 hover:text-destructive group/btn"
                    onClick={handleSignOut}
                  >
                    <LogOut className="h-4 w-4 mr-2 transition-transform group-hover/btn:-translate-x-1" />
                    {t.nav?.signOut || 'Sign Out'}
                  </Button>
                </div>
              </div>

              {/* Mobile Tabs Navigation (Desktop Hidden) */}
              <div className="lg:hidden bg-card/60 backdrop-blur-xl border border-border/50 rounded-2xl p-2 shadow-sm overflow-x-auto">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="w-full justify-start md:justify-center bg-transparent gap-2 p-0 h-auto">
                    {['overview', 'addresses', 'orders', 'security'].map(tab => (
                      <TabsTrigger
                        key={tab}
                        value={tab}
                        onClick={() => setActiveTab(tab)}
                        data-state={activeTab === tab ? 'active' : 'inactive'}
                        className="rounded-xl px-4 py-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary transition-all flex items-center gap-2"
                      >
                        {tab === 'overview' && <LayoutDashboard className="h-4 w-4" />}
                        {tab === 'addresses' && <MapPin className="h-4 w-4" />}
                        {tab === 'orders' && <Package className="h-4 w-4" />}
                        {tab === 'security' && <Shield className="h-4 w-4" />}
                        <span className="capitalize">{tab}</span>
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
              </div>

              {/* Desktop Navigation */}
              <div className="hidden lg:block bg-card/60 backdrop-blur-xl border border-border/50 rounded-3xl p-4 shadow-sm">
                <nav className="space-y-1">
                  {[
                    { id: 'overview', icon: LayoutDashboard, label: 'Overview' },
                    { id: 'addresses', icon: MapPin, label: 'Addresses' },
                    { id: 'orders', icon: Package, label: 'Orders' },
                    { id: 'security', icon: Shield, label: 'Security' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium ${activeTab === item.id
                        ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                        : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                        }`}
                    >
                      <item.icon className={`h-4 w-4 ${activeTab === item.id ? 'text-primary-foreground' : ''}`} />
                      {item.label}
                    </button>
                  ))}
                </nav>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 min-w-0">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">

                <TabsContent value="overview" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
                  <div className="space-y-6">
                    <div className="bg-card/60 backdrop-blur-xl border border-border/50 rounded-3xl p-6 shadow-sm">
                      <div className="mb-6 pb-4 border-b border-border/50">
                        <h3 className="text-xl font-bold text-foreground">{t.profile?.title || 'My Profile'}</h3>
                        <p className="text-sm text-muted-foreground">Update your public profile information.</p>
                      </div>

                      <div className="space-y-6 max-w-xl">
                        {loading ? (
                          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary/50" /></div>
                        ) : (
                          <>
                            <div className="space-y-3">
                              <Label htmlFor="username" className="flex items-center gap-2 text-sm font-medium">
                                <User className="h-4 w-4 text-primary" /> Username
                              </Label>
                              <Input
                                id="username"
                                value={profile.username || ''}
                                onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                                className="bg-background/50 border-border/50 focus:ring-primary/20 transition-all h-11"
                              />
                              <p className="text-[11px] text-muted-foreground ml-1">This is how you will appear publicly (e.g. in reviews).</p>
                            </div>

                            <div className="space-y-3">
                              <Label htmlFor="email" className="flex items-center gap-2 text-sm font-medium">
                                <Mail className="h-4 w-4 text-primary" /> {t.profile?.email || 'Email'}
                              </Label>
                              <Input
                                id="email"
                                value={profile.email || ''}
                                disabled
                                className="bg-muted/30 border-border/30 text-muted-foreground cursor-not-allowed h-11"
                              />
                              <p className="text-[11px] text-muted-foreground ml-1">To change your email, please use the Security tab.</p>
                            </div>

                            <div className="pt-4">
                              <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto min-w-[140px] rounded-full shadow-lg shadow-primary/20">
                                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                                {t.profile?.saveChanges || 'Save Changes'}
                              </Button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="addresses" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
                  <div className="bg-card/60 backdrop-blur-xl border border-border/50 rounded-3xl p-6 shadow-sm">
                    <AddressBook />
                  </div>
                </TabsContent>

                <TabsContent value="orders" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
                  <div className="bg-card/60 backdrop-blur-xl border border-border/50 rounded-3xl p-6 shadow-sm">
                    <div className="mb-6">
                      <h3 className="text-xl font-bold text-foreground">Order History</h3>
                      <p className="text-sm text-muted-foreground">View status and details of your past orders.</p>
                    </div>
                    <OrderHistory />
                  </div>
                </TabsContent>

                <TabsContent value="security" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
                  <div className="bg-card/60 backdrop-blur-xl border border-border/50 rounded-3xl p-6 shadow-sm">
                    <SecuritySettings />
                  </div>
                </TabsContent>

              </Tabs>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default function ProfilePage() {
  return (
    <ErrorBoundary>
      <ProfileContent />
    </ErrorBoundary>
  );
}
