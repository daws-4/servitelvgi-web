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

interface CrewEquipmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    crewId: string;
    crewName: string;
    onSuccess: () => void;
}

export const CrewEquipmentModal: React.FC<CrewEquipmentModalProps> = ({
    isOpen,
    onClose,
    crewId,
    crewName,
    onSuccess,
}) => {
    const [equipment, setEquipment] = useState<EquipmentInstance[]>([]);
    const [selectedInstanceIds, setSelectedInstanceIds] = useState<Set<string>>(new Set());
    const [returnReason, setReturnReason] = useState("");
    const [loading, setLoading] = useState(false);
    const [returning, setReturning] = useState(false);

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
        setReturnReason("");
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

    const handleReturn = async () => {
        if (selectedInstanceIds.size === 0) {
            alert("Selecciona al menos una instancia para devolver");
            return;
        }

        if (!returnReason.trim()) {
            alert("Ingresa un motivo de devolución");
            return;
        }

        try {
            setReturning(true);
            await axios.post(`/api/web/crews/${crewId}/equipment-instances/return`, {
                instanceIds: Array.from(selectedInstanceIds),
                reason: returnReason,
            });

            alert(`${selectedInstanceIds.size} equipo(s) devuelto(s) correctamente`);
            setSelectedInstanceIds(new Set());
            setReturnReason("");
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error("Error returning equipment:", error);
            alert(error.response?.data?.error || "Error al devolver los equipos");
        } finally {
            setReturning(false);
        }
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
                <ModalHeader className="bg-purple-50 border-b border-purple-200 flex items-center gap-2">
                    <i className="fa-solid fa-microchip text-purple-600"></i>
                    <span className="text-purple-900">Equipos Asignados - {crewName}</span>
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
                        <div className="space-y-6">
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
                                                {group.instances.length} instancia{group.instances.length > 1 ? 's' : ''}
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

                            {/* Return Section */}
                            {selectedInstanceIds.size > 0 && (
                                <div className="border-t border-purple-200 pt-6 mt-6">
                                    <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                                        <div className="mb-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <label className="text-sm font-semibold text-purple-900">
                                                    Motivo de Devolución <span className="text-red-500">*</span>
                                                </label>
                                                <span className="text-xs text-purple-600 font-medium">
                                                    {selectedInstanceIds.size} seleccionada(s)
                                                </span>
                                            </div>
                                            <textarea
                                                value={returnReason}
                                                onChange={(e) => setReturnReason(e.target.value)}
                                                placeholder="Ej: Trabajo completado, equipo sobrante"
                                                rows={3}
                                                className="w-full px-3 py-2 border border-purple-300 rounded-lg focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none text-sm resize-none"
                                                disabled={returning}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </ModalBody>

                <ModalFooter className="bg-gray-50 border-t border-neutral/10">
                    <Button color="default" variant="flat" onPress={handleClose} isDisabled={returning}>
                        Cancelar
                    </Button>
                    {selectedInstanceIds.size > 0 && (
                        <Button
                            color="secondary"
                            onPress={handleReturn}
                            isLoading={returning}
                            className="bg-purple-600 hover:bg-purple-700 text-white"
                        >
                            <i className="fa-solid fa-rotate-left mr-2"></i>
                            Devolver {selectedInstanceIds.size} Equipo(s)
                        </Button>
                    )}
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

export default CrewEquipmentModal;
