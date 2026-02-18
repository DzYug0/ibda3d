import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export default function AdminSettings() {
    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium">Settings</h3>
                <p className="text-sm text-muted-foreground">
                    Manage your store preferences and account settings.
                </p>
            </div>
            <Separator />

            <div className="space-y-4">
                <h4 className="text-sm font-medium">Store Profile</h4>
                <div className="grid gap-4 max-w-xl">
                    <div className="grid gap-2">
                        <Label htmlFor="store-name">Store Name</Label>
                        <Input id="store-name" defaultValue="Ibda3D Store" />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="email">Contact Email</Label>
                        <Input id="email" defaultValue="contact@ibda3d.com" />
                    </div>
                    <Button>Save Changes</Button>
                </div>
            </div>
        </div>
    );
}
