"use client";

import React, { useState } from 'react';
import { OrderStatus } from './OrderStatusManager';

export interface InstallerLogEntry {
    timestamp: Date;
    log: string;
    status: OrderStatus;
}

interface InstallerLogManagerProps {
    initialLogs?: InstallerLogEntry[];
    onChange?: (logs: InstallerLogEntry[]) => void;
    currentStatus?: OrderStatus;
}

export const InstallerLogManager: React.FC<InstallerLogManagerProps> = ({
    initialLogs = [],
    onChange,
    currentStatus = 'pending'
}) => {
    const [logs, setLogs] = useState<InstallerLogEntry[]>(initialLogs);
    const [newLogText, setNewLogText] = useState('');
    const [isAdding, setIsAdding] = useState(false);

    const handleAddLog = () => {
        if (!newLogText.trim()) {
            alert('Por favor ingresa un mensaje para la bitácora');
            return;
        }

        const newEntry: InstallerLogEntry = {
            timestamp: new Date(),
            log: newLogText.trim(),
            status: currentStatus
        };

        const updatedLogs = [...logs, newEntry];
        setLogs(updatedLogs);
        setNewLogText('');
        setIsAdding(false);

        if (onChange) {
            onChange(updatedLogs);
        }
    };

    const handleRemoveLog = (index: number) => {
        if (!confirm('¿Estás seguro de eliminar esta entrada de la bitácora?')) {
            return;
        }

        const updatedLogs = logs.filter((_, i) => i !== index);
        setLogs(updatedLogs);

        if (onChange) {
            onChange(updatedLogs);
        }
    };

    const getStatusBadge = (status: OrderStatus) => {
        const configs = {
            pending: { class: 'bg-yellow-100 text-yellow-800 border-yellow-200', label: 'Pendiente' },
            assigned: { class: 'bg-blue-100 text-blue-800 border-blue-200', label: 'Asignada' },
            in_progress: { class: 'bg-purple-100 text-purple-800 border-purple-200', label: 'En Progreso' },
            completed: { class: 'bg-green-100 text-green-800 border-green-200', label: 'Completada' },
            cancelled: { class: 'bg-red-100 text-red-800 border-red-200', label: 'Cancelada' },
            hard: { class: 'bg-orange-100 text-orange-800 border-orange-200', label: 'Difícil' }
        };
        const config = configs[status];
        return <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${config.class}`}>{config.label}</span>;
    };

    const formatTimestamp = (date: Date) => {
        const d = new Date(date);
        return d.toLocaleString('es-VE', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gray-50/50 border-b border-gray-100 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <i className="fa-solid fa-clipboard-list text-secondary"></i>
                    <h3 className="font-semibold text-secondary">Bitácora de Instaladores</h3>
                </div>
                <button
                    type="button"
                    onClick={() => setIsAdding(!isAdding)}
                    className="text-primary hover:text-secondary transition-colors text-sm font-medium"
                >
                    <i className={`fa-solid ${isAdding ? 'fa-times' : 'fa-plus'} mr-1`}></i>
                    {isAdding ? 'Cancelar' : 'Añadir Entrada'}
                </button>
            </div>

            <div className="p-6 space-y-4">
                {/* Add New Log Entry Form */}
                {isAdding && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">
                                Mensaje de la Bitácora
                            </label>
                            <textarea
                                value={newLogText}
                                onChange={(e) => setNewLogText(e.target.value)}
                                placeholder="Ej: Instalación completada exitosamente..."
                                className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y min-h-[80px]"
                                autoFocus
                            />
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                            <i className="fa-solid fa-info-circle"></i>
                            <span>Estado actual: {getStatusBadge(currentStatus)}</span>
                        </div>
                        <button
                            type="button"
                            onClick={handleAddLog}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                        >
                            <i className="fa-solid fa-plus mr-2"></i>
                            Añadir a la Bitácora
                        </button>
                    </div>
                )}

                {/* Log Entries List */}
                {logs.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                        <i className="fa-solid fa-inbox text-4xl mb-2"></i>
                        <p className="text-sm">No hay entradas en la bitácora</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {logs.map((entry, index) => (
                            <div
                                key={index}
                                className="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 space-y-2">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <i className="fa-solid fa-clock text-gray-400 text-xs"></i>
                                            <span className="text-xs text-gray-500">
                                                {formatTimestamp(entry.timestamp)}
                                            </span>
                                            {getStatusBadge(entry.status)}
                                        </div>
                                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{entry.log}</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveLog(index)}
                                        className="text-red-400 hover:text-red-600 transition-colors flex-shrink-0"
                                        title="Eliminar entrada"
                                    >
                                        <i className="fa-solid fa-trash text-sm"></i>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
