"use client";

import React, { useState, useEffect } from 'react';
import { FormInput } from '@/components/interactiveForms/Input';
import { FormSelect, SelectOption } from '@/components/interactiveForms/Select';
import { FormButton } from '@/components/interactiveForms/Button';

interface NewCrewFormData {
    number: string;
    leader: string;
    members: string[];
    isActive: boolean;
}

interface NewCrewFormProps {
    onSuccess?: () => void;
    onCancel?: () => void;
}

export const NewCrewForm: React.FC<NewCrewFormProps> = ({ onSuccess, onCancel }) => {
    const [formData, setFormData] = useState<NewCrewFormData>({
        number: '',
        leader: '',
        members: [],
        isActive: true,
    });

    const [installers, setInstallers] = useState<any[]>([]);
    const [isLoadingInstallers, setIsLoadingInstallers] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Load installers from API
    useEffect(() => {
        const loadInstallers = async () => {
            setIsLoadingInstallers(true);
            try {
                const res = await fetch('/api/web/installers');
                if (res.ok) {
                    const data = await res.json();
                    setInstallers(data);
                }
            } catch (error) {
                console.error('Error loading installers:', error);
            } finally {
                setIsLoadingInstallers(false);
            }
        };

        loadInstallers();
    }, []);

    const statusOptions: SelectOption[] = [
        { key: 'true', label: 'Activa' },
        { key: 'false', label: 'Inactiva' },
    ];

    const installerOptions: SelectOption[] = installers
        .filter(installer => !installer.currentCrew) // Solo instaladores sin cuadrilla
        .map(installer => ({
            key: installer._id,
            label: `${installer.name} ${installer.surname}`
        }));

    // Filter out the leader from member options
    const memberOptions: SelectOption[] = installerOptions.filter(
        option => option.key !== formData.leader
    );

    const handleInputChange = (field: keyof NewCrewFormData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.number || !formData.leader) {
            alert('Por favor completa los campos requeridos');
            return;
        }

        setIsSaving(true);

        try {
            const requestData = {
                number: parseInt(formData.number),
                leader: formData.leader,
                members: formData.members,
                isActive: formData.isActive,
            };

            const response = await fetch('/api/web/crews', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Error al crear la cuadrilla');
            }

            alert('¡Cuadrilla creada exitosamente!');
            if (onSuccess) onSuccess();
        } catch (error: any) {
            console.error('Error creating crew:', error);
            alert(error.message || 'Error al crear la cuadrilla. Por favor, intenta de nuevo.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Crew Information */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-gray-50/50 border-b border-gray-100 px-6 py-4">
                    <h3 className="font-semibold text-secondary flex items-center gap-2">
                        <i className="fa-solid fa-users-gear text-secondary"></i>
                        Información de la Cuadrilla
                    </h3>
                </div>
                <div className="p-6 grid grid-cols-1 gap-6">
                    <FormInput
                        label="Nombre de la Cuadrilla"
                        value={formData.number}
                        onValueChange={(value) => handleInputChange('number', value)}
                        isRequired
                        type="number"
                        placeholder="Ej: 1"
                    />

                    <FormSelect
                        label="Líder de la Cuadrilla"
                        selectedKeys={formData.leader ? [formData.leader] : []}
                        options={installerOptions}
                        onSelectionChange={(keys) => {
                            const key = Array.from(keys)[0];
                            handleInputChange('leader', key ? key.toString() : '');
                        }}
                        placeholder="Seleccionar líder"
                        isLoading={isLoadingInstallers}
                        isRequired
                    />

                    <FormSelect
                        label="Miembros de la Cuadrilla"
                        selectedKeys={formData.members}
                        options={memberOptions}
                        onSelectionChange={(keys) => {
                            handleInputChange('members', Array.from(keys).map(k => k.toString()));
                        }}
                        placeholder="Seleccionar miembros (opcional)"
                        isLoading={isLoadingInstallers}
                        selectionMode="multiple"
                    />

                    <FormSelect
                        label="Estado"
                        selectedKeys={[formData.isActive.toString()]}
                        options={statusOptions}
                        onSelectionChange={(keys) => {
                            const key = Array.from(keys)[0];
                            if (key) handleInputChange('isActive', key.toString() === 'true');
                        }}
                        placeholder="Seleccionar estado"
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
                    isDisabled={!formData.number || !formData.leader}
                >
                    <i className="fa-solid fa-save"></i>
                    Guardar Cuadrilla
                </FormButton>
            </div>
        </form>
    );
};

export default NewCrewForm;
