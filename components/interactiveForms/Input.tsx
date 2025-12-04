import React from "react";
import { Input, InputProps } from "@heroui/react";

// Icono de Lupa (SVG) interno para no depender de librerías externas
const SearchIcon = ({ size = 24, strokeWidth = 1.5, ...props }) => (
    <svg
        aria-hidden="true"
        fill="none"
        focusable="false"
        height={size}
        role="presentation"
        viewBox="0 0 24 24"
        width={size}
        {...props}
    >
        <path
            d="M11.5 21C16.7467 21 21 16.7467 21 11.5C21 6.25329 16.7467 2 11.5 2C6.25329 2 2 6.25329 2 11.5C2 16.7467 6.25329 21 11.5 21Z"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={strokeWidth}
        />
        <path
            d="M22 22L20 20"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={strokeWidth}
        />
    </svg>
);

// Extendemos las props nativas de HeroUI para mantener toda su flexibilidad
interface FormInputProps extends InputProps {
    isSearch?: boolean; // Prop mágica para convertirlo en buscador
}

export const FormInput: React.FC<FormInputProps> = ({
    isSearch,
    classNames,
    ...props
}) => {

    // 1. Configuración especial si es una barra de búsqueda
    if (isSearch) {
        return (
            <Input
                isClearable // Botón 'X' para borrar texto automáticamente
                radius="lg" // Bordes más redondeados para buscadores
                classNames={{
                    label: "text-black/50 dark:text-white/90",
                    input: [
                        "bg-transparent",
                        "text-black/90 dark:text-white/90",
                        "placeholder:text-default-700/50 dark:placeholder:text-white/60",
                    ],
                    innerWrapper: "bg-transparent",
                    inputWrapper: [
                        "shadow-sm",
                        "bg-default-200/50",
                        "dark:bg-default/60",
                        "backdrop-blur-xl",
                        "backdrop-saturate-200",
                        "hover:bg-default-200/70",
                        "dark:hover:bg-default/70",
                        "group-data-[focus=true]:bg-default-200/50",
                        "dark:group-data-[focus=true]:bg-default/60",
                        "!cursor-text",
                    ],
                    ...classNames, // Permite sobreescribir estilos si es necesario
                }}
                placeholder="Buscar..." // Placeholder por defecto
                startContent={
                    <SearchIcon className="text-black/50 mb-0.5 dark:text-white/90 text-slate-400 pointer-events-none flex-shrink-0" />
                }
                {...props} // Pasamos el resto de props (onChange, value, etc.)
            />
        );
    }

    // 2. Configuración estándar para formularios (Nombre, Dirección, etc.)
    return (
        <Input
            variant="bordered" // Estilo limpio por defecto para formularios
            radius="sm"        // Bordes más sutiles para datos
            labelPlacement="outside" // Etiqueta fuera para mejor legibilidad en formularios largos
            classNames={{
                label: "font-medium text-default-600",
                inputWrapper: "border-default-300 hover:border-primary focus-within:border-primary",
                ...classNames
            }}
            {...props}
        />
    );
};

export default FormInput;


// ### Cómo usarlo

// Este componente reemplaza al `<Input>` normal en todo tu proyecto.

// **1. Como Barra de Búsqueda (en tus Tablas):**
// Simplemente añade la prop `isSearch`.
// ```tsx
//     < FormInput
// isSearch
// placeholder = "Buscar orden por nombre o ID..."
// className = "max-w-xs"
// value = { searchTerm }
// onValueChange = { setSearchTerm }
//     />
//     ```

// **2. Como Campo de Formulario (Nombre, Dirección):**
// Úsalo normalmente. Ya viene pre-configurado con estilos profesionales (`variant = "bordered"`, `labelPlacement = "outside"`).
// ```tsx
//     < FormInput
// label = "Nombre del Abonado"
// placeholder = "Ej: Juan Pérez"
// isRequired
// name = "subscriberName"
//     />

//     <FormInput
//         label="Dirección"
//         placeholder="Calle 5, Casa 20..."
//         description="Incluye referencias si es posible."
//     />