import React from "react";
import { Textarea, TextAreaProps } from "@heroui/react";

interface FormTextareaProps extends TextAreaProps {
    showCharCount?: boolean; // Prop para mostrar "15/500 caracteres"
    maxLength?: number;      // Límite de caracteres
}

export const FormTextarea: React.FC<FormTextareaProps> = ({
    showCharCount,
    maxLength,
    value,
    onChange,
    label,
    placeholder = "Escribe aquí los detalles...",
    classNames,
    ...props
}) => {

    // Calculamos la longitud actual si nos pasan el valor (controlado)
    const currentLength = typeof value === 'string' ? value.length : 0;

    return (
        <div className="w-full flex flex-col gap-1">
            <Textarea
                label={label}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                maxLength={maxLength}
                variant="bordered" // Estilo consistente con FormInput y FormSelect
                radius="sm"
                labelPlacement="outside"
                minRows={3} // Altura mínima inicial para que sea cómodo escribir
                classNames={{
                    label: "font-medium text-default-600",
                    inputWrapper: "border-default-300 hover:border-primary focus-within:border-primary",
                    input: "resize-y", // Permite al usuario ajustar la altura verticalmente
                    ...classNames,
                }}
                {...props}
            />

            {/* Contador de caracteres opcional */}
            {showCharCount && maxLength && (
                <div className="flex justify-end px-1">
                    <span className={`text-tiny ${currentLength > maxLength * 0.9 ? "text-danger" : "text-default-400"}`}>
                        {currentLength} / {maxLength}
                    </span>
                </div>
            )}
        </div>
    );
};

export default FormTextarea;
// ```

// ### Cómo usarlo en tus Formularios

// **1. Para el Reporte de Cierre (Técnico):**
// Aquí es útil limitar la longitud para que no escriban una novela, pero darles suficiente espacio.

// ```tsx
// import { FormTextarea } from "@/components/ui/FormTextarea";
// import { useState } from "react";

// // ... dentro de tu componente
// const [reporte, setReporte] = useState("");

// <FormTextarea
//     label="Reporte de Cierre"
//     placeholder="Describe el trabajo realizado, materiales extra usados y estado final..."
//     value={reporte}
//     onChange={(e) => setReporte(e.target.value)}
//     minRows={5} // Más alto para reportes largos
//     showCharCount
//     maxLength={1000}
//     isRequired
// />
// ```

// **2. Para Detalles de la Falla (Administrador):**
// Cuando se crea una orden de avería.

// ```tsx
//     < FormTextarea
// label = "Descripción de la Falla"
// placeholder = "El cliente reporta intermitencia en el servicio..."
// name = "failureDetails"
//     />