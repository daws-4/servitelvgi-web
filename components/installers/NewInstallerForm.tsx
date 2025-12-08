"use client";

import React, { useState, useEffect } from 'react';
import { FormInput } from '@/components/interactiveForms/Input';
import { FormSelect, SelectOption } from '@/components/interactiveForms/Select';
import { FormButton } from '@/components/interactiveForms/Button';
import { EyeOpenIcon, EyeCloseIcon } from '@/components/icons';

interface NewInstallerFormData {
    // User account fields
    username: string;
    password: string;
    confirmPassword: string;
    surname: string;
    email: string;

    // Installer profile fields
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
        // User account fields
        username: '',
        password: '',
        confirmPassword: '',
        surname: '',
        email: '',

        // Installer profile fields
        name: '',
        phone: '',
        status: 'active',
        currentCrew: '',
    });

    const [crews, setCrews] = useState<any[]>([]);
    const [isLoadingCrews, setIsLoadingCrews] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

        // Validate password confirmation
        if (formData.password !== formData.confirmPassword) {
            alert('Las contraseñas no coinciden');
            return;
        }

        setIsSaving(true);

        try {
            const requestDataInstaller = {
                username: formData.username,
                password: formData.password,
                email: formData.email,
                surname: formData.surname,
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
                body: JSON.stringify(requestDataInstaller),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Error al crear el instalador');
            }

            alert('¡Instalador y cuenta de usuario creados exitosamente!');
            if (onSuccess) onSuccess();
        } catch (error: any) {
            console.error('Error creating installer:', error);
            alert(error.message || 'Error al crear el instalador. Por favor, intenta de nuevo.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* User Account Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-gray-50/50 border-b border-gray-100 px-6 py-4">
                    <h3 className="font-semibold text-secondary flex items-center gap-2">
                        <i className="fa-solid fa-user-lock text-secondary"></i>
                        Cuenta de Usuario
                    </h3>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormInput
                        label="Usuario"
                        value={formData.username}
                        onValueChange={(value) => handleInputChange('username', value)}
                        isRequired
                        placeholder="Ej: jperez"
                    />
                    <FormInput
                        label="Email"
                        type="email"
                        value={formData.email}
                        onValueChange={(value) => handleInputChange('email', value)}
                        isRequired
                        placeholder="Ej: jperez@example.com"
                    />
                    <div className="relative">
                        <FormInput
                            label="Contraseña"
                            type={showPassword ? "text" : "password"}
                            value={formData.password}
                            onValueChange={(value) => handleInputChange('password', value)}
                            isRequired
                            placeholder="Mínimo 6 caracteres"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-[38px] text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                            tabIndex={-1}
                        >
                            {showPassword ? <EyeOpenIcon className="w-5 h-5" /> : <EyeCloseIcon className="w-5 h-5" />}
                        </button>
                    </div>
                    <div className="relative">
                        <FormInput
                            label="Confirmar Contraseña"
                            type={showConfirmPassword ? "text" : "password"}
                            value={formData.confirmPassword}
                            onValueChange={(value) => handleInputChange('confirmPassword', value)}
                            isRequired
                            placeholder="Repetir contraseña"
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-[38px] text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                            tabIndex={-1}
                        >
                            {showConfirmPassword ? <EyeOpenIcon className="w-5 h-5" /> : <EyeCloseIcon className="w-5 h-5" />}
                        </button>
                    </div>
                </div>
            </div>

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
                        label="Nombre"
                        value={formData.name}
                        onValueChange={(value) => handleInputChange('name', value)}
                        isRequired
                        placeholder="Ej: Juan"
                    />
                    <FormInput
                        label="Apellido"
                        value={formData.surname}
                        onValueChange={(value) => handleInputChange('surname', value)}
                        isRequired
                        placeholder="Ej: Pérez"
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
                        className="md:col-span-2"
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
                    isDisabled={!formData.name || !formData.phone || !formData.username || !formData.password || !formData.email || !formData.surname}
                >
                    <i className="fa-solid fa-save"></i>
                    Guardar Instalador
                </FormButton>
            </div>
        </form>
    );
};

export default NewInstallerForm;
