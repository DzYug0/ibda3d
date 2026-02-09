
import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, MapPin, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { useLanguage } from "@/i18n/LanguageContext";

interface Address {
    id: string;
    label: string;
    full_name: string;
    phone: string;
    address_line1: string;
    city: string;
    state: string;
    zip_code: string;
    is_default: boolean;
}

interface AddressBookProps {
    userId?: string;
    readOnly?: boolean;
}

export function AddressBook({ userId, readOnly = false }: AddressBookProps) {
    const { user } = useAuth();
    // Use passed userId or fallback to current user
    const targetUserId = userId || user?.id;

    const { toast } = useToast();
    const { t } = useLanguage();
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingAddress, setEditingAddress] = useState<Address | null>(null);
    const [formData, setFormData] = useState({
        label: "Home",
        full_name: "",
        phone: "",
        address_line1: "",
        city: "",
        state: "",
        zip_code: "",
        is_default: false,
    });

    const fetchAddresses = async () => {
        if (!targetUserId) return;
        const { data, error } = await supabase
            .from("user_addresses")
            .select("*")
            .eq("user_id", targetUserId)
            .order("is_default", { ascending: false });

        if (error) {
            console.error("Error fetching addresses:", error);
        } else {
            setAddresses(data || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchAddresses();
    }, [targetUserId]);

    const resetForm = () => {
        setFormData({
            label: "Home",
            full_name: "",
            phone: "",
            address_line1: "",
            city: "",
            state: "",
            zip_code: "",
            is_default: false,
        });
        setEditingAddress(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!targetUserId || readOnly) return;

        try {
            const addressData = {
                user_id: targetUserId,
                ...formData,
            };

            if (addressData.is_default) {
                // Optimistically update local state to uncheck other defaults
                setAddresses(prev => prev.map(a => ({ ...a, is_default: false })));

                // Use a transaction or reliance on DB trigger ideally, but manual update for now if trigger missing
                await supabase
                    .from("user_addresses")
                    .update({ is_default: false })
                    .eq("user_id", targetUserId);
            }

            if (editingAddress) {
                const { error } = await supabase
                    .from("user_addresses")
                    .update(addressData)
                    .eq("id", editingAddress.id);
                if (error) throw error;
                toast({ title: "Success", description: "Address updated successfully" });
            } else {
                const { error } = await supabase.from("user_addresses").insert(addressData);
                if (error) throw error;
                toast({ title: "Success", description: "Address added successfully" });
            }

            setIsDialogOpen(false);
            resetForm();
            fetchAddresses();
        } catch (error) {
            console.error("Error saving address:", error);
            toast({
                title: "Error",
                description: "Failed to save address",
                variant: "destructive",
            });
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this address?")) return;

        const { error } = await supabase.from("user_addresses").delete().eq("id", id);
        if (error) {
            toast({
                title: "Error",
                description: "Failed to delete address",
                variant: "destructive",
            });
        } else {
            toast({ title: "Success", description: "Address deleted" });
            fetchAddresses();
        }
    };

    const openEdit = (address: Address) => {
        setEditingAddress(address);
        setFormData({
            label: address.label,
            full_name: address.full_name,
            phone: address.phone,
            address_line1: address.address_line1,
            city: address.city,
            state: address.state,
            zip_code: address.zip_code,
            is_default: address.is_default,
        });
        setIsDialogOpen(true);
    };

    const openCreate = () => {
        resetForm();
        setIsDialogOpen(true);
    };

    if (loading) return <div>Loading addresses...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">{t.profile?.myAddresses || "My Addresses"}</h3>
                {!readOnly && (
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button onClick={openCreate} size="sm">
                                <Plus className="h-4 w-4 mr-2" /> {t.common?.add || "Add Address"}
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>
                                    {editingAddress ? (t.common?.edit || "Edit Address") : (t.common?.add || "Add New Address")}
                                </DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="label">Label</Label>
                                        <Input
                                            id="label"
                                            value={formData.label}
                                            onChange={(e) =>
                                                setFormData({ ...formData, label: e.target.value })
                                            }
                                            placeholder="Home, Work, etc."
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="full_name">Full Name</Label>
                                        <Input
                                            id="full_name"
                                            value={formData.full_name}
                                            onChange={(e) =>
                                                setFormData({ ...formData, full_name: e.target.value })
                                            }
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="phone">Phone</Label>
                                        <Input
                                            id="phone"
                                            value={formData.phone}
                                            onChange={(e) =>
                                                setFormData({ ...formData, phone: e.target.value })
                                            }
                                            required
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="zip_code">Zip Code (Wilaya)</Label>
                                        <Input
                                            id="zip_code"
                                            value={formData.zip_code}
                                            onChange={(e) =>
                                                setFormData({ ...formData, zip_code: e.target.value })
                                            }
                                        />
                                    </div>
                                </div>
                                <div>
                                    <Label htmlFor="address">Address</Label>
                                    <Input
                                        id="address"
                                        value={formData.address_line1}
                                        onChange={(e) =>
                                            setFormData({ ...formData, address_line1: e.target.value })
                                        }
                                        placeholder="Street address, apartment, etc."
                                        required
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="city">City</Label>
                                        <Input
                                            id="city"
                                            value={formData.city}
                                            onChange={(e) =>
                                                setFormData({ ...formData, city: e.target.value })
                                            }
                                            required
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="state">State</Label>
                                        <Input
                                            id="state"
                                            value={formData.state}
                                            onChange={(e) =>
                                                setFormData({ ...formData, state: e.target.value })
                                            }
                                        />
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="is_default"
                                        checked={formData.is_default}
                                        onChange={(e) =>
                                            setFormData({ ...formData, is_default: e.target.checked })
                                        }
                                        className="rounded border-gray-300"
                                    />
                                    <Label htmlFor="is_default">Set as default address</Label>
                                </div>
                                <div className="flex justify-end gap-2 pt-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setIsDialogOpen(false)}
                                    >
                                        Cancel
                                    </Button>
                                    <Button type="submit">Save Address</Button>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>
                )}
            </div>

            <div className="grid md:grid-cols-2 gap-4">
                {addresses.map((address) => (
                    <div
                        key={address.id}
                        className="border rounded-lg p-4 relative hover:border-primary transition-colors bg-card"
                    >
                        {address.is_default && (
                            <div className="absolute top-4 right-4 text-primary text-xs font-medium flex items-center gap-1 bg-primary/10 px-2 py-1 rounded-full">
                                <Check className="h-3 w-3" /> Default
                            </div>
                        )}
                        <div className="flex items-start gap-3">
                            <MapPin className="h-5 w-5 text-muted-foreground mt-1" />
                            <div>
                                <p className="font-semibold text-foreground">{address.label}</p>
                                <p className="text-sm text-foreground/90">{address.full_name}</p>
                                <p className="text-sm text-muted-foreground mt-1">
                                    {address.address_line1}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    {address.city}
                                    {address.state ? `, ${address.state}` : ""} {address.zip_code}
                                </p>
                                <p className="text-sm text-muted-foreground mt-1">
                                    {address.phone}
                                </p>
                            </div>
                        </div>
                        {!readOnly && (
                            <div className="flex justify-end gap-2 mt-4 pt-3 border-t">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => openEdit(address)}
                                    className="h-8"
                                >
                                    <Pencil className="h-3 w-3 mr-1" /> Edit
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDelete(address.id)}
                                    className="h-8 text-destructive hover:text-destructive"
                                >
                                    <Trash2 className="h-3 w-3 mr-1" /> Delete
                                </Button>
                            </div>
                        )}
                    </div>
                ))}
                {addresses.length === 0 && (
                    <div className="col-span-full text-center py-8 text-muted-foreground border border-dashed rounded-lg">
                        {t.profile?.noAddresses || "No addresses saved yet."}
                    </div>
                )}
            </div>
        </div>
    );
}
