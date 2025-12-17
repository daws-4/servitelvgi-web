import React, { useState, useEffect } from "react";
import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
} from "@heroui/react";
import { FormInput } from "@/components/interactiveForms/Input";
import { FormSelect } from "@/components/interactiveForms/Select";
import { FormButton } from "@/components/interactiveForms/Button";
import { InventoryItem } from "./InventoryTable";

interface EditItemModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    item: InventoryItem | null;
}

const typeOptions = [
    { key: "material", label: "Material" },
    { key: "equipment", label: "Equipo" },
    { key: "tool", label: "Herramienta" },
];

const unitOptions = [
    { key: "unidades", label: "Unidades" },
    { key: "metros", label: "Metros" },
    { key: "kgs", label: "Kilogramos" },
    { key: "cajas", label: "Cajas" },
];

export const EditItemModal: React.FC<EditItemModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
    item,
}) => {
    const [formData, setFormData] = useState({
        description: "",
        type: "material",
        unit: "unidades",
        minimumStock: 5,
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (item) {
            setFormData({
                description: item.description,
                type: item.type,
                unit: item.unit,
                minimumStock: item.minimumStock,
            });
        }
    }, [item]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!item) return;

        setError("");

        if (!formData.description.trim()) {
            setError("La descripción es requerida");
            return;
        }

        setLoading(true);
        try {
            const response = await fetch("/api/web/inventory", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: item._id,
                    ...formData,
                }),
            });

            const data = await response.json();

            if (!data.success) {
                setError(data.error || "Error al actualizar el ítem");
                setLoading(false);
                return;
            }

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
            onClose();
        }
    };

    if (!item) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            size="lg"
            classNames={{
                base: "max-w-lg",
                backdrop: "bg-dark/50 backdrop-blur-sm",
            }}
        >
            <ModalContent>
                <form onSubmit={handleSubmit}>
                    <ModalHeader className="flex flex-col gap-1 border-b border-neutral/10 bg-gray-50">
                        <h3 className="text-lg font-bold text-dark">Editar Ítem</h3>
                        <p className="text-xs text-neutral font-normal">Código: {item.code}</p>
                    </ModalHeader>

                    <ModalBody className="py-6">
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
                                <i className="fa-solid fa-exclamation-circle mr-2"></i>
                                {error}
                            </div>
                        )}

                        <FormInput
                            label="Descripción"
                            placeholder="Ej: Cable UTP Cat6 Exterior"
                            value={formData.description}
                            onValueChange={(value) => setFormData({ ...formData, description: value })}
                            isRequired
                            autoFocus
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormSelect
                                label="Tipo"
                                options={typeOptions}
                                selectedKeys={[formData.type]}
                                onSelectionChange={(keys) => {
                                    const selected = Array.from(keys)[0] as string;
                                    setFormData({ ...formData, type: selected });
                                }}
                                isRequired
                            />

                            <FormSelect
                                label="Unidad de Medida"
                                options={unitOptions}
                                selectedKeys={[formData.unit]}
                                onSelectionChange={(keys) => {
                                    const selected = Array.from(keys)[0] as string;
                                    setFormData({ ...formData, unit: selected });
                                }}
                                isRequired
                            />
                        </div>

                        <FormInput
                            label="Stock Mínimo"
                            type="number"
                            value={formData.minimumStock.toString()}
                            onValueChange={(value) =>
                                setFormData({ ...formData, minimumStock: Number(value) })
                            }
                            isRequired
                        />

                        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg text-sm">
                            <i className="fa-solid fa-info-circle mr-2"></i>
                            El stock actual ({item.currentStock}) no se puede modificar aquí. Usa "Ingreso
                            Manual" o "Asignar a Cuadrilla" para ajustar cantidades.
                        </div>
                    </ModalBody>

                    <ModalFooter className="bg-gray-50 border-t border-neutral/10">
                        <FormButton
                            variant="secondary"
                            onPress={handleClose}
                            isDisabled={loading}
                        >
                            Cancelar
                        </FormButton>
                        <FormButton type="submit" isLoading={loading}>
                            Guardar Cambios
                        </FormButton>
                    </ModalFooter>
                </form>
            </ModalContent>
        </Modal>
    );
};

export default EditItemModal;
