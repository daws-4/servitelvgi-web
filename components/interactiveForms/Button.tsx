import React from "react";
import { Button, ButtonProps } from "@heroui/react";

interface FormButtonProps extends ButtonProps {
    label: string; // Texto del botón
    classNames?: {
        base?: string;
        [key: string]: string | undefined;
    };
}

export const FormButton: React.FC<FormButtonProps> = ({
    label,
    isLoading,
    isDisabled,
    children,
    classNames,
    ...props
}) => {
    return (
        <Button
            color="primary" // Por defecto usa el color principal (azul #3e78b2)
            variant="solid"
            radius="sm"     // Bordes sutilmente redondeados, consistente con los inputs
            isLoading={isLoading} // Prop nativa de HeroUI que muestra el spinner
            isDisabled={isDisabled || isLoading} // Deshabilita si está cargando o si se pasa la prop isDisabled
            className={`font-medium px-6 ${classNames?.base || ""}`} // Estilos base
            {...props}
        >
            {/* Si hay children (ej: un icono), se muestran junto con el label, o solo el label */}
            {children || label}
        </Button>
    );
};

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