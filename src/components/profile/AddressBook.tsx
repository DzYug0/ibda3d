
import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, MapPin, Check, Home, Briefcase, Building } from "lucide-react";
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
import { cn } from "@/lib/utils";

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

    const getLabelIcon = (label: string) => {
        const l = label.toLowerCase();
        if (l.includes('home')) return <Home className="h-4 w-4" />;
        if (l.includes('work') || l.includes('office')) return <Briefcase className="h-4 w-4" />;
        return <MapPin className="h-4 w-4" />;
    };

    if (loading) return <div className="py-8 text-center text-muted-foreground">Loading addresses...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-xl font-bold text-foreground">{t.profile?.myAddresses || "My Addresses"}</h3>
                    <p className="text-sm text-muted-foreground">Manage your shipping addresses.</p>
                </div>
                {!readOnly && (
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button onClick={openCreate} className="shadow-lg shadow-primary/20 rounded-full">
                                <Plus className="h-4 w-4 mr-2" /> {t.common?.add || "Add Address"}
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px] bg-card/95 backdrop-blur-xl border-border/50">
                            <DialogHeader>
                                <DialogTitle className="text-xl font-bold">
                                    {editingAddress ? (t.common?.edit || "Edit Address") : (t.common?.add || "Add New Address")}
                                </DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="label">Label</Label>
                                        <div className="relative">
                                            <Home className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                id="label"
                                                value={formData.label}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, label: e.target.value })
                                                }
                                                placeholder="Home, Work..."
                                                className="pl-9 bg-background/50 border-border/50"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="full_name">Full Name</Label>
                                        <Input
                                            id="full_name"
                                            value={formData.full_name}
                                            onChange={(e) =>
                                                setFormData({ ...formData, full_name: e.target.value })
                                            }
                                            required
                                            className="bg-background/50 border-border/50"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="phone">Phone</Label>
                                        <Input
                                            id="phone"
                                            value={formData.phone}
                                            onChange={(e) =>
                                                setFormData({ ...formData, phone: e.target.value })
                                            }
                                            required
                                            className="bg-background/50 border-border/50"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="zip_code">Zip Code</Label>
                                        <Input
                                            id="zip_code"
                                            value={formData.zip_code}
                                            onChange={(e) =>
                                                setFormData({ ...formData, zip_code: e.target.value })
                                            }
                                            className="bg-background/50 border-border/50"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="address">Address</Label>
                                    <Input
                                        id="address"
                                        value={formData.address_line1}
                                        onChange={(e) =>
                                            setFormData({ ...formData, address_line1: e.target.value })
                                        }
                                        placeholder="Street address, apartment, etc."
                                        required
                                        className="bg-background/50 border-border/50"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="city">City</Label>
                                        <Input
                                            id="city"
                                            value={formData.city}
                                            onChange={(e) =>
                                                setFormData({ ...formData, city: e.target.value })
                                            }
                                            required
                                            className="bg-background/50 border-border/50"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="state">State</Label>
                                        <Input
                                            id="state"
                                            value={formData.state}
                                            onChange={(e) =>
                                                setFormData({ ...formData, state: e.target.value })
                                            }
                                            className="bg-background/50 border-border/50"
                                        />
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 pt-2">
                                    <input
                                        type="checkbox"
                                        id="is_default"
                                        checked={formData.is_default}
                                        onChange={(e) =>
                                            setFormData({ ...formData, is_default: e.target.checked })
                                        }
                                        className="rounded border-gray-300 text-primary focus:ring-primary"
                                    />
                                    <Label htmlFor="is_default" className="cursor-pointer">Set as default address</Label>
                                </div>
                                <div className="flex justify-end gap-3 pt-4">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setIsDialogOpen(false)}
                                        className="rounded-full"
                                    >
                                        Cancel
                                    </Button>
                                    <Button type="submit" className="rounded-full shadow-lg shadow-primary/20">Save Address</Button>
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
                        className={cn(
                            "group relative rounded-2xl p-5 border transition-all duration-300",
                            address.is_default
                                ? "bg-primary/5 border-primary/30 shadow-sm"
                                : "bg-card/40 border-border/40 hover:border-primary/30 hover:shadow-md hover:bg-card/60"
                        )}
                    >
                        {address.is_default && (
                            <div className="absolute top-4 right-4 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                                <Check className="h-3 w-3" /> Default
                            </div>
                        )}

                        <div className="flex items-start gap-4">
                            <div className={cn(
                                "h-10 w-10 rounded-full flex items-center justify-center shrink-0",
                                address.is_default ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors"
                            )}>
                                {getLabelIcon(address.label)}
                            </div>

                            <div className="flex-1 space-y-1">
                                <div className="flex items-center gap-2">
                                    <p className="font-bold text-foreground">{address.label}</p>
                                </div>
                                <p className="text-sm font-medium text-foreground/90">{address.full_name}</p>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    {address.address_line1}<br />
                                    {address.city}
                                    {address.state ? `, ${address.state}` : ""} {address.zip_code}
                                </p>
                                <p className="text-sm text-muted-foreground pt-1 flex items-center gap-1.5">
                                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Phone:</span>
                                    {address.phone}
                                </p>
                            </div>
                        </div>

                        {!readOnly && (
                            <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-border/30 opacity-80 group-hover:opacity-100 transition-opacity">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => openEdit(address)}
                                    className="h-8 hover:bg-primary/10 hover:text-primary rounded-lg"
                                >
                                    <Pencil className="h-3.5 w-3.5 mr-1.5" /> Edit
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDelete(address.id)}
                                    className="h-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg"
                                >
                                    <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Delete
                                </Button>
                            </div>
                        )}
                    </div>
                ))}

                {!readOnly && (
                    <button
                        onClick={openCreate}
                        className="flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border border-dashed border-border/60 hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 min-h-[160px] group"
                    >
                        <div className="h-12 w-12 rounded-full bg-muted group-hover:bg-primary/20 flex items-center justify-center transition-colors">
                            <Plus className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                        <span className="text-sm font-medium text-muted-foreground group-hover:text-primary transition-colors">
                            {t.common?.add || "Add New Address"}
                        </span>
                    </button>
                )}

                {readOnly && addresses.length === 0 && (
                    <div className="col-span-full text-center py-8 text-muted-foreground border border-dashed rounded-xl">
                        {t.profile?.noAddresses || "No addresses saved yet."}
                    </div>
                )}
            </div>
        </div>
    );
}
