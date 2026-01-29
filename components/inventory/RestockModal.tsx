import React, { useState, useEffect, useRef } from "react";
import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Tabs,
    Tab,
    Autocomplete,
    AutocompleteItem,
    Input,
} from "@heroui/react";
import { FormInput } from "@/components/interactiveForms/Input";
import { FormButton } from "@/components/interactiveForms/Button";

interface RestockItem {
    inventoryId: string;
    code: string;
    description: string;
    quantity: number;
}

interface Bobbin {
    _id: string;
    batchCode: string;
    item: {
        _id: string;
        code: string;
        description: string;
    };
    currentQuantity: number;
    status: string;
}

interface EquipmentInstance {
    uniqueId: string;
    serialNumber?: string;
    macAddress?: string;
    notes?: string;
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
    // Manual Entry State
    const [reference, setReference] = useState("");
    const [items, setItems] = useState<RestockItem[]>([]);
    const [inventoryItems, setInventoryItems] = useState<any[]>([]);
    const [selectedItemId, setSelectedItemId] = useState("");
    const [quantity, setQuantity] = useState("");

    // Bobbin Management State
    const [bobbins, setBobbins] = useState<Bobbin[]>([]);
    const [newBobbinCode, setNewBobbinCode] = useState("");
    const [newBobbinItemId, setNewBobbinItemId] = useState("");
    const [newBobbinMeters, setNewBobbinMeters] = useState("");
    const [selectedBobbinId, setSelectedBobbinId] = useState("");
    const [metersToAdd, setMetersToAdd] = useState("");

    // Edit bobbin state
    const [editingBobbin, setEditingBobbin] = useState<{
        id: string;
        batchCode: string;
        itemId: string;
        meters: string;
    } | null>(null);

    // Equipment Management State
    const [selectedEquipmentTypeId, setSelectedEquipmentTypeId] = useState("");
    const [equipmentInstances, setEquipmentInstances] = useState<EquipmentInstance[]>([]);
    const [instanceForm, setInstanceForm] = useState<EquipmentInstance>({
        uniqueId: "",
        serialNumber: "",
        macAddress: "",
        notes: "",
    });

    // Barcode Scanner State
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const scannerRef = useRef<any>(null);

    // Shared State
    const [activeTab, setActiveTab] = useState<string>("manual");
    const [loading, setLoading] = useState(false);
    const [loadingItems, setLoadingItems] = useState(false);
    const [loadingBobbins, setLoadingBobbins] = useState(false);
    const [error, setError] = useState("");

    // Fetch inventory items for autocomplete
    useEffect(() => {
        if (isOpen) {
            fetchInventoryItems();
            if (activeTab === "bobbins") {
                fetchBobbins();
            }
        }
    }, [isOpen, activeTab]);

    // Filter items by type
    const regularMaterials = inventoryItems.filter(item => item.type !== "equipment");
    const equipmentTypes = inventoryItems.filter(item => item.type === "equipment");

    // Debug: Log equipment types
    console.log('🔍 Total inventoryItems:', inventoryItems.length);
    console.log('🔍 Equipment items found:', equipmentTypes.length, equipmentTypes);

    const fetchInventoryItems = async () => {
        setLoadingItems(true);
        try {
            // Fetch all items without pagination by setting a high limit
            const response = await fetch("/api/web/inventory?limit=9999");
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

    const fetchBobbins = async () => {
        setLoadingBobbins(true);
        try {
            const response = await fetch("/api/web/inventory/batches?status=active");
            const data = await response.json();
            setBobbins(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Error fetching bobbins:", err);
            setBobbins([]);
        } finally {
            setLoadingBobbins(false);
        }
    };

    // Manual Entry Handlers
    const handleAddItem = () => {
        if (!selectedItemId || !quantity || Number(quantity) <= 0) {
            setError("Selecciona un ítem y cantidad válida");
            return;
        }

        const selectedItem = inventoryItems.find((item) => item._id === selectedItemId);
        if (!selectedItem) return;

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

        setSelectedItemId("");
        setQuantity("");
        setError("");
    };

    const handleRemoveItem = (inventoryId: string) => {
        setItems(items.filter((item) => item.inventoryId !== inventoryId));
    };

    const handleSubmitManual = async (e: React.FormEvent) => {
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

    // Bobbin Management Handlers
    const handleCreateBobbin = async () => {
        if (!newBobbinCode || !newBobbinItemId || !newBobbinMeters || Number(newBobbinMeters) <= 0) {
            setError("Completa todos los campos para crear la bobina");
            return;
        }

        setLoading(true);
        setError("");
        try {
            const response = await fetch("/api/web/inventory/batches", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    batchCode: newBobbinCode,
                    inventoryId: newBobbinItemId,
                    initialQuantity: Number(newBobbinMeters),
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setNewBobbinCode("");
                setNewBobbinItemId("");
                setNewBobbinMeters("");
                fetchBobbins();
                onSuccess();
            } else {
                setError(data.message || "Error al crear bobina");
            }
        } catch (err) {
            setError("Error de conexión con el servidor");
        } finally {
            setLoading(false);
        }
    };

    const handleAssignMeters = async () => {
        if (!selectedBobbinId || !metersToAdd || Number(metersToAdd) <= 0) {
            setError("Selecciona una bobina y cantidad de metros válida");
            return;
        }

        const bobbin = bobbins.find(b => b._id === selectedBobbinId);
        if (!bobbin) return;

        setLoading(true);
        setError("");
        try {
            const response = await fetch("/api/web/inventory/batches", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    batchCode: bobbin.batchCode,
                    metersToAdd: Number(metersToAdd),
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setSelectedBobbinId("");
                setMetersToAdd("");
                fetchBobbins();
                onSuccess();
            } else {
                setError(data.message || "Error al asignar metros");
            }
        } catch (err) {
            setError("Error de conexión con el servidor");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteBobbin = async (batchCode: string) => {
        if (!confirm(`¿Estás seguro de que deseas eliminar la bobina ${batchCode}? Esta acción no se puede deshacer.`)) {
            return;
        }

        setLoading(true);
        setError("");
        try {
            const response = await fetch(`/api/web/inventory/batches?batchCode=${batchCode}`, {
                method: "DELETE",
            });

            const data = await response.json();

            if (response.ok) {
                fetchBobbins();
                onSuccess();
            } else {
                setError(data.message || "Error al eliminar bobina");
            }
        } catch (err) {
            setError("Error de conexión con el servidor");
        } finally {
            setLoading(false);
        }
    };

    // Start editing a bobbin
    const handleEditBobbin = (bobbin: Bobbin) => {
        setEditingBobbin({
            id: bobbin._id,
            batchCode: bobbin.batchCode,
            itemId: typeof bobbin.item === 'object' && bobbin.item !== null ? bobbin.item._id : bobbin.item || "",
            meters: bobbin.currentQuantity.toString()
        });
    };

    // Save edited bobbin
    const handleSaveEditBobbin = async () => {
        if (!editingBobbin) return;

        setLoading(true);
        setError("");
        try {
            const response = await fetch(`/api/web/inventory/batches/update`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    batchCode: editingBobbin.batchCode,
                    itemId: editingBobbin.itemId,
                    currentQuantity: Number(editingBobbin.meters)
                })
            });

            const data = await response.json();

            if (response.ok) {
                fetchBobbins();
                onSuccess();
                setEditingBobbin(null);
            } else {
                setError(data.message || "Error al actualizar bobina");
            }
        } catch (err) {
            setError("Error de conexión con el servidor");
        } finally {
            setLoading(false);
        }
    };

    // Equipment Handlers
    const handleAddInstance = () => {
        if (!instanceForm.uniqueId.trim()) {
            setError("El ID único es requerido");
            return;
        }

        if (equipmentInstances.some(inst => inst.uniqueId === instanceForm.uniqueId)) {
            setError("Este ID único ya existe en la lista");
            return;
        }

        setEquipmentInstances([...equipmentInstances, { ...instanceForm }]);
        setInstanceForm({
            uniqueId: "",
            serialNumber: "",
            macAddress: "",
            notes: "",
        });
        setError("");
    };

    const handleRemoveInstance = (uniqueId: string) => {
        setEquipmentInstances(equipmentInstances.filter(inst => inst.uniqueId !== uniqueId));
    };

    const handleSubmitEquipment = async () => {
        if (!selectedEquipmentTypeId) {
            setError("Selecciona un tipo de equipo");
            return;
        }

        if (equipmentInstances.length === 0) {
            setError("Debes agregar al menos una instancia");
            return;
        }

        setLoading(true);
        setError("");
        try {
            const response = await fetch("/api/web/inventory/instances", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    inventoryId: selectedEquipmentTypeId,
                    instances: equipmentInstances,
                }),
            });

            const data = await response.json();

            if (!data.success) {
                setError(data.error || "Error al agregar instancias");
                setLoading(false);
                return;
            }

            setSelectedEquipmentTypeId("");
            setEquipmentInstances([]);
            onSuccess();
            alert(`${equipmentInstances.length} instancia(s) agregada(s) exitosamente`);
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
            const html5QrCode = new Html5Qrcode("barcode-reader");
            scannerRef.current = html5QrCode;

            // Request permission explicitly first to ensure browser prompting
            Html5Qrcode.getCameras().then((devices) => {
                if (devices && devices.length) {
                    // Cameras exist, try to start
                    return html5QrCode.start(
                        { facingMode: "environment" }, // Use back camera
                        {
                            fps: 10,
                            qrbox: (viewfinderWidth, viewfinderHeight) => {
                                // Responsive qrbox: 70% of the smallest dimension
                                const minEdgePercentage = 0.7;
                                const minDimension = Math.min(viewfinderWidth, viewfinderHeight);
                                const boxSize = Math.floor(minDimension * minEdgePercentage);
                                return { width: boxSize, height: boxSize };
                            },
                            aspectRatio: 1.0
                        },
                        (decodedText) => {
                            // On success
                            setInstanceForm(prev => ({
                                ...prev,
                                uniqueId: decodedText
                            }));
                            stopScanner();
                        },
                        (errorMessage) => {
                            // On error (scan failed) - ignore
                        }
                    );
                } else {
                    throw new Error("No se detectaron cámaras en el dispositivo.");
                }
            }).catch((err: unknown) => {
                console.error("Unable to start scanner:", err);

                let errorMessage = "No se pudo iniciar la cámara.";
                if (!window.isSecureContext) {
                    errorMessage = "La cámara requiere una conexión segura (HTTPS) o localhost.";
                } else if (err instanceof Error) {
                    if (err.message.includes("Camera streaming not supported")) {
                        errorMessage = "El navegador no soporta streaming de cámara o faltan permisos.";
                    } else if (err.message.includes("Permission denied")) {
                        errorMessage = "Permiso de cámara denegado.";
                    }
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

    const handleClose = () => {
        if (!loading) {
            setError("");
            setReference("");
            setItems([]);
            setNewBobbinCode("");
            setNewBobbinItemId("");
            setNewBobbinMeters("");
            setSelectedBobbinId("");
            setMetersToAdd("");
            setSelectedEquipmentTypeId("");
            setEquipmentInstances([]);
            setInstanceForm({
                uniqueId: "",
                serialNumber: "",
                macAddress: "",
                notes: "",
            });
            onClose();
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            size="3xl"
            scrollBehavior="inside"
            placement="top"
            classNames={{
                base: "max-w-4xl",
                backdrop: "bg-dark/50 backdrop-blur-sm",
                wrapper: "overflow-hidden",
            }}
        >
            <ModalContent className="max-h-[85vh]">
                <ModalHeader className="flex-shrink-0 border-b border-neutral/10 bg-background/30">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-background rounded-lg text-secondary">
                            <i className="fa-solid fa-box-open"></i>
                        </div>
                        <h3 className="text-lg font-bold text-dark">Gestión de Inventario</h3>
                    </div>
                </ModalHeader>

                <ModalBody className="flex-1 overflow-y-auto py-6">
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
                            <i className="fa-solid fa-exclamation-circle mr-2"></i>
                            {error}
                        </div>
                    )}

                    <Tabs
                        selectedKey={activeTab}
                        onSelectionChange={(key) => setActiveTab(key as string)}
                        classNames={{
                            tabList: "gap-6 w-full relative rounded-none p-0 border-b border-divider",
                            cursor: "w-full bg-primary",
                            tab: "max-w-fit px-0 h-12",
                        }}
                    >
                        {/* Manual Entry Tab */}
                        <Tab
                            key="manual"
                            title={
                                <div className="flex items-center gap-2">
                                    <i className="fa-solid fa-hand-holding-box"></i>
                                    <span>Ingreso Manual</span>
                                </div>
                            }
                        >
                            <form onSubmit={handleSubmitManual} className="flex flex-col gap-4 mt-4">
                                <FormInput
                                    label="Referencia / Documento de Transporte"
                                    placeholder="Ej: Orden de Entrega Netuno #9088"
                                    value={reference}
                                    onValueChange={setReference}
                                    isRequired
                                />

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
                                                {regularMaterials.map((item) => (
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

                                <div className="flex gap-3 justify-end">
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
                            </form>
                        </Tab>

                        {/* Bobbin Management Tab */}
                        <Tab
                            key="bobbins"
                            title={
                                <div className="flex items-center gap-2">
                                    <i className="fa-solid fa-tape"></i>
                                    <span>Gestión de Bobinas</span>
                                </div>
                            }
                        >
                            <div className="flex flex-col gap-6 mt-4">
                                {/* Create New Bobbin */}
                                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                    <h4 className="text-sm font-bold text-dark mb-3 flex items-center gap-2">
                                        <i className="fa-solid fa-plus-circle text-primary"></i>
                                        Crear Nueva Bobina
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                        <Input
                                            label="Código de Bobina"
                                            placeholder="Ej: BOB-001"
                                            value={newBobbinCode}
                                            onValueChange={setNewBobbinCode}
                                            size="md"
                                            variant="bordered"
                                            labelPlacement="outside"
                                            classNames={{
                                                inputWrapper: "border-neutral/50 hover:border-primary data-[focus=true]:border-neutral"
                                            }}
                                        />
                                        <div>
                                            <Autocomplete
                                                labelPlacement="outside"
                                                label="Ítem de Cable"
                                                placeholder="Seleccionar cable..."
                                                selectedKey={newBobbinItemId}
                                                onSelectionChange={(key) => setNewBobbinItemId(key as string)}
                                                isLoading={loadingItems}
                                                variant="bordered"
                                                size="md"
                                            >
                                                {inventoryItems.filter(item => item.type === 'material' && item.unit === 'metros').map((item) => (
                                                    <AutocompleteItem key={item._id} textValue={item.description}>
                                                        <div className="flex flex-col">
                                                            <span className="font-medium">{item.description}</span>
                                                            <span className="text-xs text-neutral">{item.code}</span>
                                                        </div>
                                                    </AutocompleteItem>
                                                ))}
                                            </Autocomplete>
                                        </div>
                                        <div className="flex gap-2">
                                            <Input
                                                type="number"
                                                label="Metros"
                                                placeholder="Cantidad"
                                                value={newBobbinMeters}
                                                onValueChange={setNewBobbinMeters}
                                                min="1"
                                                size="md"
                                                variant="bordered"
                                                labelPlacement="outside"
                                                classNames={{
                                                    inputWrapper: "border-neutral/50 hover:border-primary data-[focus=true]:border-neutral"
                                                }}
                                            />
                                            <FormButton
                                                onPress={handleCreateBobbin}
                                                isLoading={loading}
                                                className="self-end"
                                            >
                                                Crear
                                            </FormButton>
                                        </div>
                                    </div>
                                </div>

                                {/* Assign Meters to Existing Bobbin */}
                                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                                    <h4 className="text-sm font-bold text-dark mb-3 flex items-center gap-2">
                                        <i className="fa-solid fa-arrow-up text-success"></i>
                                        Asignar Metros a Bobina Existente
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                        <div className="md:col-span-2">
                                            <Autocomplete
                                                label="Bobina"
                                                placeholder="Seleccionar bobina..."
                                                selectedKey={selectedBobbinId}
                                                onSelectionChange={(key) => setSelectedBobbinId(key as string)}
                                                isLoading={loadingBobbins}
                                                variant="bordered"
                                                size="md"
                                                labelPlacement="outside"
                                            >
                                                {bobbins.filter(bobbin => bobbin.item).map((bobbin) => (
                                                    <AutocompleteItem key={bobbin._id} textValue={bobbin.batchCode}>
                                                        <div className="flex flex-col">
                                                            <span className="font-medium">{bobbin.batchCode}</span>
                                                            <span className="text-xs text-neutral">
                                                                {bobbin.item?.description || 'Item no disponible'} - {bobbin.currentQuantity}m disponibles
                                                            </span>
                                                        </div>
                                                    </AutocompleteItem>
                                                ))}
                                            </Autocomplete>
                                        </div>
                                        <div className="flex gap-2">
                                            <FormInput
                                                type="number"
                                                label="Metros a Añadir"
                                                placeholder="Cantidad"
                                                value={metersToAdd}
                                                onValueChange={setMetersToAdd}
                                                min="1"
                                            />
                                            <FormButton
                                                onPress={handleAssignMeters}
                                                isLoading={loading}
                                                variant="secondary"
                                                className="self-end"
                                            >
                                                Asignar
                                            </FormButton>
                                        </div>
                                    </div>
                                </div>

                                {/* Bobbins List */}
                                <div>
                                    <h4 className="text-sm font-bold text-dark mb-3">Bobinas Activas</h4>
                                    {loadingBobbins ? (
                                        <div className="flex items-center justify-center py-8">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                        </div>
                                    ) : bobbins.length === 0 ? (
                                        <div className="border border-neutral/20 rounded-lg p-8 text-center">
                                            <i className="fa-solid fa-tape text-4xl text-neutral/30 mb-2"></i>
                                            <p className="text-neutral text-sm">No hay bobinas activas</p>
                                        </div>
                                    ) : (
                                        <div className="border border-neutral/20 rounded-lg overflow-hidden">
                                            <table className="w-full text-sm text-left">
                                                <thead className="bg-gray-100 text-neutral text-xs uppercase">
                                                    <tr>
                                                        <th className="px-4 py-2">Código</th>
                                                        <th className="px-4 py-2">Ítem</th>
                                                        <th className="px-4 py-2 text-right">Metros</th>
                                                        <th className="px-4 py-2 text-center">Estado</th>
                                                        <th className="px-4 py-2"></th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-neutral/10">
                                                    {bobbins.map((bobbin) => (
                                                        <tr key={bobbin._id}>
                                                            {editingBobbin?.id === bobbin._id ? (
                                                                // Editing mode
                                                                <>
                                                                    <td className="px-4 py-3 font-medium">{bobbin.batchCode}</td>
                                                                    <td className="px-4 py-3">
                                                                        <Autocomplete
                                                                            size="sm"
                                                                            selectedKey={editingBobbin.itemId}
                                                                            onSelectionChange={(key) => setEditingBobbin({
                                                                                ...editingBobbin,
                                                                                itemId: key as string
                                                                            })}
                                                                            placeholder="Seleccionar item..."
                                                                            classNames={{
                                                                                base: "max-w-xs"
                                                                            }}
                                                                        >
                                                                            {inventoryItems.filter(item => item.unit === 'metros').map((item) => (
                                                                                <AutocompleteItem key={item._id} textValue={item.description}>
                                                                                    <div className="flex flex-col">
                                                                                        <span className="text-sm">{item.description}</span>
                                                                                        <span className="text-xs text-neutral">{item.code}</span>
                                                                                    </div>
                                                                                </AutocompleteItem>
                                                                            ))}
                                                                        </Autocomplete>
                                                                    </td>
                                                                    <td className="px-4 py-3 text-right">
                                                                        <Input
                                                                            type="number"
                                                                            size="sm"
                                                                            value={editingBobbin.meters}
                                                                            onValueChange={(value) => setEditingBobbin({
                                                                                ...editingBobbin,
                                                                                meters: value
                                                                            })}
                                                                            endContent="m"
                                                                            classNames={{
                                                                                base: "max-w-[120px] ml-auto"
                                                                            }}
                                                                        />
                                                                    </td>
                                                                    <td className="px-4 py-3 text-center">
                                                                        <span className={`px - 2 py - 1 rounded - full text - xs ${Number(editingBobbin.meters) === 0
                                                                            ? 'bg-red-100 text-red-700'
                                                                            : 'bg-green-100 text-green-700'
                                                                            } `}>
                                                                            {Number(editingBobbin.meters) === 0 ? 'Agotada' : 'Activa'}
                                                                        </span>
                                                                    </td>
                                                                    <td className="px-4 py-3 text-right">
                                                                        <div className="flex items-center justify-end gap-2">
                                                                            <button
                                                                                type="button"
                                                                                onClick={handleSaveEditBobbin}
                                                                                className="text-green-600 hover:text-green-700 transition-colors"
                                                                                disabled={loading}
                                                                            >
                                                                                <i className="fa-solid fa-check"></i>
                                                                            </button>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => setEditingBobbin(null)}
                                                                                className="text-neutral hover:text-dark transition-colors"
                                                                                disabled={loading}
                                                                            >
                                                                                <i className="fa-solid fa-times"></i>
                                                                            </button>
                                                                        </div>
                                                                    </td>
                                                                </>
                                                            ) : (
                                                                // View mode
                                                                <>
                                                                    <td className="px-4 py-3 font-medium">{bobbin.batchCode}</td>
                                                                    <td className="px-4 py-3">
                                                                        <div className="text-sm">
                                                                            {bobbin.item?.description || (
                                                                                <span className="text-red-600 italic">⚠️ Item eliminado</span>
                                                                            )}
                                                                        </div>
                                                                        <div className="text-xs text-neutral">{bobbin.item?.code || '-'}</div>
                                                                    </td>
                                                                    <td className="px-4 py-3 text-right font-bold text-primary">
                                                                        {bobbin.currentQuantity}m
                                                                    </td>
                                                                    <td className="px-4 py-3 text-center">
                                                                        <span className={`px - 2 py - 1 rounded - full text - xs ${bobbin.currentQuantity === 0
                                                                            ? 'bg-red-100 text-red-700'
                                                                            : 'bg-green-100 text-green-700'
                                                                            } `}>
                                                                            {bobbin.currentQuantity === 0 ? 'Agotada' : 'Activa'}
                                                                        </span>
                                                                    </td>
                                                                    <td className="px-4 py-3 text-right">
                                                                        <div className="flex items-center justify-end gap-2">
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => handleEditBobbin(bobbin)}
                                                                                className="text-blue-600 hover:text-blue-700 transition-colors"
                                                                                disabled={loading}
                                                                                title="Editar bobina"
                                                                            >
                                                                                <i className="fa-solid fa-edit"></i>
                                                                            </button>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => handleDeleteBobbin(bobbin.batchCode)}
                                                                                className="text-red-600 hover:text-red-700 transition-colors"
                                                                                disabled={loading}
                                                                                title="Eliminar bobina"
                                                                            >
                                                                                <i className="fa-solid fa-trash"></i>
                                                                            </button>
                                                                        </div>
                                                                    </td>
                                                                </>
                                                            )}
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-3 justify-end">
                                    <FormButton
                                        variant="secondary"
                                        onPress={handleClose}
                                        isDisabled={loading}
                                    >
                                        Cerrar
                                    </FormButton>
                                </div>
                            </div>
                        </Tab>

                        {/* Equipment Management Tab */}
                        <Tab
                            key="equipment"
                            title={
                                <div className="flex items-center gap-2">
                                    <i className="fa-solid fa-microchip"></i>
                                    <span>Gestión de Equipos</span>
                                </div>
                            }
                        >
                            <div className="flex flex-col gap-6 mt-4">
                                {/* Select Equipment Type */}
                                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                                    <h4 className="text-sm font-bold text-dark mb-3 flex items-center gap-2">
                                        <i className="fa-solid fa-server text-purple-600"></i>
                                        Seleccionar Tipo de Equipo
                                    </h4>
                                    <Autocomplete
                                        label="Tipo de Equipo"
                                        placeholder="ONT, Modem, Router..."
                                        selectedKey={selectedEquipmentTypeId}
                                        onSelectionChange={(key) => setSelectedEquipmentTypeId(key as string)}
                                        isLoading={loadingItems}
                                        variant="bordered"
                                        size="md"
                                    >
                                        {equipmentTypes.map((item) => (
                                            <AutocompleteItem key={item._id} textValue={item.description}>
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{item.description}</span>
                                                    <span className="text-xs text-neutral">
                                                        {item.code} - Stock: {item.currentStock}
                                                    </span>
                                                </div>
                                            </AutocompleteItem>
                                        ))}
                                    </Autocomplete>
                                </div>

                                {/* Add Equipment Instances */}
                                {selectedEquipmentTypeId && (
                                    <div className="bg-gray-50 p-4 rounded-lg border border-neutral/10">
                                        <h4 className="text-sm font-bold text-dark mb-3">Agregar Instancias</h4>

                                        {/* Camera Barcode Scanner Button */}
                                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                                            <div className="flex items-center justify-between gap-2 mb-2">
                                                <div className="flex items-center gap-2">
                                                    <i className="fa-solid fa-camera text-blue-600"></i>
                                                    <label className="text-sm font-medium text-blue-900">
                                                        Escanear Código con Cámara
                                                    </label>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={startScanner}
                                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                                                    disabled={loading || isScannerOpen}
                                                >
                                                    <i className="fa-solid fa-qrcode"></i>
                                                    Abrir Cámara
                                                </button>
                                            </div>
                                            <p className="text-xs text-blue-700">
                                                Usa la cámara de tu dispositivo para escanear códigos de barras o QR
                                            </p>
                                        </div>



                                        {/* Scanner Modal */}
                                        {isScannerOpen && (
                                            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
                                                <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
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
                                                        <div id="barcode-reader" className="w-full rounded-lg overflow-hidden border-2 border-blue-500 min-h-[250px] bg-black"></div>
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

                                        <div className="grid grid-cols-2 gap-3 mb-3">
                                            <FormInput
                                                label="ID Único *"
                                                placeholder="Ej: ONT-12345"
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
                                )}

                                {/* Instances List */}
                                {equipmentInstances.length > 0 && (
                                    <div>
                                        <h4 className="text-sm font-bold text-dark mb-3">
                                            Instancias a Agregar ({equipmentInstances.length})
                                        </h4>
                                        <div className="border border-neutral/20 rounded-lg overflow-hidden">
                                            <table className="w-full text-sm text-left">
                                                <thead className="bg-purple-100 text-purple-900 text-xs uppercase">
                                                    <tr>
                                                        <th className="px-4 py-2">ID Único</th>
                                                        <th className="px-4 py-2">Serial</th>
                                                        <th className="px-4 py-2">MAC</th>
                                                        <th className="px-4 py-2">Notas</th>
                                                        <th className="px-4 py-2"></th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-neutral/10">
                                                    {equipmentInstances.map((inst) => (
                                                        <tr key={inst.uniqueId}>
                                                            <td className="px-4 py-3 font-semibold text-purple-700">
                                                                {inst.uniqueId}
                                                            </td>
                                                            <td className="px-4 py-3 text-neutral text-xs">
                                                                {inst.serialNumber || '-'}
                                                            </td>
                                                            <td className="px-4 py-3 text-neutral text-xs">
                                                                {inst.macAddress || '-'}
                                                            </td>
                                                            <td className="px-4 py-3 text-neutral text-xs italic">
                                                                {inst.notes || '-'}
                                                            </td>
                                                            <td className="px-4 py-3 text-right">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleRemoveInstance(inst.uniqueId)}
                                                                    className="text-neutral hover:text-red-500 transition-colors cursor-pointer"
                                                                    disabled={loading}
                                                                >
                                                                    <i className="fa-solid fa-trash"></i>
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                <div className="flex gap-3 justify-end">
                                    <FormButton
                                        variant="secondary"
                                        onPress={handleClose}
                                        isDisabled={loading}
                                    >
                                        Cancelar
                                    </FormButton>
                                    <FormButton
                                        onPress={handleSubmitEquipment}
                                        isLoading={loading}
                                        isDisabled={!selectedEquipmentTypeId || equipmentInstances.length === 0}
                                    >
                                        Agregar {equipmentInstances.length} Instancia(s)
                                    </FormButton>
                                </div>
                            </div>
                        </Tab>
                    </Tabs>
                </ModalBody>
            </ModalContent>
        </Modal>
    );
};

export default RestockModal;
