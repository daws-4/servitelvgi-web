import React from "react";
import {Link} from "@heroui/react"

export interface UserCellProps {
    name?: string;
    surname?: string;
    role?: string;      // Cargo (ej: "Técnico Senior") o Teléfono
    avatarUrl?: string; // URL de la foto (opcional)
    email?: string;     // Email para fallback o tooltip (opcional)
    id?: string;
}

export const UserCell: React.FC<UserCellProps> = ({
    name,
    role,
    surname,
    avatarUrl,
    email,
    id
}) => {
    return (
        <div className='flex items-center gap-3'>
        <img src={avatarUrl} alt={name} className="w-10 h-10 rounded-full border-2 border-background" />
                    <div className="flex-1 min-w-0">
                        <Link href={`/users/${id}`} className="text-sm text-white font-semibold truncate">{name} {surname}</Link>
                        <p className="text-xs text-neutral truncate">{email}</p>
                        <p className="text-xs text-neutral truncate">{role}</p>
                    </div>
        </div>
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