import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';

interface BulkEditProductDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    selectedCount: number;
    onSave: (data: { price?: number; stock_quantity?: number }) => Promise<void>;
}

export function BulkEditProductDialog({
    open,
    onOpenChange,
    selectedCount,
    onSave,
}: BulkEditProductDialogProps) {
    const [price, setPrice] = useState('');
    const [stock, setStock] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const data: { price?: number; stock_quantity?: number } = {};
            if (price) data.price = parseFloat(price);
            if (stock) data.stock_quantity = parseInt(stock);

            await onSave(data);
            onOpenChange(false);
            setPrice('');
            setStock('');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Bulk Edit {selectedCount} Products</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                        Enter values to update. Leave blank to keep existing values.
                    </p>
                    <div className="space-y-2">
                        <Label htmlFor="bulk-price">New Price (DA)</Label>
                        <Input
                            id="bulk-price"
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="Keep existing price"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="bulk-stock">New Stock Quantity</Label>
                        <Input
                            id="bulk-stock"
                            type="number"
                            min="0"
                            placeholder="Keep existing stock"
                            value={stock}
                            onChange={(e) => setStock(e.target.value)}
                        />
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading || (!price && !stock)}>
                            Update Products
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
