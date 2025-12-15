"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";

interface Crew {
    _id: string;
    name: string;
    leader?: {
        _id: string;
        name: string;
        surname: string;
    };
}

interface AssignCrewModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (crewId: string) => void;
    selectedCount: number;
}

export const AssignCrewModal: React.FC<AssignCrewModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    selectedCount,
}) => {
    const [crews, setCrews] = useState<Crew[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchValue, setSearchValue] = useState("");
    const [selectedCrew, setSelectedCrew] = useState<string | null>(null);

    // Fetch crews when modal opens
    useEffect(() => {
        if (isOpen) {
            fetchCrews();
        }
    }, [isOpen]);

    const fetchCrews = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await axios.get('/api/web/crews');
            setCrews(response.data);
        } catch (err) {
            console.error("Error fetching crews:", err);
            setError("Error al cargar las cuadrillas");
        } finally {
            setLoading(false);
        }
    };

    // Filter crews based on search
    const filteredCrews = crews.filter(crew =>
        crew.name.toLowerCase().includes(searchValue.toLowerCase())
    );

    const handleConfirm = () => {
        if (selectedCrew) {
            onConfirm(selectedCrew);
            handleClose();
        }
    };

    const handleClose = () => {
        setSearchValue("");
        setSelectedCrew(null);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[80vh] flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                        <h2 className="text-xl font-semibold text-dark">Asignar Cuadrilla</h2>
                        <button
                            onClick={handleClose}
                            className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                        >
                            <i className="fa-solid fa-times text-xl"></i>
                        </button>
                    </div>
                    <p className="text-sm text-gray-500">
                        Selecciona una cuadrilla para asignar a {selectedCount} {selectedCount === 1 ? "orden" : "órdenes"}
                    </p>
                </div>

                {/* Search */}
                <div className="p-4 border-b border-gray-100">
                    <div className="relative">
                        <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                        <input
                            type="text"
                            placeholder="Buscar por nombre de cuadrilla..."
                            value={searchValue}
                            onChange={(e) => setSearchValue(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary"
                        />
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4">
                    {loading && (
                        <div className="flex flex-col items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-3"></div>
                            <p className="text-sm text-gray-500">Cargando cuadrillas...</p>
                        </div>
                    )}

                    {error && !loading && (
                        <div className="text-center py-8">
                            <i className="fa-solid fa-triangle-exclamation text-red-500 text-3xl mb-3"></i>
                            <p className="text-sm text-red-700">{error}</p>
                            <button
                                onClick={fetchCrews}
                                className="mt-3 text-sm text-primary hover:underline cursor-pointer"
                            >
                                Reintentar
                            </button>
                        </div>
                    )}

                    {!loading && !error && filteredCrews.length === 0 && (
                        <div className="text-center py-8">
                            <i className="fa-solid fa-users-slash text-gray-300 text-4xl mb-3"></i>
                            <p className="text-sm text-gray-500">
                                {searchValue ? "No se encontraron cuadrillas" : "No hay cuadrillas disponibles"}
                            </p>
                        </div>
                    )}

                    {!loading && !error && filteredCrews.length > 0 && (
                        <div className="space-y-2">
                            {filteredCrews.map((crew) => {
                                const isSelected = selectedCrew === crew._id;
                                const leaderName = crew.leader
                                    ? `${crew.leader.name} ${crew.leader.surname}`
                                    : null;

                                return (
                                    <button
                                        key={crew._id}
                                        onClick={() => setSelectedCrew(crew._id)}
                                        className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all cursor-pointer ${isSelected
                                            ? "border-primary bg-blue-50"
                                            : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                                            }`}
                                    >
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${isSelected ? "bg-primary text-white" : "bg-gray-200 text-gray-600"
                                            }`}>
                                            <i className="fa-solid fa-users"></i>
                                        </div>
                                        <div className="flex-1 text-left">
                                            <div className="font-medium text-dark text-sm">{crew.name}</div>
                                            {leaderName && (
                                                <div className="text-xs text-gray-500">
                                                    Líder: {leaderName}
                                                </div>
                                            )}
                                        </div>
                                        {isSelected && (
                                            <i className="fa-solid fa-check text-primary"></i>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100 flex gap-3">
                    <button
                        onClick={handleClose}
                        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium cursor-pointer"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={!selectedCrew}
                        className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${selectedCrew
                            ? "bg-primary text-white hover:bg-secondary cursor-pointer"
                            : "bg-gray-200 text-gray-400 cursor-not-allowed "
                            }`}
                    >
                        Asignar
                    </button>
                </div>
            </div>
        </div>
    );
};
