import React, { useState, useEffect } from "react";
import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Tabs,
    Tab,
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
        if (!confirm(`¿Eliminar la bobina ${batchCode}? Solo se pueden eliminar bobinas agotadas.`)) {
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
            onClose();
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            size="3xl"
            scrollBehavior="inside"
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
                                        <FormInput
                                            label="Código de Bobina"
                                            placeholder="Ej: BOB-001"
                                            value={newBobbinCode}
                                            onValueChange={setNewBobbinCode}
                                        />
                                        <div>
                                            <Autocomplete
                                                label="Ítem de Cable"
                                                placeholder="Seleccionar cable..."
                                                selectedKey={newBobbinItemId}
                                                onSelectionChange={(key) => setNewBobbinItemId(key as string)}
                                                isLoading={loadingItems}
                                                variant="bordered"
                                                size="sm"
                                            >
                                                {inventoryItems.filter(item => item.type === 'material').map((item) => (
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
                                            <FormInput
                                                type="number"
                                                label="Metros"
                                                placeholder="Cantidad"
                                                value={newBobbinMeters}
                                                onValueChange={setNewBobbinMeters}
                                                min="1"
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
                                                size="sm"
                                            >
                                                {bobbins.map((bobbin) => (
                                                    <AutocompleteItem key={bobbin._id} textValue={bobbin.batchCode}>
                                                        <div className="flex flex-col">
                                                            <span className="font-medium">{bobbin.batchCode}</span>
                                                            <span className="text-xs text-neutral">
                                                                {bobbin.item.description} - {bobbin.currentQuantity}m disponibles
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
                                                            <td className="px-4 py-3 font-medium">{bobbin.batchCode}</td>
                                                            <td className="px-4 py-3">
                                                                <div className="text-sm">{bobbin.item.description}</div>
                                                                <div className="text-xs text-neutral">{bobbin.item.code}</div>
                                                            </td>
                                                            <td className="px-4 py-3 text-right font-bold text-primary">
                                                                {bobbin.currentQuantity}m
                                                            </td>
                                                            <td className="px-4 py-3 text-center">
                                                                <span className={`px-2 py-1 rounded-full text-xs ${bobbin.currentQuantity === 0
                                                                        ? 'bg-red-100 text-red-700'
                                                                        : 'bg-green-100 text-green-700'
                                                                    }`}>
                                                                    {bobbin.currentQuantity === 0 ? 'Agotada' : 'Activa'}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-3 text-right">
                                                                {bobbin.currentQuantity === 0 && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleDeleteBobbin(bobbin.batchCode)}
                                                                        className="text-neutral hover:text-red-500 transition-colors cursor-pointer"
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
                    </Tabs>
                </ModalBody>
            </ModalContent>
        </Modal>
    );
};

export default RestockModal;
