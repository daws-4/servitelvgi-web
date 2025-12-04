import React from "react";
import { Switch, SwitchProps } from "@heroui/react";

interface FormSwitchProps extends SwitchProps {
    label: string; // El texto descriptivo (ej: "Usuario Activo")
}

export const FormSwitch: React.FC<FormSwitchProps> = ({
    label,
    classNames,
    ...props
}) => {
    return (
        <Switch
            size="sm" // Tamaño por defecto, ideal para formularios densos
            color="primary" // Usa tu color azul corporativo al estar activo
            classNames={{
                base: "flex-row-reverse w-full max-w-md bg-content1 hover:bg-content2 items-center justify-between cursor-pointer rounded-lg gap-2 p-2 border-2 border-transparent data-[selected=true]:border-primary",
                wrapper: "p-0 h-4 overflow-visible",
                thumb: "w-6 h-6 border-2 shadow-sm group-data-[hover=true]:border-primary group-data-[selected=true]:ml-6 group-data-[pressed=true]:w-7 group-data-[selected]:group-data-[pressed]:ml-4",
                label: "text-small font-medium text-default-600",
                ...classNames,
            }}
            {...props}
        >
            <div className="flex flex-col gap-1">
                <p className="text-medium">{label}</p>
                {props.children && (
                    <p className="text-tiny text-default-400">
                        {props.children}
                    </p>
                )}
            </div>
        </Switch>
    );
};

export default FormSwitch;
// ```

// ### Cómo usarlo en tus Formularios

// **1. Para Activar/Desactivar un Instalador:**

// ```tsx
// import { FormSwitch } from "@/components/ui/FormSwitch";
// import { useState } from "react";

// // ...
// const [isActive, setIsActive] = useState(true);

// <FormSwitch
//     label="Estado del Instalador"
//     isSelected={isActive}
//     onValueChange={setIsActive}
// >
//     {isActive ? "El técnico puede recibir órdenes" : "El técnico está inactivo"}
// </FormSwitch>
// ```

// **2. Para Configuraciones del Sistema:**

// ```tsx
//     < FormSwitch
// label = "Notificaciones por WhatsApp"
// defaultSelected
//     />