
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCategories } from "@/hooks/useProducts";
import { useLanguage } from "@/i18n/LanguageContext";
import { X, Filter } from "lucide-react";

interface FilterSidebarProps {
    selectedCategories: string[];
    onCategoryChange: (slug: string) => void;
    priceRange: [number, number];
    onPriceChange: (range: [number, number]) => void;
    inStock: boolean;
    onInStockChange: (checked: boolean) => void;
    onClear: () => void;
    onClearCategories?: () => void;
    className?: string;
}

export function FilterSidebar({
    selectedCategories,
    onCategoryChange,
    priceRange,
    onPriceChange,
    inStock,
    onInStockChange,
    onClear,
    onClearCategories,
    className = "",
}: FilterSidebarProps) {
    const { data: categories = [] } = useCategories();
    const { t } = useLanguage();

    return (
        <div className={`space-y-8 p-6 rounded-2xl bg-card/50 backdrop-blur-xl border border-border/50 shadow-sm ${className}`}>
            {/* Header with Clear button */}
            <div className="flex items-center justify-between pb-4 border-b border-border/50">
                <h3 className="font-bold text-lg flex items-center gap-2">
                    <Filter className="h-4 w-4 text-primary" />
                    {t.common?.filters || "Filters"}
                </h3>
                {(selectedCategories.length > 0 || priceRange[0] > 0 || priceRange[1] < 100000 || inStock) && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onClear}
                        className="h-8 px-2 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    >
                        {t.common?.clearAll || "Clear all"}
                    </Button>
                )}
            </div>

            <ScrollArea className="h-[calc(100vh-250px)] pr-4">
                <div className="space-y-8">
                    {/* Availability */}
                    <div className="space-y-4">
                        <h4 className="font-semibold text-sm text-foreground">{t.products?.availability || "Availability"}</h4>
                        <div className="flex items-center space-x-3 p-3 rounded-xl bg-background/50 border border-border/50 hover:border-primary/30 transition-colors">
                            <Checkbox id="instock" checked={inStock} onCheckedChange={(checked) => onInStockChange(checked as boolean)} />
                            <Label htmlFor="instock" className="text-sm cursor-pointer font-medium flex-1">
                                {t.products?.inStockOnly || "In Stock Only"}
                            </Label>
                        </div>
                    </div>

                    {/* Price Range */}
                    <div className="space-y-5">
                        <div className="flex items-center justify-between">
                            <h4 className="font-semibold text-sm text-foreground">{t.products?.priceRange || "Price Range"}</h4>
                            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{priceRange[0]} - {priceRange[1]} DA</span>
                        </div>
                        <div className="pt-2 px-1">
                            <Slider
                                defaultValue={[0, 100000]}
                                value={priceRange}
                                max={100000}
                                step={500}
                                minStepsBetweenThumbs={1}
                                onValueChange={(value) => onPriceChange(value as [number, number])}
                                className="mb-6"
                            />
                            <div className="flex items-center gap-3">
                                <div className="space-y-1.5 flex-1">
                                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Min</span>
                                    <div className="relative">
                                        <Input
                                            type="number"
                                            value={priceRange[0]}
                                            onChange={(e) => onPriceChange([Number(e.target.value), priceRange[1]])}
                                            className="h-9 text-sm bg-background/50 border-border/50 focus:ring-primary/20"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">DA</span>
                                    </div>
                                </div>
                                <div className="space-y-1.5 flex-1">
                                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Max</span>
                                    <div className="relative">
                                        <Input
                                            type="number"
                                            value={priceRange[1]}
                                            onChange={(e) => onPriceChange([priceRange[0], Number(e.target.value)])}
                                            className="h-9 text-sm bg-background/50 border-border/50 focus:ring-primary/20"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">DA</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Categories */}
                    <div className="space-y-4">
                        <h4 className="font-semibold text-sm text-foreground">{t.categories?.title || "Categories"}</h4>
                        <div className="space-y-2">
                            {/* 'All' Option */}
                            <div className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                                <Checkbox
                                    id="category-all"
                                    checked={selectedCategories.length === 0}
                                    onCheckedChange={(checked) => {
                                        if (checked) onClear();
                                    }}
                                />
                                <Label htmlFor="category-all" className="text-sm cursor-pointer font-medium leading-none filter-all-label flex-1">
                                    {t.products?.allProducts || "All Products"}
                                </Label>
                            </div>

                            {/* Hierarchical Categories */}
                            {categories.filter(c => !c.parent_id).map((parent) => {
                                const children = categories.filter(c => c.parent_id === parent.id);
                                const isParentSelected = selectedCategories.includes(parent.slug);

                                if (children.length === 0) {
                                    return (
                                        <div key={parent.id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                                            <Checkbox
                                                id={parent.slug}
                                                checked={isParentSelected}
                                                onCheckedChange={() => onCategoryChange(parent.slug)}
                                            />
                                            <Label htmlFor={parent.slug} className="text-sm cursor-pointer font-medium leading-none flex-1">
                                                {parent.name}
                                            </Label>
                                        </div>
                                    );
                                }

                                return (
                                    <div key={parent.id} className="space-y-1">
                                        <div className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                                            <Checkbox
                                                id={parent.slug}
                                                checked={isParentSelected}
                                                onCheckedChange={() => onCategoryChange(parent.slug)}
                                            />
                                            <Label htmlFor={parent.slug} className="text-sm cursor-pointer font-bold leading-none flex-1">
                                                {parent.name}
                                            </Label>
                                        </div>
                                        <div className="pl-6 ml-2 border-l border-border/50 space-y-1 my-1">
                                            {children.map(child => (
                                                <div key={child.id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                                                    <Checkbox
                                                        id={child.slug}
                                                        checked={selectedCategories.includes(child.slug)}
                                                        onCheckedChange={() => onCategoryChange(child.slug)}
                                                    />
                                                    <Label htmlFor={child.slug} className="text-sm cursor-pointer font-normal leading-none flex-1">
                                                        {child.name}
                                                    </Label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </ScrollArea>
        </div>
    );
}
