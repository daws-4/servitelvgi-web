import React from "react";
import { Select, SelectItem, SelectProps } from "@heroui/react";

// Definimos la estructura simple de una opción
export interface SelectOption {
    key: string; // El valor que se guardará en la BD (ej: "pending")
    label: string; // Lo que ve el usuario (ej: "Pendiente")
}

interface FormSelectProps extends Omit<SelectProps, "children"> {
    options: SelectOption[]; // Tu lista de opciones
}

export const FormSelect: React.FC<FormSelectProps> = ({
    options,
    label,
    placeholder = "Selecciona una opción",
    classNames,
    ...props
}) => {
    return (
        <Select
            label={label}
            placeholder={placeholder}
            variant="bordered" // Estilo consistente con FormInput y otros
            radius="sm"
            labelPlacement="outside"
            classNames={{
                label: "font-medium text-default-600",
                trigger: "border-default-300 hover:border-primary focus-within:border-primary data-[open=true]:border-primary",
                ...classNames,
            }}
            // Pasamos el resto de props (onChange, selectedKeys, etc.)
            {...props}
        >
            {options.map((option) => (
                <SelectItem key={option.key} >
                    {option.label}
                </SelectItem>
            ))}
        </Select>
    );
};

export default FormSelect;
// ```

// ### Cómo usarlo en tu Filtro o Formulario

// **1. Para Filtrar por Estado (en tu barra de filtros):**

// ```tsx
// import { FormSelect } from "@/components/ui/FormSelect";

// const statusOptions = [
//     { key: "all", label: "Todos" },
//     { key: "pending", label: "Pendiente" },
//     { key: "in_progress", label: "En Progreso" },
//     { key: "completed", label: "Completada" },
//     { key: "cancelled", label: "Cancelada" },
// ];

// // ... dentro de tu componente
// <FormSelect
//     label="Estado"
//     options={statusOptions}
//     defaultSelectedKeys={["all"]}
//     className="w-40"
// />
// ```

// **2. Para Seleccionar Tipo de Orden (al crear una orden manual):**

// ```tsx
// const typeOptions = [
//     { key: "instalacion", label: "Instalación" },
//     { key: "averia", label: "Avería" },
//     { key: "visita_tecnica", label: "Visita Técnica" },
// ];

// <FormSelect
//     label="Tipo de Orden"
//     placeholder="Selecciona el tipo"
//     options={typeOptions}
//     isRequired
// />