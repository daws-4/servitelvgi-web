"use client";

import React, { useState, useEffect } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button } from "@heroui/react";
import axios from "axios";

interface EquipmentInstance {
    uniqueId: string;
    serialNumber?: string;
    macAddress?: string;
    notes?: string;
    status: string;
    inventoryId: string;
    itemCode: string;
    itemDescription: string;
}

interface GroupedEquipment {
    inventoryId: string;
    itemCode: string;
    itemDescription: string;
    instances: EquipmentInstance[];
}

interface SelectedInstance {
    uniqueId: string;
    inventoryId: string;
    itemCode: string;
    itemDescription: string;
}

interface OrderEquipmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    crewId: string;
    onAddEquipment: (instances: SelectedInstance[]) => void;
}

export const OrderEquipmentModal: React.FC<OrderEquipmentModalProps> = ({
    isOpen,
    onClose,
    crewId,
    onAddEquipment,
}) => {
    const [equipment, setEquipment] = useState<EquipmentInstance[]>([]);
    const [selectedInstanceIds, setSelectedInstanceIds] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchEquipment();
        }
    }, [isOpen, crewId]);

    const fetchEquipment = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`/api/web/crews/${crewId}/equipment-instances`);
            setEquipment(response.data.instances || []);
        } catch (error) {
            console.error("Error fetching equipment:", error);
            alert("Error al cargar los equipos");
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setSelectedInstanceIds(new Set());
        onClose();
    };

    const handleToggleInstance = (uniqueId: string) => {
        const newSelection = new Set(selectedInstanceIds);
        if (newSelection.has(uniqueId)) {
            newSelection.delete(uniqueId);
        } else {
            newSelection.add(uniqueId);
        }
        setSelectedInstanceIds(newSelection);
    };

    const handleAdd = () => {
        if (selectedInstanceIds.size === 0) {
            alert("Selecciona al menos una instancia");
            return;
        }

        const selectedInstances: SelectedInstance[] = equipment
            .filter(inst => selectedInstanceIds.has(inst.uniqueId))
            .map(inst => ({
                uniqueId: inst.uniqueId,
                inventoryId: inst.inventoryId,
                itemCode: inst.itemCode,
                itemDescription: inst.itemDescription,
            }));

        onAddEquipment(selectedInstances);
        setSelectedInstanceIds(new Set());
        onClose();
    };

    // Group equipment by inventory item
    const groupedEquipment: GroupedEquipment[] = Object.values(
        equipment.reduce((acc, instance) => {
            const key = instance.inventoryId;
            if (!acc[key]) {
                acc[key] = {
                    inventoryId: instance.inventoryId,
                    itemCode: instance.itemCode,
                    itemDescription: instance.itemDescription,
                    instances: [],
                };
            }
            acc[key].instances.push(instance);
            return acc;
        }, {} as Record<string, GroupedEquipment>)
    );

    return (
        <Modal isOpen={isOpen} onClose={handleClose} size="3xl" scrollBehavior="inside">
            <ModalContent>
                {/* Header */}
                <ModalHeader className="bg-purple-600 text-white border-b flex items-center gap-2">
                    <i className="fa-solid fa-microchip"></i>
                    <span>Seleccionar Equipos para Instalar</span>
                </ModalHeader>

                <ModalBody className="py-6">
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="text-center">
                                <i className="fa-solid fa-spinner fa-spin text-purple-600 text-3xl mb-3"></i>
                                <p className="text-sm text-neutral">Cargando equipos...</p>
                            </div>
                        </div>
                    ) : equipment.length === 0 ? (
                        <div className="text-center py-12">
                            <i className="fa-solid fa-box-open text-neutral/30 text-5xl mb-4"></i>
                            <p className="text-neutral">No hay equipos asignados a esta cuadrilla</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Equipment Groups */}
                            {groupedEquipment.map((group) => (
                                <div key={group.inventoryId} className="border border-purple-200 rounded-lg overflow-hidden">
                                    {/* Group Header */}
                                    <div className="bg-purple-100 px-4 py-3 border-b border-purple-200">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <i className="fa-solid fa-microchip text-purple-700"></i>
                                                <span className="font-semibold text-purple-900">
                                                    {group.itemDescription}
                                                </span>
                                                <span className="text-xs bg-purple-200 text-purple-800 px-2 py-0.5 rounded-full">
                                                    {group.itemCode}
                                                </span>
                                            </div>
                                            <span className="text-sm text-purple-700 font-medium">
                                                {group.instances.length} disponible{group.instances.length > 1 ? 's' : ''}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Instances List */}
                                    <div className="divide-y divide-purple-100">
                                        {group.instances.map((instance) => (
                                            <label
                                                key={instance.uniqueId}
                                                className="flex items-start gap-3 p-4 hover:bg-purple-50 cursor-pointer transition-colors"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={selectedInstanceIds.has(instance.uniqueId)}
                                                    onChange={() => handleToggleInstance(instance.uniqueId)}
                                                    className="mt-1 w-4 h-4 text-purple-600 border-purple-300 rounded focus:ring-purple-500"
                                                />
                                                <div className="flex-1">
                                                    <div className="font-semibold text-purple-800 mb-1">
                                                        {instance.uniqueId}
                                                    </div>
                                                    <div className="space-y-0.5">
                                                        {instance.serialNumber && (
                                                            <div className="text-xs text-gray-600 flex items-center gap-2">
                                                                <i className="fa-solid fa-barcode text-gray-400 w-4"></i>
                                                                <span>SN: {instance.serialNumber}</span>
                                                            </div>
                                                        )}
                                                        {instance.macAddress && (
                                                            <div className="text-xs text-gray-600 flex items-center gap-2">
                                                                <i className="fa-solid fa-network-wired text-gray-400 w-4"></i>
                                                                <span>MAC: {instance.macAddress}</span>
                                                            </div>
                                                        )}
                                                        {instance.notes && (
                                                            <div className="text-xs text-gray-500 italic flex items-center gap-2">
                                                                <i className="fa-solid fa-note-sticky text-gray-400 w-4"></i>
                                                                <span>{instance.notes}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            ))}

                            {/* Selection Count */}
                            {selectedInstanceIds.size > 0 && (
                                <div className="text-center p-3 bg-purple-50 rounded-lg border border-purple-200">
                                    <span className="text-sm font-medium text-purple-700">
                                        {selectedInstanceIds.size} instancia(s) seleccionada(s)
                                    </span>
                                </div>
                            )}
                        </div>
                    )}
                </ModalBody>

                <ModalFooter className="bg-gray-50 border-t border-neutral/10">
                    <Button color="default" variant="flat" onPress={handleClose}>
                        Cancelar
                    </Button>
                    {selectedInstanceIds.size > 0 && (
                        <Button
                            color="secondary"
                            onPress={handleAdd}
                            className="bg-purple-600 hover:bg-purple-700 text-white"
                        >
                            <i className="fa-solid fa-plus mr-2"></i>
                            Agregar ({selectedInstanceIds.size})
                        </Button>
                    )}
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

export default OrderEquipmentModal;
