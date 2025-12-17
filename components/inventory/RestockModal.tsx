import React, { useState, useEffect } from "react";
import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
} from "@heroui/react";
import { Autocomplete, AutocompleteItem } from "@heroui/react";
import { FormInput } from "@/components/interactiveForms/Input";
import { FormButton } from "@/components/interactiveForms/Button";

interface RestockItem {
    inventoryId: string;
    code: string;
    description: string;
    quantity: number;
}

interface RestockModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export const RestockModal: React.FC<RestockModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
}) => {
    const [reference, setReference] = useState("");
    const [items, setItems] = useState<RestockItem[]>([]);
    const [inventoryItems, setInventoryItems] = useState<any[]>([]);
    const [selectedItemId, setSelectedItemId] = useState("");
    const [quantity, setQuantity] = useState("");
    const [loading, setLoading] = useState(false);
    const [loadingItems, setLoadingItems] = useState(false);
    const [error, setError] = useState("");

    // Fetch inventory items for autocomplete
    useEffect(() => {
        if (isOpen) {
            fetchInventoryItems();
        }
    }, [isOpen]);

    const fetchInventoryItems = async () => {
        setLoadingItems(true);
        try {
            const response = await fetch("/api/web/inventory");
            const data = await response.json();
            if (data.success) {
                setInventoryItems(data.items || []);
            }
        } catch (err) {
            console.error("Error fetching inventory items:", err);
        } finally {
            setLoadingItems(false);
        }
    };

    const handleAddItem = () => {
        if (!selectedItemId || !quantity || Number(quantity) <= 0) {
            setError("Selecciona un ítem y cantidad válida");
            return;
        }

        const selectedItem = inventoryItems.find((item) => item._id === selectedItemId);
        if (!selectedItem) return;

        // Check if item already in list
        if (items.some((item) => item.inventoryId === selectedItemId)) {
            setError("Este ítem ya está en la lista");
            return;
        }

        setItems([
            ...items,
            {
                inventoryId: selectedItem._id,
                code: selectedItem.code,
                description: selectedItem.description,
                quantity: Number(quantity),
            },
        ]);

        // Reset selection
        setSelectedItemId("");
        setQuantity("");
        setError("");
    };

    const handleRemoveItem = (inventoryId: string) => {
        setItems(items.filter((item) => item.inventoryId !== inventoryId));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!reference.trim()) {
            setError("La referencia/documento es requerido");
            return;
        }

        if (items.length === 0) {
            setError("Debes agregar al menos un ítem");
            return;
        }

        setLoading(true);
        try {
            const response = await fetch("/api/web/inventory/movements", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "restock",
                    data: {
                        items: items.map((item) => ({
                            inventoryId: item.inventoryId,
                            quantity: item.quantity,
                        })),
                        reason: reference,
                    },
                }),
            });

            const data = await response.json();

            if (!data.success) {
                setError(data.error || "Error al procesar el reabastecimiento");
                setLoading(false);
                return;
            }

            // Reset form
            setReference("");
            setItems([]);
            onSuccess();
            onClose();
        } catch (err) {
            setError("Error de conexión con el servidor");
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        if (!loading) {
            setError("");
            setReference("");
            setItems([]);
            onClose();
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            size="2xl"
            scrollBehavior="inside"
            classNames={{
                base: "max-w-2xl",
                backdrop: "bg-dark/50 backdrop-blur-sm",
                wrapper: "overflow-hidden",
            }}
        >
            <ModalContent className="max-h-[80vh]">
                <form onSubmit={handleSubmit} className="flex flex-col h-full">
                    <ModalHeader className="flex-shrink-0 border-b border-neutral/10 bg-background/30">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-background rounded-lg text-secondary">
                                <i className="fa-solid fa-box-open"></i>
                            </div>
                            <h3 className="text-lg font-bold text-dark">Ingreso de Mercancía</h3>
                        </div>
                    </ModalHeader>

                    <ModalBody className="flex-1 overflow-y-auto py-6">
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
                                <i className="fa-solid fa-exclamation-circle mr-2"></i>
                                {error}
                            </div>
                        )}

                        {/* Document Reference */}
                        <FormInput
                            label="Referencia / Documento de Transporte"
                            placeholder="Ej: Orden de Entrega Netuno #9088"
                            value={reference}
                            onValueChange={setReference}
                            isRequired
                        />

                        {/* Add Item Section */}
                        <div className="bg-gray-50 p-4 rounded-lg border border-neutral/10">
                            <p className="text-sm font-bold text-secondary mb-3">
                                Agregar Ítem a la Lista
                            </p>
                            <div className="flex flex-col md:flex-row gap-3">
                                <div className="flex-1">
                                    <Autocomplete
                                        label="Buscar ítem"
                                        placeholder="Buscar por código o nombre..."
                                        selectedKey={selectedItemId}
                                        onSelectionChange={(key) => setSelectedItemId(key as string)}
                                        isLoading={loadingItems}
                                        variant="bordered"
                                        size="sm"
                                    >
                                        {inventoryItems.map((item) => (
                                            <AutocompleteItem key={item._id} textValue={item.description}>
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{item.description}</span>
                                                    <span className="text-xs text-neutral">{item.code}</span>
                                                </div>
                                            </AutocompleteItem>
                                        ))}
                                    </Autocomplete>
                                </div>
                                <div className="w-24">
                                    <FormInput
                                        type="number"
                                        placeholder="Cant."
                                        value={quantity}
                                        onValueChange={setQuantity}
                                        min="1"
                                        classNames={{
                                            inputWrapper: "h-10",
                                        }}
                                    />
                                </div>
                                <FormButton
                                    type="button"
                                    onPress={handleAddItem}
                                    variant="secondary"
                                    className="h-10"
                                >
                                    <i className="fa-solid fa-plus"></i>
                                </FormButton>
                            </div>
                        </div>

                        {/* Items List */}
                        <div>
                            <h4 className="text-sm font-bold text-dark mb-2">Ítems a Ingresar</h4>
                            {items.length === 0 ? (
                                <div className="border border-neutral/20 rounded-lg p-8 text-center">
                                    <i className="fa-solid fa-inbox text-4xl text-neutral/30 mb-2"></i>
                                    <p className="text-neutral text-sm">No hay ítems agregados</p>
                                </div>
                            ) : (
                                <div className="border border-neutral/20 rounded-lg overflow-hidden">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-gray-100 text-neutral text-xs uppercase">
                                            <tr>
                                                <th className="px-4 py-2">Ítem</th>
                                                <th className="px-4 py-2 text-right">Cantidad</th>
                                                <th className="px-4 py-2"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-neutral/10">
                                            {items.map((item) => (
                                                <tr key={item.inventoryId}>
                                                    <td className="px-4 py-3">
                                                        <div className="font-medium">{item.description}</div>
                                                        <div className="text-xs text-neutral">{item.code}</div>
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-bold text-green-600">
                                                        +{item.quantity}
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveItem(item.inventoryId)}
                                                            className="text-neutral hover:text-red-500 transition-colors cursor-pointer"
                                                        >
                                                            <i className="fa-solid fa-trash"></i>
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </ModalBody>

                    <ModalFooter className="flex-shrink-0 bg-gray-50 border-t border-neutral/10 flex justify-between items-center">
                        <div className="text-xs text-neutral">
                            Total ítems: {items.length}
                        </div>
                        <div className="flex gap-3">
                            <FormButton
                                variant="secondary"
                                onPress={handleClose}
                                isDisabled={loading}
                            >
                                Cancelar
                            </FormButton>
                            <FormButton type="submit" isLoading={loading}>
                                Confirmar Recepción
                            </FormButton>
                        </div>
                    </ModalFooter>
                </form>
            </ModalContent>
        </Modal>
    );
};

export default RestockModal;
