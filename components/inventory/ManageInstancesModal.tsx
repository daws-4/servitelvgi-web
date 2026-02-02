import React, { useState, useEffect, useRef } from "react";
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

    // Search and Scanner State
    const [searchQuery, setSearchQuery] = useState("");
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const scannerRef = useRef<any>(null);

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
        let result = instances;

        // Filter by status
        if (statusFilter !== "all") {
            result = result.filter((inst) => inst.status === statusFilter);
        }

        // Filter by search query
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            result = result.filter(
                (inst) =>
                    inst.uniqueId.toLowerCase().includes(query) ||
                    inst.serialNumber?.toLowerCase().includes(query) ||
                    inst.macAddress?.toLowerCase().includes(query)
            );
        }

        setFilteredInstances(result);
    }, [instances, statusFilter, searchQuery]);

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

    // Barcode Scanner Handlers
    const startScanner = async () => {
        setIsScannerOpen(true);

        // Dynamically import html5-qrcode
        const { Html5Qrcode } = await import('html5-qrcode');

        // Wait for next tick to ensure DOM is ready
        setTimeout(() => {
            const html5QrCode = new Html5Qrcode("barcode-reader-instance");
            scannerRef.current = html5QrCode;

            // Request permission explicitly first
            Html5Qrcode.getCameras().then((devices) => {
                if (devices && devices.length) {
                    return html5QrCode.start(
                        { facingMode: "environment" },
                        {
                            fps: 10,
                            qrbox: (viewfinderWidth, viewfinderHeight) => {
                                const minEdgePercentage = 0.7;
                                const minDimension = Math.min(viewfinderWidth, viewfinderHeight);
                                const boxSize = Math.floor(minDimension * minEdgePercentage);
                                return { width: boxSize, height: boxSize };
                            },
                            aspectRatio: 1.0
                        },
                        (decodedText) => {
                            setSearchQuery(decodedText);
                            stopScanner();
                        },
                        (errorMessage) => {
                            // ignore
                        }
                    );
                } else {
                    throw new Error("No se detectaron cámaras.");
                }
            }).catch((err: unknown) => {
                console.error("Unable to start scanner:", err);
                let errorMessage = "No se pudo iniciar la cámara.";
                if (!window.isSecureContext) {
                    errorMessage = "La cámara requiere HTTPS o localhost.";
                }
                setError(errorMessage);
                setIsScannerOpen(false);
            });
        }, 100);
    };

    const stopScanner = () => {
        if (scannerRef.current) {
            scannerRef.current.stop().then(() => {
                scannerRef.current = null;
                setIsScannerOpen(false);
            }).catch((err: unknown) => {
                console.error("Error stopping scanner:", err);
                setIsScannerOpen(false);
            });
        } else {
            setIsScannerOpen(false);
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
        stopScanner();
        setNewInstanceForm({
            uniqueId: "",
            serialNumber: "",
            macAddress: "",
            notes: "",
        });
        setSearchQuery("");
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
            placement="top"
            classNames={{
                backdrop: "bg-dark/50 backdrop-blur-sm",
            }}
        >
            <ModalContent>
                <ModalHeader className="flex flex-col gap-2 border-b border-neutral/10 bg-gray-50">
                    <h3 className="text-lg font-bold text-dark">Gestión de Instancias</h3>
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

                    {/* Buscador y Escáner */}
                    <div className="mb-4 flex gap-2">
                        <div className="flex-1 relative">
                            <FormInput
                                placeholder="Buscar por ID, Serie o MAC..."
                                value={searchQuery}
                                onValueChange={setSearchQuery}
                                startContent={<i className="fa-solid fa-search text-neutral/50"></i>}
                                size="sm"
                            />
                        </div>
                        <FormButton
                            size="sm"
                            onPress={isScannerOpen ? stopScanner : startScanner}
                            variant={isScannerOpen ? "flat" : "secondary"}
                            color={isScannerOpen ? "danger" : "default"}
                            className="w-12 px-0 min-w-12"
                            title={isScannerOpen ? "Detener cámara" : "Escanear código"}
                        >
                            <i className={`fa-solid ${isScannerOpen ? 'fa-stop' : 'fa-qrcode'}`}></i>
                        </FormButton>
                    </div>

                    {/* Contenedor del escáner - Modal Overlay */}
                    {isScannerOpen && (
                        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm">
                            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6 relative">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-bold text-dark">Escanear Código</h3>
                                    <button
                                        onClick={stopScanner}
                                        className="text-neutral hover:text-dark transition-colors"
                                    >
                                        <i className="fa-solid fa-times text-xl"></i>
                                    </button>
                                </div>

                                <div className="mb-4">
                                    <div id="barcode-reader-instance" className="w-full rounded-lg overflow-hidden border-2 border-blue-500 min-h-[300px] bg-black"></div>
                                </div>

                                <p className="text-xs text-neutral/70 text-center mb-2">
                                    Si el navegador solicita permiso de cámara, por favor acéptalo.
                                </p>
                                <p className="text-sm text-neutral text-center">
                                    Coloca el código dentro del cuadro para escanearlo
                                </p>
                            </div>
                        </div>
                    )}

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
                        <div className="border rounded-lg overflow-auto max-h-[60vh]">
                            <table className="w-full text-sm relative">
                                <thead className="bg-gray-100 text-dark font-semibold sticky top-0 z-10">
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
