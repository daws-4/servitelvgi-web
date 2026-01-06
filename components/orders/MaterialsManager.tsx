"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import OrderEquipmentModal from "./OrderEquipmentModal";

export interface Material {
    item: {
        _id: string;
        code: string;
        description: string;
        unit: string;
        type?: string;
    } | string;
    quantity: number;
    batchCode?: string; // Optional: identifies specific bobbin used
    instanceIds?: string[]; // Optional: identifies specific equipment instances used
    instanceDetails?: { uniqueId: string; serialNumber: string }[]; // Populated details
}

interface MaterialsManagerProps {
    orderId: string;
    assignedCrewId?: string;
    initialMaterials?: Material[];
    onChange?: (materials: Material[]) => void;
    onImmediateSave?: (materials: Material[]) => Promise<void>;
}

interface CrewInventoryItem {
    item: {
        _id: string;
        code: string;
        description: string;
        unit: string;
    };
    quantity: number;
    lastUpdate: Date;
}

interface CrewBobbin {
    _id: string;
    batchCode: string;
    item: {
        _id: string;
        code: string;
        description: string;
        unit: string;
    };
    currentQuantity: number;
    initialQuantity: number;
    status: string;
}

export const MaterialsManager: React.FC<MaterialsManagerProps> = ({
    orderId,
    assignedCrewId,
    initialMaterials = [],
    onChange,
    onImmediateSave,
}) => {
    const [materials, setMaterials] = useState<Material[]>(initialMaterials);
    const [crewInventory, setCrewInventory] = useState<CrewInventoryItem[]>([]);
    const [crewBobbins, setCrewBobbins] = useState<CrewBobbin[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedMaterialId, setSelectedMaterialId] = useState("");
    const [selectedBatchCode, setSelectedBatchCode] = useState("");
    const [materialQuantity, setMaterialQuantity] = useState(1);
    const [bobbinQuantity, setBobbinQuantity] = useState(1);
    const [returnModalOpen, setReturnModalOpen] = useState(false);
    const [materialToReturn, setMaterialToReturn] = useState<Material | null>(null);
    const [returningMaterial, setReturningMaterial] = useState(false);
    const [returnReason, setReturnReason] = useState("");

    // Equipment state
    const [crewEquipment, setCrewEquipment] = useState<any[]>([]);
    const [selectedEquipmentId, setSelectedEquipmentId] = useState("");
    const [equipmentInstances, setEquipmentInstances] = useState<any[]>([]);
    const [selectedInstanceIds, setSelectedInstanceIds] = useState<Set<string>>(new Set());
    const [loadingEquipment, setLoadingEquipment] = useState(false);
    const [equipmentModalOpen, setEquipmentModalOpen] = useState(false);

    // Notify parent of material changes
    useEffect(() => {
        if (onChange) {
            onChange(materials);
        }
    }, [materials, onChange]);

    // Fetch crew inventory and bobbins when crew is assigned
    useEffect(() => {
        if (assignedCrewId) {
            fetchCrewInventory();
            fetchCrewBobbins();
            fetchCrewEquipment();
        } else {
            setCrewInventory([]);
            setCrewBobbins([]);
            setCrewEquipment([]);
        }
    }, [assignedCrewId]);

    const fetchCrewInventory = async () => {
        if (!assignedCrewId) return;

        try {
            setLoading(true);
            const response = await axios.get(`/api/web/crews?id=${assignedCrewId}`);
            let inventory = response.data.assignedInventory || [];

            // Sync with local materials (deduct used quantities)
            // This prevents "resetting" available counts if we refresh while editing
            if (materials.length > 0) {
                inventory = inventory.map((inv: any) => {
                    const materialUsage = materials.find(m => {
                        const mId = typeof m.item === 'string' ? m.item : m.item._id;
                        return mId === inv.item._id;
                    });

                    if (materialUsage && !materialUsage.batchCode) { // Only generic materials
                        return {
                            ...inv,
                            quantity: Math.max(0, inv.quantity - materialUsage.quantity)
                        };
                    }
                    return inv;
                });
            }

            setCrewInventory(inventory);
        } catch (error) {
            console.error("Error fetching crew inventory:", error);
            alert("Error al cargar el inventario de la cuadrilla");
        } finally {
            setLoading(false);
        }
    };

    const fetchCrewBobbins = async () => {
        if (!assignedCrewId) return;

        try {
            const response = await axios.get(
                `/api/web/inventory/batches?crewId=${assignedCrewId}&status=active`
            );
            const bobbins = response.data || [];

            // Use server values directly - the server already reflects the correct state
            // after processing. Local decrements in handleAddBobbin provide immediate UI feedback.
            setCrewBobbins(bobbins);
        } catch (error) {
            console.error("Error fetching crew bobbins:", error);
        }
    };

    const fetchCrewEquipment = async () => {
        if (!assignedCrewId) return;

        try {
            setLoadingEquipment(true);
            const response = await axios.get(`/api/web/crews/${assignedCrewId}/equipment-instances`);
            let equipment = response.data.instances || [];

            // Sync equipment? 
            // Equipment handling typically relies on checking instanceIds in materials.
            // But strict exclusion from list might be needed if we supported adding same type multiple times.
            // For now, let's leave equipment logic as is since duplications are blocked in handleAddEquipment.

            setCrewEquipment(equipment);
        } catch (error) {
            console.error("Error fetching crew equipment:", error);
        } finally {
            setLoadingEquipment(false);
        }
    };

    const getAvailableQuantity = (itemId: string): number => {
        const inventoryItem = crewInventory.find((inv) => inv.item._id === itemId);
        return inventoryItem?.quantity || 0;
    };

    const handleAddMaterial = () => {
        if (!selectedMaterialId) {
            alert("Por favor selecciona un material.");
            return;
        }

        const selectedItem = crewInventory.find(
            (inv) => inv.item._id === selectedMaterialId
        );

        if (!selectedItem) {
            alert("Material no encontrado");
            return;
        }

        if (materialQuantity <= 0) {
            alert("La cantidad debe ser mayor a 0");
            return;
        }

        if (materialQuantity > selectedItem.quantity) {
            alert(
                `Cantidad no disponible. Máximo: ${selectedItem.quantity} ${selectedItem.item.unit}`
            );
            return;
        }

        // Check if material already exists in the list
        const existingMaterialIndex = materials.findIndex((m) => {
            const itemId = typeof m.item === "string" ? m.item : m.item._id;
            return itemId === selectedMaterialId;
        });

        if (existingMaterialIndex >= 0) {
            // Material already exists, update quantity
            const existingMaterial = materials[existingMaterialIndex];
            const newQuantity = existingMaterial.quantity + materialQuantity;

            // Validate total quantity
            if (newQuantity > selectedItem.quantity) {
                alert(
                    `Cantidad total excede disponibilidad. Ya tienes ${existingMaterial.quantity} ${selectedItem.item.unit}. Máximo: ${selectedItem.quantity} ${selectedItem.item.unit}`
                );
                return;
            }

            // Update existing material quantity
            setMaterials((prev) =>
                prev.map((material, i) =>
                    i === existingMaterialIndex
                        ? { ...material, quantity: newQuantity }
                        : material
                )
            );

            alert(
                `Cantidad actualizada: ${existingMaterial.quantity} + ${materialQuantity} = ${newQuantity} ${selectedItem.item.unit}`
            );
        } else {
            // Material doesn't exist, add new entry
            const newMaterial: Material = {
                item: selectedItem.item,
                quantity: materialQuantity,
            };

            setMaterials((prev) => [...prev, newMaterial]);
        }

        // DECREMENT LOCAL INVENTORY
        setCrewInventory(prev => prev.map(inv => {
            if (inv.item._id === selectedMaterialId) {
                return {
                    ...inv,
                    quantity: inv.quantity - materialQuantity
                };
            }
            return inv;
        }));

        // Reset inputs
        setSelectedMaterialId("");
        setMaterialQuantity(1);
    };

    const handleAddBobbin = () => {
        if (!selectedBatchCode) {
            alert("Por favor selecciona una bobina.");
            return;
        }

        const selectedBobbin = crewBobbins.find(
            (bob) => bob.batchCode === selectedBatchCode
        );

        if (!selectedBobbin) {
            alert("Bobina no encontrada");
            return;
        }

        // Validate that bobbin has a valid item reference
        if (!selectedBobbin.item || !selectedBobbin.item._id) {
            alert("Esta bobina tiene un item de inventario inválido o eliminado. No se puede usar.");
            return;
        }

        if (bobbinQuantity <= 0) {
            alert("La cantidad debe ser mayor a 0");
            return;
        }

        if (bobbinQuantity > selectedBobbin.currentQuantity) {
            alert(
                `Metros no disponibles. Máximo: ${selectedBobbin.currentQuantity}m`
            );
            return;
        }

        // Check if bobbin already exists in the list
        const existingBobbin = materials.find(
            (m) => m.batchCode === selectedBatchCode
        );

        if (existingBobbin) {
            alert("Esta bobina ya está en la lista.");
            return;
        }

        // Add bobbin as material with valid item data
        const newMaterial: Material = {
            item: {
                _id: selectedBobbin.item._id,
                code: selectedBobbin.item.code,
                description: selectedBobbin.item.description,
                unit: selectedBobbin.item.unit,
                type: 'bobbin',
            },
            quantity: bobbinQuantity,
            batchCode: selectedBatchCode,
        };

        setMaterials((prev) => [...prev, newMaterial]);

        // DECREMENT LOCAL BOBBIN INVENTORY (Subtract quantity)
        setCrewBobbins((prev) =>
            prev.map((bob) => {
                if (bob.batchCode === selectedBatchCode) {
                    return {
                        ...bob,
                        currentQuantity: bob.currentQuantity - bobbinQuantity,
                    };
                }
                return bob;
            })
        );

        // Reset inputs
        setSelectedBatchCode("");
        setBobbinQuantity(1);
    };

    const handleToggleInstance = (instanceId: string) => {
        const newSelection = new Set(selectedInstanceIds);
        if (newSelection.has(instanceId)) {
            newSelection.delete(instanceId);
        } else {
            newSelection.add(instanceId);
        }
        setSelectedInstanceIds(newSelection);
    };

    const handleAddEquipment = async () => {
        if (!selectedEquipmentId) {
            alert("Por favor selecciona un equipo.");
            return;
        }

        if (selectedInstanceIds.size === 0) {
            alert("Debes seleccionar al menos una instancia.");
            return;
        }

        // Get equipment info from crewEquipment
        const firstInstance = crewEquipment.find(eq =>
            Array.from(selectedInstanceIds).includes(eq.uniqueId)
        );

        if (!firstInstance) return;

        // Check if equipment type already in list
        if (materials.some(m => {
            const itemId = typeof m.item === 'string' ? m.item : m.item._id;
            return itemId === selectedEquipmentId;
        })) {
            alert("Este tipo de equipo ya está en la lista. Modifica las instancias.");
            return;
        }

        // Add equipment with selected instances
        const newMaterial: Material = {
            item: {
                _id: firstInstance.inventoryId,
                code: firstInstance.itemCode,
                description: firstInstance.itemDescription,
                unit: "unidades",
                type: "equipment",
            },
            quantity: selectedInstanceIds.size,
            instanceIds: Array.from(selectedInstanceIds),
        };

        const updatedMaterials = [...materials, newMaterial];
        setMaterials(updatedMaterials);

        // Immediate save for equipment
        if (onImmediateSave) {
            try {
                await onImmediateSave(updatedMaterials);
            } catch (error) {
                console.error("Error auto-saving equipment:", error);
                alert("Error al asignar equipo. Verifica la conexión.");
            }
        }

        // Reset
        setSelectedEquipmentId("");
        setSelectedInstanceIds(new Set());
        setEquipmentInstances([]);
    };

    const handleEquipmentModalAdd = async (instances: any[]) => {
        // Group instances by inventoryId
        const grouped = instances.reduce((acc, inst) => {
            if (!acc[inst.inventoryId]) {
                acc[inst.inventoryId] = {
                    item: {
                        _id: inst.inventoryId,
                        code: inst.itemCode,
                        description: inst.itemDescription,
                        unit: "unidades",
                        type: "equipment",
                    },
                    quantity: 0,
                    instanceIds: [],
                    instanceDetails: []
                };
            }
            acc[inst.inventoryId].quantity += 1;
            acc[inst.inventoryId].instanceIds.push(inst.uniqueId);
            acc[inst.inventoryId].instanceDetails.push({
                uniqueId: inst.uniqueId,
                serialNumber: inst.serialNumber || 'N/A'
            });
            return acc;
        }, {} as Record<string, Material>);

        // Add to materials
        const newMaterialsList = [...materials, ...Object.values(grouped) as Material[]];
        setMaterials(newMaterialsList);

        // --- UPDATE LOCAL INVENTORY STATE ---
        // Reduce quantity locally so it reflects immediately in UI
        const usedInstanceIds = new Set(instances.map(i => i.uniqueId));

        setCrewInventory(prev => prev.map(inv => {
            // Check if this inventory item is one of the ones being added
            if (grouped[inv.item._id]) {
                const countUsedHere = grouped[inv.item._id].quantity;
                return {
                    ...inv,
                    quantity: Math.max(0, inv.quantity - countUsedHere),
                    item: {
                        ...inv.item,
                        instances: (inv.item as any).instances?.map((inst: any) => {
                            if (usedInstanceIds.has(inst.uniqueId)) {
                                return { ...inst, status: 'installed' };
                            }
                            return inst;
                        })
                    }
                };
            }
            return inv;
        }));

        // Immediate save for equipment
        if (onImmediateSave) {
            try {
                await onImmediateSave(newMaterialsList);
            } catch (error) {
                console.error("Error auto-saving equipment:", error);
                alert("Error al asignar equipos. Verifica la conexión.");
            }
        }
    };

    const handleRemoveMaterial = async (index: number) => {
        const materialToRemove = materials[index];
        const updatedMaterials = materials.filter((_, i) => i !== index);
        setMaterials(updatedMaterials);

        console.log("Removing material:", materialToRemove);

        // Case 1: Bobbin (identified by batchCode or type 'bobbin')
        if (materialToRemove.batchCode || (typeof materialToRemove.item !== 'string' && materialToRemove.item.type === 'bobbin')) {
            const batchCode = materialToRemove.batchCode;
            const quantityToRestore = materialToRemove.quantity;

            if (batchCode) {
                setCrewBobbins(prev => prev.map(bob => {
                    if (bob.batchCode === batchCode) {
                        return {
                            ...bob,
                            currentQuantity: bob.currentQuantity + quantityToRestore
                        };
                    }
                    return bob;
                }));
            }

            // IMPORTANT: Save changes to server to persist bobbin restoration
            if (onImmediateSave) {
                try {
                    console.log("Saving bobbin removal to backend...");
                    await onImmediateSave(updatedMaterials);
                    console.log("Bobbin removal saved successfully.");
                } catch (error) {
                    console.error("Error updating order after bobbin removal:", error);
                    alert("Error al eliminar la bobina. Verifica la conexión.");
                }
            }
            return;
        }

        // Case 2: Equipment (identified by instanceIds or type='equipment')
        if (
            (materialToRemove.instanceIds && materialToRemove.instanceIds.length > 0) ||
            (typeof materialToRemove.item !== 'string' && materialToRemove.item.type === 'equipment')
        ) {
            // Restore to local inventory state
            const itemId = typeof materialToRemove.item === 'string' ? materialToRemove.item : materialToRemove.item._id;
            const quantityToRestore = materialToRemove.instanceIds?.length || materialToRemove.quantity || 0;
            const instancesToRestore = new Set(materialToRemove.instanceIds || []);

            console.log(`Restoring locally: Item=${itemId}, Qty=${quantityToRestore}, Instances=${Array.from(instancesToRestore).join(',')}`);

            setCrewInventory(prev => prev.map(inv => {
                // Loose comparison to avoid type mismatch
                if (inv.item._id.toString() === itemId.toString()) {
                    const newQuantity = inv.quantity + quantityToRestore;
                    console.log(`Updated inventory item ${inv.item.description}: Old Qty=${inv.quantity}, New Qty=${newQuantity}`);
                    return {
                        ...inv,
                        quantity: newQuantity,
                        item: {
                            ...inv.item,
                            instances: (inv.item as any).instances?.map((inst: any) => {
                                if (instancesToRestore.has(inst.uniqueId)) {
                                    // Mark as assigned (available) locally
                                    return { ...inst, status: 'assigned' };
                                }
                                return inst;
                            })
                        }
                    };
                }
                return inv;
            }));

            if (onImmediateSave) {
                try {
                    console.log("Saving changes to backend...");
                    await onImmediateSave(updatedMaterials);
                    console.log("Changes saved successfully.");
                } catch (error) {
                    console.error("Error updating ordering after equipment removal:", error);
                }
            }
            return;
        }

        // Case 3: Regular Material
        const itemId = typeof materialToRemove.item === 'string' ? materialToRemove.item : materialToRemove.item._id;
        const quantityToRestore = materialToRemove.quantity;

        setCrewInventory(prev => prev.map(inv => {
            if (inv.item._id.toString() === itemId.toString()) {
                return {
                    ...inv,
                    quantity: inv.quantity + quantityToRestore
                };
            }
            return inv;
        }));
    };

    const handleQuantityChange = (index: number, newQuantity: number) => {
        if (newQuantity < 1) return;

        const material = materials[index];
        const itemId =
            typeof material.item === "string" ? material.item : material.item._id;
        const available = getAvailableQuantity(itemId);

        if (newQuantity > available) {
            alert(`Cantidad no disponible.Máximo: ${available} `);
            return;
        }

        setMaterials((prev) =>
            prev.map((material, i) =>
                i === index ? { ...material, quantity: newQuantity } : material
            )
        );
    };

    const handleReturnClick = (material: Material) => {
        setMaterialToReturn(material);
        setReturnModalOpen(true);
        setReturnReason("");
    };

    const handleReturnMaterial = async () => {
        if (!materialToReturn || !assignedCrewId) return;

        if (!returnReason.trim()) {
            alert("Debe ingresar un motivo de devolución");
            return;
        }

        try {
            setReturningMaterial(true);

            const itemId =
                typeof materialToReturn.item === "string"
                    ? materialToReturn.item
                    : materialToReturn.item._id;

            await axios.post("/api/web/inventory/movements", {
                action: "return",
                data: {
                    crewId: assignedCrewId,
                    items: [
                        {
                            inventoryId: itemId,
                            quantity: materialToReturn.quantity,
                        },
                    ],
                    reason: `${returnReason} (Orden #${orderId})`,
                },
            });

            alert("Material devuelto correctamente al almacén");

            // Remove material from list
            setMaterials((prev) =>
                prev.filter((m) => {
                    const mItemId = typeof m.item === "string" ? m.item : m.item._id;
                    return mItemId !== itemId || m.quantity !== materialToReturn.quantity;
                })
            );

            // Refresh crew inventory
            await fetchCrewInventory();

            setReturnModalOpen(false);
            setMaterialToReturn(null);
            setReturnReason("");
        } catch (error: any) {
            console.error("Error returning material:", error);
            alert(
                error.response?.data?.error ||
                "Error al devolver el material. Intente nuevamente."
            );
        } finally {
            setReturningMaterial(false);
        }
    };

    const renderMaterialDisplay = (material: Material) => {
        if (typeof material.item === "string") {
            return material.item;
        }
        if (!material.item) {
            return "Item no encontrado";
        }
        return `${material.item.code} - ${material.item.description} `;
    };

    const getItemUnit = (material: Material): string => {
        if (typeof material.item === "string") return "";
        if (!material.item) return "";
        return material.item.unit;
    };

    return (
        <>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-gray-50/50 border-b border-gray-100 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <i className="fa-solid fa-tools text-secondary"></i>
                        <h3 className="font-semibold text-secondary">
                            Materiales Utilizados
                        </h3>
                    </div>
                    <div className="flex items-center gap-2">
                        {assignedCrewId && (
                            <button
                                onClick={fetchCrewInventory}
                                className="text-xs text-gray-500 hover:text-primary transition-colors"
                                title="Actualizar inventario"
                            >
                                <i className="fa-solid fa-rotate-right"></i>
                            </button>
                        )}
                        <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">
                            {assignedCrewId ? "Inventario Real" : "Sin Cuadrilla"}
                        </span>
                    </div>
                </div>

                <div className="p-6 space-y-4">
                    {/* Add Material Bar */}
                    {!assignedCrewId ? (
                        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
                            <i className="fa-solid fa-info-circle text-yellow-600 mb-2 text-2xl"></i>
                            <p className="text-sm text-yellow-800 font-medium">
                                Asigna una cuadrilla primero para gestionar materiales
                            </p>
                        </div>
                    ) : loading ? (
                        <div className="p-4 bg-gray-50 rounded-lg text-center">
                            <i className="fa-solid fa-spinner fa-spin text-gray-400 text-xl"></i>
                            <p className="text-sm text-gray-500 mt-2">
                                Cargando inventario...
                            </p>
                        </div>
                    ) : crewInventory.length === 0 ? (
                        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-center">
                            <i className="fa-solid fa-box-open text-gray-400 mb-2 text-2xl"></i>
                            <p className="text-sm text-gray-600">
                                La cuadrilla no tiene materiales asignados
                            </p>
                        </div>
                    ) : (
                        <div className="flex flex-col sm:flex-row gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200 items-end">
                            <div className="flex-1 w-full">
                                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
                                    Material / Equipo
                                </label>
                                <select
                                    value={selectedMaterialId}
                                    onChange={(e) => setSelectedMaterialId(e.target.value)}
                                    className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-md bg-white text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all cursor-pointer"
                                >
                                    <option value="">-- Seleccionar Material --</option>
                                    {crewInventory
                                        .filter(inv => {
                                            const type = (inv.item as any).type;

                                            // 1. Check explicit type
                                            if (type === 'bobbin' || type === 'equipment') return false;

                                            // 2. Check if item exists in crewBobbins (Robust check)
                                            // If an item ID is found in crewBobbins, it's a bobbin and should be excluded here
                                            const isBobbin = crewBobbins.some(b => b.item && b.item._id === inv.item._id);
                                            if (isBobbin) return false;

                                            return true;
                                        })
                                        .map((inv) => (
                                            <option key={inv.item._id} value={inv.item._id}>
                                                {inv.item.code} - {inv.item.description} (Disp:{" "}
                                                {inv.quantity} {inv.item.unit})
                                            </option>
                                        ))}
                                </select>
                            </div>
                            <div className="w-24">
                                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
                                    Cantidad
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    value={materialQuantity}
                                    onChange={(e) => setMaterialQuantity(parseInt(e.target.value) || 1)}
                                    className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-md bg-white text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                                />
                            </div>
                            <button
                                type="button"
                                onClick={handleAddMaterial}
                                className="bg-secondary hover:bg-primary text-white px-4 py-2.5 rounded-md font-medium text-sm transition-colors flex items-center gap-2 cursor-pointer"
                            >
                                <i className="fa-solid fa-plus"></i> Agregar
                            </button>
                        </div>
                    )}

                    {/* Add Bobbin Section - Only if crew has bobbins */}
                    {assignedCrewId && crewBobbins.length > 0 && (
                        <div className="flex flex-col sm:flex-row gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200 items-end">
                            <div className="flex-1 w-full">
                                <label className="block text-xs font-semibold text-blue-700 uppercase tracking-wide mb-1">
                                    <i className="fa-solid fa-spool mr-1"></i>
                                    Bobina de Cable (Metros)
                                </label>
                                <select
                                    value={selectedBatchCode}
                                    onChange={(e) => {
                                        const code = e.target.value;
                                        setSelectedBatchCode(code);
                                        setBobbinQuantity(1);
                                    }}
                                    className="w-full px-3 py-2.5 border-2 border-blue-200 rounded-md bg-white text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all cursor-pointer"
                                >
                                    <option value="">-- Seleccionar Bobina --</option>
                                    {crewBobbins
                                        .filter((bobbin) => bobbin.item && bobbin.item._id)
                                        .map((bobbin) => (
                                            <option key={bobbin._id} value={bobbin.batchCode}>
                                                {bobbin.batchCode} - {bobbin.item.description} (Disp:{" "}
                                                {bobbin.currentQuantity}m)
                                            </option>
                                        ))}
                                </select>
                            </div>
                            <div className="w-24">
                                <label className="block text-xs font-semibold text-blue-700 uppercase tracking-wide mb-1">
                                    Metros
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    value={bobbinQuantity}
                                    onChange={(e) => setBobbinQuantity(parseInt(e.target.value) || 1)}
                                    className="w-full px-3 py-2.5 border-2 border-blue-200 rounded-md bg-white text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                                />
                            </div>
                            <button
                                type="button"
                                onClick={handleAddBobbin}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-md font-medium text-sm transition-colors flex items-center gap-2 cursor-pointer"
                            >
                                <i className="fa-solid fa-spool"></i> Añadir Bobina
                            </button>
                        </div>
                    )}

                    {/* Add Equipment Button - Opens Modal */}
                    {assignedCrewId && crewEquipment.length > 0 && (
                        <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                            <button
                                type="button"
                                onClick={() => setEquipmentModalOpen(true)}
                                className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded-md font-medium text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
                            >
                                <i className="fa-solid fa-microchip"></i>
                                Agregar Equipos Instalados
                            </button>
                            <p className="text-xs text-purple-600 mt-2 text-center">
                                {crewEquipment.length} equipo(s) disponible(s)
                            </p>
                        </div>
                    )}

                    {/* Materials Table */}
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-500 font-semibold border-b border-gray-200">
                                <tr>
                                    <th className="px-4 py-3">Material</th>
                                    <th className="px-4 py-3 w-24 text-center">Cant.</th>
                                    <th className="px-4 py-3 w-16 text-center">Unidad</th>
                                    <th className="px-4 py-3 w-32 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {materials.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={4}
                                            className="px-4 py-8 text-center text-gray-400 italic"
                                        >
                                            No se han registrado materiales aún.
                                        </td>
                                    </tr>
                                ) : (
                                    materials.map((material, index) => (
                                        <tr
                                            key={index}
                                            className="bg-white border-b border-gray-50 hover:bg-gray-50 transition-colors"
                                        >
                                            <td className="px-4 py-3 font-medium text-gray-700">
                                                <div className="flex items-center gap-2">
                                                    {/* Check for Bobbin FIRST */}
                                                    {(material.batchCode || (typeof material.item !== 'string' && material.item.type === 'bobbin')) ? (
                                                        <i className="fa-solid fa-spool text-blue-600" title="Bobina"></i>
                                                    ) : (
                                                        /* Check for Equipment SECOND */
                                                        (material.instanceIds && material.instanceIds.length > 0) || (typeof material.item !== 'string' && material.item.type === 'equipment') ? (
                                                            <i className="fa-solid fa-microchip text-purple-600" title="Equipo"></i>
                                                        ) : null
                                                    )}
                                                    <span>{renderMaterialDisplay(material)}</span>
                                                    {material.batchCode && (
                                                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                                                            {material.batchCode}
                                                        </span>
                                                    )}
                                                    {/* Only show instance count for equipment that has actual instances */}
                                                    {material.instanceIds && material.instanceIds.length > 0 &&
                                                        !material.batchCode &&
                                                        (typeof material.item !== 'string' && material.item.type === 'equipment') && (
                                                            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                                                                {material.instanceIds.length} instancia{material.instanceIds.length > 1 ? 's' : ''}
                                                            </span>
                                                        )}
                                                </div>
                                                {/* Show instance details if available */}
                                                {material.instanceDetails && material.instanceDetails.length > 0 && (
                                                    <div className="mt-1 pl-6 text-xs text-gray-500">
                                                        {material.instanceDetails.map((detail, idx) => (
                                                            <div key={idx} className="flex gap-2">
                                                                <span className="font-mono bg-gray-50 px-1 rounded border border-gray-100">ID: {detail.uniqueId}</span>
                                                                {detail.serialNumber && detail.serialNumber !== 'N/A' && (
                                                                    <span>S/N: {detail.serialNumber}</span>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={material.quantity}
                                                    onChange={(e) =>
                                                        handleQuantityChange(
                                                            index,
                                                            parseInt(e.target.value) || 1
                                                        )
                                                    }
                                                    className={`w-16 text-center border rounded p-1 text-sm focus:border-primary outline-none ${(material.instanceIds && material.instanceIds.length > 0) || (typeof material.item !== 'string' && material.item && material.item.type === 'equipment')
                                                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                                        : ""
                                                        }`}
                                                    readOnly={!!((material.instanceIds && material.instanceIds.length > 0) || (typeof material.item !== 'string' && material.item && material.item.type === 'equipment'))}
                                                />
                                            </td>
                                            <td className="px-4 py-3 text-center text-gray-500">
                                                {getItemUnit(material)}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {assignedCrewId && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleReturnClick(material)}
                                                            className="text-orange-500 hover:text-orange-600 p-1 rounded hover:bg-orange-50 transition-colors cursor-pointer"
                                                            title="Devolver al almacén"
                                                        >
                                                            <i className="fa-solid fa-rotate-left"></i>
                                                        </button>
                                                    )}
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveMaterial(index)}
                                                        className="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors cursor-pointer"
                                                        title="Eliminar"
                                                    >
                                                        <i className="fa-solid fa-trash-can"></i>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Return Material Modal */}
            {returnModalOpen && materialToReturn && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-neutral/10">
                            <div className="flex items-center gap-2">
                                <i className="fa-solid fa-rotate-left text-orange-500 text-xl"></i>
                                <h3 className="text-xl font-bold text-dark">
                                    Devolver Material al Almacén
                                </h3>
                            </div>
                            <button
                                onClick={() => setReturnModalOpen(false)}
                                className="text-neutral hover:text-dark transition-colors"
                                disabled={returningMaterial}
                            >
                                <i className="fa-solid fa-xmark text-xl"></i>
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6">
                            {/* Material Info */}
                            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                                <p className="text-xs text-neutral mb-1">Material</p>
                                <p className="font-medium text-dark">
                                    {renderMaterialDisplay(materialToReturn)}
                                </p>
                                <p className="text-sm text-neutral mt-2">
                                    Cantidad a devolver: {materialToReturn.quantity}{" "}
                                    {getItemUnit(materialToReturn)}
                                </p>
                            </div>

                            {/* Reason Input */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-dark mb-1">
                                    Motivo de Devolución{" "}
                                    <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    value={returnReason}
                                    onChange={(e) => setReturnReason(e.target.value)}
                                    className="w-full px-4 py-2 rounded-lg border border-neutral/30 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm resize-none"
                                    placeholder="Ej: Material no utilizado en la orden"
                                    rows={3}
                                    required
                                    disabled={returningMaterial}
                                />
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setReturnModalOpen(false)}
                                    className="flex-1 px-4 py-2 text-sm font-medium text-dark bg-white border border-neutral/30 rounded-lg hover:bg-gray-50 transition-colors"
                                    disabled={returningMaterial}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="button"
                                    onClick={handleReturnMaterial}
                                    disabled={returningMaterial}
                                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-600 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {returningMaterial ? (
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
                        </div>
                    </div>
                </div>
            )}

            {/* Order Equipment Modal */}
            {assignedCrewId && (
                <OrderEquipmentModal
                    isOpen={equipmentModalOpen}
                    onClose={() => setEquipmentModalOpen(false)}
                    crewId={assignedCrewId}
                    onAddEquipment={handleEquipmentModalAdd}
                />
            )}
        </>
    );
};
