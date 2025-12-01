import React, { useMemo, useState } from "react";
import {
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    Pagination,
    getKeyValue,
    SortDescriptor,
} from "@heroui/react";

// Definición de tipos para las props
export interface Column {
    key: string;
    label: string;
    sortable?: boolean;
}

export interface DataTableProps {
    columns: Column[];
    data: any[];
    // Prop opcional para personalizar cómo se ve la primera columna
    // Recibe el item completo y devuelve un elemento React (JSX)
    renderFirstColumn?: (item: any) => React.ReactNode;
    initialRowsPerPage?: number;
    emptyContent?: string;
}

export const DataTable: React.FC<DataTableProps> = ({
    columns,
    data,
    renderFirstColumn,
    initialRowsPerPage = 10,
    emptyContent = "No hay datos para mostrar.",
}) => {
    // Estado para la paginación
    const [page, setPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(initialRowsPerPage);

    // Estado para el ordenamiento (sorting)
    const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
        column: columns[0]?.key,
        direction: "ascending",
    });

    // Lógica de paginación
    const pages = Math.ceil(data.length / rowsPerPage);

    const items = useMemo(() => {
        const start = (page - 1) * rowsPerPage;
        const end = start + rowsPerPage;

        // Primero ordenamos los datos si hay un descriptor de orden
        const sortedData = [...data].sort((a, b) => {
            const first = a[sortDescriptor.column as string];
            const second = b[sortDescriptor.column as string];
            const cmp = first < second ? -1 : first > second ? 1 : 0;

            return sortDescriptor.direction === "descending" ? -cmp : cmp;
        });

        return sortedData.slice(start, end);
    }, [page, data, rowsPerPage, sortDescriptor]);

    // Renderizado de celdas
    const renderCell = React.useCallback((item: any, columnKey: any) => {
        const cellValue = getKeyValue(item, columnKey);

        // Si es la primera columna Y tenemos una función personalizada para renderizarla
        if (columnKey === columns[0].key && renderFirstColumn) {
            return renderFirstColumn(item);
        }

        // Renderizado por defecto para el resto
        return cellValue;
    }, [columns, renderFirstColumn]);

    return (
        <div className="w-full flex flex-col gap-4">
            <Table
                aria-label="Tabla de datos reutilizable"
                sortDescriptor={sortDescriptor}
                onSortChange={setSortDescriptor}
                bottomContent={
                    pages > 0 ? (
                        <div className="flex w-full justify-center">
                            <Pagination
                                isCompact
                                showControls
                                showShadow
                                color="primary" // Usará tu color #3e78b2 si configuraste el tema
                                page={page}
                                total={pages}
                                onChange={(page) => setPage(page)}
                            />
                        </div>
                    ) : null
                }
                classNames={{
                    wrapper: "min-h-[222px]",
                }}
            >
                <TableHeader columns={columns}>
                    {(column) => (
                        <TableColumn
                            key={column.key}
                            allowsSorting={column.sortable}
                        >
                            {column.label}
                        </TableColumn>
                    )}
                </TableHeader>
                <TableBody items={items} emptyContent={emptyContent}>
                    {(item) => (
                        <TableRow key={item.id || item._id || Math.random()}>
                            {(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
};

export default DataTable;

// 1 #3e78b2
// 2 #7D8CA3
// 3 #004ba8
// 4 #deefb7
// 5 #bcabae
// 6 #0f0f0f


// **** EJEMPLO DE USO ****
// "use client";
// import React from "react";
// import { DataTable } from "@/components/common/DataTable"; // Asumiendo la ruta
// import { User } from "@heroui/react";

// // 1. Definimos las columnas (JSON)
// const columns = [
//     { key: "name", label: "NOMBRE", sortable: true },
//     { key: "role", label: "ROL", sortable: true },
//     { key: "status", label: "ESTADO", sortable: true },
// ];

// // 2. Definimos los datos (JSON - vendrían de tu API)
// const installers = [
//     {
//         id: 1,
//         name: "Juan Pérez",
//         email: "juan@servitel.com",
//         role: "Técnico Senior",
//         status: "Activo",
//         avatar: "https://i.pravatar.cc/150?u=a042581f4e29026024d",
//     },
//     {
//         id: 2,
//         name: "Ana Gómez",
//         email: "ana@servitel.com",
//         role: "Ayudante",
//         status: "Inactivo",
//         avatar: "https://i.pravatar.cc/150?u=a042581f4e29026704d",
//     },
// ];

// export default function InstallersPage() {
//     return (
//         <div className="p-6">
//             <h1 className="text-2xl font-bold mb-4 text-[#3e78b2]">Listado de Instaladores</h1>

//             <DataTable
//                 columns={columns}
//                 data={installers}
//                 // Aquí está la magia: personalizamos la primera columna (name)
//                 renderFirstColumn={(item) => (
//                     <User
//                         avatarProps={{ radius: "lg", src: item.avatar }}
//                         description={item.email}
//                         name={item.name}
//                     >
//                         {item.email}
//                     </User>
//                 )}
//             />
//         </div>
//     );
// }