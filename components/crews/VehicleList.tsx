"use client";

import React, { useState } from "react";

interface Vehicle {
    id: string;
    name: string;
}

interface VehicleListProps {
    vehicles: Vehicle[];
    onChange: (vehicles: Vehicle[]) => void;
}

export const VehicleList: React.FC<VehicleListProps> = ({ vehicles, onChange }) => {
    const [newVehicleId, setNewVehicleId] = useState("");
    const [newVehicleName, setNewVehicleName] = useState("");

    const handleAddVehicle = () => {
        if (!newVehicleId.trim() || !newVehicleName.trim()) {
            alert("Por favor completa ambos campos del vehículo");
            return;
        }

        // Check for duplicate IDs
        if (vehicles.some(v => v.id === newVehicleId.trim())) {
            alert("Ya existe un vehículo con ese ID");
            return;
        }

        const newVehicle: Vehicle = {
            id: newVehicleId.trim(),
            name: newVehicleName.trim(),
        };

        onChange([...vehicles, newVehicle]);
        setNewVehicleId("");
        setNewVehicleName("");
    };

    const handleRemoveVehicle = (vehicleId: string) => {
        if (confirm("¿Desvincular este vehículo?")) {
            onChange(vehicles.filter(v => v.id !== vehicleId));
        }
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral/10">
            <h3 className="text-lg font-semibold text-dark mb-4 border-b border-neutral/10 pb-2">
                Vehículos Asignados
            </h3>
            <p className="text-xs text-neutral mb-4">Vehículos vinculados para logística.</p>

            {/* Lista Vehículos */}
            <div className="space-y-3 mb-4">
                {vehicles.length === 0 ? (
                    <div className="text-center py-4 text-neutral text-sm">
                        No hay vehículos asignados
                    </div>
                ) : (
                    vehicles.map((vehicle) => (
                        <div
                            key={vehicle.id}
                            className="flex items-center justify-between p-3 border border-neutral/20 rounded-lg bg-gray-50"
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white rounded border border-neutral/10 text-primary">
                                    <i className="fa-solid fa-truck-pickup"></i>
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-dark">{vehicle.name}</p>
                                    <p className="text-xs text-neutral font-mono">ID: {vehicle.id}</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => handleRemoveVehicle(vehicle.id)}
                                className="text-neutral hover:text-red-500 transition-colors"
                            >
                                <i className="fa-solid fa-trash-can"></i>
                            </button>
                        </div>
                    ))
                )}
            </div>

            {/* Añadir Vehículo Inputs */}
            <div className="bg-primary/5 p-3 rounded-lg border border-primary/10">
                <p className="text-xs font-semibold text-primary mb-2">Vincular nuevo vehículo</p>
                <div className="space-y-2">
                    <input
                        type="text"
                        placeholder="ID (Placa/Ficha)"
                        value={newVehicleId}
                        onChange={(e) => setNewVehicleId(e.target.value)}
                        className="w-full px-3 py-1.5 rounded border border-neutral/30 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                    />
                    <input
                        type="text"
                        placeholder="Descripción (Ej: Van Ford)"
                        value={newVehicleName}
                        onChange={(e) => setNewVehicleName(e.target.value)}
                        className="w-full px-3 py-1.5 rounded border border-neutral/30 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                    />
                    <button
                        type="button"
                        onClick={handleAddVehicle}
                        className="w-full py-1.5 bg-primary text-white rounded text-sm hover:bg-secondary transition-colors"
                    >
                        Vincular
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VehicleList;
