
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OrderHistory } from "@/components/profile/OrderHistory";
import { AddressBook } from "@/components/profile/AddressBook";
import { ScrollArea } from "@/components/ui/scroll-area";
import { User, Package, MapPin } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface UserWithRole {
    id: string;
    email: string;
    username: string | null;
    created_at: string;
    role: 'owner' | 'admin' | 'user';
    is_banned: boolean;
    ltv?: number;
}

interface CustomerDetailsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    user: UserWithRole | null;
}

export function CustomerDetailsDialog({ open, onOpenChange, user }: CustomerDetailsDialogProps) {
    const { data: orders, isLoading } = useQuery({
        queryKey: ['admin-user-orders', user?.id],
        queryFn: async () => {
            if (!user?.id) return [];
            const { data, error } = await supabase
                .from('orders')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data;
        },
        enabled: !!user?.id,
    });

    if (!user) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0">
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                        <User className="h-6 w-6" />
                        @{user.username || "No username"}
                    </DialogTitle>
                    <div className="text-sm text-muted-foreground">
                        {user.email} • Joined {new Date(user.created_at).toLocaleDateString()}
                    </div>
                </DialogHeader>

                <div className="grid gap-6 py-4 px-6"> {/* Added px-6 here */}
                    <div className="flex items-center gap-4">
                        <Avatar className="h-16 w-16">
                            <AvatarFallback className="text-lg">
                                {user.username?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <h3 className="text-xl font-semibold">@{user.username || 'No username'}</h3>
                            <p className="text-muted-foreground">{user.email}</p>
                            <div className="flex items-center gap-2 mt-1">
                                <Badge variant={user.is_banned ? "destructive" : "outline"} className={user.is_banned ? "" : "bg-green-500/10 text-green-600 border-green-500/20"}>
                                    {user.is_banned ? "Banned" : "Active"}
                                </Badge>
                                <Badge variant="outline">
                                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                                </Badge>
                                <span className="text-sm text-muted-foreground">
                                    Joined {new Date(user.created_at).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <Tabs defaultValue="orders" className="flex-1 flex flex-col overflow-hidden">
                    <div className="px-6 border-b">
                        <TabsList>
                            <TabsTrigger value="orders" className="flex items-center gap-2">
                                <Package className="h-4 w-4" />
                                Orders
                            </TabsTrigger>
                            <TabsTrigger value="addresses" className="flex items-center gap-2">
                                <MapPin className="h-4 w-4" />
                                Addresses
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <ScrollArea className="flex-1 p-6 bg-muted/20">
                        <TabsContent value="orders" className="mt-0">
                            <OrderHistory userId={user.id} />
                        </TabsContent>

                        <TabsContent value="addresses" className="mt-0">
                            <AddressBook userId={user.id} readOnly />
                        </TabsContent>
                    </ScrollArea>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
