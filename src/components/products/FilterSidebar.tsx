
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { useCategories } from "@/hooks/useProducts";
import { useLanguage } from "@/i18n/LanguageContext";
import { X, Filter, ChevronRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

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
    const [priceInput, setPriceInput] = useState<[string, string]>([priceRange[0].toString(), priceRange[1].toString()]);

    const handlePriceInputChange = (index: 0 | 1, value: string) => {
        const newInputs = [...priceInput] as [string, string];
        newInputs[index] = value;
        setPriceInput(newInputs);

        const numVal = parseInt(value);
        if (!isNaN(numVal)) {
            const newRange = [...priceRange] as [number, number];
            newRange[index] = numVal;
            onPriceChange(newRange);
        }
    };

    return (
        <div className={cn("space-y-6 p-6 rounded-3xl bg-card/60 backdrop-blur-xl border border-border/50 shadow-sm transition-all hover:shadow-md", className)}>
            {/* Header */}
            <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg flex items-center gap-2 text-foreground">
                    <Filter className="h-5 w-5 text-primary" />
                    {t.common?.filters || "Filters"}
                </h3>
                {(selectedCategories.length > 0 || priceRange[0] > 0 || priceRange[1] < 20000 || inStock) && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onClear}
                        className="h-8 px-2 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    >
                        {t.common?.clearAll || "Clear all"}
                    </Button>
                )}
            </div>

            <ScrollArea className="h-[calc(100vh-280px)] pr-4 -mr-4">
                <div className="space-y-8 pr-4">

                    {/* Availability Toggle */}
                    <div className="rounded-2xl bg-muted/30 p-4 border border-border/50">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="instock" className="text-sm font-semibold cursor-pointer">
                                {t.products?.inStockOnly || "In Stock Only"}
                            </Label>
                            <Switch
                                id="instock"
                                checked={inStock}
                                onCheckedChange={onInStockChange}
                                className="scale-90"
                            />
                        </div>
                    </div>

                    {/* Price Range */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h4 className="font-semibold text-sm text-foreground/80 lowercase small-caps">{t.products?.priceRange || "Price Range"}</h4>
                        </div>

                        <Slider
                            defaultValue={[0, 20000]}
                            value={priceRange}
                            max={20000}
                            step={100}
                            minStepsBetweenThumbs={1}
                            onValueChange={(value) => {
                                onPriceChange(value as [number, number]);
                                setPriceInput([value[0].toString(), value[1].toString()]);
                            }}
                            className="py-4"
                        />

                        <div className="flex items-center gap-3">
                            <div className="relative flex-1">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-mono">DA</span>
                                <Input
                                    type="number"
                                    value={priceInput[0]}
                                    onChange={(e) => handlePriceInputChange(0, e.target.value)}
                                    className="h-10 pl-9 text-sm bg-background/50 border-border/50 rounded-xl focus:ring-primary/20 font-mono"
                                />
                            </div>
                            <span className="text-muted-foreground font-light">-</span>
                            <div className="relative flex-1">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-mono">DA</span>
                                <Input
                                    type="number"
                                    value={priceInput[1]}
                                    onChange={(e) => handlePriceInputChange(1, e.target.value)}
                                    className="h-10 pl-9 text-sm bg-background/50 border-border/50 rounded-xl focus:ring-primary/20 font-mono"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Categories */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h4 className="font-semibold text-sm text-foreground/80 lowercase small-caps">{t.categories?.title || "Categories"}</h4>
                            {selectedCategories.length > 0 && (
                                <button onClick={onClearCategories} className="text-[10px] text-primary hover:underline">
                                    Reset
                                </button>
                            )}
                        </div>

                        <div className="space-y-1">
                            {/* 'All' Option */}
                            <button
                                onClick={() => onClear()}
                                className={cn(
                                    "w-full flex items-center justify-between p-2.5 rounded-xl text-sm transition-all text-left group",
                                    selectedCategories.length === 0
                                        ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 font-semibold"
                                        : "hover:bg-muted text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <span>{t.products?.allProducts || "All Products"}</span>
                                {selectedCategories.length === 0 && <Check className="h-3.5 w-3.5" />}
                            </button>

                            <div className="h-px bg-border/50 my-2" />

                            {/* Hierarchical Categories */}
                            {categories.filter(c => !c.parent_id).map((parent) => {
                                const children = categories.filter(c => c.parent_id === parent.id);
                                const isParentSelected = selectedCategories.includes(parent.slug);
                                const isChildSelected = children.some(c => selectedCategories.includes(c.slug));
                                const isExpanded = true; // Could use state for accordion effect

                                return (
                                    <div key={parent.id} className="space-y-1">
                                        <div
                                            className={cn(
                                                "flex items-center gap-2 p-2 rounded-lg transition-colors cursor-pointer group select-none",
                                                isParentSelected ? "bg-muted/60" : "hover:bg-muted/30"
                                            )}
                                            onClick={() => onCategoryChange(parent.slug)}
                                        >
                                            <div className={cn(
                                                "w-4 h-4 rounded border flex items-center justify-center transition-colors",
                                                isParentSelected ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground/40 group-hover:border-primary"
                                            )}>
                                                {isParentSelected && <Check className="h-3 w-3" />}
                                            </div>
                                            <span className={cn("text-sm flex-1", isParentSelected ? "font-semibold text-foreground" : "text-muted-foreground group-hover:text-foreground")}>
                                                {parent.name}
                                            </span>
                                            {children.length > 0 && (
                                                <ChevronRight className={cn("h-3 w-3 text-muted-foreground transition-transform", isChildSelected ? "rotate-90" : "")} />
                                            )}
                                        </div>

                                        {children.length > 0 && (
                                            <div className="pl-6 space-y-1 border-l ml-3.5 border-border/40 py-1">
                                                {children.map(child => {
                                                    const isSelected = selectedCategories.includes(child.slug);
                                                    return (
                                                        <div
                                                            key={child.id}
                                                            className={cn(
                                                                "flex items-center gap-2 p-1.5 rounded-md transition-colors cursor-pointer group select-none hover:bg-muted/50",
                                                            )}
                                                            onClick={() => onCategoryChange(child.slug)}
                                                        >
                                                            <div className={cn(
                                                                "w-3.5 h-3.5 rounded-sm border flex items-center justify-center transition-colors",
                                                                isSelected ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground/40 group-hover:border-primary"
                                                            )}>
                                                                {isSelected && <Check className="h-2.5 w-2.5" />}
                                                            </div>
                                                            <span className={cn("text-sm", isSelected ? "font-medium text-foreground" : "text-muted-foreground group-hover:text-foreground")}>
                                                                {child.name}
                                                            </span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
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
