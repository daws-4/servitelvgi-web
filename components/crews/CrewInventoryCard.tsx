"use client";

import React from "react";

interface InventoryItem {
    item: {
        _id: string;
        code: string;
        description: string;
        unit: string;
        type?: string;
    };
    quantity: number;
    lastUpdate: Date;
}

interface CrewInventoryCardProps {
    crewId: string;
    assignedInventory: InventoryItem[];
    onReturnClick: (item: InventoryItem) => void;
    onRefresh: () => void;
    onEquipmentClick?: () => void;
}

export const CrewInventoryCard: React.FC<CrewInventoryCardProps> = ({
    crewId,
    assignedInventory,
    onReturnClick,
    onRefresh,
    onEquipmentClick,
}) => {
    // Filter out equipment items - they are shown in the equipment modal
    const regularInventory = assignedInventory.filter(
        (item) => item.item?.type !== "equipment"
    );
    const hasInventory = regularInventory && regularInventory.length > 0;

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral/10">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 border-b border-neutral/10 pb-2">
                <div className="flex items-center gap-2">
                    <i className="fa-solid fa-boxes-stacked text-primary text-lg"></i>
                    <h3 className="text-lg font-semibold text-dark">Material Asignado</h3>
                </div>
                <div className="flex items-center gap-2">
                    {onEquipmentClick && (
                        <button
                            onClick={onEquipmentClick}
                            className="px-3 py-1.5 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
                            title="Ver equipos asignados"
                        >
                            <i className="fa-solid fa-microchip"></i>
                            Ver Equipos
                        </button>
                    )}
                    <button
                        onClick={onRefresh}
                        className="p-2 text-neutral hover:text-primary transition-colors"
                        title="Actualizar"
                    >
                        <i className="fa-solid fa-rotate-right"></i>
                    </button>
                </div>
            </div>

            {/* Content */}
            {hasInventory ? (
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="text-left text-sm text-neutral border-b border-neutral/10">
                                <th className="pb-3 font-medium">Código</th>
                                <th className="pb-3 font-medium">Descripción</th>
                                <th className="pb-3 font-medium text-right">Cantidad</th>
                                <th className="pb-3 font-medium">Unidad</th>
                                <th className="pb-3 font-medium text-center">Acción</th>
                            </tr>
                        </thead>
                        <tbody>
                            {regularInventory.map((inventoryItem, index) => (
                                <tr
                                    key={inventoryItem.item._id || index}
                                    className="border-b border-neutral/5 hover:bg-gray-50/50 transition-colors"
                                >
                                    <td className="py-3">
                                        <span className="font-mono text-sm font-semibold text-dark flex items-center gap-2">
                                            {inventoryItem.item.type === 'equipment' && (
                                                <i className="fa-solid fa-microchip text-purple-600" title="Equipo"></i>
                                            )}
                                            {inventoryItem.item.code}
                                        </span>
                                    </td>
                                    <td className="py-3">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-dark">
                                                {inventoryItem.item.description}
                                            </span>
                                            {inventoryItem.item.type === 'equipment' && (
                                                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded font-medium">
                                                    {inventoryItem.quantity} instancia{inventoryItem.quantity > 1 ? 's' : ''}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="py-3 text-right">
                                        <span className="font-semibold text-dark">
                                            {inventoryItem.quantity}
                                        </span>
                                    </td>
                                    <td className="py-3">
                                        <span className="text-sm text-neutral">
                                            {inventoryItem.item.unit}
                                        </span>
                                    </td>
                                    <td className="py-3 text-center">
                                        <button
                                            onClick={() => onReturnClick(inventoryItem)}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-600 transition-colors shadow-sm"
                                            title="Devolver material al almacén"
                                        >
                                            <i className="fa-solid fa-rotate-left text-xs"></i>
                                            Devolver
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="text-center py-8">
                    <i className="fa-solid fa-box-open text-4xl text-neutral/30 mb-3"></i>
                    <p className="text-neutral text-sm">
                        No hay materiales asignados a esta cuadrilla
                    </p>
                </div>
            )}
        </div>
    );
};

export default CrewInventoryCard;
