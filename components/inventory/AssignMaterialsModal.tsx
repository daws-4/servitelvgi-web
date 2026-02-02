import React, { useState, useEffect, useRef } from "react";
import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
} from "@heroui/react";
import { Autocomplete, AutocompleteItem } from "@heroui/react";
import { FormInput } from "@/components/interactiveForms/Input";
import { FormSelect, SelectOption } from "@/components/interactiveForms/Select";
import { FormButton } from "@/components/interactiveForms/Button";

interface AssignItem {
    inventoryId: string;
    code: string;
    description: string;
    quantity: number;
    batchCode?: string; // Present if this is a bobbin assignment
    instanceIds?: string[]; // Present if this is equipment assignment
}

interface AssignMaterialsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export const AssignMaterialsModal: React.FC<AssignMaterialsModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
}) => {
    const [crews, setCrews] = useState<any[]>([]);
    const [selectedCrewId, setSelectedCrewId] = useState("");
    const [items, setItems] = useState<AssignItem[]>([]);
    const [inventoryItems, setInventoryItems] = useState<any[]>([]);
    const [bobbins, setBobbins] = useState<any[]>([]);
    const [selectedItemId, setSelectedItemId] = useState("");
    const [selectedBatchCode, setSelectedBatchCode] = useState("");
    const [quantity, setQuantity] = useState("");
    const [loading, setLoading] = useState(false);
    const [loadingCrews, setLoadingCrews] = useState(false);
    const [loadingItems, setLoadingItems] = useState(false);
    const [loadingBobbins, setLoadingBobbins] = useState(false);
    const [loadingInstances, setLoadingInstances] = useState(false);
    const [error, setError] = useState("");

    // Equipment state
    const [selectedEquipmentId, setSelectedEquipmentId] = useState("");
    const [availableInstances, setAvailableInstances] = useState<any[]>([]);
    const [selectedInstanceIds, setSelectedInstanceIds] = useState<Set<string>>(new Set());

    // Barcode Scanner State
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const scannerRef = useRef<any>(null);

    // Fetch crews, inventory items and bobbins
    useEffect(() => {
        if (isOpen) {
            fetchCrews();
            fetchInventoryItems();
            fetchBobbins();
        }
    }, [isOpen]);

    // Fetch available instances when equipment is selected
    useEffect(() => {
        if (selectedEquipmentId) {
            fetchAvailableInstances(selectedEquipmentId);
        } else {
            setAvailableInstances([]);
            setSelectedInstanceIds(new Set());
        }
    }, [selectedEquipmentId]);

    const fetchCrews = async () => {
        setLoadingCrews(true);
        try {
            const response = await fetch("/api/web/crews");
            const data = await response.json();
            if (Array.isArray(data)) {
                setCrews(data);
            }
        } catch (err) {
            console.error("Error fetching crews:", err);
        } finally {
            setLoadingCrews(false);
        }
    };

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
            const response = await fetch('/api/web/inventory/batches?location=warehouse&status=active');
            const data = await response.json();
            setBobbins(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Error fetching bobbins:', err);
        } finally {
            setLoadingBobbins(false);
        }
    };

    const fetchAvailableInstances = async (inventoryId: string) => {
        setLoadingInstances(true);
        try {
            const response = await fetch(`/api/web/inventory/${inventoryId}/instances?status=in-stock`);
            const data = await response.json();
            setAvailableInstances(Array.isArray(data.instances) ? data.instances : []);
        } catch (err) {
            console.error('Error fetching instances:', err);
            setAvailableInstances([]);
        } finally {
            setLoadingInstances(false);
        }
    };

    // Barcode Scanner Handlers
    const startScanner = async () => {
        setIsScannerOpen(true);

        // Dynamically import html5-qrcode
        const { Html5Qrcode } = await import('html5-qrcode');

        // Wait for next tick to ensure DOM is ready
        setTimeout(() => {
            const html5QrCode = new Html5Qrcode("barcode-reader-assign");
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
                            // Feedback: Populate search query so user sees what was scanned
                            setSearchQuery(decodedText);

                            // Attempt to toggle instance
                            const found = handleToggleInstance(decodedText);

                            // Stop scanner after successful scan
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

        // Check if enough stock available
        if (selectedItem.currentStock < Number(quantity)) {
            setError(
                `Stock insuficiente. Disponible: ${selectedItem.currentStock} ${selectedItem.unit}`
            );
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

    const handleAddBobbin = () => {
        if (!selectedBatchCode) {
            setError("Selecciona una bobina");
            return;
        }

        const selectedBatch = bobbins.find(b => b.batchCode === selectedBatchCode);
        if (!selectedBatch) return;

        // Check if bobbin already added
        if (items.some(item => item.batchCode === selectedBatchCode)) {
            setError("Esta bobina ya está en la lista");
            return;
        }

        const itemInfo = typeof selectedBatch.item === 'object'
            ? selectedBatch.item
            : inventoryItems.find(i => i._id === selectedBatch.item);

        setItems([
            ...items,
            {
                inventoryId: itemInfo?._id || selectedBatch.item,
                code: itemInfo?.code || 'CABLE',
                description: `${itemInfo?.description || 'Cable'} (Bobina: ${selectedBatchCode})`,
                quantity: selectedBatch.currentQuantity,
                batchCode: selectedBatchCode,
            },
        ]);

        setSelectedBatchCode("");
        setError("");
    };

    const handleToggleInstance = (instanceId: string): boolean => {
        const query = instanceId.trim().toLowerCase();

        const instance = availableInstances.find(i =>
            i.uniqueId.toLowerCase() === query ||
            (i.serialNumber && i.serialNumber.toLowerCase() === query) ||
            (i.macAddress && i.macAddress.toLowerCase() === query)
        );

        if (instance) {
            const targetId = instance.uniqueId;
            const newSelection = new Set(selectedInstanceIds);
            if (newSelection.has(targetId)) {
                newSelection.delete(targetId);
            } else {
                newSelection.add(targetId);
            }
            setSelectedInstanceIds(newSelection);
            return true;
        }
        return false;
    };

    const handleAddEquipment = () => {
        if (!selectedEquipmentId) {
            setError("Selecciona un tipo de equipo");
            return;
        }

        if (selectedInstanceIds.size === 0) {
            setError("Selecciona al menos una instancia");
            return;
        }

        const selectedEquipment = inventoryItems.find(i => i._id === selectedEquipmentId);
        if (!selectedEquipment) return;

        // Check if already in list
        if (items.some(item => item.inventoryId === selectedEquipmentId)) {
            setError("Este equipo ya está en la lista");
            return;
        }

        const instanceCount = selectedInstanceIds.size;
        const instancesList = Array.from(selectedInstanceIds).join(', ');

        setItems([
            ...items,
            {
                inventoryId: selectedEquipment._id,
                code: selectedEquipment.code,
                description: `${selectedEquipment.description} (${instanceCount} instancia${instanceCount > 1 ? 's' : ''})`,
                quantity: instanceCount,
                instanceIds: Array.from(selectedInstanceIds),
            },
        ]);

        setSelectedEquipmentId("");
        setSelectedInstanceIds(new Set());
        setAvailableInstances([]);
        setError("");
    };

    const handleRemoveItem = (inventoryId: string) => {
        setItems(items.filter((item) => item.inventoryId !== inventoryId));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!selectedCrewId) {
            setError("Debes seleccionar una cuadrilla");
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
                    action: "assign",
                    data: {
                        crewId: selectedCrewId,
                        items: items.map((item) => ({
                            inventoryId: item.inventoryId,
                            quantity: item.quantity,
                            ...(item.batchCode && { batchCode: item.batchCode }),
                            ...(item.instanceIds && { instanceIds: item.instanceIds }),
                        })),
                    },
                }),
            });

            const data = await response.json();

            if (!data.success) {
                setError(data.error || "Error al asignar materiales");
                setLoading(false);
                return;
            }

            // Reset form
            setSelectedCrewId("");
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
            setSelectedCrewId("");
            setItems([]);
            stopScanner();
            onClose();
        }
    };

    // Filter out items that have bobbins from regular inventory list
    const itemsWithBobbins = new Set(bobbins
        .filter(b => b.item) // Filter out bobbins with null items
        .map(b => {
            return typeof b.item === 'object' ? b.item._id : b.item;
        }));

    const regularInventoryItems = inventoryItems.filter(item =>
        !itemsWithBobbins.has(item._id) &&
        item.type !== "equipment" &&
        item.unit !== "metros"
    );

    const equipmentItems = inventoryItems.filter(item => item.type === "equipment");

    const crewOptions: SelectOption[] = crews.map((crew) => ({
        key: crew._id,
        label: `Cuadrilla ${crew.number} - ${crew.leader?.name || "Sin líder"}`,
    }));

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            size="2xl"
            scrollBehavior="outside"
            placement="top"
            classNames={{
                base: "max-w-2xl",
                backdrop: "bg-dark/50 backdrop-blur-sm",
            }}
        >
            <ModalContent>
                <form onSubmit={handleSubmit} className="flex flex-col">
                    <ModalHeader className="border-b border-neutral/10 bg-secondary/10">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-secondary rounded-lg text-white">
                                <i className="fa-solid fa-truck"></i>
                            </div>
                            <h3 className="text-lg font-bold text-dark">Asignar Materiales a Cuadrilla</h3>
                        </div>
                    </ModalHeader>

                    <ModalBody className="py-6">
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
                                <i className="fa-solid fa-exclamation-circle mr-2"></i>
                                {error}
                            </div>
                        )}

                        {/* Crew Selection */}
                        <FormSelect
                            label="Cuadrilla"
                            placeholder="Selecciona una cuadrilla"
                            options={crewOptions}
                            selectedKeys={selectedCrewId ? [selectedCrewId] : []}
                            onSelectionChange={(keys) => {
                                const selected = Array.from(keys)[0] as string;
                                setSelectedCrewId(selected);
                            }}
                            isRequired
                            isLoading={loadingCrews}
                        />

                        {/* Add Item Section */}
                        <div className="bg-gray-50 p-4 rounded-lg border border-neutral/10">
                            <p className="text-sm font-bold text-secondary mb-3">
                                Agregar Material Regular
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
                                        {regularInventoryItems.map((item) => (
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

                        {/* Bobbin Assignment Section */}
                        {bobbins.length > 0 && (
                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                <p className="text-sm font-bold text-blue-700 mb-3 flex items-center gap-2">
                                    <i className="fa-solid fa-spool"></i>
                                    Asignar Bobina de Cable
                                </p>
                                <div className="flex flex-col md:flex-row gap-3">
                                    <div className="flex-1">
                                        <Autocomplete
                                            label="Buscar bobina"
                                            placeholder="Código o tipo de cable..."
                                            selectedKey={selectedBatchCode}
                                            onSelectionChange={(key) => setSelectedBatchCode(key as string)}
                                            isLoading={loadingBobbins}
                                            variant="bordered"
                                            size="sm"
                                        >
                                            {bobbins.filter(batch => batch.item).map((batch) => (
                                                <AutocompleteItem key={batch.batchCode} textValue={batch.batchCode}>
                                                    <div className="flex flex-col">
                                                        <span className="font-medium">{batch.batchCode}</span>
                                                        <span className="text-xs text-neutral">
                                                            {batch.item?.description || 'Cable'} - {batch.currentQuantity}m disponibles
                                                        </span>
                                                    </div>
                                                </AutocompleteItem>
                                            ))}
                                        </Autocomplete>
                                    </div>
                                    <FormButton
                                        type="button"
                                        onPress={handleAddBobbin}
                                        variant="primary"
                                        className="h-10"
                                    >
                                        <i className="fa-solid fa-plus"></i> Añadir Bobina
                                    </FormButton>
                                </div>
                            </div>
                        )}

                        {/*Equipment Assignment Section */}
                        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                            <p className="text-sm font-bold text-purple-700 mb-3 flex items-center gap-2">
                                <i className="fa-solid fa-microchip"></i>
                                Asignar Equipos
                            </p>
                            <div className="flex flex-col gap-3">
                                <Autocomplete
                                    label="Tipo de Equipo"
                                    placeholder="ONT, Modem, Router..."
                                    selectedKey={selectedEquipmentId}
                                    onSelectionChange={(key) => setSelectedEquipmentId(key as string)}
                                    isLoading={loadingItems}
                                    variant="bordered"
                                    size="sm"
                                >
                                    {equipmentItems.map((item) => (
                                        <AutocompleteItem key={item._id} textValue={item.description}>
                                            <div className="flex flex-col">
                                                <span className="font-medium">{item.description}</span>
                                                <span className="text-xs text-neutral">
                                                    {item.code} - {item.currentStock} disponibles
                                                </span>
                                            </div>
                                        </AutocompleteItem>
                                    ))}
                                </Autocomplete>

                                {/* Search and Scanner Controls */}
                                {selectedEquipmentId && (
                                    <div className="flex gap-2 mb-3">
                                        <div className="flex-1">
                                            <FormInput
                                                placeholder="Buscar por ID, Serie o MAC..."
                                                value={searchQuery}
                                                onValueChange={setSearchQuery}
                                                startContent={<i className="fa-solid fa-search text-neutral/50"></i>}
                                                size="sm"
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={startScanner}
                                            className="px-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center min-w-[48px]"
                                            disabled={loading || isScannerOpen}
                                            title="Escanear con cámara"
                                        >
                                            <i className="fa-solid fa-qrcode text-lg"></i>
                                        </button>
                                    </div>
                                )}

                                {/* Scanner Modal Overlay */}
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
                                                <div id="barcode-reader-assign" className="w-full rounded-lg overflow-hidden border-2 border-blue-500 min-h-[300px] bg-black"></div>
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

                                {/* Show instances when equipment is selected */}
                                {selectedEquipmentId && availableInstances.length > 0 && (
                                    <div className="mt-2 max-h-48 overflow-y-auto border border-purple-200 rounded-lg p-3 bg-white">
                                        <p className="text-xs font-semibold text-purple-800 mb-2">
                                            Seleccionar Instancias ({selectedInstanceIds.size} seleccionadas)
                                        </p>
                                        {loadingInstances ? (
                                            <div className="flex justify-center py-4">
                                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                {availableInstances
                                                    .filter(instance => {
                                                        if (!searchQuery.trim()) return true;
                                                        const query = searchQuery.toLowerCase();
                                                        return (
                                                            instance.uniqueId.toLowerCase().includes(query) ||
                                                            (instance.serialNumber && instance.serialNumber.toLowerCase().includes(query)) ||
                                                            (instance.macAddress && instance.macAddress.toLowerCase().includes(query))
                                                        );
                                                    })
                                                    .map((instance) => (
                                                        <label
                                                            key={instance.uniqueId}
                                                            className="flex items-start gap-2 p-2 hover:bg-purple-50 rounded cursor-pointer"
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedInstanceIds.has(instance.uniqueId)}
                                                                onChange={() => handleToggleInstance(instance.uniqueId)}
                                                                className="mt-1"
                                                            />
                                                            <div className="flex-1 text-sm">
                                                                <div className="font-semibold text-purple-700">
                                                                    {instance.uniqueId}
                                                                </div>
                                                                {instance.serialNumber && (
                                                                    <div className="text-xs text-neutral">
                                                                        SN: {instance.serialNumber}
                                                                    </div>
                                                                )}
                                                                {instance.macAddress && (
                                                                    <div className="text-xs text-neutral">
                                                                        MAC: {instance.macAddress}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </label>
                                                    ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {selectedEquipmentId && availableInstances.length === 0 && !loadingInstances && (
                                    <div className="text-xs text-neutral italic p-2 bg-white border border-purple-200 rounded">
                                        No hay instancias disponibles para este equipo
                                    </div>
                                )}

                                {selectedEquipmentId && selectedInstanceIds.size > 0 && (
                                    <FormButton
                                        type="button"
                                        onPress={handleAddEquipment}
                                        variant="primary"
                                        size="sm"
                                        className="bg-purple-600 hover:bg-purple-700"
                                    >
                                        <i className="fa-solid fa-plus"></i> Añadir {selectedInstanceIds.size} Equipo(s)
                                    </FormButton>
                                )}
                            </div>
                        </div>

                        {/* Items List */}
                        <div>
                            <h4 className="text-sm font-bold text-dark mb-2">Materiales a Asignar</h4>
                            {items.length === 0 ? (
                                <div className="border border-neutral/20 rounded-lg p-8 text-center">
                                    <i className="fa-solid fa-inbox text-4xl text-neutral/30 mb-2"></i>
                                    <p className="text-neutral text-sm">No hay materiales agregados</p>
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
                                                <tr key={item.batchCode || item.inventoryId}>
                                                    <td className="px-4 py-3">
                                                        <div className="font-medium">{item.description}</div>
                                                        <div className="text-xs text-neutral">
                                                            {item.code}
                                                            {item.batchCode && (
                                                                <span className="ml-2 text-blue-600">
                                                                    <i className="fa-solid fa-spool mr-1"></i>
                                                                    {item.batchCode}
                                                                </span>
                                                            )}
                                                            {item.instanceIds && (
                                                                <span className="ml-2 text-purple-600">
                                                                    <i className="fa-solid fa-microchip mr-1"></i>
                                                                    {item.instanceIds.length} instancia{item.instanceIds.length > 1 ? 's' : ''}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-bold text-secondary">
                                                        {item.quantity}{item.batchCode ? 'm' : ''}
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

                    <ModalFooter className="bg-gray-50 border-t border-neutral/10 flex justify-between items-center rounded-b-lg">
                        <div className="text-xs text-neutral">Total ítems: {items.length}</div>
                        <div className="flex gap-3">
                            <FormButton
                                variant="secondary"
                                onPress={handleClose}
                                isDisabled={loading}
                            >
                                Cancelar
                            </FormButton>
                            <FormButton type="submit" isLoading={loading}>
                                Asignar Materiales
                            </FormButton>
                        </div>
                    </ModalFooter>
                </form>
            </ModalContent>
        </Modal>
    );
};

export default AssignMaterialsModal;
