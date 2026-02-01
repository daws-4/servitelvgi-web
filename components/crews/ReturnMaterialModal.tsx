"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";

interface InventoryItem {
    item: {
        _id: string;
        code: string;
        description: string;
        unit: string;
    };
    quantity: number;
}

interface ReturnMaterialModalProps {
    isOpen: boolean;
    onClose: () => void;
    crewId: string;
    material: InventoryItem | null;
    onSuccess: () => void;
}

interface BatchOption {
    _id: string;
    batchCode: string;
    currentQuantity: number;
}

export const ReturnMaterialModal: React.FC<ReturnMaterialModalProps> = ({
    isOpen,
    onClose,
    crewId,
    material,
    onSuccess,
}) => {
    const [quantity, setQuantity] = useState<string>("");
    const [reason, setReason] = useState<string>("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Batch Handling
    const [loadingBatches, setLoadingBatches] = useState(false);
    const [batches, setBatches] = useState<BatchOption[]>([]);
    const [selectedBatchCode, setSelectedBatchCode] = useState<string>("");

    // Reset form when modal opens/closes or material changes
    useEffect(() => {
        if (isOpen && material) {
            setQuantity("");
            setReason("");
            setError(null);
            setBatches([]);
            setSelectedBatchCode("");

            // Check if we need to fetch batches (e.g. if unit is metros or description hints at cable)
            // A more robust way is to ALWAYS try to fetch batches for this item+crew.
            fetchBatches(material.item._id);
        }
    }, [isOpen, material, crewId]);

    const fetchBatches = async (itemId: string) => {
        try {
            setLoadingBatches(true);
            // We need an endpoint to get batches for a crew and item.
            // Currently assuming we can filter existing endpoint or add one.
            // Let's use the existing comprehensive inventory endpoint but filtered?
            // Or simpler: Just a direct call to get batches.
            // Since we don't have a specific endpoint document for this, we'll try querying the inventory-batches endpoint
            // or adapt.
            // Assuming: GET /api/web/inventory/batches?crewId=...&itemId=...
            const response = await axios.get(`/api/web/inventory/batches`, {
                params: {
                    crewId: crewId,
                    itemId: itemId,
                    status: 'active'
                }
            });

            // Filter batches that are assigned to THIS crew
            const crewBatches = response.data.filter((b: any) =>
                b.location === 'crew' &&
                (b.crew?._id === crewId || b.crew === crewId) &&
                b.currentQuantity > 0
            );

            setBatches(crewBatches);
        } catch (err) {
            console.error("Error fetching batches:", err);
            // If it fails, maybe it's because the endpoint doesn't exist or other error.
            // We'll proceed without batches (standard material).
        } finally {
            setLoadingBatches(false);
        }
    };

    if (!isOpen || !material) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        const quantityNum = parseFloat(quantity);

        // Validations
        if (!quantityNum || quantityNum <= 0) {
            setError("La cantidad debe ser mayor a 0");
            return;
        }

        // If batches exist, user MUST select one
        if (batches.length > 0 && !selectedBatchCode) {
            setError("Este material se maneja por Bobinas. Debe seleccionar una Bobina para devolver.");
            return;
        }

        if (quantityNum > material.quantity) {
            setError(
                `La cantidad no puede ser mayor a ${material.quantity} ${material.item.unit}`
            );
            return;
        }

        // If batch selected, validate against batch quantity
        if (selectedBatchCode) {
            const selectedBatch = batches.find(b => b.batchCode === selectedBatchCode);
            if (selectedBatch && quantityNum > selectedBatch.currentQuantity) {
                // Allowing small tolerance? No, strict.
                setError(`La cantidad excede el stock de la bobina seleccionada (${selectedBatch.currentQuantity} ${material.item.unit})`);
                return;
            }
        }

        if (!reason.trim()) {
            setError("Debe ingresar un motivo de devolución");
            return;
        }

        try {
            setIsSubmitting(true);

            await axios.post("/api/web/inventory/movements", {
                action: "return",
                data: {
                    crewId,
                    items: [
                        {
                            inventoryId: material.item._id,
                            quantity: quantityNum,
                            batchCode: selectedBatchCode || undefined
                        },
                    ],
                    reason: reason.trim(),
                },
            });

            // Success
            alert("Material devuelto correctamente al almacén");
            onSuccess();
            onClose();
        } catch (err: any) {
            console.error("Error returning material:", err);
            setError(
                err.response?.data?.error ||
                "Error al devolver el material. Intente nuevamente."
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    // Auto-fill quantity when batch is selected
    const handleBatchChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const code = e.target.value;
        setSelectedBatchCode(code);
        if (code) {
            const batch = batches.find(b => b.batchCode === code);
            if (batch) {
                setQuantity(batch.currentQuantity.toString());
            }
        } else {
            setQuantity("");
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-neutral/10">
                    <div className="flex items-center gap-2">
                        <i className="fa-solid fa-rotate-left text-orange-500 text-xl"></i>
                        <h3 className="text-xl font-bold text-dark">Devolver Material</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-neutral hover:text-dark transition-colors"
                        disabled={isSubmitting}
                    >
                        <i className="fa-solid fa-xmark text-xl"></i>
                    </button>
                </div>

                {/* Content */}
                <form onSubmit={handleSubmit} className="p-6">
                    {/* Material Info */}
                    <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                            <div>
                                <p className="text-xs text-neutral mb-1">Material</p>
                                <p className="font-mono font-semibold text-dark">
                                    {material.item.code}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-neutral mb-1">Disponible Total</p>
                                <p className="font-semibold text-dark">
                                    {material.quantity} {material.item.unit}
                                </p>
                            </div>
                        </div>
                        <p className="text-sm text-dark">{material.item.description}</p>
                    </div>

                    {/* Batch Selection (if available) */}
                    {loadingBatches ? (
                        <div className="mb-4 text-center text-sm text-neutral">
                            <i className="fa-solid fa-circle-notch fa-spin mr-2"></i>
                            Buscando bobinas...
                        </div>
                    ) : batches.length > 0 && (
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-dark mb-1">
                                Seleccionar Bobina (Lote) <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={selectedBatchCode}
                                onChange={handleBatchChange}
                                className="w-full px-4 py-2 rounded-lg border border-neutral/30 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm bg-white"
                                required
                                disabled={isSubmitting}
                            >
                                <option value="">-- Seleccionar --</option>
                                {batches.map(batch => (
                                    <option key={batch._id} value={batch.batchCode}>
                                        {batch.batchCode} ({batch.currentQuantity} {material.item.unit})
                                    </option>
                                ))}
                            </select>
                            <p className="text-xs text-blue-600 mt-1">
                                <i className="fa-solid fa-info-circle mr-1"></i>
                                Al devolver una bobina, se transfiere completa al almacén.
                            </p>
                        </div>
                    )}

                    {/* Quantity Input */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-dark mb-1">
                            Cantidad a Devolver <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <input
                                type="number"
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value)}
                                className="w-full px-4 py-2 pr-16 rounded-lg border border-neutral/30 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm"
                                placeholder="0"
                                min="0"
                                max={material.quantity}
                                step="any"
                                required
                                disabled={isSubmitting || (batches.length > 0 && !!selectedBatchCode)} // Disable quantity edit if batch is selected? Maybe allow edit to correct discrepancies, but technically you move the WHOLE bobbin. Let's allow edit but validate.
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-neutral">
                                {material.item.unit}
                            </span>
                        </div>
                        <p className="text-xs text-neutral mt-1">
                            Máximo: {batches.length > 0 && selectedBatchCode
                                ? batches.find(b => b.batchCode === selectedBatchCode)?.currentQuantity
                                : material.quantity} {material.item.unit}
                        </p>
                    </div>

                    {/* Reason Input */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-dark mb-1">
                            Motivo de Devolución <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="w-full px-4 py-2 rounded-lg border border-neutral/30 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm resize-none"
                            placeholder="Ej: Material no utilizado en instalación"
                            rows={3}
                            required
                            disabled={isSubmitting}
                        />
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-600 flex items-center gap-2">
                                <i className="fa-solid fa-triangle-exclamation"></i>
                                {error}
                            </p>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 text-sm font-medium text-dark bg-white border border-neutral/30 rounded-lg hover:bg-gray-50 transition-colors"
                            disabled={isSubmitting}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-600 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isSubmitting ? (
                                <>
                                    <i className="fa-solid fa-circle-notch fa-spin"></i>
                                    Devolviendo...
                                </>
                            ) : (
                                <>
                                    <i className="fa-solid fa-rotate-left"></i>
                                    Devolver Material
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ReturnMaterialModal;
