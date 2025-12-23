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

interface InstanceInput {
    uniqueId: string;
    serialNumber?: string;
    macAddress?: string;
    notes?: string;
}

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
    const [instances, setInstances] = useState<InstanceInput[]>([]);
    const [instanceForm, setInstanceForm] = useState<InstanceInput>({
        uniqueId: "",
        serialNumber: "",
        macAddress: "",
        notes: "",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleAddInstance = () => {
        if (!instanceForm.uniqueId.trim()) {
            setError("El ID único es requerido para añadir una instancia");
            return;
        }

        // Verificar que el uniqueId no esté duplicado
        if (instances.some((inst) => inst.uniqueId === instanceForm.uniqueId)) {
            setError("El ID único ya existe en las instancias añadidas");
            return;
        }

        setInstances([...instances, { ...instanceForm }]);
        setInstanceForm({
            uniqueId: "",
            serialNumber: "",
            macAddress: "",
            notes: "",
        });
        setError("");
    };

    const handleRemoveInstance = (uniqueId: string) => {
        setInstances(instances.filter((inst) => inst.uniqueId !== uniqueId));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!formData.code.trim() || !formData.description.trim()) {
            setError("Código y descripción son requeridos");
            return;
        }

        setLoading(true);
        try {
            const payload: any = { ...formData };

            // Añadir instancias solo si es equipo y tiene instancias
            if (formData.type === "equipment" && instances.length > 0) {
                payload.instances = instances;
            }

            const response = await fetch("/api/web/inventory", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
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
            setInstances([]);
            setInstanceForm({
                uniqueId: "",
                serialNumber: "",
                macAddress: "",
                notes: "",
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

    const isEquipment = formData.type === "equipment";

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            size="2xl"
            classNames={{
                base: "max-w-2xl",
                backdrop: "bg-dark/50 backdrop-blur-sm",
            }}
            scrollBehavior="inside"
        >
            <ModalContent>
                <form onSubmit={handleSubmit}>
                    <ModalHeader className="flex flex-col gap-1 border-b border-neutral/10 bg-gray-50">
                        <h3 className="text-lg font-bold text-dark">Crear Nuevo Ítem</h3>
                    </ModalHeader>

                    <ModalBody className="py-6 max-h-[70vh] overflow-y-auto">
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
                                    // Limpiar instancias si cambia de equipo a otro tipo
                                    if (selected !== "equipment") {
                                        setInstances([]);
                                    }
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

                        {!isEquipment && (
                            <FormInput
                                label="Stock Inicial"
                                type="number"
                                placeholder="0"
                                value={formData.currentStock.toString()}
                                onValueChange={(value) =>
                                    setFormData({ ...formData, currentStock: Number(value) })
                                }
                            />
                        )}

                        {/* Sección de Instancias para Equipos */}
                        {isEquipment && (
                            <div className="mt-6 border-t pt-6">
                                <h4 className="text-md font-semibold text-dark mb-4 flex items-center gap-2">
                                    <i className="fa-solid fa-microchip text-primary"></i>
                                    Instancias de Equipo (Opcional)
                                </h4>
                                <p className="text-sm text-neutral mb-4">
                                    Añade instancias individuales con ID único para trackear cada equipo.
                                </p>

                                {/* Formulario para añadir instancia */}
                                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                                    <div className="grid grid-cols-2 gap-3 mb-3">
                                        <FormInput
                                            label="ID Único *"
                                            placeholder="Ej: ONT-001"
                                            value={instanceForm.uniqueId}
                                            onValueChange={(value) =>
                                                setInstanceForm({ ...instanceForm, uniqueId: value })
                                            }
                                            size="sm"
                                        />
                                        <FormInput
                                            label="Número de Serie"
                                            placeholder="Opcional"
                                            value={instanceForm.serialNumber}
                                            onValueChange={(value) =>
                                                setInstanceForm({ ...instanceForm, serialNumber: value })
                                            }
                                            size="sm"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 mb-3">
                                        <FormInput
                                            label="MAC Address"
                                            placeholder="Opcional"
                                            value={instanceForm.macAddress}
                                            onValueChange={(value) =>
                                                setInstanceForm({ ...instanceForm, macAddress: value })
                                            }
                                            size="sm"
                                        />
                                        <FormInput
                                            label="Notas"
                                            placeholder="Opcional"
                                            value={instanceForm.notes}
                                            onValueChange={(value) =>
                                                setInstanceForm({ ...instanceForm, notes: value })
                                            }
                                            size="sm"
                                        />
                                    </div>
                                    <FormButton
                                        type="button"
                                        variant="secondary"
                                        size="sm"
                                        onPress={handleAddInstance}
                                        isDisabled={loading}
                                    >
                                        <i className="fa-solid fa-plus mr-2"></i>
                                        Añadir Instancia
                                    </FormButton>
                                </div>

                                {/* Lista de instancias añadidas */}
                                {instances.length > 0 && (
                                    <div className="border rounded-lg overflow-hidden">
                                        <div className="bg-gray-100 px-4 py-2 text-sm font-semibold text-dark flex justify-between">
                                            <span>Instancias Añadidas ({instances.length})</span>
                                        </div>
                                        <div className="max-h-48 overflow-y-auto">
                                            {instances.map((inst, idx) => (
                                                <div
                                                    key={inst.uniqueId}
                                                    className="px-4 py-3 border-b last:border-b-0 hover:bg-gray-50 flex justify-between items-start"
                                                >
                                                    <div className="flex-1">
                                                        <div className="font-semibold text-dark text-sm">
                                                            {inst.uniqueId}
                                                        </div>
                                                        <div className="text-xs text-neutral mt-1 space-y-0.5">
                                                            {inst.serialNumber && (
                                                                <div>SN: {inst.serialNumber}</div>
                                                            )}
                                                            {inst.macAddress && (
                                                                <div>MAC: {inst.macAddress}</div>
                                                            )}
                                                            {inst.notes && (
                                                                <div className="italic">{inst.notes}</div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveInstance(inst.uniqueId)}
                                                        className="text-red-500 hover:text-red-700 ml-2"
                                                        disabled={loading}
                                                    >
                                                        <i className="fa-solid fa-trash"></i>
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
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
