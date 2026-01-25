"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { InstallerEditForm } from "@/components/installers/InstallerEditForm";
import { InstallerStatusBadge } from "@/components/installers/InstallerStatusBadge";
import { InstallerOnDutyBadge } from "@/components/installers/InstallerOnDutyBadge";
import { DataUsageSection } from "@/components/installers/DataUsageSection";


interface Installer {
    _id: string;
    username: string;
    name: string;
    surname: string;
    email: string;
    phone: string;
    status: "active" | "inactive";
    onDuty: "active" | "inactive" | "onDuty";
    showInventory: boolean;
    currentCrew?: string | null;
    profilePicture?: string | null;
}

interface Crew {
    _id: string;
    number: number;
}

export default function InstallerEditPage() {
    const router = useRouter();
    const params = useParams();
    const id = params?.id as string;

    const [installer, setInstaller] = useState<Installer | null>(null);
    const [crews, setCrews] = useState<Crew[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch installer data and crews
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                // Fetch installer
                const installerRes = await fetch(`/api/web/installers?id=${id}`);
                if (!installerRes.ok) {
                    throw new Error("Instalador no encontrado");
                }
                const installerData = await installerRes.json();

                // Fetch crews
                const crewsRes = await fetch("/api/web/crews");
                if (!crewsRes.ok) {
                    throw new Error("Error al cargar cuadrillas");
                }
                const crewsData = await crewsRes.json();

                setInstaller(installerData);
                setCrews(crewsData);
            } catch (err: any) {
                console.error("Error fetching data:", err);
                setError(err.message || "Error al cargar datos");
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchData();
        }
    }, [id]);

    const handleSubmit = async (
        data: Partial<Installer> & { password?: string }
    ) => {
        try {
            const response = await fetch("/api/web/installers", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    _id: id,
                    ...data,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Error al actualizar instalador");
            }

            const updatedInstaller = await response.json();
            setInstaller(updatedInstaller);

            // Show success message
            alert("¡Datos del instalador actualizados correctamente!");
        } catch (err: any) {
            console.error("Error updating installer:", err);
            alert(err.message || "Error al actualizar instalador");
            throw err;
        }
    };

    const handleCancel = () => {
        router.push("/dashboard/installers");
    };

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col">
                <header className="h-16 bg-white shadow-sm flex items-center justify-between px-6 border-b border-gray-200 sticky top-0 z-10">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleCancel}
                            className="text-gray-500 hover:text-primary transition-colors"
                        >
                            <i className="fa-solid fa-arrow-left"></i>
                        </button>
                        <div>
                            <h1 className="text-xl font-bold text-primary flex items-center gap-2">
                                Cargando...
                            </h1>
                        </div>
                    </div>
                </header>
                <main className="flex-1 p-6 max-w-6xl mx-auto w-full">
                    <div className="flex items-center justify-center h-64">
                        <div className="text-center">
                            <i className="fa-solid fa-circle-notch fa-spin text-4xl text-primary mb-4"></i>
                            <p className="text-gray-600">Cargando datos del instalador...</p>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    if (error || !installer) {
        return (
            <div className="min-h-screen flex flex-col">
                <header className="h-16 bg-white shadow-sm flex items-center justify-between px-6 border-b border-gray-200 sticky top-0 z-10">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleCancel}
                            className="text-gray-500 hover:text-primary transition-colors"
                        >
                            <i className="fa-solid fa-arrow-left"></i>
                        </button>
                        <div>
                            <h1 className="text-xl font-bold text-primary flex items-center gap-2">
                                Error
                            </h1>
                        </div>
                    </div>
                </header>
                <main className="flex-1 p-6 max-w-6xl mx-auto w-full">
                    <div className="flex items-center justify-center h-64">
                        <div className="text-center">
                            <i className="fa-solid fa-triangle-exclamation text-4xl text-red-500 mb-4"></i>
                            <p className="text-gray-600 mb-4">{error || "Instalador no encontrado"}</p>
                            <button
                                onClick={handleCancel}
                                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-secondary transition-colors"
                            >
                                Volver a instaladores
                            </button>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
            {/* HEADER */}
            <header className="h-16 bg-white shadow-sm flex items-center justify-between px-6 border-b border-gray-200 flex-shrink-0 z-10">
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleCancel}
                        className="text-gray-500 hover:text-primary transition-colors"
                    >
                        <i className="fa-solid fa-arrow-left"></i>
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-primary flex items-center gap-2">
                            Editar Instalador
                        </h1>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <InstallerStatusBadge status={installer.status} />
                    <InstallerOnDutyBadge onDuty={installer.onDuty} />
                    <img
                        src={`https://ui-avatars.com/api/?name=${installer.name}+${installer.surname}&background=004ba8&color=fff`}
                        className="w-8 h-8 rounded-full"
                        alt={`${installer.name} ${installer.surname}`}
                    />
                </div>
            </header>

            {/* MAIN CONTENT - Scrollable */}
            <main className="flex-1 overflow-y-auto">
                <div className="p-6 max-w-6xl mx-auto w-full">
                    <InstallerEditForm
                        installer={installer}
                        crews={crews}
                        onSubmit={handleSubmit}
                        onCancel={handleCancel}
                    />

                    {/* DATA USAGE SECTION */}
                    <div className="mt-8">
                        <DataUsageSection installerId={id} />
                    </div>
                </div>
            </main>
        </div>
    );
}


