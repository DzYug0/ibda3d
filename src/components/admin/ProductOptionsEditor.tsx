
import { useState, useEffect } from "react";
import { Plus, X, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

export interface ProductOptionValue {
    name: string;
    value: string; // Hex code for colors, same as name for text
}

export interface ProductOption {
    id: string;
    name: string;
    type: "color" | "text" | "image";
    values: ProductOptionValue[];
}

interface ProductOptionsEditorProps {
    options: ProductOption[];
    onChange: (options: ProductOption[]) => void;
}

export function ProductOptionsEditor({ options, onChange }: ProductOptionsEditorProps) {
    // Use local state to avoid stuttering on every keystroke, sync on blur/action
    const [localOptions, setLocalOptions] = useState<ProductOption[]>(options);

    useEffect(() => {
        setLocalOptions(options);
    }, [options]);

    const updateParent = (newOptions: ProductOption[]) => {
        setLocalOptions(newOptions);
        onChange(newOptions);
    };

    const addOptionGroup = () => {
        const newGroup: ProductOption = {
            id: crypto.randomUUID(),
            name: "",
            type: "text",
            values: [],
        };
        updateParent([...localOptions, newGroup]);
    };

    const removeOptionGroup = (id: string) => {
        updateParent(localOptions.filter((opt) => opt.id !== id));
    };

    const updateOptionGroup = (id: string, updates: Partial<ProductOption>) => {
        const newOptions = localOptions.map((opt) =>
            opt.id === id ? { ...opt, ...updates } : opt
        );
        updateParent(newOptions);
    };

    const addValueToGroup = (groupId: string) => {
        const newOptions = localOptions.map((opt) => {
            if (opt.id === groupId) {
                return {
                    ...opt,
                    values: [...opt.values, { name: "", value: opt.type === "color" ? "#000000" : "" }],
                };
            }
            return opt;
        });
        updateParent(newOptions);
    };

    const removeValueFromGroup = (groupId: string, index: number) => {
        const newOptions = localOptions.map((opt) => {
            if (opt.id === groupId) {
                const newValues = [...opt.values];
                newValues.splice(index, 1);
                return { ...opt, values: newValues };
            }
            return opt;
        });
        updateParent(newOptions);
    };

    const updateValueInGroup = (
        groupId: string,
        index: number,
        updates: Partial<ProductOptionValue>
    ) => {
        const newOptions = localOptions.map((opt) => {
            if (opt.id === groupId) {
                const newValues = [...opt.values];
                newValues[index] = { ...newValues[index], ...updates };
                return { ...opt, values: newValues };
            }
            return opt;
        });
        updateParent(newOptions);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <Label className="text-base">Product Options</Label>
                <Button type="button" variant="outline" size="sm" onClick={addOptionGroup}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Option Group
                </Button>
            </div>

            {localOptions.length === 0 && (
                <p className="text-sm text-muted-foreground italic">
                    No options defined (e.g. Color, Size). Click "Add Option Group" to start.
                </p>
            )}

            <div className="space-y-6">
                {localOptions.map((group, groupIndex) => (
                    <div key={group.id} className="border rounded-lg p-4 bg-card relative">
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute top-2 right-2 h-6 w-6"
                            onClick={() => removeOptionGroup(group.id)}
                        >
                            <X className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                        </Button>

                        <div className="grid sm:grid-cols-2 gap-4 mb-4 pr-8">
                            <div>
                                <Label className="text-xs text-muted-foreground mb-1">Option Name (e.g. Color)</Label>
                                <Input
                                    value={group.name}
                                    onChange={(e) => updateOptionGroup(group.id, { name: e.target.value })}
                                    placeholder="Color"
                                />
                            </div>
                            <div>
                                <Label className="text-xs text-muted-foreground mb-1">Display Type</Label>
                                <Select
                                    value={group.type}
                                    onValueChange={(val: "color" | "text") =>
                                        updateOptionGroup(group.id, { type: val })
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="text">Text / Button</SelectItem>
                                        <SelectItem value="color">Color Picker</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <Separator className="my-3" />

                        <div className="space-y-3">
                            <Label className="text-xs text-muted-foreground">Option Values</Label>
                            {group.values.map((val, valIndex) => (
                                <div key={valIndex} className="flex items-center gap-2">
                                    <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0 opacity-50" />

                                    <Input
                                        className="flex-1"
                                        placeholder={group.type === "color" ? "Color Name (e.g. Red)" : "Value (e.g. Small)"}
                                        value={val.name}
                                        onChange={(e) =>
                                            updateValueInGroup(group.id, valIndex, { name: e.target.value })
                                        }
                                    />

                                    {group.type === "color" && (
                                        <div className="flex items-center gap-2">
                                            <Input
                                                type="color"
                                                className="w-12 h-10 p-1 cursor-pointer"
                                                value={val.value}
                                                onChange={(e) =>
                                                    updateValueInGroup(group.id, valIndex, { value: e.target.value })
                                                }
                                            />
                                            <Input
                                                className="w-24 font-mono text-xs"
                                                value={val.value}
                                                onChange={(e) =>
                                                    updateValueInGroup(group.id, valIndex, { value: e.target.value })
                                                }
                                                placeholder="#000000"
                                            />
                                        </div>
                                    )}

                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => removeValueFromGroup(group.id, valIndex)}
                                    >
                                        <X className="h-4 w-4 text-muted-foreground" />
                                    </Button>
                                </div>
                            ))}

                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="text-xs text-muted-foreground"
                                onClick={() => addValueToGroup(group.id)}
                            >
                                <Plus className="h-3 w-3 mr-1" />
                                Add Value
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
