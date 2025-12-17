import React from "react";
import { DatePicker, DatePickerProps } from "@heroui/react";

interface FormDatePickerProps extends Omit<DatePickerProps, "children"> {
    onDateChange?: (date: string | null) => void;
}

export const FormDatePicker: React.FC<FormDatePickerProps> = ({
    onDateChange,
    label = "Fecha",
    ...props
}) => {
    // Manejador de cambio: convierte el objeto Date de HeroUI a string ISO (YYYY-MM-DD)
    const handleChange = (date: any) => {
        if (date && onDateChange) {
            onDateChange(date.toString()); // "2025-12-16"
        } else if (onDateChange) {
            onDateChange(null);
        }
    };

    return (
        <DatePicker
            label={label}
            variant="bordered"
            radius="sm"
            labelPlacement="outside"
            classNames={{
                base: "max-w-xs",
                label: "font-medium text-default-600",
                inputWrapper: "border-default-300 hover:border-primary focus-within:border-primary bg-white dark:bg-transparent",
            }}
            errorMessage="Selecciona una fecha válida"
            onChange={handleChange}
            {...props}
        />
    );
};

export default FormDatePicker;
