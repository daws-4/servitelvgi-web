import React from "react";
import { EditIcon, TrashIcon } from "../icons";

export interface InventoryItem {
    _id: string;
    code: string;
    description: string;
    type: "material" | "equipment" | "tool";
    unit: string;
    currentStock: number;
    minimumStock: number;
    subtitle?: string;
}

interface InventoryTableProps {
    items: InventoryItem[];
    loading?: boolean;
    selectedItems: Set<string>;
    onSelectionChange: (selected: Set<string>) => void;
    onEdit: (item: InventoryItem) => void;
    onDelete: (itemId: string) => void;
    onManageInstances?: (item: InventoryItem) => void;
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    onPageChange: (page: number) => void;
}

const getTypeInfo = (type: string) => {
    switch (type) {
        case "material":
            return {
                label: "Material",
                icon: "fa-solid fa-reel",
                bgColor: "bg-blue-50",
                textColor: "text-blue-700",
                borderColor: "border-blue-100",
            };
        case "equipment":
            return {
                label: "Equipo",
                icon: "fa-solid fa-server",
                bgColor: "bg-purple-50",
                textColor: "text-purple-700",
                borderColor: "border-purple-100",
            };
        case "tool":
            return {
                label: "Herramienta",
                icon: "fa-solid fa-screwdriver-wrench",
                bgColor: "bg-gray-100",
                textColor: "text-gray-700",
                borderColor: "border-gray-200",
            };
        default:
            return {
                label: type,
                icon: "fa-solid fa-box",
                bgColor: "bg-gray-100",
                textColor: "text-gray-700",
                borderColor: "border-gray-200",
            };
    }
};

const getStockStatus = (current: number, minimum: number) => {
    const ratio = current / minimum;

    if (ratio <= 0.5) {
        // Critical: 50% or less of minimum
        return {
            label: `Crítico (Min: ${minimum})`,
            bgColor: "bg-red-100",
            textColor: "text-red-700",
            stockColor: "text-red-600",
            rowBg: "bg-red-50/30",
        };
    } else if (ratio <= 1.2) {
        // Low: Between 50% and 120% of minimum
        return {
            label: `Bajo (Min: ${minimum})`,
            bgColor: "bg-yellow-100",
            textColor: "text-yellow-700",
            stockColor: "text-dark",
            rowBg: "",
        };
    } else {
        // Normal: More than 120% of minimum
        return {
            label: "Normal",
            bgColor: "bg-green-100",
            textColor: "text-green-700",
            stockColor: "text-dark",
            rowBg: "",
        };
    }
};

export const InventoryTable: React.FC<InventoryTableProps> = ({
    items,
    loading,
    selectedItems,
    onSelectionChange,
    onEdit,
    onDelete,
    onManageInstances,
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    onPageChange,
}) => {
    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            onSelectionChange(new Set(items.map((item) => item._id)));
        } else {
            onSelectionChange(new Set());
        }
    };

    const handleSelectItem = (itemId: string, checked: boolean) => {
        const newSelection = new Set(selectedItems);
        if (checked) {
            newSelection.add(itemId);
        } else {
            newSelection.delete(itemId);
        }
        onSelectionChange(newSelection);
    };

    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    if (loading) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-neutral/10 overflow-hidden">
                <div className="p-8 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                    <p className="text-neutral mt-4">Cargando inventario...</p>
                </div>
            </div>
        );
    }

    if (items.length === 0) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-neutral/10 overflow-hidden">
                <div className="p-8 text-center">
                    <i className="fa-solid fa-box-open text-6xl text-neutral/30 mb-4"></i>
                    <p className="text-neutral text-lg">No se encontraron ítems</p>
                    <p className="text-neutral/60 text-sm mt-2">
                        Intenta ajustar los filtros o crear un nuevo ítem
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-neutral/10 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-dark">
                    <thead className="bg-gray-50 text-neutral font-semibold uppercase text-xs border-b border-neutral/10">
                        <tr>
                            <th className="px-6 py-4 w-10">
                                <input
                                    type="checkbox"
                                    className="rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                                    checked={selectedItems.size === items.length && items.length > 0}
                                    onChange={(e) => handleSelectAll(e.target.checked)}
                                />
                            </th>
                            <th className="px-6 py-4">Código</th>
                            <th className="px-6 py-4">Descripción</th>
                            <th className="px-6 py-4">Tipo</th>
                            <th className="px-6 py-4 text-center">Unidad</th>
                            <th className="px-6 py-4 text-right">Stock Físico</th>
                            <th className="px-6 py-4 text-center">Estado</th>
                            <th className="px-6 py-4 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral/10">
                        {items.map((item) => {
                            const typeInfo = getTypeInfo(item.type);
                            const stockStatus = getStockStatus(item.currentStock, item.minimumStock);
                            const isSelected = selectedItems.has(item._id);

                            return (
                                <tr
                                    key={item._id}
                                    className={`hover:bg-gray-50 transition-colors group ${stockStatus.rowBg}`}
                                >
                                    <td className="px-6 py-4">
                                        <input
                                            type="checkbox"
                                            className="rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                                            checked={isSelected}
                                            onChange={(e) => handleSelectItem(item._id, e.target.checked)}
                                        />
                                    </td>
                                    <td className="px-6 py-4 font-medium font-mono text-neutral">
                                        {item.code}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-dark">{item.description}</div>
                                        {item.subtitle && (
                                            <div className="text-xs text-neutral">{item.subtitle}</div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span
                                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${typeInfo.bgColor} ${typeInfo.textColor} border ${typeInfo.borderColor}`}
                                        >
                                            <i className={typeInfo.icon}></i> {typeInfo.label}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center text-neutral">{item.unit}</td>
                                    <td className={`px-6 py-4 text-right font-bold ${stockStatus.stockColor}`}>
                                        {item.currentStock.toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span
                                            className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${stockStatus.bgColor} ${stockStatus.textColor}`}
                                        >
                                            {stockStatus.label.includes("Crítico") && (
                                                <i className="fa-solid fa-triangle-exclamation"></i>
                                            )}
                                            {stockStatus.label}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            {item.type === "equipment" && onManageInstances && (
                                                <button
                                                    onClick={() => onManageInstances(item)}
                                                    className="text-neutral hover:text-primary p-1 transition-colors cursor-pointer"
                                                    title="Gestionar Instancias"
                                                >
                                                    <i className="fa-solid fa-microchip"></i>
                                                </button>
                                            )}
                                            <button
                                                onClick={() => onEdit(item)}
                                                className="text-neutral hover:text-secondary p-1 transition-colors cursor-pointer"
                                                title="Editar"
                                            >
                                                <EditIcon />
                                            </button>
                                            <button
                                                onClick={() => onDelete(item._id)}
                                                className="text-neutral hover:text-red-500 p-1 transition-colors cursor-pointer"
                                                title="Eliminar"
                                            >
                                                <TrashIcon />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="px-6 py-4 border-t border-neutral/10 flex items-center justify-between">
                <p className="text-sm text-neutral">
                    Mostrando{" "}
                    <span className="font-bold text-dark">
                        {startItem}-{endItem}
                    </span>{" "}
                    de <span className="font-bold text-dark">{totalItems}</span> resultados
                </p>
                <div className="flex gap-2">
                    <button
                        onClick={() => onPageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="px-3 py-1 text-sm border border-neutral/30 rounded text-neutral hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    >
                        Anterior
                    </button>
                    <button
                        onClick={() => onPageChange(currentPage + 1)}
                        disabled={currentPage >= totalPages}
                        className="px-3 py-1 text-sm border border-neutral/30 rounded text-neutral hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    >
                        Siguiente
                    </button>
                </div>
            </div>
        </div>
    );
};

export default InventoryTable;
