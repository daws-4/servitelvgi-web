"use client";

import React, { useState, useEffect } from 'react';
import { FormInput } from '@/components/interactiveForms/Input';
import { FormTextarea } from '@/components/interactiveForms/Textarea';
import { FormSelect, SelectOption } from '@/components/interactiveForms/Select';
import { CustomAutocomplete, Item } from '@/components/interactiveForms/Autocomplete';
import { FormButton } from '@/components/interactiveForms/Button';
import { StatusIndicator } from './StatusIndicator';
import { UserIcon } from '@/components/icons';


// Icons for section headers
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

const SaveIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 448 512"
        className={className}
        fill="currentColor"
    >
        <path d="M64 32C28.7 32 0 60.7 0 96V416c0 35.3 28.7 64 64 64H384c35.3 0 64-28.7 64-64V173.3c0-17-6.7-33.3-18.7-45.3L352 50.7C340 38.7 323.7 32 306.7 32H64zm0 96c0-17.7 14.3-32 32-32H288c17.7 0 32 14.3 32 32v64c0 17.7-14.3 32-32 32H96c-17.7 0-32-14.3-32-32V128zM224 288a64 64 0 1 1 0 128 64 64 0 1 1 0-128z" />
    </svg>
);

interface NewOrderFormData {
    subscriberNumber: string;
    ticket_id: string;
    subscriberName: string;
    phones: string;
    email: string;
    address: string;
    node: string;
    servicesToInstall: string;
    type: string;
    assignedToId?: string;
    assignedToName?: string;
}

interface NewOrderFormProps {
    onSuccess?: () => void;
    onCancel?: () => void;
}

export const NewOrderForm: React.FC<NewOrderFormProps> = ({ onSuccess, onCancel }) => {
    const [formData, setFormData] = useState<NewOrderFormData>({
        subscriberNumber: '',
        ticket_id: '',
        subscriberName: '',
        phones: '',
        email: '',
        address: '',
        node: '',
        servicesToInstall: '',
        type: 'instalacion',
        assignedToId: undefined,
        assignedToName: '',
    });

    const [crews, setCrews] = useState<Item[]>([]);
    const [isLoadingCrews, setIsLoadingCrews] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Load crews from API
    useEffect(() => {
        const loadCrews = async () => {
            setIsLoadingCrews(true);
            try {
                const res = await fetch('/api/web/crews');
                if (res.ok) {
                    const json = await res.json();
                    const mappedData: Item[] = json.map((crew: any) => ({
                        id: crew._id,
                        name: `Cuadrilla ${crew.number}`,
                        description: crew.leader ? `Líder: ${crew.leader.name} ${crew.leader.surname}` : 'Sin líder'
                    }));
                    setCrews(mappedData);
                }
            } catch (error) {
                console.error('Error cargando cuadrillas:', error);
            } finally {
                setIsLoadingCrews(false);
            }
        };

        loadCrews();
    }, []);

    const orderTypeOptions: SelectOption[] = [
        { key: 'instalacion', label: 'Instalación' },
        { key: 'averia', label: 'Avería' },
        { key: 'recuperacion', label: 'Recuperación' },
        { key: 'otro', label: 'Otro' },
    ];

    const handleInputChange = (field: keyof NewOrderFormData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleCrewChange = (key: React.Key | null) => {
        if (key) {
            const selectedCrew = crews.find(c => c.id === key);
            setFormData(prev => ({
                ...prev,
                assignedToId: key.toString(),
                assignedToName: selectedCrew?.name || '',
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                assignedToId: undefined,
                assignedToName: '',
            }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        try {
            // Prepare order data
            const orderData = {
                subscriberNumber: formData.subscriberNumber,
                ticket_id: formData.ticket_id || undefined,
                subscriberName: formData.subscriberName,
                phones: formData.phones.split(',').map(p => p.trim()).filter(p => p),
                email: formData.email,
                address: formData.address,
                node: formData.node,
                servicesToInstall: formData.servicesToInstall.split(',').map(s => s.trim()).filter(s => s),
                type: formData.type,
                status: formData.assignedToId ? 'assigned' : 'pending',
                assignedTo: formData.assignedToId || null,
            };

            const response = await fetch('/api/web/orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(orderData),
            });

            if (response.ok) {
                // Reset form
                setFormData({
                    subscriberNumber: '',
                    ticket_id: '',
                    subscriberName: '',
                    phones: '',
                    email: '',
                    address: '',
                    node: '',
                    servicesToInstall: '',
                    type: 'instalacion',
                    assignedToId: undefined,
                    assignedToName: '',
                });

                // Show success message
                alert('¡Orden creada con éxito!');

                // Call success callback if provided
                if (onSuccess) {
                    onSuccess();
                }
            } else {
                alert('Error al crear la orden');
            }
        } catch (error) {
            console.error('Error guardando orden:', error);
            alert('Error al crear la orden');
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        if (confirm('¿Estás seguro de cancelar? Se perderán los cambios.')) {
            if (onCancel) {
                onCancel();
            } else {
                window.history.back();
            }
        }
    };

    return (
        <form onSubmit={handleSubmit} className="w-full">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* LEFT COLUMN - Main Data (2 spaces) */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Subscriber Data Card */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="bg-gray-50/50 border-b border-gray-100 px-6 py-4 flex items-center gap-2">
                            <UserIcon className="text-secondary w-5 h-5" />
                            <h3 className="font-semibold text-secondary">Datos del Abonado</h3>
                        </div>
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">

                            <FormInput
                                label="N. Abonado (ID)"
                                placeholder="Ej: 368063"
                                value={formData.subscriberNumber}
                                onValueChange={(value) => handleInputChange('subscriberNumber', value)}
                                isRequired
                            />

                            <FormInput
                                label="ID del Ticket"
                                placeholder="Ej: TKT-2026-001"
                                value={formData.ticket_id}
                                onValueChange={(value) => handleInputChange('ticket_id', value)}
                                description="Opcional: ID del ticket asociado"
                            />

                            <FormInput
                                label="Nombre Completo"
                                placeholder="Ej: Daniel Hernandez"
                                value={formData.subscriberName}
                                onValueChange={(value) => handleInputChange('subscriberName', value)}
                                isRequired
                            />

                            <FormInput
                                label="Teléfonos"
                                placeholder="Ej: 0424..., 0414..."
                                value={formData.phones}
                                onValueChange={(value) => handleInputChange('phones', value)}
                                description="Separa múltiples números con comas"
                            />

                            <FormInput
                                label="Correo Electrónico"
                                type="email"
                                placeholder="cliente@email.com"
                                value={formData.email}
                                onValueChange={(value) => handleInputChange('email', value)}
                            />

                            <div className="md:col-span-2">
                                <FormTextarea
                                    label="Dirección Detallada"
                                    placeholder="Municipio, Sector, Calle, Casa, Puntos de referencia..."
                                    value={formData.address}
                                    onChange={(e) => handleInputChange('address', e.target.value)}
                                    isRequired
                                    minRows={3}
                                />
                            </div>

                        </div>
                    </div>

                    {/* Technical Data Card */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="bg-gray-50/50 border-b border-gray-100 px-6 py-4 flex items-center gap-2">
                            <MicrochipIcon className="text-secondary w-5 h-5" />
                            <h3 className="font-semibold text-secondary">Datos Técnicos</h3>
                        </div>
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">

                            <FormInput
                                label="Nodo / Ubicación"
                                placeholder="Ej: SCRVEG20112A-GPON"
                                value={formData.node}
                                onValueChange={(value) => handleInputChange('node', value)}
                            />

                            <div className="md:col-span-2">
                                <FormTextarea
                                    label="Servicios a Instalar / Reporte de Falla / Recuperación de equipo"
                                    placeholder="Ej: Internet, Streaming, FibraNet500..."
                                    value={formData.servicesToInstall}
                                    onChange={(e) => handleInputChange('servicesToInstall', e.target.value)}
                                    description="Separa múltiples servicios o fallas con comas"
                                    minRows={3}
                                />
                            </div>

                        </div>
                    </div>

                </div>

                {/* RIGHT COLUMN - Order Management (1 space) */}
                <div className="space-y-6">

                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden h-full flex flex-col">
                        <div className="bg-background/30 border-b border-background px-6 py-4">
                            <h3 className="font-semibold text-secondary">Gestión de la Orden</h3>
                        </div>
                        <div className="p-6 flex flex-col gap-6 flex-1">

                            {/* Order Type */}
                            <FormSelect
                                label="Tipo de Orden"
                                options={orderTypeOptions}
                                selectedKeys={[formData.type]}
                                onSelectionChange={(keys) => {
                                    const selected = Array.from(keys)[0];
                                    if (selected) handleInputChange('type', selected.toString());
                                }}
                                isRequired
                            />

                            {/* Crew Assignment */}
                            <CustomAutocomplete
                                label="Asignar Cuadrilla"
                                items={crews}
                                isLoading={isLoadingCrews}
                                placeholder="Buscar cuadrilla..."
                                onSelectionChange={handleCrewChange}
                            />

                            {/* Status Indicator */}
                            <StatusIndicator isAssigned={!!formData.assignedToId} />

                            <hr className="border-gray-100 my-2" />

                            {/* Action Buttons */}
                            <div className="mt-auto flex flex-col gap-3">
                                <FormButton
                                    type="submit"
                                    label={isSaving ? 'Guardando...' : 'Guardar Orden'}
                                    isLoading={isSaving}
                                    className="w-full shadow-md shadow-primary/20"
                                    classNames={{
                                        base: 'w-full bg-primary hover:bg-secondary text-white font-medium py-2.5 px-4 rounded-lg shadow-md shadow-primary/20 transition-all'
                                    }}
                                    startContent={!isSaving ? <SaveIcon className="w-4 h-4" /> : undefined}
                                />
                                <button
                                    type="button"
                                    onClick={handleCancel}
                                    className="w-full bg-white hover:bg-gray-50 text-red-500 font-medium py-2.5 px-4 rounded-lg border border-transparent hover:border-red-100 transition-all cursor-pointer"
                                >
                                    Cancelar
                                </button>
                            </div>

                        </div>
                    </div>

                </div>
            </div>
        </form>
    );
};

export default NewOrderForm;
