import React from "react";
import { Select, SelectItem } from "@heroui/react";

interface MonthSelectorProps {
    value: string; // Format: "YYYY-MM"
    onChange: (value: string) => void;
    label?: string;
    className?: string;
}

export const MonthSelector: React.FC<MonthSelectorProps> = ({
    value,
    onChange,
    label = "Mes",
    className = "",
}) => {
    // Get current year
    const currentYear = new Date().getFullYear();

    // Generate months for the current year
    const months = [
        { value: `${currentYear}-01`, label: "Enero" },
        { value: `${currentYear}-02`, label: "Febrero" },
        { value: `${currentYear}-03`, label: "Marzo" },
        { value: `${currentYear}-04`, label: "Abril" },
        { value: `${currentYear}-05`, label: "Mayo" },
        { value: `${currentYear}-06`, label: "Junio" },
        { value: `${currentYear}-07`, label: "Julio" },
        { value: `${currentYear}-08`, label: "Agosto" },
        { value: `${currentYear}-09`, label: "Septiembre" },
        { value: `${currentYear}-10`, label: "Octubre" },
        { value: `${currentYear}-11`, label: "Noviembre" },
        { value: `${currentYear}-12`, label: "Diciembre" },
    ];

    return (
        <Select
            label={label}
            placeholder="Selecciona un mes"
            selectedKeys={value ? [value] : []}
            onSelectionChange={(keys) => {
                const selected = Array.from(keys)[0] as string;
                if (selected) {
                    onChange(selected);
                }
            }}
            variant="bordered"
            radius="sm"
            labelPlacement="outside"
            classNames={{
                base: className,
                label: "font-medium text-default-600",
                trigger: "border-default-300 hover:border-primary focus-within:border-primary bg-white",
            }}
        >
            {months.map((month) => (
                <SelectItem key={month.value}>
                    {month.label} {currentYear}
                </SelectItem>
            ))}
        </Select>
    );
};

export default MonthSelector;
