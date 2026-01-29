import React from "react";
import FormInput from "@/components/interactiveForms/Input";
import FormSelect from "@/components/interactiveForms/Select";
import Switch from "@/components/interactiveForms/Switch";

interface InventoryFilterToolbarProps {
    searchValue: string;
    onSearchChange: (value: string) => void;
    typeFilter: string;
    onTypeChange: (value: string) => void;
    showOnlyLowStock: boolean;
    onLowStockToggle: (value: boolean) => void;
}

const typeOptions = [
    { key: "all", label: "Todos los Tipos" },
    { key: "material", label: "Materiales" },
    { key: "equipment", label: "Equipos" },
    { key: "tool", label: "Herramientas" },
];

export const InventoryFilterToolbar: React.FC<InventoryFilterToolbarProps> = ({
    searchValue,
    onSearchChange,
    typeFilter,
    onTypeChange,
    showOnlyLowStock,
    onLowStockToggle,
}) => {
    return (
        <div suppressHydrationWarning className="bg-white p-4 rounded-xl shadow-sm border border-neutral/10 mb-6 flex flex-col md:flex-row gap-4 justify-between items-center">
            {/* Left Section: Search & Type Filter */}
            <div className="flex gap-4 w-full md:w-auto">
                {/* Search Input */}
                <div className="relative w-full md:w-64">
                    <FormInput
                        isSearch
                        placeholder="Buscar por código o nombre..."
                        value={searchValue}
                        onValueChange={onSearchChange}
                        classNames={{
                            inputWrapper: "border-neutral/30",
                        }}
                    />
                </div>

                {/* Category Select */}
                <FormSelect
                    options={typeOptions}
                    selectedKeys={[typeFilter]}
                    onSelectionChange={(keys) => {
                        const selected = Array.from(keys)[0] as string;
                        onTypeChange(selected);
                    }}
                    placeholder="Tipo"
                    className="w-full md:w-48"
                    classNames={{
                        trigger: "border-neutral/30 bg-white",
                    }}
                    aria-label="Filtrar por tipo"
                />
            </div>

            {/* Right Section: Low Stock Toggle */}
            <div className="flex items-center gap-4">
                <Switch
                    isSelected={showOnlyLowStock}
                    label="Solo Stock Bajo"
                    onValueChange={onLowStockToggle}
                    classNames={{
                        wrapper: "group-data-[selected=true]:bg-red-500",
                    }}
                />
            </div>
        </div>
    );
};

export default InventoryFilterToolbar;
