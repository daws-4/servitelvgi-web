import React, { useState, useEffect } from "react";
import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
} from "@heroui/react";
import { FormInput } from "@/components/interactiveForms/Input";
import { FormButton } from "@/components/interactiveForms/Button";
import { FormSelect } from "@/components/interactiveForms/Select";

interface ManageInstancesModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    inventoryId: string;
    itemDescription: string;
}

interface EquipmentInstance {
    _id?: string;
    uniqueId: string;
    serialNumber?: string;
    macAddress?: string;
    status: string;
    assignedTo?: {
        crewId?: { _id: string; name: string };
        assignedAt?: Date;
    };
    installedAt?: {
        orderId?: string;
        installedDate?: Date;
        location?: string;
    };
    notes?: string;
    createdAt?: Date;
}

const statusLabels: Record<string, { label: string; color: string }> = {
    "in-stock": { label: "En Stock", color: "bg-green-100 text-green-700" },
    assigned: { label: "Asignado", color: "bg-blue-100 text-blue-700" },
    installed: { label: "Instalado", color: "bg-purple-100 text-purple-700" },
    damaged: { label: "Dañado", color: "bg-red-100 text-red-700" },
    retired: { label: "Retirado", color: "bg-gray-100 text-gray-700" },
};

const statusFilterOptions = [
    { key: "all", label: "Todos" },
    { key: "in-stock", label: "En Stock" },
    { key: "assigned", label: "Asignado" },
    { key: "installed", label: "Instalado" },
    { key: "damaged", label: "Dañado" },
    { key: "retired", label: "Retirado" },
];

export const ManageInstancesModal: React.FC<ManageInstancesModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
    inventoryId,
    itemDescription,
}) => {
    const [instances, setInstances] = useState<EquipmentInstance[]>([]);
    const [filteredInstances, setFilteredInstances] = useState<EquipmentInstance[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [showAddForm, setShowAddForm] = useState(false);

    const [newInstanceForm, setNewInstanceForm] = useState({
        uniqueId: "",
        serialNumber: "",
        macAddress: "",
        notes: "",
    });

    const fetchInstances = async () => {
        setLoading(true);
        try {
            const response = await fetch(
                `/api/web/inventory/instances?inventoryId=${inventoryId}`
            );
            const data = await response.json();

            if (data.success) {
                setInstances(data.instances || []);
            } else {
                setError(data.error || "Error al cargar instancias");
            }
        } catch (err) {
            setError("Error de conexión con el servidor");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchInstances();
        }
    }, [isOpen]);

    useEffect(() => {
        if (statusFilter === "all") {
            setFilteredInstances(instances);
        } else {
            setFilteredInstances(instances.filter((inst) => inst.status === statusFilter));
        }
    }, [instances, statusFilter]);

    const handleAddInstance = async () => {
        if (!newInstanceForm.uniqueId.trim()) {
            setError("El ID único es requerido");
            return;
        }

        setLoading(true);
        setError("");
        try {
            const response = await fetch("/api/web/inventory/instances", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    inventoryId,
                    instances: [newInstanceForm],
                }),
            });

            const data = await response.json();

            if (!data.success) {
                setError(data.error || "Error al añadir instancia");
                setLoading(false);
                return;
            }

            setNewInstanceForm({
                uniqueId: "",
                serialNumber: "",
                macAddress: "",
                notes: "",
            });
            setShowAddForm(false);
            fetchInstances();
            onSuccess();
        } catch (err) {
            setError("Error de conexión con el servidor");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteInstance = async (uniqueId: string) => {
        if (!confirm(`¿Eliminar la instancia ${uniqueId}?`)) return;

        setLoading(true);
        try {
            const response = await fetch(
                `/api/web/inventory/instances?inventoryId=${inventoryId}&uniqueId=${uniqueId}`,
                { method: "DELETE" }
            );

            const data = await response.json();

            if (data.success) {
                fetchInstances();
                onSuccess();
            } else {
                setError(data.error || "Error al eliminar instancia");
            }
        } catch (err) {
            setError("Error de conexión con el servidor");
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setShowAddForm(false);
        setNewInstanceForm({
            uniqueId: "",
            serialNumber: "",
            macAddress: "",
            notes: "",
        });
        setError("");
        onClose();
    };

    const stats = {
        total: instances.length,
        inStock: instances.filter((i) => i.status === "in-stock").length,
        assigned: instances.filter((i) => i.status === "assigned").length,
        installed: instances.filter((i) => i.status === "installed").length,
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            size="3xl"
            scrollBehavior="inside"
            classNames={{
                backdrop: "bg-dark/50 backdrop-blur-sm",
            }}
        >
            <ModalContent>
                <ModalHeader className="flex flex-col gap-2 border-b border-neutral/10 bg-gray-50">
                    <h3 className="text-lg font-bold text-dark">Gestionar Instancias</h3>
                    <p className="text-sm text-neutral font-normal">{itemDescription}</p>

                    {/* Estadísticas */}
                    <div className="flex gap-4 text-xs mt-2">
                        <span className="text-neutral">
                            Total: <strong className="text-dark">{stats.total}</strong>
                        </span>
                        <span className="text-green-600">
                            En Stock: <strong>{stats.inStock}</strong>
                        </span>
                        <span className="text-blue-600">
                            Asignadas: <strong>{stats.assigned}</strong>
                        </span>
                        <span className="text-purple-600">
                            Instaladas: <strong>{stats.installed}</strong>
                        </span>
                    </div>
                </ModalHeader>

                <ModalBody className="py-6">
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
                            <i className="fa-solid fa-exclamation-circle mr-2"></i>
                            {error}
                        </div>
                    )}

                    {/* Filtro y botón añadir */}
                    <div className="flex justify-between items-center mb-4">
                        <div className="w-48">
                            <FormSelect
                                label="Filtrar por estado"
                                options={statusFilterOptions}
                                selectedKeys={[statusFilter]}
                                onSelectionChange={(keys) => {
                                    const selected = Array.from(keys)[0] as string;
                                    setStatusFilter(selected);
                                }}
                                size="sm"
                            />
                        </div>
                        <FormButton
                            size="sm"
                            onPress={() => setShowAddForm(!showAddForm)}
                            isDisabled={loading}
                        >
                            <i className="fa-solid fa-plus mr-2"></i>
                            Añadir Instancia
                        </FormButton>
                    </div>

                    {/* Formulario de añadir */}
                    {showAddForm && (
                        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-4">
                            <h4 className="text-sm font-semibold text-dark mb-3">Nueva Instancia</h4>
                            <div className="grid grid-cols-2 gap-3 mb-3">
                                <FormInput
                                    label="ID Único *"
                                    placeholder="Ej: ONT-001"
                                    value={newInstanceForm.uniqueId}
                                    onValueChange={(value) =>
                                        setNewInstanceForm({ ...newInstanceForm, uniqueId: value })
                                    }
                                    size="sm"
                                />
                                <FormInput
                                    label="Número de Serie"
                                    placeholder="Opcional"
                                    value={newInstanceForm.serialNumber}
                                    onValueChange={(value) =>
                                        setNewInstanceForm({ ...newInstanceForm, serialNumber: value })
                                    }
                                    size="sm"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3 mb-3">
                                <FormInput
                                    label="MAC Address"
                                    placeholder="Opcional"
                                    value={newInstanceForm.macAddress}
                                    onValueChange={(value) =>
                                        setNewInstanceForm({ ...newInstanceForm, macAddress: value })
                                    }
                                    size="sm"
                                />
                                <FormInput
                                    label="Notas"
                                    placeholder="Opcional"
                                    value={newInstanceForm.notes}
                                    onValueChange={(value) =>
                                        setNewInstanceForm({ ...newInstanceForm, notes: value })
                                    }
                                    size="sm"
                                />
                            </div>
                            <div className="flex gap-2">
                                <FormButton
                                    size="sm"
                                    onPress={handleAddInstance}
                                    isLoading={loading}
                                >
                                    Guardar
                                </FormButton>
                                <FormButton
                                    size="sm"
                                    variant="secondary"
                                    onPress={() => setShowAddForm(false)}
                                >
                                    Cancelar
                                </FormButton>
                            </div>
                        </div>
                    )}

                    {/* Tabla de instancias */}
                    {loading && !showAddForm ? (
                        <div className="text-center py-8 text-neutral">
                            <i className="fa-solid fa-spinner fa-spin mr-2"></i>
                            Cargando instancias...
                        </div>
                    ) : filteredInstances.length === 0 ? (
                        <div className="text-center py-8 text-neutral">
                            <i className="fa-solid fa-inbox text-3xl mb-2"></i>
                            <p>No hay instancias {statusFilter !== "all" ? `con estado "${statusFilterOptions.find(o => o.key === statusFilter)?.label}"` : ""}</p>
                        </div>
                    ) : (
                        <div className="border rounded-lg overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-100 text-dark font-semibold">
                                    <tr>
                                        <th className="px-4 py-3 text-left">ID Único</th>
                                        <th className="px-4 py-3 text-left">Serial / MAC</th>
                                        <th className="px-4 py-3 text-left">Estado</th>
                                        <th className="px-4 py-3 text-left">Ubicación</th>
                                        <th className="px-4 py-3 text-center">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredInstances.map((inst) => (
                                        <tr key={inst.uniqueId} className="border-t hover:bg-gray-50">
                                            <td className="px-4 py-3 font-semibold text-dark">
                                                {inst.uniqueId}
                                            </td>
                                            <td className="px-4 py-3 text-neutral text-xs">
                                                {inst.serialNumber && <div>SN: {inst.serialNumber}</div>}
                                                {inst.macAddress && <div>MAC: {inst.macAddress}</div>}
                                                {!inst.serialNumber && !inst.macAddress && <span className="text-gray-400">-</span>}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-1 rounded text-xs font-medium ${statusLabels[inst.status].color}`}>
                                                    {statusLabels[inst.status].label}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-xs text-neutral">
                                                {inst.status === "assigned" && inst.assignedTo?.crewId && (
                                                    <div>Cuadrilla: {(inst.assignedTo.crewId as any).name}</div>
                                                )}
                                                {inst.status === "installed" && inst.installedAt?.location && (
                                                    <div className="truncate max-w-xs">{inst.installedAt.location}</div>
                                                )}
                                                {inst.status === "in-stock" && <span className="text-gray-400">Bodega</span>}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                {inst.status === "in-stock" && (
                                                    <button
                                                        onClick={() => handleDeleteInstance(inst.uniqueId)}
                                                        className="text-red-500 hover:text-red-700"
                                                        title="Eliminar"
                                                        disabled={loading}
                                                    >
                                                        <i className="fa-solid fa-trash"></i>
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </ModalBody>

                <ModalFooter className="bg-gray-50 border-t border-neutral/10">
                    <FormButton variant="secondary" onPress={handleClose}>
                        Cerrar
                    </FormButton>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

export default ManageInstancesModal;
