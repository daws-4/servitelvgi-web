"use client";

import React, { useState } from "react";

interface Installer {
    _id: string;
    name: string;
    surname: string;
    role?: string;
}

interface MemberListProps {
    members: Installer[];
    availableInstallers: Installer[];
    leaderId: string;
    onChange: (memberIds: string[]) => void;
}

export const MemberList: React.FC<MemberListProps> = ({
    members,
    availableInstallers,
    leaderId,
    onChange,
}) => {
    const [selectedInstallerId, setSelectedInstallerId] = useState("");

    const getInitials = (name: string, surname: string) => {
        return `${name.charAt(0)}${surname.charAt(0)}`.toUpperCase();
    };

    const handleAddMember = () => {
        if (!selectedInstallerId) {
            return;
        }

        // Prevent adding the leader as a member
        if (selectedInstallerId === leaderId) {
            alert("El líder no puede ser agregado como miembro");
            setSelectedInstallerId("");
            return;
        }

        // Check if already a member
        if (members.some(m => m._id === selectedInstallerId)) {
            alert("Este instalador ya es miembro de la cuadrilla");
            setSelectedInstallerId("");
            return;
        }

        const currentMemberIds = members.map(m => m._id);
        onChange([...currentMemberIds, selectedInstallerId]);
        setSelectedInstallerId("");
    };

    const handleRemoveMember = (memberId: string) => {
        if (confirm("¿Remover técnico de la cuadrilla?")) {
            const updatedMemberIds = members.filter(m => m._id !== memberId).map(m => m._id);
            onChange(updatedMemberIds);
        }
    };

    // Filter out installers that are already members or the leader
    const filteredAvailableInstallers = availableInstallers.filter(
        installer =>
            !members.some(m => m._id === installer._id) &&
            installer._id !== leaderId
    );

    return (
        <div>
            <label className="block text-sm font-medium text-dark mb-2">Técnicos Miembros</label>

            {/* Lista de miembros actuales */}
            <div className="bg-gray-50 rounded-lg border border-neutral/20 p-1 mb-3 space-y-1">
                {members.length === 0 ? (
                    <div className="text-center py-4 text-neutral text-sm">
                        No hay miembros asignados
                    </div>
                ) : (
                    members.map((member) => (
                        <div
                            key={member._id}
                            className="flex items-center justify-between bg-white p-2 rounded border border-neutral/10 shadow-sm"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-secondary/10 text-secondary flex items-center justify-center text-xs font-bold">
                                    {getInitials(member.name, member.surname)}
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-dark">
                                        {member.name} {member.surname}
                                    </p>
                                    <p className="text-xs text-neutral">
                                        {member.role || "Técnico"}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => handleRemoveMember(member._id)}
                                className="text-red-500 hover:bg-red-50 p-1.5 rounded transition-colors text-xs"
                            >
                                <i className="fa-solid fa-xmark"></i>
                            </button>
                        </div>
                    ))
                )}
            </div>

            {/* Añadir miembro */}
            <div className="flex gap-2">
                <select
                    value={selectedInstallerId}
                    onChange={(e) => setSelectedInstallerId(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg border border-neutral/30 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                >
                    <option value="">Seleccionar técnico para agregar...</option>
                    {filteredAvailableInstallers.map((installer) => (
                        <option key={installer._id} value={installer._id}>
                            {installer.name} {installer.surname}
                        </option>
                    ))}
                </select>
                <button
                    type="button"
                    onClick={handleAddMember}
                    disabled={!selectedInstallerId}
                    className="px-4 py-2 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <i className="fa-solid fa-plus mr-1"></i> Agregar
                </button>
            </div>
        </div>
    );
};

export default MemberList;
