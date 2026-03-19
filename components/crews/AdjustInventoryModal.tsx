"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";

interface InventoryItem {
    item: {
        _id: string;
        code: string;
        description: string;
        unit: string;
        type?: string;
    };
    quantity: number;
}

interface BatchOption {
    _id: string;
    batchCode: string;
    currentQuantity: number;
}

interface AdjustInventoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    crewId: string;
    material: InventoryItem | null;
    onSuccess: () => void;
}

export const AdjustInventoryModal: React.FC<AdjustInventoryModalProps> = ({
    isOpen,
    onClose,
    crewId,
    material,
    onSuccess,
}) => {
    const [newQuantity, setNewQuantity] = useState<string>("");
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
            setNewQuantity(material.quantity.toString());
            setReason("");
            setError(null);
            setBatches([]);
            setSelectedBatchCode("");

            fetchBatches(material.item._id);
        }
    }, [isOpen, material, crewId]);

    const fetchBatches = async (itemId: string) => {
        try {
            setLoadingBatches(true);
            const response = await axios.get(`/api/web/inventory/batches`, {
                params: {
                    crewId: crewId,
                    itemId: itemId,
                },
            });

            const crewBatches = response.data.filter(
                (b: any) =>
                    b.location === "crew" &&
                    (b.crew?._id === crewId || b.crew === crewId)
            );

            setBatches(crewBatches);
        } catch (err) {
            console.error("Error fetching batches:", err);
        } finally {
            setLoadingBatches(false);
        }
    };

    if (!isOpen || !material) return null;

    const quantityNum = parseFloat(newQuantity) || 0;
    // When a batch is selected, the "current" quantity is the batch's quantity, not the total
    const selectedBatch = selectedBatchCode
        ? batches.find((b) => b.batchCode === selectedBatchCode)
        : null;
    const currentQty = selectedBatch ? selectedBatch.currentQuantity : material.quantity;
    const diff = quantityNum - currentQty;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (quantityNum < 0) {
            setError("La cantidad no puede ser negativa");
            return;
        }

        if (quantityNum === currentQty) {
            setError("La cantidad nueva es igual a la actual");
            return;
        }

        if (!reason.trim()) {
            setError("Debe ingresar un motivo para el ajuste");
            return;
        }

        // If batches exist and quantity is per-bobbin, require selection
        if (batches.length > 0 && !selectedBatchCode) {
            setError(
                "Este material se maneja por Bobinas. Debe seleccionar la bobina a ajustar."
            );
            return;
        }

        try {
            setIsSubmitting(true);

            await axios.post("/api/web/inventory/movements", {
                action: "adjust",
                data: {
                    crewId,
                    inventoryId: material.item._id,
                    // When a batch is selected, compute the new TOTAL for the crew:
                    //   totalActual + (nuevaCantidadBobina - cantidadActualBobina)
                    newQuantity: selectedBatch
                        ? material.quantity + (quantityNum - selectedBatch.currentQuantity)
                        : quantityNum,
                    reason: reason.trim(),
                    batchCode: selectedBatchCode || undefined,
                },
            });

            alert("Ajuste aplicado correctamente");
            onSuccess();
            onClose();
        } catch (err: any) {
            console.error("Error adjusting inventory:", err);
            setError(
                err.response?.data?.error ||
                "Error al aplicar el ajuste. Intente nuevamente."
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    // When batch is selected, update quantity to batch's current quantity
    const handleBatchChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const code = e.target.value;
        setSelectedBatchCode(code);
        if (code) {
            const batch = batches.find((b) => b.batchCode === code);
            if (batch) {
                setNewQuantity(batch.currentQuantity.toString());
            }
        } else {
            setNewQuantity(material.quantity.toString());
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-neutral/10">
                    <div className="flex items-center gap-2">
                        <i className="fa-solid fa-wrench text-amber-600 text-xl"></i>
                        <h3 className="text-xl font-bold text-dark">
                            Ajustar Inventario
                        </h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-neutral hover:text-dark transition-colors cursor-pointer"
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
                                <p className="text-xs text-neutral mb-1">
                                    Material
                                </p>
                                <p className="font-mono font-semibold text-dark">
                                    {material.item.code}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-neutral mb-1">
                                    {selectedBatch ? `Bobina ${selectedBatchCode}` : "Cantidad Actual"}
                                </p>
                                <p className="font-semibold text-dark">
                                    {currentQty} {material.item.unit}
                                </p>
                                {selectedBatch && (
                                    <p className="text-xs text-neutral mt-0.5">
                                        Total cuadrilla: {material.quantity} {material.item.unit}
                                    </p>
                                )}
                            </div>
                        </div>
                        <p className="text-sm text-dark">
                            {material.item.description}
                        </p>
                    </div>

                    {/* Warning */}
                    <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <p className="text-xs text-amber-700 flex items-start gap-2">
                            <i className="fa-solid fa-triangle-exclamation mt-0.5"></i>
                            <span>
                                Los ajustes son correcciones contables. No
                                mueven material físicamente al/del almacén. Use
                                esta función solo para corregir discrepancias.
                            </span>
                        </p>
                    </div>

                    {/* Batch Selection (if available) */}
                    {loadingBatches ? (
                        <div className="mb-4 text-center text-sm text-neutral">
                            <i className="fa-solid fa-circle-notch fa-spin mr-2"></i>
                            Buscando bobinas...
                        </div>
                    ) : (
                        batches.length > 0 && (
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-dark mb-1">
                                    Seleccionar Bobina{" "}
                                    <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={selectedBatchCode}
                                    onChange={handleBatchChange}
                                    className="w-full px-4 py-2 rounded-lg border border-neutral/30 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm bg-white"
                                    required
                                    disabled={isSubmitting}
                                >
                                    <option value="">-- Seleccionar --</option>
                                    {batches.map((batch) => (
                                        <option
                                            key={batch._id}
                                            value={batch.batchCode}
                                        >
                                            {batch.batchCode} (
                                            {batch.currentQuantity}{" "}
                                            {material.item.unit})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )
                    )}

                    {/* New Quantity Input */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-dark mb-1">
                            Nueva Cantidad{" "}
                            <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <input
                                type="number"
                                value={newQuantity}
                                onChange={(e) => setNewQuantity(e.target.value)}
                                className={`w-full px-4 py-2 pr-16 rounded-lg border border-neutral/30 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm ${
                                    batches.length > 0 && !selectedBatchCode ? "bg-gray-100 cursor-not-allowed" : ""
                                }`}
                                placeholder="0"
                                min="0"
                                step="any"
                                required
                                disabled={isSubmitting || (batches.length > 0 && !selectedBatchCode)}
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-neutral">
                                {material.item.unit}
                            </span>
                        </div>
                        {batches.length > 0 && !selectedBatchCode && (
                            <p className="text-xs text-amber-600 mt-1">
                                <i className="fa-solid fa-info-circle mr-1"></i>
                                Seleccione una bobina primero para poder ajustar la cantidad.
                            </p>
                        )}

                        {/* Change indicator */}
                        {diff !== 0 && !isNaN(diff) && (
                            <div
                                className={`mt-2 p-2 rounded-lg text-sm font-medium flex items-center gap-2 ${
                                    diff > 0
                                        ? "bg-green-50 text-green-700 border border-green-200"
                                        : "bg-red-50 text-red-700 border border-red-200"
                                }`}
                            >
                                <i
                                    className={`fa-solid ${
                                        diff > 0
                                            ? "fa-arrow-up"
                                            : "fa-arrow-down"
                                    }`}
                                ></i>
                                {diff > 0 ? "+" : ""}
                                {diff} {material.item.unit} (
                                {currentQty} → {quantityNum})
                            </div>
                        )}
                    </div>

                    {/* Reason Input */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-dark mb-1">
                            Motivo del Ajuste{" "}
                            <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="w-full px-4 py-2 rounded-lg border border-neutral/30 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm resize-none"
                            placeholder="Ej: Corrección por discrepancia en orden eliminada"
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
                            className="flex-1 px-4 py-2 text-sm font-medium text-dark bg-white border border-neutral/30 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                            disabled={isSubmitting}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting || diff === 0}
                            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                        >
                            {isSubmitting ? (
                                <>
                                    <i className="fa-solid fa-circle-notch fa-spin"></i>
                                    Aplicando...
                                </>
                            ) : (
                                <>
                                    <i className="fa-solid fa-wrench"></i>
                                    Aplicar Ajuste
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AdjustInventoryModal;
