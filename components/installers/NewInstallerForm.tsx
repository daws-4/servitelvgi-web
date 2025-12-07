"use client";

import React, { useState, useEffect } from 'react';
import { FormInput } from '@/components/interactiveForms/Input';
import { FormSelect, SelectOption } from '@/components/interactiveForms/Select';
import { FormButton } from '@/components/interactiveForms/Button';

interface NewInstallerFormData {
    name: string;
    phone: string;
    status: string;
    currentCrew: string;
}

interface NewInstallerFormProps {
    onSuccess?: () => void;
    onCancel?: () => void;
}

export const NewInstallerForm: React.FC<NewInstallerFormProps> = ({ onSuccess, onCancel }) => {
    const [formData, setFormData] = useState<NewInstallerFormData>({
        name: '',
        phone: '',
        status: 'active',
        currentCrew: '',
    });

    const [crews, setCrews] = useState<any[]>([]);
    const [isLoadingCrews, setIsLoadingCrews] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Load crews from API
    useEffect(() => {
        const loadCrews = async () => {
            setIsLoadingCrews(true);
            try {
                const res = await fetch('/api/web/crews');
                if (res.ok) {
                    const data = await res.json();
                    setCrews(data);
                }
            } catch (error) {
                console.error('Error loading crews:', error);
            } finally {
                setIsLoadingCrews(false);
            }
        };

        loadCrews();
    }, []);

    const statusOptions: SelectOption[] = [
        { key: 'active', label: 'Activo' },
        { key: 'inactive', label: 'Inactivo' },
    ];

    const crewOptions: SelectOption[] = [
        { key: '', label: 'Sin Cuadrilla' },
        ...crews.map(crew => ({
            key: crew._id,
            label: crew.name
        }))
    ];

    const handleInputChange = (field: keyof NewInstallerFormData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        try {
            // Prepare installer data
            const installerData = {
                name: formData.name,
                phone: formData.phone,
                status: formData.status,
                currentCrew: formData.currentCrew || null,
            };

            const response = await fetch('/api/web/installers', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(installerData),
            });

            if (!response.ok) {
                throw new Error('Error al crear el instalador');
            }

            alert('¡Instalador creado exitosamente!');
            if (onSuccess) onSuccess();
        } catch (error) {
            console.error('Error creating installer:', error);
            alert('Error al crear el instalador. Por favor, intenta de nuevo.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Installer Information */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-gray-50/50 border-b border-gray-100 px-6 py-4">
                    <h3 className="font-semibold text-secondary flex items-center gap-2">
                        <i className="fa-solid fa-user text-secondary"></i>
                        Información del Instalador
                    </h3>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormInput
                        label="Nombre Completo"
                        value={formData.name}
                        onValueChange={(value) => handleInputChange('name', value)}
                        isRequired
                        placeholder="Ej: Juan Pérez"
                    />
                    <FormInput
                        label="Teléfono"
                        value={formData.phone}
                        onValueChange={(value) => handleInputChange('phone', value)}
                        isRequired
                        placeholder="Ej: 0424-1234567"
                    />
                    <FormSelect
                        label="Estado"
                        selectedKeys={[formData.status]}
                        options={statusOptions}
                        onSelectionChange={(keys) => {
                            const key = Array.from(keys)[0];
                            if (key) handleInputChange('status', key.toString());
                        }}
                        placeholder="Seleccionar estado"
                    />
                    <FormSelect
                        label="Cuadrilla"
                        selectedKeys={formData.currentCrew ? [formData.currentCrew] : []}
                        options={crewOptions}
                        onSelectionChange={(keys) => {
                            const key = Array.from(keys)[0];
                            handleInputChange('currentCrew', key ? key.toString() : '');
                        }}
                        placeholder="Seleccionar cuadrilla (opcional)"
                        isLoading={isLoadingCrews}
                    />
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 justify-end">
                <FormButton
                    type="button"
                    onPress={onCancel}
                    className="bg-primary"
                    isDisabled={isSaving}
                >
                    Cancelar
                </FormButton>
                <FormButton
                    type="submit"
                    className="bg-secondary"
                    isLoading={isSaving}
                    isDisabled={!formData.name || !formData.phone}
                >
                    <i className="fa-solid fa-save"></i>
                    Guardar Instalador
                </FormButton>
            </div>
        </form>
    );
};

export default NewInstallerForm;
