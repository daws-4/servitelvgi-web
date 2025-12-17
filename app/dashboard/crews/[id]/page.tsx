"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import axios from "axios";
import { CrewEditForm } from "@/components/crews/CrewEditForm";
import { CrewInventoryCard } from "@/components/crews/CrewInventoryCard";
import { ReturnMaterialModal } from "@/components/crews/ReturnMaterialModal";

interface Installer {
    _id: string;
    name: string;
    surname: string;
    role?: string;
}

interface Vehicle {
    id: string;
    name: string;
}

interface InventoryItem {
    item: {
        _id: string;
        code: string;
        description: string;
        unit: string;
    };
    quantity: number;
    lastUpdate: Date;
}

interface CrewData {
    _id: string;
    name: string;
    leader: Installer;
    members: Installer[];
    vehiclesAssigned: Vehicle[];
    assignedInventory: InventoryItem[];
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export default function CrewEditPage() {
    const router = useRouter();
    const params = useParams();
    const crewId = params.id as string;

    const [crew, setCrew] = useState<CrewData | null>(null);
    const [availableInstallers, setAvailableInstallers] = useState<Installer[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [returnModalOpen, setReturnModalOpen] = useState(false);
    const [selectedMaterial, setSelectedMaterial] = useState<InventoryItem | null>(null);

    useEffect(() => {
        fetchData();
    }, [crewId]);

    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);

            // Fetch crew data
            const crewResponse = await axios.get(`/api/web/crews?id=${crewId}`);

            if (!crewResponse.data) {
                setError("Cuadrilla no encontrada");
                return;
            }

            setCrew(crewResponse.data);

            // Fetch available installers
            const installersResponse = await axios.get("/api/web/installers");
            setAvailableInstallers(installersResponse.data);
        } catch (error) {
            console.error("Error fetching data:", error);
            setError("Error al cargar los datos de la cuadrilla");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (data: {
        name: string;
        leader: string;
        members: string[];
        vehiclesAssigned: Vehicle[];
        isActive: boolean;
    }) => {
        try {
            await axios.put("/api/web/crews", {
                id: crewId,
                ...data,
            });

            // Show success message and redirect
            alert("Cuadrilla actualizada exitosamente");
            router.push("/dashboard/crews");
        } catch (error) {
            console.error("Error updating crew:", error);
            alert("Error al actualizar la cuadrilla");
            throw error;
        }
    };

    const handleCancel = () => {
        router.push("/dashboard/crews");
    };

    const handleReturnClick = (material: InventoryItem) => {
        setSelectedMaterial(material);
        setReturnModalOpen(true);
    };

    const handleReturnSuccess = async () => {
        setReturnModalOpen(false);
        setSelectedMaterial(null);
        await fetchData(); // Refresh crew data to show updated inventory
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full min-h-[400px]">
                <div className="text-center">
                    <i className="fa-solid fa-spinner fa-spin text-4xl text-primary mb-4"></i>
                    <p className="text-neutral">Cargando datos de la cuadrilla...</p>
                </div>
            </div>
        );
    }

    if (error || !crew) {
        return (
            <div className="flex items-center justify-center h-full min-h-[400px]">
                <div className="text-center">
                    <i className="fa-solid fa-triangle-exclamation text-4xl text-red-500 mb-4"></i>
                    <p className="text-dark font-semibold mb-2">{error || "Cuadrilla no encontrada"}</p>
                    <button
                        onClick={() => router.push("/dashboard/crews")}
                        className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-secondary transition-colors"
                    >
                        Volver a Cuadrillas
                    </button>
                </div>
            </div>
        );
    }

    return (
        <main className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
            <div className="max-w-5xl mx-auto">
                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-sm text-neutral mb-4">
                    <button
                        onClick={() => router.push("/dashboard/crews")}
                        className="hover:text-primary transition-colors"
                    >
                        Cuadrillas
                    </button>
                    <i className="fa-solid fa-chevron-right text-xs"></i>
                    <span className="font-semibold text-dark">Editar Cuadrilla</span>
                </div>

                {/* Form Header */}
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-dark">Editar {crew.name}</h2>
                </div>

                {/* Form Content */}
                <CrewEditForm
                    crew={crew}
                    availableInstallers={availableInstallers}
                    onSubmit={handleSubmit}
                    onCancel={handleCancel}
                />

                {/* Material Asignado */}
                <div className="mt-6">
                    <CrewInventoryCard
                        crewId={crew._id}
                        assignedInventory={crew.assignedInventory || []}
                        onReturnClick={handleReturnClick}
                        onRefresh={fetchData}
                    />
                </div>

                {/* Return Material Modal */}
                <ReturnMaterialModal
                    isOpen={returnModalOpen}
                    onClose={() => setReturnModalOpen(false)}
                    crewId={crew._id}
                    material={selectedMaterial}
                    onSuccess={handleReturnSuccess}
                />
            </div>
        </main>
    );
}
