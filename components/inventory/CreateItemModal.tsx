import React, { useState } from "react";
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

interface CreateItemModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
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

export const CreateItemModal: React.FC<CreateItemModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
}) => {
    const [formData, setFormData] = useState({
        code: "",
        type: "material",
        description: "",
        unit: "unidades",
        minimumStock: 5,
        currentStock: 0,
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!formData.code.trim() || !formData.description.trim()) {
            setError("Código y descripción son requeridos");
            return;
        }

        setLoading(true);
        try {
            const response = await fetch("/api/web/inventory", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (!data.success) {
                setError(data.error || "Error al crear el ítem");
                setLoading(false);
                return;
            }

            // Reset form and close
            setFormData({
                code: "",
                type: "material",
                description: "",
                unit: "unidades",
                minimumStock: 5,
                currentStock: 0,
            });
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
                        <h3 className="text-lg font-bold text-dark">Crear Nuevo Ítem</h3>
                    </ModalHeader>

                    <ModalBody className="py-6">
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
                                <i className="fa-solid fa-exclamation-circle mr-2"></i>
                                {error}
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <FormInput
                                label="Código"
                                placeholder="Ej: MAT-001"
                                value={formData.code}
                                onValueChange={(value) => setFormData({ ...formData, code: value })}
                                isRequired
                                autoFocus
                            />

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
                        </div>

                        <FormInput
                            label="Descripción"
                            placeholder="Ej: Cable UTP Cat6 Exterior"
                            value={formData.description}
                            onValueChange={(value) => setFormData({ ...formData, description: value })}
                            isRequired
                        />

                        <div className="grid grid-cols-2 gap-4">
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

                            <FormInput
                                label="Stock Mínimo"
                                type="number"
                                value={formData.minimumStock.toString()}
                                onValueChange={(value) =>
                                    setFormData({ ...formData, minimumStock: Number(value) })
                                }
                                isRequired
                            />
                        </div>

                        <FormInput
                            label="Stock Inicial"
                            type="number"
                            placeholder="0"
                            value={formData.currentStock.toString()}
                            onValueChange={(value) =>
                                setFormData({ ...formData, currentStock: Number(value) })
                            }
                        />
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
                            Crear Ítem
                        </FormButton>
                    </ModalFooter>
                </form>
            </ModalContent>
        </Modal>
    );
};

export default CreateItemModal;
