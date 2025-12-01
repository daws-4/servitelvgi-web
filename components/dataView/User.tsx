import React from "react";
import { User } from "@heroui/react";

export interface UserCellProps {
    name: string;
    role?: string;      // Cargo (ej: "Técnico Senior") o Teléfono
    avatarUrl?: string; // URL de la foto (opcional)
    email?: string;     // Email para fallback o tooltip (opcional)
}

export const UserCell: React.FC<UserCellProps> = ({
    name,
    role,
    avatarUrl,
    email
}) => {
    return (
        <User
            name={name}
            description={role || email} // Muestra el rol/teléfono como subtítulo
            avatarProps={{
                src: avatarUrl,
                radius: "md",       // Bordes redondeados suaves
                size: "sm",         // Tamaño compacto ideal para filas de tabla
                isBordered: false,  // Sin borde para un look más limpio en la lista
                showFallback: true, // Muestra iniciales si la imagen falla o no existe
                name: name,         // Usa el nombre para generar las iniciales (ej: "Juan Perez" -> "JP")
                color: "primary",   // Usa tu color azul (#3e78b2) para el fondo de las iniciales
                classNames: {
                    // Estilo suave para el fallback de iniciales
                    base: "bg-primary/10 text-primary font-semibold"
                }
            }}
            classNames={{
                // Ajustes de tipografía para jerarquía visual
                name: "text-sm font-semibold text-default-900 leading-none",
                description: "text-xs text-default-500 mt-0.5 capitalize",
            }}
        />
    );
};

export default UserCell;

// ### Cómo usarlo en tu `DataTable`

// Este componente simplifica enormemente el código de tu página. En lugar de configurar el componente `<User>` manualmente cada vez, ahora solo pasas los datos.

// **Ejemplo en `InstallersPage.tsx` (o en la tabla de Asignación de Órdenes):**

// import { DataTable } from "@/components/common/DataTable";
// import { UserCell } from "@/components/ui/UserCell"; // Importas tu nuevo componente

// // ... (definición de columnas y datos)

// export default function AssignPage() {
//     return (
//         <DataTable
//             columns={columns}
//             data={installers}
//             // Uso simplificado gracias a UserCell
//             renderFirstColumn={(item) => (
//                 <UserCell
//                     name={item.name}
//                     role={item.phone} // En la tabla de asignación es útil ver el teléfono
//                     avatarUrl={item.avatar}
//                 />
//             )}
//         />
//     );
// }