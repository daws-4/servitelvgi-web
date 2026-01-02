"use client";

import React, { useState, useEffect } from 'react';
import { FormInput } from '@/components/interactiveForms/Input';
import { FormTextarea } from '@/components/interactiveForms/Textarea';
import { MaterialsManager, Material } from './MaterialsManager';
import { OrderStatusManager, OrderStatus, OrderType } from './OrderStatusManager';
import { PhotoEvidenceManager } from './PhotoEvidenceManager';
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

export interface OrderEditData {
    subscriberNumber: string;
    subscriberName: string;
    phones: string;
    email: string;
    address: string;
    node: string;
    servicesToInstall: string;
    type: OrderType;
    status: OrderStatus;
    assignedTo?: string;
    materialsUsed?: Material[];
    photoEvidence?: string[]; // Image IDs in format "recordId:filename"
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
    const [isSaving, setIsSaving] = useState(false);

    const handleInputChange = (field: keyof OrderEditData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleStatusManagerSave = async (data: {
        status: OrderStatus;
        type: OrderType;
        assignedTo: string;
        reportDetails?: string;
    }) => {
        setIsSaving(true);

        try {
            const updatedData: OrderEditData = {
                ...formData,
                status: data.status,
                type: data.type,
                assignedTo: data.assignedTo || undefined,
                materialsUsed: materials,
                photoEvidence: photoIds,
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
                            isReadOnly
                            classNames={{
                                input: 'bg-gray-50 text-gray-500 cursor-not-allowed'
                            }}
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

                {/* 3. Materials Used */}
                <MaterialsManager
                    orderId={orderId}
                    assignedCrewId={formData.assignedTo}
                    initialMaterials={materials}
                    onChange={setMaterials}
                />

                {/* 4. Photo Evidence */}
                <PhotoEvidenceManager
                    orderId={orderId}
                    installerId={formData.assignedTo} // Using assignedTo as installer for now
                    crewId={formData.assignedTo}
                    initialPhotoIds={photoIds}
                    onChange={setPhotoIds}
                />

            </div>

            {/* RIGHT COLUMN (1/3) - Status & Assignment */}
            <div className="space-y-6">
                <OrderStatusManager
                    orderId={orderId}
                    orderName={formData.subscriberName}
                    initialStatus={formData.status}
                    initialType={formData.type}
                    initialAssignedTo={formData.assignedTo}
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
