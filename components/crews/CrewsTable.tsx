"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { CrewStatusBadge } from "./CrewStatusBadge";
import { CrewMemberAvatars } from "./CrewMemberAvatars";
import { EditIcon, TrashIcon } from "@/components/icons";

interface CrewMember {
    _id: string;
    name: string;
    surname: string;
}

interface Crew {
    _id: string;
    name: string;
    zone?: string;
    leader: CrewMember;
    members: CrewMember[];
    isActive: boolean;
}

interface CrewsTableProps {
    crews: Crew[];
    selectedIds: string[];
    onSelectAll: (checked: boolean) => void;
    onSelectRow: (id: string, checked: boolean) => void;
    onEditCrew?: (id: string) => void;
    onDeleteCrew?: (id: string) => void;
}

export const CrewsTable: React.FC<CrewsTableProps> = ({
    crews,
    selectedIds,
    onSelectAll,
    onSelectRow,
    onEditCrew,
    onDeleteCrew,
}) => {
    const router = useRouter();
    const allSelected = crews.length > 0 && selectedIds.length === crews.length;
    const someSelected = selectedIds.length > 0 && !allSelected;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-neutral/10 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-dark">
                    <thead className="bg-gray-50 text-neutral font-semibold uppercase text-xs border-b border-neutral/10">
                        <tr>
                            {/* Checkbox Column */}
                            <th className="px-6 py-4 w-10">
                                <input
                                    type="checkbox"
                                    checked={allSelected}
                                    ref={(input) => {
                                        if (input) {
                                            input.indeterminate = someSelected;
                                        }
                                    }}
                                    onChange={(e) => onSelectAll(e.target.checked)}
                                    className="rounded border-neutral text-primary focus:ring-primary cursor-pointer w-4 h-4"
                                />
                            </th>
                            <th className="px-6 py-4">Cuadrilla</th>
                            <th className="px-6 py-4">Líder</th>
                            <th className="px-6 py-4">Estado</th>
                            <th className="px-6 py-4 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral/10">
                        {crews.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-neutral">
                                    No se encontraron cuadrillas
                                </td>
                            </tr>
                        ) : (
                            crews.map((crew) => (
                                <tr
                                    key={crew._id}
                                    className="hover:bg-gray-50 transition-colors group"
                                >
                                    <td className="px-6 py-4">
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.includes(crew._id)}
                                            onChange={(e) => onSelectRow(crew._id, e.target.checked)}
                                            className="rounded border-neutral text-primary focus:ring-primary cursor-pointer w-4 h-4"
                                        />
                                    </td>
                                    <td className="px-6 py-4 font-medium text-dark cursor-pointer" onClick={() => router.push(`/dashboard/crews/${crew._id}`)}>
                                        {crew.name}
                                        {/* {crew.zone && (
                                            <span className="block text-xs text-neutral font-normal mt-0.5">
                                                Zona: {crew.zone}
                                            </span>
                                        )} */}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <img
                                                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                                                    `${crew.leader.name} ${crew.leader.surname}`
                                                )}&background=random`}
                                                className="w-6 h-6 rounded-full"
                                                alt={`${crew.leader.name} ${crew.leader.surname}`}
                                            />
                                            <span>
                                                {crew.leader.name} {crew.leader.surname}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <CrewStatusBadge isActive={crew.isActive} />
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2 transition-opacity">
                                            <button
                                                onClick={() => router.push(`/dashboard/crews/${crew._id}`)}
                                                className="text-gray-400 hover:text-primary p-1 cursor-pointer"
                                                title="Editar"
                                            >
                                                <EditIcon className="w-4 h-4" />
                                            </button>
                                            {onDeleteCrew && (
                                                <button
                                                    onClick={() => onDeleteCrew(crew._id)}
                                                    className="text-gray-400 hover:text-red-600 p-1 cursor-pointer"
                                                    title="Eliminar"
                                                >
                                                    <TrashIcon className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
