"use client";

import React from 'react';

interface InternetTestData {
    downloadSpeed?: number;
    uploadSpeed?: number;
    ping?: number;
    provider?: string;
    wifiSSID?: string;
    frecuency?: string;
    coordinates?: {
        latitude?: number;
        longitude?: number;
    };
}

interface InternetTestCardProps {
    data?: InternetTestData;
}

export const InternetTestCard: React.FC<InternetTestCardProps> = ({ data }) => {
    if (!data || (!data.downloadSpeed && !data.uploadSpeed && !data.ping)) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-gray-50/50 border-b border-gray-100 px-6 py-4 flex items-center gap-2">
                    <i className="fa-solid fa-wifi text-secondary"></i>
                    <h3 className="font-semibold text-secondary">Prueba de Internet</h3>
                </div>
                <div className="p-6 text-center text-gray-400">
                    <i className="fa-solid fa-signal-slash text-4xl mb-3"></i>
                    <p className="text-sm">No se ha realizado prueba de internet</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gray-50/50 border-b border-gray-100 px-6 py-4 flex items-center gap-2">
                <i className="fa-solid fa-wifi text-secondary"></i>
                <h3 className="font-semibold text-secondary">Prueba de Internet</h3>
            </div>
            <div className="p-6">
                {/* Speed Metrics */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                    {/* Download Speed */}
                    <div className="text-center p-4 bg-green-50 rounded-lg border border-green-100">
                        <i className="fa-solid fa-arrow-down text-green-600 text-xl mb-2"></i>
                        <p className="text-2xl font-bold text-green-700">
                            {data.downloadSpeed?.toFixed(1) || '—'}
                        </p>
                        <p className="text-xs text-green-600 font-medium">Mbps Bajada</p>
                    </div>

                    {/* Upload Speed */}
                    <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-100">
                        <i className="fa-solid fa-arrow-up text-blue-600 text-xl mb-2"></i>
                        <p className="text-2xl font-bold text-blue-700">
                            {data.uploadSpeed?.toFixed(1) || '—'}
                        </p>
                        <p className="text-xs text-blue-600 font-medium">Mbps Subida</p>
                    </div>

                    {/* Ping */}
                    <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-100">
                        <i className="fa-solid fa-clock text-purple-600 text-xl mb-2"></i>
                        <p className="text-2xl font-bold text-purple-700">
                            {data.ping?.toFixed(0) || '—'}
                        </p>
                        <p className="text-xs text-purple-600 font-medium">ms Ping</p>
                    </div>
                </div>

                {/* Additional Info */}
                <div className="space-y-3 text-sm">
                    {data.provider && (
                        <div className="flex items-center justify-between py-2 border-b border-gray-100">
                            <span className="text-gray-500 flex items-center gap-2">
                                <i className="fa-solid fa-building"></i> Proveedor
                            </span>
                            <span className="font-medium text-gray-700">{data.provider}</span>
                        </div>
                    )}

                    {data.wifiSSID && (
                        <div className="flex items-center justify-between py-2 border-b border-gray-100">
                            <span className="text-gray-500 flex items-center gap-2">
                                <i className="fa-solid fa-router"></i> Red WiFi
                            </span>
                            <span className="font-medium text-gray-700">{data.wifiSSID}</span>
                        </div>
                    )}

                    {data.frecuency && (
                        <div className="flex items-center justify-between py-2 border-b border-gray-100">
                            <span className="text-gray-500 flex items-center gap-2">
                                <i className="fa-solid fa-signal"></i> Frecuencia
                            </span>
                            <span className="font-medium text-gray-700">{data.frecuency}</span>
                        </div>
                    )}

                    {data.coordinates?.latitude && data.coordinates?.longitude && (
                        <div className="flex items-center justify-between py-2">
                            <span className="text-gray-500 flex items-center gap-2">
                                <i className="fa-solid fa-map-pin"></i> Ubicación
                            </span>
                            <a
                                href={`https://www.google.com/maps?q=${data.coordinates.latitude},${data.coordinates.longitude}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-medium text-primary hover:underline"
                            >
                                Ver en mapa
                            </a>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
