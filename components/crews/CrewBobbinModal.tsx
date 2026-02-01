"use client";

import React, { useState, useEffect } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button } from "@heroui/react";
import axios from "axios";

interface Batch {
    _id: string;
    batchCode: string;
    currentQuantity: number;
    initialQuantity: number;
    acquisitionDate: string;
    unit: string;
}

interface CrewBobbinModalProps {
    isOpen: boolean;
    onClose: () => void;
    crewId: string;
    crewNumber: number;
    materialId: string | null;
    materialCode: string | null;
    materialDescription: string | null;
    onSuccess: () => void;
    readOnly?: boolean;
}

export const CrewBobbinModal: React.FC<CrewBobbinModalProps> = ({
    isOpen,
    onClose,
    crewId,
    crewNumber,
    materialId,
    materialCode,
    materialDescription,
    onSuccess,
    readOnly = false,
}) => {
    const [batches, setBatches] = useState<Batch[]>([]);
    const [selectedBatchIds, setSelectedBatchIds] = useState<Set<string>>(new Set());
    const [returnReason, setReturnReason] = useState("");
    const [loading, setLoading] = useState(false);
    const [returning, setReturning] = useState(false);

    useEffect(() => {
        if (isOpen && materialId) {
            fetchBatches();
        }
    }, [isOpen, materialId, crewId]);

    const fetchBatches = async () => {
        setLoading(true);
        try {
            // Fetch batches for this crew and specific material
            const response = await axios.get(`/api/web/inventory/batches`, {
                params: {
                    crewId: crewId,
                    itemId: materialId,
                    status: 'active'
                }
            });

            // Filter locally just in case api returns broader set (though params should handle it)
            // Ensure we only look at batches actually Assigned to this crew
            const crewBatches = response.data.filter((b: any) =>
                b.location === 'crew' &&
                (b.crew?._id === crewId || b.crew === crewId)
            );

            setBatches(crewBatches);
        } catch (error) {
            console.error("Error fetching batches:", error);
            alert("Error al cargar las bobinas");
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setSelectedBatchIds(new Set());
        setReturnReason("");
        onClose();
    };

    const handleToggleBatch = (batchId: string) => {
        const newSelection = new Set(selectedBatchIds);
        if (newSelection.has(batchId)) {
            newSelection.delete(batchId);
        } else {
            newSelection.add(batchId);
        }
        setSelectedBatchIds(newSelection);
    };

    const handleReturn = async () => {
        if (selectedBatchIds.size === 0) {
            alert("Selecciona al menos una bobina para devolver");
            return;
        }

        if (!returnReason.trim()) {
            alert("Ingresa un motivo de devolución");
            return;
        }

        try {
            setReturning(true);

            // Process each selected batch as a return item
            // We use the existing 'returnMaterialFromCrew' via the movements API
            // The API now accepts 'batchCode' which triggers the 'Whole Bobbin Return' logic we implemented.
            const itemsToReturn = Array.from(selectedBatchIds).map(batchId => {
                const batch = batches.find(b => b._id === batchId);
                if (!batch) throw new Error("Bobina no encontrada");

                return {
                    inventoryId: materialId!,
                    quantity: batch.currentQuantity, // Return the whole remaining quantity (moving the bobbin)
                    batchCode: batch.batchCode
                };
            });

            await axios.post("/api/web/inventory/movements", {
                action: "return",
                data: {
                    crewId,
                    items: itemsToReturn,
                    reason: returnReason.trim(),
                },
            });

            alert(`${selectedBatchIds.size} bobina(s) devuelta(s) correctamente`);
            setSelectedBatchIds(new Set());
            setReturnReason("");
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error("Error returning batches:", error);
            alert(error.response?.data?.error || "Error al devolver las bobinas");
        } finally {
            setReturning(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} size="2xl" scrollBehavior="inside">
            <ModalContent>
                {/* Header */}
                <ModalHeader className="bg-orange-50 border-b border-orange-200 flex items-center gap-2">
                    <i className="fa-solid fa-ring text-orange-600"></i>
                    <div className="flex flex-col">
                        <span className="text-orange-900">Bobinas Asignadas - Cuadrilla {crewNumber}</span>
                        {materialDescription && (
                            <span className="text-sm font-normal text-orange-700">
                                {materialCode} - {materialDescription}
                            </span>
                        )}
                    </div>
                </ModalHeader>

                <ModalBody className="py-6">
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="text-center">
                                <i className="fa-solid fa-spinner fa-spin text-orange-600 text-3xl mb-3"></i>
                                <p className="text-sm text-neutral">Cargando bobinas...</p>
                            </div>
                        </div>
                    ) : batches.length === 0 ? (
                        <div className="text-center py-12">
                            <i className="fa-solid fa-ring text-neutral/30 text-5xl mb-4"></i>
                            <p className="text-neutral">No hay bobinas de este material asignadas</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Batches List */}
                            <div className="border border-orange-200 rounded-lg overflow-hidden divide-y divide-orange-100">
                                {batches.map((batch) => (
                                    <label
                                        key={batch._id}
                                        className="flex items-center gap-4 p-4 hover:bg-orange-50 cursor-pointer transition-colors"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedBatchIds.has(batch._id)}
                                            onChange={() => handleToggleBatch(batch._id)}
                                            className={`w-5 h-5 text-orange-600 border-orange-300 rounded focus:ring-orange-500 ${readOnly ? 'hidden' : ''}`}
                                            disabled={readOnly}
                                        />

                                        <div className="flex-1">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="font-bold text-gray-800 font-mono text-lg">
                                                    {batch.batchCode}
                                                </span>
                                                <span className="text-sm font-semibold bg-green-100 text-green-800 px-2 py-0.5 rounded">
                                                    {batch.currentQuantity} {batch.unit}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-4 text-xs text-gray-500">
                                                <span>
                                                    <i className="fa-regular fa-calendar mr-1"></i>
                                                    {new Date(batch.acquisitionDate).toLocaleDateString()}
                                                </span>
                                                <span>
                                                    Inicial: {batch.initialQuantity} {batch.unit}
                                                </span>
                                            </div>
                                        </div>
                                    </label>
                                ))}
                            </div>

                            {/* Return Section */}
                            {!readOnly && selectedBatchIds.size > 0 && (
                                <div className="border-t border-orange-200 pt-6 mt-6">
                                    <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                                        <div className="mb-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <label className="text-sm font-semibold text-orange-900">
                                                    Motivo de Devolución <span className="text-red-500">*</span>
                                                </label>
                                                <span className="text-xs text-orange-600 font-medium">
                                                    {selectedBatchIds.size} seleccionada(s)
                                                </span>
                                            </div>
                                            <textarea
                                                value={returnReason}
                                                onChange={(e) => setReturnReason(e.target.value)}
                                                placeholder="Ej: Bobina terminada o devuelta a bodega"
                                                rows={3}
                                                className="w-full px-3 py-2 border border-orange-300 rounded-lg focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none text-sm resize-none"
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
                    {selectedBatchIds.size > 0 && (
                        <Button
                            color="warning"
                            onPress={handleReturn}
                            isLoading={returning}
                            className="bg-orange-600 hover:bg-orange-700 text-white"
                        >
                            <i className="fa-solid fa-rotate-left mr-2"></i>
                            Devolver {selectedBatchIds.size} Bobina(s)
                        </Button>
                    )}
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

export default CrewBobbinModal;
