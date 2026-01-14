"use client";

import React, { useState } from "react";
import { ToggleSwitch } from "@/components/interactiveForms/ToggleSwitch";
import { MemberList } from "./MemberList";
import { VehicleList } from "./VehicleList";
import { MetaInfo } from "./MetaInfo";

interface Installer {
    _id: string;
    name: string;
    surname: string;
    role?: string;
    currentCrew?: string | null;
}

interface Vehicle {
    id: string;
    name: string;
}

interface CrewData {
    _id: string;
    number: number;
    leader: Installer;
    members: Installer[];
    vehiclesAssigned: Vehicle[];
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

interface CrewEditFormProps {
    crew: CrewData;
    availableInstallers: Installer[];
    onSubmit: (data: {
        number: number;
        leader: string;
        members: string[];
        vehiclesAssigned: Vehicle[];
        isActive: boolean;
    }) => Promise<void>;
    onCancel: () => void;
}

export const CrewEditForm: React.FC<CrewEditFormProps> = ({
    crew,
    availableInstallers,
    onSubmit,
    onCancel,
}) => {
    const [formData, setFormData] = useState({
        number: crew.number,
        leader: crew.leader._id,
        members: crew.members,
        memberIds: crew.members.map(m => m._id),
        vehiclesAssigned: crew.vehiclesAssigned || [],
        isActive: crew.isActive,
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    // Get IDs of current crew members (leader + members) to allow them in the dropdown
    const currentCrewMemberIds = [formData.leader, ...formData.memberIds];

    // Filter available installers: exclude those with currentCrew assigned (unless they're in this crew)
    const filteredAvailableInstallers = availableInstallers.filter(installer => {
        // If installer has no crew, they're available
        if (!installer.currentCrew) return true;

        // If installer is currently in THIS crew (leader or member), they're available
        if (currentCrewMemberIds.includes(installer._id)) return true;

        // Otherwise, they're assigned to another crew, so exclude them
        return false;
    });

    const handleInputChange = (field: string, value: any) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleMembersChange = (memberIds: string[]) => {
        const updatedMembers = availableInstallers.filter(installer =>
            memberIds.includes(installer._id)
        );
        setFormData((prev) => ({
            ...prev,
            memberIds,
            members: updatedMembers,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            await onSubmit({
                number: Number(formData.number),
                leader: formData.leader,
                members: formData.memberIds,
                vehiclesAssigned: formData.vehiclesAssigned,
                isActive: formData.isActive,
            });
        } catch (error) {
            console.error("Error submitting form:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* LEFT COLUMN (2/3): GENERAL INFO & PERSONNEL */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Tarjeta: Información General */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral/10">
                        <h3 className="text-lg font-semibold text-dark mb-4 border-b border-neutral/10 pb-2">
                            Información General
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Nombre */}
                            <div className="col-span-1 md:col-span-2">
                                <label className="block text-sm font-medium text-dark mb-1">
                                    Número de Cuadrilla <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    value={formData.number}
                                    onChange={(e) => handleInputChange("number", e.target.value)}
                                    className="w-full px-4 py-2 rounded-lg border border-neutral/30 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm"
                                    required
                                    min="1"
                                />
                            </div>

                            {/* Estado (isActive) */}
                            <div className="col-span-1">
                                <label className="block text-sm font-medium text-dark mb-2">Estado</label>
                                <label className="inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.isActive}
                                        onChange={(e) => handleInputChange("isActive", e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                                    <span className="ms-3 text-sm font-medium text-gray-700">Activa</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Tarjeta: Composición del Equipo */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral/10">
                        <h3 className="text-lg font-semibold text-dark mb-4 border-b border-neutral/10 pb-2">
                            Personal
                        </h3>

                        {/* Líder */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-dark mb-1">
                                Líder de Cuadrilla <span className="text-red-500">*</span>
                            </label>
                            <p className="text-xs text-neutral mb-2">Responsable principal de las órdenes.</p>
                            <div className="relative">
                                <select
                                    value={formData.leader}
                                    onChange={(e) => {
                                        handleInputChange("leader", e.target.value);
                                        // Remove leader from members if they're in the list
                                        const updatedMemberIds = formData.memberIds.filter(
                                            id => id !== e.target.value
                                        );
                                        handleMembersChange(updatedMemberIds);
                                    }}
                                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-neutral/30 focus:border-primary focus:ring-1 focus:ring-primary outline-none appearance-none text-sm bg-white"
                                    required
                                >
                                    <option value="">Seleccionar instalador...</option>
                                    {filteredAvailableInstallers.map((installer) => (
                                        <option key={installer._id} value={installer._id}>
                                            {installer.name} {installer.surname}
                                            {installer.role ? ` (${installer.role})` : ""}
                                        </option>
                                    ))}
                                </select>
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-primary">
                                    <i className="fa-solid fa-user-shield"></i>
                                </div>
                            </div>
                        </div>

                        {/* Miembros */}
                        <MemberList
                            members={formData.members}
                            availableInstallers={filteredAvailableInstallers}
                            leaderId={formData.leader}
                            onChange={handleMembersChange}
                        />
                    </div>
                </div>

                {/* RIGHT COLUMN (1/3): VEHICLES & METADATA */}
                <div className="space-y-6">
                    {/* Tarjeta: Vehículos */}
                    <VehicleList
                        vehicles={formData.vehiclesAssigned}
                        onChange={(vehicles) => handleInputChange("vehiclesAssigned", vehicles)}
                    />

                    {/* Meta Info (Read Only) */}
                    <MetaInfo
                        createdAt={crew.createdAt}
                        updatedAt={crew.updatedAt}
                        id={crew._id}
                    />
                </div>
            </div>

            {/* Action Buttons - Fixed at the bottom in mobile, part of form in desktop */}
            <div className="mt-8 flex justify-end gap-3 sticky bottom-0 bg-gray-50/50 py-4 -mx-6 px-6 lg:static lg:bg-transparent lg:p-0">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-4 py-2 text-sm font-medium text-dark bg-white border border-neutral/30 rounded-lg hover:bg-gray-50 transition-colors"
                >
                    Cancelar
                </button>
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-secondary transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    {isSubmitting ? (
                        <>
                            <i className="fa-solid fa-circle-notch fa-spin"></i>
                            Guardando...
                        </>
                    ) : (
                        "Guardar Cambios"
                    )}
                </button>
            </div>
        </form>
    );
};

export default CrewEditForm;
