import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Search, Shield, User, Crown, Ban, Trash2, ShieldOff } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { supabase as supabaseClient } from '@/integrations/supabase/client';

type AppRole = 'owner' | 'admin' | 'user';

interface UserWithRole {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
  role: AppRole;
  role_id: string | null;
  is_banned: boolean;
}

const roleIcons: Record<AppRole, typeof Crown> = {
  owner: Crown,
  admin: Shield,
  user: User,
};

const roleColors: Record<AppRole, string> = {
  owner: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  admin: 'bg-primary/10 text-primary border-primary/20',
  user: 'bg-muted text-muted-foreground border-border',
};

export default function AdminUsers() {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [banTarget, setBanTarget] = useState<UserWithRole | null>(null);
  const [banReason, setBanReason] = useState('');
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch users with their roles
  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      // Get all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, email, full_name, created_at, is_banned');

      if (profilesError) throw profilesError;

      // Get all user roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('id, user_id, role');

      if (rolesError) throw rolesError;

      // Map profiles to users with roles
      const usersWithRoles: UserWithRole[] = profiles.map((profile: any) => {
        const userRole = roles.find((r) => r.user_id === profile.user_id);
        return {
          id: profile.user_id,
          email: profile.email || '',
          full_name: profile.full_name,
          created_at: profile.created_at,
          role: (userRole?.role as AppRole) || 'user',
          role_id: userRole?.id || null,
          is_banned: profile.is_banned || false,
        };
      });

      return usersWithRoles;
    },
  });

  // Check if current user is owner
  const { data: currentUserRole } = useQuery({
    queryKey: ['current-user-role', currentUser?.id],
    queryFn: async () => {
      if (!currentUser?.id) return null;
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', currentUser.id)
        .maybeSingle();
      return data?.role as AppRole | null;
    },
    enabled: !!currentUser?.id,
  });

  const isOwner = currentUserRole === 'owner';

  // Update user role mutation
  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, newRole, oldRole, targetEmail }: { 
      userId: string; 
      newRole: AppRole; 
      oldRole: AppRole;
      targetEmail: string;
    }) => {
      // Delete existing role
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      // Insert new role
      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role: newRole });

      if (error) throw error;

      // Log the activity
      await supabase.from('activity_logs').insert({
        user_id: currentUser!.id,
        action: 'role_change',
        target_type: 'user',
        target_id: userId,
        details: {
          target_email: targetEmail,
          old_role: oldRole,
          new_role: newRole,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast({
        title: 'Role updated',
        description: 'User role has been updated successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to update user role.',
        variant: 'destructive',
      });
      console.error('Error updating role:', error);
    },
  });

  // Ban/Unban/Delete mutation
  const manageUserMutation = useMutation({
    mutationFn: async ({ action, userId, reason }: { action: 'ban' | 'unban' | 'delete'; userId: string; reason?: string }) => {
      const { data: { session } } = await supabaseClient.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await supabaseClient.functions.invoke('manage-user', {
        body: { action, userId, reason },
      });

      if (response.error) throw response.error;
      if (response.data?.error) throw new Error(response.data.error);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      const messages: Record<string, string> = {
        ban: 'User has been banned.',
        unban: 'User has been unbanned.',
        delete: 'User has been deleted.',
      };
      toast({ title: 'Success', description: messages[variables.action] });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message || 'Action failed.', variant: 'destructive' });
    },
  });

  const handleRoleChange = (userId: string, newRole: AppRole) => {
    if (userId === currentUser?.id) {
      toast({ title: 'Cannot change own role', description: 'You cannot change your own role.', variant: 'destructive' });
      return;
    }
    if (newRole === 'owner' && !isOwner) {
      toast({ title: 'Permission denied', description: 'Only owners can assign the owner role.', variant: 'destructive' });
      return;
    }
    const targetUser = users.find((u) => u.id === userId);
    if (targetUser?.role === 'owner' && !isOwner) {
      toast({ title: 'Permission denied', description: 'Only owners can modify owner accounts.', variant: 'destructive' });
      return;
    }
    if (!targetUser) return;
    updateRoleMutation.mutate({ userId, newRole, oldRole: targetUser.role, targetEmail: targetUser.email });
  };

  // Filter users
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.email.toLowerCase().includes(search.toLowerCase()) ||
      user.full_name?.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">User Management</h1>
        <p className="text-muted-foreground">Manage user roles and permissions</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by email or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="owner">Owner</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="user">User</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Users table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => {
                const RoleIcon = roleIcons[user.role];
                const isCurrentUser = user.id === currentUser?.id;
                const canEdit = isOwner || (currentUserRole === 'admin' && user.role === 'user');

                return (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-foreground">
                          {user.full_name || 'No name'}
                          {isCurrentUser && (
                            <span className="ml-2 text-xs text-muted-foreground">(You)</span>
                          )}
                        </p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {user.is_banned ? (
                        <Badge variant="destructive">Banned</Badge>
                      ) : (
                        <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">Active</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={roleColors[user.role]}>
                        <RoleIcon className="h-3 w-3 mr-1" />
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(user.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {!isCurrentUser && canEdit && (
                          <Select
                            value={user.role}
                            onValueChange={(value) => handleRoleChange(user.id, value as AppRole)}
                            disabled={updateRoleMutation.isPending}
                          >
                            <SelectTrigger className="w-28">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {isOwner && <SelectItem value="owner">Owner</SelectItem>}
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="user">User</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                        {isOwner && !isCurrentUser && (
                          <>
                            {user.is_banned ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => manageUserMutation.mutate({ action: 'unban', userId: user.id })}
                                disabled={manageUserMutation.isPending}
                              >
                                <ShieldOff className="h-4 w-4 mr-1" />
                                Unban
                              </Button>
                            ) : (
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => { setBanTarget(user); setBanReason(''); setBanDialogOpen(true); }}
                                disabled={manageUserMutation.isPending}
                              >
                                <Ban className="h-4 w-4 mr-1" />
                                Ban
                              </Button>
                            )}
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="sm" disabled={manageUserMutation.isPending}>
                                  <Trash2 className="h-4 w-4 mr-1" />
                                  Delete
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete User</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to permanently delete <strong>{user.email}</strong>? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => manageUserMutation.mutate({ action: 'delete', userId: user.id })}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </>
                        )}
                        {isCurrentUser && <span className="text-sm text-muted-foreground">—</span>}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Role explanation */}
      <div className="mt-8 grid sm:grid-cols-3 gap-4">
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center gap-2 mb-2">
            <Crown className="h-5 w-5 text-amber-500" />
            <h3 className="font-semibold text-foreground">Owner</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Full access to all features. Can manage all users including other owners and admins.
          </p>
        </div>
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-foreground">Admin</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Can manage products, categories, and orders. Can promote users to admin.
          </p>
        </div>
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center gap-2 mb-2">
            <User className="h-5 w-5 text-muted-foreground" />
            <h3 className="font-semibold text-foreground">User</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Standard customer access. Can browse products, place orders, and view order history.
          </p>
        </div>
      </div>
      {/* Ban Dialog */}
      <Dialog open={banDialogOpen} onOpenChange={setBanDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ban User</DialogTitle>
            <DialogDescription>
              Ban <strong>{banTarget?.email}</strong> from the platform. They will not be able to sign in.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="ban-reason">Reason (optional)</Label>
            <Textarea
              id="ban-reason"
              placeholder="Enter the reason for banning this user..."
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBanDialogOpen(false)}>Cancel</Button>
            <Button
              variant="destructive"
              disabled={manageUserMutation.isPending}
              onClick={() => {
                if (banTarget) {
                  manageUserMutation.mutate(
                    { action: 'ban', userId: banTarget.id, reason: banReason || undefined },
                    { onSuccess: () => setBanDialogOpen(false) }
                  );
                }
              }}
            >
              <Ban className="h-4 w-4 mr-1" />
              Ban User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
