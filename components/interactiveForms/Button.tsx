import React from "react";
import { Button as HeroButton, ButtonProps as HeroButtonProps } from "@heroui/react";

// Custom variant type that includes our custom variants
type CustomVariant = "primary" | "secondary";

interface FormButtonProps extends Omit<HeroButtonProps, "variant"> {
    variant?: CustomVariant | HeroButtonProps["variant"];
    label?: string; // Texto del botón (opcional si se usan children)
    loading?: boolean; // Alias for isLoading
    classNames?: {
        base?: string;
        [key: string]: string | undefined;
    };
}

export const FormButton: React.FC<FormButtonProps> = ({
    variant = "primary",
    label,
    isLoading,
    loading,
    isDisabled,
    children,
    classNames,
    ...props
}) => {
    // Map custom variants to HeroUI variants
    let heroVariant: HeroButtonProps["variant"] = "solid";
    let heroColor: HeroButtonProps["color"] = "primary";

    if (variant === "primary") {
        heroVariant = "solid";
        heroColor = "primary";
    } else if (variant === "secondary") {
        heroVariant = "bordered";
        heroColor = "default";
    } else {
        // If it's a native HeroUI variant, use it directly
        heroVariant = variant as HeroButtonProps["variant"];
    }

    const isButtonLoading = isLoading || loading;

    return (
        <HeroButton
            color={heroColor}
            variant={heroVariant}
            radius="sm"     // Bordes sutilmente redondeados, consistente con los inputs
            isLoading={isButtonLoading} // Prop nativa de HeroUI que muestra el spinner
            isDisabled={isDisabled || isButtonLoading} // Deshabilita si está cargando o si se pasa la prop isDisabled
            className={`font-medium px-6 ${classNames?.base || ""}`} // Estilos base
            {...props}
        >
            {/* Si hay children (ej: un icono), se muestran junto con el label, o solo el label */}
            {children || label}
        </HeroButton>
    );
};

// Named export for convenience
export const Button = FormButton;

export default FormButton;
// ```

// ### Cómo usarlo en tus Formularios

// **1. En el formulario de "Crear Orden":**

// ```tsx
// import { FormButton } from "@/components/ui/FormButton";
// import { useState } from "react";

// export default function CreateOrderForm() {
//     const [isSaving, setIsSaving] = useState(false);

//     const handleSubmit = async (e) => {
//         e.preventDefault();
//         setIsSaving(true);

//         // Simular llamada a API
//         await new Promise(resolve => setTimeout(resolve, 2000));

//         // Aquí iría tu lógica real de guardado
//         console.log("Orden guardada");

//         setIsSaving(false);
//     };

//     return (
//         <form onSubmit={handleSubmit} className="flex flex-col gap-4">
//             {/* ... tus otros inputs ... */}

//             <div className="flex justify-end mt-4">
//                 <FormButton
//                     type="submit"
//                     label="Guardar Orden"
//                     isLoading={isSaving}
//                 />
//             </div>
//         </form>
//     );
// }
// ```

// **2. Botón Secundario (Cancelar):**
// Puedes usar el mismo componente cambiando el color y la variante.

// ```tsx
//     < div className = "flex gap-2" >
//   <FormButton
//     label="Cancelar"
//     color="danger"
//     variant="light"
//     onPress={() => console.log("Cancelado")}
//   />
//   <FormButton
//     label="Confirmar Asignación"
//     isLoading={isProcessing}
//   />
// </div >