"use client";

import React, { useState, useEffect } from 'react';

export interface Material {
    name: string;
    quantity: number;
}

interface MaterialsManagerProps {
    initialMaterials?: Material[];
    onChange?: (materials: Material[]) => void;
}

const MATERIAL_OPTIONS = [
    { value: "CABLE UTP CAT6", label: "Cable UTP Cat6 (mts)" },
    { value: "CONECTOR RJ45", label: "Conector RJ45 (unidad)" },
    { value: "ONT HUAWEI", label: "ONT Huawei (equipo)" },
    { value: "ROUTER TP-LINK", label: "Router TP-Link (equipo)" },
    { value: "PRECINTO PLASTICO", label: "Precinto Plástico (unidad)" },
];

export const MaterialsManager: React.FC<MaterialsManagerProps> = ({
    initialMaterials = [],
    onChange
}) => {
    const [materials, setMaterials] = useState<Material[]>(initialMaterials);
    const [selectedMaterial, setSelectedMaterial] = useState("");
    const [quantity, setQuantity] = useState(1);

    // Notify parent of changes
    useEffect(() => {
        if (onChange) {
            onChange(materials);
        }
    }, [materials]);

    const handleAddMaterial = () => {
        if (!selectedMaterial) {
            alert("Por favor selecciona un material.");
            return;
        }

        const newMaterial: Material = {
            name: selectedMaterial,
            quantity: quantity
        };

        setMaterials(prev => [...prev, newMaterial]);

        // Reset inputs
        setSelectedMaterial("");
        setQuantity(1);
    };

    const handleRemoveMaterial = (index: number) => {
        setMaterials(prev => prev.filter((_, i) => i !== index));
    };

    const handleQuantityChange = (index: number, newQuantity: number) => {
        if (newQuantity < 1) return;

        setMaterials(prev => prev.map((material, i) =>
            i === index ? { ...material, quantity: newQuantity } : material
        ));
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gray-50/50 border-b border-gray-100 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <i className="fa-solid fa-tools text-secondary"></i>
                    <h3 className="font-semibold text-secondary">Materiales Utilizados</h3>
                </div>
                <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">
                    Control de Stock
                </span>
            </div>

            <div className="p-6 space-y-4">
                {/* Add Material Bar */}
                <div className="flex flex-col sm:flex-row gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200 items-end">
                    <div className="flex-1 w-full">
                        <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
                            Material / Equipo
                        </label>
                        <select
                            value={selectedMaterial}
                            onChange={(e) => setSelectedMaterial(e.target.value)}
                            className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-md bg-white text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all cursor-pointer"
                        >
                            <option value="">-- Seleccionar Material --</option>
                            {MATERIAL_OPTIONS.map(option => (
                                <option className="cursor-pointer" key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="w-24">
                        <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
                            Cantidad
                        </label>
                        <input
                            type="number"
                            min="1"
                            value={quantity}
                            onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                            className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-md bg-white text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                        />
                    </div>
                    <button
                        type="button"
                        onClick={handleAddMaterial}
                        className="bg-secondary hover:bg-primary text-white px-4 py-2.5 rounded-md font-medium text-sm transition-colors flex items-center gap-2 cursor-pointer"
                    >
                        <i className="fa-solid fa-plus"></i> Agregar
                    </button>
                </div>

                {/* Materials Table */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-500 font-semibold border-b border-gray-200">
                            <tr>
                                <th className="px-4 py-3">Material</th>
                                <th className="px-4 py-3 w-24 text-center">Cant.</th>
                                <th className="px-4 py-3 w-16 text-right"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {materials.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="px-4 py-8 text-center text-gray-400 italic">
                                        No se han registrado materiales aún.
                                    </td>
                                </tr>
                            ) : (
                                materials.map((material, index) => (
                                    <tr
                                        key={index}
                                        className="fade-in bg-white border-b border-gray-50 hover:bg-gray-50 transition-colors"
                                    >
                                        <td className="px-4 py-3 font-medium text-gray-700">
                                            {material.name}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <input
                                                type="number"
                                                min="1"
                                                value={material.quantity}
                                                onChange={(e) => handleQuantityChange(index, parseInt(e.target.value) || 1)}
                                                className="w-16 text-center border rounded p-1 text-sm focus:border-primary outline-none"
                                            />
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveMaterial(index)}
                                                className="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors cursor-pointer"
                                            >
                                                <i className="fa-solid fa-trash-can"></i>
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <style jsx>{`
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                        transform: translateY(5px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                .fade-in {
                    animation: fadeIn 0.3s ease-in;
                }
            `}</style>
        </div>
    );
};
