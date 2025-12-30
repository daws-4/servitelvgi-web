"use client";

import React, { useState, useEffect } from "react";
import { FormInput } from "@/components/interactiveForms/Input";
import { ToggleSwitch } from "@/components/interactiveForms/ToggleSwitch";
import { InstallerStatusBadge } from "@/components/installers/InstallerStatusBadge";

interface Crew {
    _id: string;
    name: string;
}

interface InstallerData {
    _id: string;
    username: string;
    name: string;
    surname: string;
    email: string;
    phone: string;
    status: "active" | "inactive";
    onDuty: boolean;
    showInventory: boolean;
    currentCrew?: string | null;
}

interface InstallerEditFormProps {
    installer: InstallerData;
    crews: Crew[];
    onSubmit: (data: Partial<InstallerData> & { password?: string }) => Promise<void>;
    onCancel: () => void;
}

export const InstallerEditForm: React.FC<InstallerEditFormProps> = ({
    installer,
    crews,
    onSubmit,
    onCancel,
}) => {
    const [formData, setFormData] = useState({
        name: installer.name,
        surname: installer.surname,
        email: installer.email,
        phone: installer.phone,
        status: installer.status,
        onDuty: installer.onDuty,
        showInventory: installer.showInventory || false,
        currentCrew: installer.currentCrew || "",
        password: "",
    });

    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleInputChange = (field: string, value: any) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const submitData: any = {
                name: formData.name,
                surname: formData.surname,
                email: formData.email,
                phone: formData.phone,
                status: formData.status,
                onDuty: formData.onDuty,
                showInventory: formData.showInventory,
                currentCrew: formData.currentCrew || null,
            };

            // Only include password if it's been changed
            if (formData.password) {
                submitData.password = formData.password;
            }

            await onSubmit(submitData);
        } catch (error) {
            console.error("Error submitting form:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* LEFT COLUMN (2/3): PERSONAL INFORMATION */}
                <div className="lg:col-span-2 space-y-6">
                    {/* PERSONAL INFORMATION CARD */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="bg-gray-50/50 border-b border-gray-100 px-6 py-4 flex items-center gap-2">
                            <i className="fa-solid fa-user-tag text-secondary"></i>
                            <h3 className="font-semibold text-secondary">Información Personal</h3>
                        </div>
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Name */}
                            <div>
                                <label className="form-label">
                                    NOMBRE <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => handleInputChange("name", e.target.value)}
                                    className="form-input"
                                    required
                                />
                            </div>

                            {/* Surname */}
                            <div>
                                <label className="form-label">
                                    APELLIDO <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.surname}
                                    onChange={(e) => handleInputChange("surname", e.target.value)}
                                    className="form-input"
                                    required
                                />
                            </div>

                            {/* Phone */}
                            <div>
                                <label className="form-label">
                                    TELÉFONO <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <i className="fa-solid fa-phone absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs"></i>
                                    <input
                                        type="text"
                                        value={formData.phone}
                                        onChange={(e) => handleInputChange("phone", e.target.value)}
                                        className="form-input pl-9"
                                        placeholder="04xx-xxxxxxx"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Email */}
                            <div>
                                <label className="form-label">
                                    CORREO ELECTRÓNICO <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <i className="fa-solid fa-envelope absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs "></i>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => handleInputChange("email", e.target.value)}
                                        className="form-input pl-9 "
                                        required
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ACCESS CREDENTIALS CARD */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="bg-gray-50/50 border-b border-gray-100 px-6 py-4 flex items-center gap-2">
                            <i className="fa-solid fa-key text-secondary"></i>
                            <h3 className="font-semibold text-secondary">
                                Credenciales de Acceso (App Móvil)
                            </h3>
                        </div>
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Username (readonly) */}
                            <div>
                                <label className="form-label">
                                    NOMBRE DE USUARIO <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={installer.username}
                                    className="form-input bg-gray-50"
                                    readOnly
                                />
                                <p className="text-[10px] text-gray-400 mt-1">
                                    El usuario no se puede modificar.
                                </p>
                            </div>

                            {/* Password */}
                            <div>
                                <label className="form-label">CONTRASEÑA</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={formData.password}
                                        onChange={(e) => handleInputChange("password", e.target.value)}
                                        className="form-input pr-10"
                                        placeholder="••••••••"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary"
                                    >
                                        <i
                                            className={`fa-solid ${showPassword ? "fa-eye-slash" : "fa-eye"
                                                }`}
                                        ></i>
                                    </button>
                                </div>
                                <p className="text-[10px] text-gray-400 mt-1">
                                    Déjalo en blanco para mantener la actual.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN (1/3): OPERATIONAL MANAGEMENT */}
                <div className="space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-fit sticky top-24">
                        <div className="bg-background/40 border-b border-background px-6 py-4">
                            <h3 className="font-semibold text-secondary">Gestión Operativa</h3>
                        </div>
                        <div className="p-6 space-y-6">
                            {/* Status */}
                            <div>
                                <label className="form-label">ESTADO DE LA CUENTA</label>
                                <select
                                    value={formData.status}
                                    onChange={(e) =>
                                        handleInputChange("status", e.target.value as "active" | "inactive")
                                    }
                                    className="form-input appearance-none cursor-pointer font-medium"
                                >
                                    <option value="active">Activo</option>
                                    <option value="inactive">Inactivo</option>
                                </select>
                                <p className="text-xs text-gray-400 mt-1">
                                    Si está inactivo, no podrá acceder a la app.
                                </p>
                            </div>

                            {/* On Duty Toggle */}
                            <ToggleSwitch
                                id="onDuty"
                                name="onDuty"
                                checked={formData.onDuty}
                                onChange={(checked) => handleInputChange("onDuty", checked)}
                                label="En Guardia (On Duty)"
                                description="Disponible para emergencias"
                            />

                            {/* Show Inventory Toggle */}
                            <ToggleSwitch
                                id="showInventory"
                                name="showInventory"
                                checked={formData.showInventory}
                                onChange={(checked) => handleInputChange("showInventory", checked)}
                                label="Inventario"
                                description="desea que el instalador vea su propio inventario"
                            />

                            <hr className="border-gray-100" />

                            {/* Crew Assignment */}
                            <div>
                                <label className="form-label text-secondary flex items-center gap-1">
                                    <i className="fa-solid fa-users"></i> Asignar a Cuadrilla
                                </label>
                                <div className="relative mt-1">
                                    <select
                                        value={formData.currentCrew}
                                        onChange={(e) => handleInputChange("currentCrew", e.target.value)}
                                        className="form-input pl-3 pr-10 appearance-none cursor-pointer"
                                    >
                                        <option value="">-- Trabajo Individual (Sin Cuadrilla) --</option>
                                        {crews.map((crew) => (
                                            <option key={crew._id} value={crew._id}>
                                                {crew.name}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-gray-500">
                                        <i className="fa-solid fa-chevron-down text-xs"></i>
                                    </div>
                                </div>
                                <p className="text-xs text-gray-400 mt-2">
                                    Al asignar una cuadrilla, el inventario personal podría fusionarse con
                                    el de la cuadrilla.
                                </p>
                            </div>

                            {/* Action Buttons */}
                            <div className="pt-4 flex flex-col gap-3 mt-auto">
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full bg-primary hover:bg-secondary text-white font-bold py-3 px-4 rounded-lg shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 transform active:scale-[0.98] disabled:opacity-75 disabled:cursor-not-allowed cursor-pointer"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <i className="fa-solid fa-circle-notch fa-spin"></i> Guardando...
                                        </>
                                    ) : (
                                        <>
                                            <i className="fa-solid fa-save"></i> Guardar Cambios
                                        </>
                                    )}
                                </button>
                                <button
                                    type="button"
                                    onClick={onCancel}
                                    className="w-full bg-white hover:bg-gray-50 text-gray-600 font-medium py-3 px-4 rounded-lg border border-gray-200 hover:border-gray-300 transition-all cursor-pointer"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
        .form-input {
          width: 100%;
          padding: 0.625rem 0.75rem;
          border-radius: 0.375rem;
          border: 2px solid #e5e7eb;
          background-color: white;
          transition: all 0.2s;
          outline: none;
          font-size: 0.875rem;
        }
        .form-input:focus {
          border-color: #3e78b2;
          box-shadow: 0 0 0 1px #3e78b2;
        }
        .form-label {
          display: block;
          font-size: 0.75rem;
          font-weight: 700;
          color: #6b7280;
          margin-bottom: 0.25rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
      `}</style>
        </form>
    );
};

export default InstallerEditForm;
