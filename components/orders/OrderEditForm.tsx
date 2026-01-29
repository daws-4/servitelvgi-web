"use client";

import React, { useState, useEffect } from 'react';
import { FormInput } from '@/components/interactiveForms/Input';
import { FormTextarea } from '@/components/interactiveForms/Textarea';
import { MaterialsManager, Material } from './MaterialsManager';
import { OrderStatusManager, OrderStatus, OrderType } from './OrderStatusManager';
import { PhotoEvidenceManager } from './PhotoEvidenceManager';
import { InternetTestCard } from './InternetTestCard';
import { CustomerSignatureCard } from './CustomerSignatureCard';
import { InstallerLogManager, InstallerLogEntry } from './InstallerLogManager';
import { UserIcon } from '@/components/icons';

// Microchip icon for technical section
const MicrochipIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 512 512"
        className={className}
        fill="currentColor"
    >
        <path d="M176 24c0-13.3-10.7-24-24-24s-24 10.7-24 24V64c-35.3 0-64 28.7-64 64H24c-13.3 0-24 10.7-24 24s10.7 24 24 24H64v56H24c-13.3 0-24 10.7-24 24s10.7 24 24 24H64v56H24c-13.3 0-24 10.7-24 24s10.7 24 24 24H64c0 35.3 28.7 64 64 64v40c0 13.3 10.7 24 24 24s24-10.7 24-24V448h56v40c0 13.3 10.7 24 24 24s24-10.7 24-24V448h56v40c0 13.3 10.7 24 24 24s24-10.7 24-24V448c35.3 0 64-28.7 64-64h40c13.3 0 24-10.7 24-24s-10.7-24-24-24H448V280h40c13.3 0 24-10.7 24-24s-10.7-24-24-24H448V176h40c13.3 0 24-10.7 24-24s-10.7-24-24-24H448c0-35.3-28.7-64-64-64V24c0-13.3-10.7-24-24-24s-24 10.7-24 24V64H280V24c0-13.3-10.7-24-24-24s-24 10.7-24 24V64H176V24zM160 128H352c17.7 0 32 14.3 32 32V352c0 17.7-14.3 32-32 32H160c-17.7 0-32-14.3-32-32V160c0-17.7 14.3-32 32-32zm192 32H160V352H352V160z" />
    </svg>
);

export interface InternetTestData {
    downloadSpeed?: number;
    uploadSpeed?: number;
    ping?: number;
    provider?: string;
    wifiSSID?: string;
    frecuency?: string;
    coordinates?: {
        latitude?: number;
        longitude?: number;
    };
}

export interface EquipmentRecovered {
    ontId: string;
    serialNumber?: string;
    macAddress?: string;
    model?: string;
    condition?: "good" | "damaged" | "defective";
    notes?: string;
}

export interface OrderEditData {
    subscriberNumber: string;
    ticket_id?: string;
    subscriberName: string;
    phones: string;
    email: string;
    address: string;
    node: string;
    servicesToInstall: string;
    type: OrderType;
    status: OrderStatus;
    assignedTo?: string | null;
    materialsUsed?: Material[];
    photoEvidence?: string[]; // Image IDs in format "recordId:filename"
    internetTest?: InternetTestData;
    customerSignature?: string; // Base64 from react-native-signature-canvas
    equipmentRecovered?: EquipmentRecovered; // For recovery orders
    installerLog?: InstallerLogEntry[];
    technicianName?: string;
    updatedAt?: Date | string; // Order finalization date
    visitCount?: number;
    powerNap?: string;
    powerRoseta?: string;
    remainingPorts?: number;
    etiqueta?: {
        color: "verde" | "rojo" | "azul";
        numero: number;
    };
}

interface OrderEditFormProps {
    orderId: string;
    initialData: OrderEditData;
    onSave?: (data: OrderEditData) => Promise<void>;
    onCancel?: () => void;
    onDelete?: () => Promise<void>;
}

export const OrderEditForm: React.FC<OrderEditFormProps> = ({
    orderId,
    initialData,
    onSave,
    onCancel,
    onDelete
}) => {
    const [formData, setFormData] = useState<OrderEditData>(initialData);
    const [materials, setMaterials] = useState<Material[]>(initialData.materialsUsed || []);
    const [photoIds, setPhotoIds] = useState<string[]>(initialData.photoEvidence || []);
    const [installerLog, setInstallerLog] = useState<InstallerLogEntry[]>(initialData.installerLog || []);
    const [equipment, setEquipment] = useState<EquipmentRecovered>(initialData.equipmentRecovered || {
        ontId: '',
        serialNumber: '',
        macAddress: '',
        model: '',
        condition: 'good',
        notes: ''
    });
    const [isSaving, setIsSaving] = useState(false);

    // Check if this is a recovery order
    const isRecoveryOrder = formData.type === 'recuperacion';

    const handleInputChange = (field: keyof OrderEditData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleStatusManagerSave = async (data: {
        status: OrderStatus;
        type: OrderType;
        assignedTo: string;
    }) => {
        // Validate required fields
        if (!formData.subscriberNumber.trim()) {
            alert('El número de abonado es obligatorio');
            return;
        }

        setIsSaving(true);

        try {
            const updatedData: OrderEditData = {
                ...formData,
                status: data.status,
                type: data.type,
                assignedTo: data.assignedTo || null,
                materialsUsed: materials,
                photoEvidence: photoIds,
                equipmentRecovered: isRecoveryOrder ? equipment : undefined,
                installerLog: installerLog,
            };

            if (onSave) {
                await onSave(updatedData);
            } else {
                // Default save implementation
                const response = await fetch('/api/web/orders', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        id: orderId,
                        ...updatedData,
                        ticket_id: updatedData.ticket_id?.trim() || undefined, // Allow empty ticket
                        phones: updatedData.phones.split(',').map(p => p.trim()).filter(p => p),
                        servicesToInstall: updatedData.servicesToInstall.split(',').map(s => s.trim()).filter(s => s),
                    }),
                });

                if (response.ok) {
                    alert('¡Orden actualizada correctamente!');
                } else {
                    throw new Error('Failed to update order');
                }
            }
        } catch (error) {
            console.error('Error saving order:', error);
            alert('Error al actualizar la orden. Por favor, intenta de nuevo.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        if (confirm('¿Estás seguro de cancelar? Se perderán los cambios no guardados.')) {
            if (onCancel) {
                onCancel();
            } else {
                window.history.back();
            }
        }
    };

    const handleMaterialsAutoSave = async (newMaterials: Material[]) => {
        try {
            // Send PUT request to update only materials
            // Note: We send the current state of other important fields if needed, 
            // but the API should handle partial updates if designed well. 
            // Here we send minimal required fields + materials

            const payload = {
                id: orderId,
                // Include other required fields if the API validation is strict, 
                // but ideally a PATCH or relaxed PUT handles this.
                // Re-sending current form data to be safe with the current PUT logic
                ...formData,
                ticket_id: formData.ticket_id?.trim() || undefined, // Allow empty ticket
                materialsUsed: newMaterials, // Overwrite specifically
                phones: formData.phones.split(',').map(p => p.trim()).filter(p => p),
                servicesToInstall: formData.servicesToInstall.split(',').map(s => s.trim()).filter(s => s),
            };

            const response = await fetch('/api/web/orders', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Failed to auto-save materials');
            }

            // If successful, update local state too just in case
            setMaterials(newMaterials);

        } catch (error) {
            console.error("Auto-save materials failed:", error);
            throw error; // Re-throw to be handled by the caller (MaterialsManager alert)
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* LEFT COLUMN (2/3) */}
            <div className="lg:col-span-2 space-y-6">

                {/* 1. Subscriber Data */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="bg-gray-50/50 border-b border-gray-100 px-6 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <UserIcon className="text-secondary w-5 h-5" />
                            <h3 className="font-semibold text-secondary">Datos del Abonado</h3>
                        </div>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormInput
                            label="N. Abonado"
                            value={formData.subscriberNumber}
                            onValueChange={(value) => handleInputChange('subscriberNumber', value)}
                            isRequired
                            description="Campo obligatorio"
                        />
                        <FormInput
                            label="ID del Ticket"
                            placeholder="Ej: TKT-2026-001"
                            value={formData.ticket_id || ''}
                            onValueChange={(value) => handleInputChange('ticket_id', value)}
                            description="Opcional: ID del ticket asociado"
                        />
                        <FormInput
                            label="Nombre Completo"
                            value={formData.subscriberName}
                            onValueChange={(value) => handleInputChange('subscriberName', value)}
                        />
                        <FormInput
                            label="Teléfonos"
                            value={formData.phones}
                            onValueChange={(value) => handleInputChange('phones', value)}
                        />
                        <FormInput
                            label="Correo Electrónico"
                            type="email"
                            value={formData.email}
                            onValueChange={(value) => handleInputChange('email', value)}
                        />
                        <div className="md:col-span-2">
                            <FormTextarea
                                label="Dirección"
                                value={formData.address}
                                onChange={(e) => handleInputChange('address', e.target.value)}
                                minRows={2}
                            />
                        </div>
                    </div>
                </div>

                {/* 2. Technical Data */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="bg-gray-50/50 border-b border-gray-100 px-6 py-4 flex items-center gap-2">
                        <MicrochipIcon className="text-secondary w-5 h-5" />
                        <h3 className="font-semibold text-secondary">Datos Técnicos</h3>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormInput
                            label="Nodo / Ubicación"
                            value={formData.node}
                            onValueChange={(value) => handleInputChange('node', value)}
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <FormInput
                                label="Potencia Nap"
                                value={formData.powerNap || ''}
                                onValueChange={(value) => handleInputChange('powerNap', value)}
                                placeholder="Ej: -20.5"
                            />
                            <FormInput
                                label="Potencia Roseta"
                                value={formData.powerRoseta || ''}
                                onValueChange={(value) => handleInputChange('powerRoseta', value)}
                                placeholder="Ej: -21.2"
                            />
                        </div>
                        <FormInput
                            label="Puertos Restantes"
                            type="number"
                            value={formData.remainingPorts?.toString() || ''}
                            onValueChange={(value) => setFormData(prev => ({ ...prev, remainingPorts: parseInt(value) || undefined }))}
                            placeholder="Ej: 4"
                        />

                        {/* Etiqueta Section */}
                        <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <div className="md:col-span-3">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <i className="fa-solid fa-tag mr-2 text-secondary"></i>
                                    Etiqueta
                                </label>
                            </div>
                            <div className="md:col-span-1">
                                <label className="block text-xs font-medium text-gray-600 mb-1">Color</label>
                                <select
                                    value={formData.etiqueta?.color || ''}
                                    onChange={(e) => setFormData(prev => ({
                                        ...prev,
                                        etiqueta: {
                                            color: e.target.value as "verde" | "rojo" | "azul",
                                            numero: prev.etiqueta?.numero || 0
                                        }
                                    }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent text-sm"
                                >
                                    <option value="">Seleccionar color</option>
                                    <option value="verde">🟢 Verde</option>
                                    <option value="rojo">🔴 Rojo</option>
                                    <option value="azul">🔵 Azul</option>
                                </select>
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-xs font-medium text-gray-600 mb-1">Número</label>
                                <input
                                    type="number"
                                    value={formData.etiqueta?.numero?.toString() || ''}
                                    onChange={(e) => setFormData(prev => ({
                                        ...prev,
                                        etiqueta: {
                                            color: prev.etiqueta?.color || 'verde',
                                            numero: parseInt(e.target.value) || 0
                                        }
                                    }))}
                                    placeholder="Ingrese un número"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent text-sm"
                                />
                            </div>
                        </div>

                        <div className="md:col-span-2">
                            <FormTextarea
                                label="Servicios / Reporte"
                                value={formData.servicesToInstall}
                                onChange={(e) => handleInputChange('servicesToInstall', e.target.value)}
                                minRows={2}
                            />
                        </div>
                    </div>
                </div>

                {/* 3. Materials Used (Hidden for recovery orders) */}
                {!isRecoveryOrder && (
                    <MaterialsManager
                        orderId={orderId}
                        assignedCrewId={formData.assignedTo || undefined}
                        initialMaterials={materials}
                        onChange={setMaterials}
                        onImmediateSave={handleMaterialsAutoSave}
                    />
                )}

                {/* 3b. Equipment Recovered (Only for recovery orders) */}
                {isRecoveryOrder && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="bg-blue-50/50 border-b border-blue-100 px-6 py-4 flex items-center gap-2">
                            <i className="fa-solid fa-box-archive text-blue-600"></i>
                            <h3 className="font-semibold text-blue-900">Equipo Recuperado (ONT)</h3>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormInput
                                    label="ID de la ONT"
                                    placeholder="Ingrese el ID de la ONT"
                                    value={equipment.ontId}
                                    onValueChange={(value) => setEquipment(prev => ({ ...prev, ontId: value }))}
                                    isRequired
                                    description="Campo obligatorio"
                                />
                                <FormInput
                                    label="Número de Serie"
                                    placeholder="Ej: SN123456789"
                                    value={equipment.serialNumber || ''}
                                    onValueChange={(value) => setEquipment(prev => ({ ...prev, serialNumber: value }))}
                                />
                                <FormInput
                                    label="Dirección MAC"
                                    placeholder="Ej: 00:1A:2B:3C:4D:5E"
                                    value={equipment.macAddress || ''}
                                    onValueChange={(value) => setEquipment(prev => ({ ...prev, macAddress: value }))}
                                />
                                <FormInput
                                    label="Modelo"
                                    placeholder="Ej: HG8546M"
                                    value={equipment.model || ''}
                                    onValueChange={(value) => setEquipment(prev => ({ ...prev, model: value }))}
                                />
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Condición del Equipo
                                    </label>
                                    <select
                                        value={equipment.condition}
                                        onChange={(e) => setEquipment(prev => ({ ...prev, condition: e.target.value as 'good' | 'damaged' | 'defective' }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value="good">Bueno</option>
                                        <option value="damaged">Dañado</option>
                                        <option value="defective">Defectuoso</option>
                                    </select>
                                </div>
                                <div className="md:col-span-2">
                                    <FormTextarea
                                        label="Notas Adicionales"
                                        placeholder="Observaciones sobre el estado del equipo..."
                                        value={equipment.notes || ''}
                                        onChange={(e) => setEquipment(prev => ({ ...prev, notes: e.target.value }))}
                                        minRows={3}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}


                {/* 4. Photo Evidence */}
                <PhotoEvidenceManager
                    orderId={orderId}
                    installerId={formData.assignedTo || undefined} // Using assignedTo as installer for now
                    crewId={formData.assignedTo || undefined}
                    initialPhotoIds={photoIds}
                    onChange={setPhotoIds}
                />

                {/* 5. Installer Log */}
                <InstallerLogManager
                    initialLogs={installerLog}
                    onChange={setInstallerLog}
                    currentStatus={formData.status}
                />

                {/* 6. Internet Test Results (Hidden for recovery orders) */}
                {!isRecoveryOrder && <InternetTestCard data={formData.internetTest} />}

                {/* 7. Customer Signature (Hidden for recovery orders) */}
                {!isRecoveryOrder && (
                    <CustomerSignatureCard
                        signature={formData.customerSignature}
                        onDelete={async () => {
                            try {
                                const response = await fetch(`/api/web/upload/signature?orderId=${orderId}`, {
                                    method: 'DELETE',
                                });

                                if (response.ok) {
                                    setFormData(prev => ({ ...prev, customerSignature: undefined }));
                                    alert("Firma eliminada correctamente");
                                } else {
                                    const err = await response.json();
                                    throw new Error(err.error || "Error al eliminar la firma");
                                }
                            } catch (error: any) {
                                console.error("Error deleting signature:", error);
                                alert(error.message);
                            }
                        }}
                    />
                )}

            </div>

            {/* RIGHT COLUMN (1/3) - Status & Assignment */}
            <div className="space-y-6">
                <OrderStatusManager
                    orderId={orderId}
                    orderName={formData.subscriberName}
                    initialStatus={formData.status}
                    initialType={formData.type}
                    initialAssignedTo={formData.assignedTo || undefined}
                    onStatusChange={(status) => setFormData(prev => ({ ...prev, status }))}
                    onTypeChange={(type) => setFormData(prev => ({ ...prev, type }))}
                    onAssignedToChange={(assignedTo) => setFormData(prev => ({ ...prev, assignedTo }))}
                    onSave={handleStatusManagerSave}
                    onCancel={handleCancel}
                    onDelete={onDelete}
                    isSaving={isSaving}
                />
            </div>
        </div>
    );
};
