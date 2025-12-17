"use client";

import React, { useState } from "react";
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

    // Reset form when modal opens/closes or material changes
    React.useEffect(() => {
        if (isOpen && material) {
            setQuantity("");
            setReason("");
            setError(null);
        }
    }, [isOpen, material]);

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

        if (quantityNum > material.quantity) {
            setError(
                `La cantidad no puede ser mayor a ${material.quantity} ${material.item.unit}`
            );
            return;
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
                                <p className="text-xs text-neutral mb-1">Disponible</p>
                                <p className="font-semibold text-dark">
                                    {material.quantity} {material.item.unit}
                                </p>
                            </div>
                        </div>
                        <p className="text-sm text-dark">{material.item.description}</p>
                    </div>

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
                                disabled={isSubmitting}
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-neutral">
                                {material.item.unit}
                            </span>
                        </div>
                        <p className="text-xs text-neutral mt-1">
                            Máximo: {material.quantity} {material.item.unit}
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
