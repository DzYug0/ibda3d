
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OrderHistory } from "@/components/profile/OrderHistory";
import { AddressBook } from "@/components/profile/AddressBook";
import { ScrollArea } from "@/components/ui/scroll-area";
import { User, Package, MapPin } from "lucide-react";

interface CustomerDetailsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    user: {
        id: string;
        email: string;
        full_name: string | null;
        created_at: string;
        role: string;
        is_banned: boolean;
    } | null;
}

export function CustomerDetailsDialog({
    open,
    onOpenChange,
    user,
}: CustomerDetailsDialogProps) {
    if (!user) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0">
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                        <User className="h-6 w-6" />
                        {user.full_name || "Customer Details"}
                    </DialogTitle>
                    <div className="text-sm text-muted-foreground">
                        {user.email} • Joined {new Date(user.created_at).toLocaleDateString()}
                    </div>
                </DialogHeader>

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
