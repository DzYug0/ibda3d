
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCategories } from "@/hooks/useProducts";
import { useLanguage } from "@/i18n/LanguageContext";
import { X } from "lucide-react";

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
        <div className={`space-y-8 ${className}`}>
            {/* Header with Clear button */}
            <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">{t.common?.filters || "Filters"}</h3>
                {(selectedCategories.length > 0 || priceRange[0] > 0 || priceRange[1] < 100000 || inStock) && (
                    <Button variant="ghost" size="sm" onClick={onClear} className="h-auto p-0 text-muted-foreground hover:text-destructive">
                        {t.common?.clearAll || "Clear all"}
                    </Button>
                )}
            </div>

            {/* Availability */}
            <div className="space-y-4">
                <h4 className="font-medium text-sm text-foreground/80">{t.products?.availability || "Availability"}</h4>
                <div className="flex items-center space-x-2">
                    <Checkbox id="instock" checked={inStock} onCheckedChange={(checked) => onInStockChange(checked as boolean)} />
                    <Label htmlFor="instock" className="text-sm cursor-pointer font-normal">
                        {t.products?.inStockOnly || "In Stock Only"}
                    </Label>
                </div>
            </div>

            {/* Price Range */}
            <div className="space-y-4">
                <h4 className="font-medium text-sm text-foreground/80">{t.products?.priceRange || "Price Range"}</h4>
                <div className="pt-2 px-2">
                    <Slider
                        defaultValue={[0, 100000]}
                        value={priceRange}
                        max={100000}
                        step={500}
                        minStepsBetweenThumbs={1}
                        onValueChange={(value) => onPriceChange(value as [number, number])}
                        className="mb-6"
                    />
                    <div className="flex items-center gap-4">
                        <div className="space-y-1">
                            <span className="text-xs text-muted-foreground">Min (DA)</span>
                            <Input
                                type="number"
                                value={priceRange[0]}
                                onChange={(e) => onPriceChange([Number(e.target.value), priceRange[1]])}
                                className="h-8 text-sm"
                            />
                        </div>
                        <div className="space-y-1">
                            <span className="text-xs text-muted-foreground">Max (DA)</span>
                            <Input
                                type="number"
                                value={priceRange[1]}
                                onChange={(e) => onPriceChange([priceRange[0], Number(e.target.value)])}
                                className="h-8 text-sm"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Categories */}
            <div className="space-y-4">
                <h4 className="font-medium text-sm text-foreground/80">{t.categories?.title || "Categories"}</h4>
                <ScrollArea className="h-[300px] w-full rounded-md pr-4">
                    <div className="space-y-3">
                        {/* 'All' Option */}
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="category-all"
                                checked={selectedCategories.length === 0}
                                onCheckedChange={(checked) => {
                                    // Use onClear for now which resets everything, including categories.
                                    // If strict "only clear categories" is needed, we'd need a new prop.
                                    // Given "All" usually means default state, full reset is often expected or acceptable.
                                    if (checked) onClear();
                                }}
                            />
                            <Label htmlFor="category-all" className="text-sm cursor-pointer font-normal leading-none filter-all-label">
                                {t.products?.allProducts || "All Products"}
                            </Label>
                        </div>

                        {categories.map((category) => (
                            <div key={category.id} className="flex items-center space-x-2">
                                <Checkbox
                                    id={category.slug}
                                    checked={selectedCategories.includes(category.slug)}
                                    onCheckedChange={() => onCategoryChange(category.slug)}
                                />
                                <Label htmlFor={category.slug} className="text-sm cursor-pointer font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                    {category.name}
                                </Label>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </div>
        </div>
    );
}
