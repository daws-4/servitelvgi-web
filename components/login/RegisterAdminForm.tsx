"use client";

import React, { useState } from "react";
import { FormFieldWithIcon, PasswordFieldWithToggle } from "@/components/interactiveForms/FormFieldWithIcon";

interface RegisterAdminFormProps {
    onSubmit: (data: AdminFormData) => Promise<void>;
    loading: boolean;
    error: string | null;
}

export interface AdminFormData {
    name: string;
    surname: string;
    email: string;
    username: string;
    password: string;
}

/**
 * RegisterAdminForm - Two-column registration form for admin creation
 * Left column: Personal Data | Right column: Credentials
 */
export const RegisterAdminForm: React.FC<RegisterAdminFormProps> = ({ onSubmit, loading, error }) => {
    const [formData, setFormData] = useState<AdminFormData>({
        name: "",
        surname: "",
        email: "",
        username: "",
        password: "",
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onSubmit(formData);
    };

    return (
        <div className="p-8 bg-white/80 backdrop-blur-sm">
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* LEFT COLUMN: PERSONAL DATA */}
                <div className="space-y-5">
                    <h3 className="text-primary font-bold border-b-2 border-gray-100 pb-2 text-xs uppercase tracking-wider mb-4">
                        <i className="fa-solid fa-address-card mr-2"></i> Datos Personales
                    </h3>

                    {/* Name */}
                    <FormFieldWithIcon
                        label="Nombre"
                        name="name"
                        placeholder="Ej. Juan"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        leftIcon={<i className="fa-solid fa-user" />}
                    />

                    {/* Surname */}
                    <FormFieldWithIcon
                        label="Apellido"
                        name="surname"
                        placeholder="Ej. Pérez"
                        required
                        value={formData.surname}
                        onChange={handleChange}
                        leftIcon={<i className="fa-regular fa-user" />}
                    />

                    {/* Email */}
                    <FormFieldWithIcon
                        label="Correo Electrónico"
                        name="email"
                        type="email"
                        placeholder="admin@enlared.com"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        leftIcon={<i className="fa-solid fa-envelope" />}
                    />
                </div>

                {/* RIGHT COLUMN: CREDENTIALS */}
                <div className="space-y-5">
                    <h3 className="text-primary font-bold border-b-2 border-gray-100 pb-2 text-xs uppercase tracking-wider mb-4">
                        <i className="fa-solid fa-lock mr-2"></i> Credenciales
                    </h3>

                    {/* Username */}
                    <FormFieldWithIcon
                        label="Nombre de Usuario"
                        name="username"
                        placeholder="Ej. admin.juan"
                        required
                        value={formData.username}
                        onChange={handleChange}
                        leftIcon={<span className="font-bold">@</span>}
                    />

                    {/* Password with toggle */}
                    <PasswordFieldWithToggle
                        label="Contraseña"
                        name="password"
                        placeholder="••••••••"
                        required
                        value={formData.password}
                        onChange={handleChange}
                    />

                    {/* Info Box */}
                    <div className="bg-background/40 p-3 rounded-lg border border-background flex items-start gap-2 mt-4">
                        <i className="fa-solid fa-circle-info text-green-700 mt-1"></i>
                        <p className="text-xs text-green-800 leading-tight">
                            <span className="font-bold">Información:</span> El usuario creado tendrá privilegios de <strong>Administrador</strong> y acceso completo al sistema ENLARED.
                        </p>
                    </div>
                </div>

                {/* ERROR MESSAGE */}
                {error && (
                    <div className="md:col-span-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
                        <i className="fa-solid fa-circle-exclamation"></i>
                        <span className="text-sm">{error}</span>
                    </div>
                )}

                {/* SUBMIT BUTTON */}
                <div className="md:col-span-2 mt-6">
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-primary hover:bg-secondary text-white font-bold py-3.5 px-4 rounded-lg shadow-lg shadow-primary/30 transform hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
                    >
                        <span>{loading ? 'Procesando...' : 'Registrar Administrador'}</span>
                        {loading ? (
                            <i className="fa-solid fa-circle-notch fa-spin"></i>
                        ) : (
                            <i className="fa-solid fa-arrow-right group-hover:translate-x-1 transition-transform"></i>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};
