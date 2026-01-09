"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';

interface AppVersionData {
    version: string;
    versionCode: number;
    downloadUrl: string;
    releaseNotes: string;
    forceUpdate: boolean;
    minAndroidVersion: number;
    publishedDate: string;
    fileSize: string;
}

export default function ApkDownloadPage() {
    const [versionData, setVersionData] = useState<AppVersionData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchLatestVersion();
    }, []);

    const fetchLatestVersion = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/public/app-version');
            const data = await response.json();

            if (data.success) {
                setVersionData(data.data);
            } else {
                setError(data.error || 'No hay versiones disponibles');
            }
        } catch (err) {
            setError('Error al cargar información de la aplicación');
            console.error('Error fetching version:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = () => {
        if (versionData?.downloadUrl) {
            window.location.href = versionData.downloadUrl;
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg
                            className="w-8 h-8 text-red-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        No Disponible
                    </h2>
                    <p className="text-gray-600">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
            {/* Hero Section */}
            <div className="container mx-auto px-4 py-12 sm:py-20">
                <div className="max-w-4xl mx-auto">
                    {/* Logo and Title */}
                    <div className="text-center mb-12">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-600 rounded-2xl mb-6 shadow-lg">
                            <svg
                                className="w-12 h-12 text-white"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                                />
                            </svg>
                        </div>
                        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
                            Servitelv App
                        </h1>
                        <p className="text-xl text-gray-600">
                            Descarga la aplicación móvil oficial
                        </p>
                    </div>

                    {/* Main Download Card */}
                    <div className="bg-white rounded-3xl shadow-2xl overflow-hidden mb-8">
                        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6">
                            <div className="flex items-center justify-between text-white">
                                <div>
                                    <h2 className="text-2xl font-bold mb-1">
                                        Versión {versionData?.version}
                                    </h2>
                                    <p className="text-blue-100">
                                        Publicada el{' '}
                                        {versionData?.publishedDate &&
                                            new Date(versionData.publishedDate).toLocaleDateString('es-ES', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric',
                                            })}
                                    </p>
                                </div>
                                {versionData?.forceUpdate && (
                                    <span className="px-4 py-2 bg-red-500 text-white rounded-full text-sm font-semibold">
                                        Actualización requerida
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="p-8">
                            {/* Download Button */}
                            <button
                                onClick={handleDownload}
                                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-4 px-8 rounded-xl hover:from-blue-700 hover:to-indigo-700 transform hover:scale-105 transition-all duration-200 shadow-lg flex items-center justify-center gap-3 mb-6"
                            >
                                <svg
                                    className="w-6 h-6"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                                    />
                                </svg>
                                Descargar APK
                            </button>

                            {/* Version Info */}
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="text-center p-4 bg-gray-50 rounded-xl">
                                    <p className="text-sm text-gray-500 mb-1">Tamaño</p>
                                    <p className="text-lg font-semibold text-gray-900">
                                        {versionData?.fileSize || 'N/A'}
                                    </p>
                                </div>
                                <div className="text-center p-4 bg-gray-50 rounded-xl">
                                    <p className="text-sm text-gray-500 mb-1">Android Mínimo</p>
                                    <p className="text-lg font-semibold text-gray-900">
                                        {versionData?.minAndroidVersion || 21}+
                                    </p>
                                </div>
                            </div>

                            {/* Release Notes */}
                            {versionData?.releaseNotes && (
                                <div className="mb-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                                        Novedades de esta versión
                                    </h3>
                                    <div className="bg-blue-50 rounded-xl p-4">
                                        <p className="text-gray-700 whitespace-pre-line">
                                            {versionData.releaseNotes}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Installation Instructions */}
                    <div className="bg-white rounded-2xl shadow-xl p-8">
                        <h3 className="text-2xl font-bold text-gray-900 mb-6">
                            Instrucciones de Instalación
                        </h3>
                        <ol className="space-y-4">
                            <li className="flex gap-4">
                                <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                                    1
                                </div>
                                <div>
                                    <h4 className="font-semibold text-gray-900 mb-1">
                                        Habilita instalación desde fuentes desconocidas
                                    </h4>
                                    <p className="text-gray-600">
                                        Ve a Configuración → Seguridad → Fuentes desconocidas y actívalo
                                    </p>
                                </div>
                            </li>
                            <li className="flex gap-4">
                                <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                                    2
                                </div>
                                <div>
                                    <h4 className="font-semibold text-gray-900 mb-1">
                                        Descarga el archivo APK
                                    </h4>
                                    <p className="text-gray-600">
                                        Haz clic en el botón de descarga y espera que termine
                                    </p>
                                </div>
                            </li>
                            <li className="flex gap-4">
                                <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                                    3
                                </div>
                                <div>
                                    <h4 className="font-semibold text-gray-900 mb-1">
                                        Instala la aplicación
                                    </h4>
                                    <p className="text-gray-600">
                                        Abre el archivo descargado y sigue las instrucciones en pantalla
                                    </p>
                                </div>
                            </li>
                        </ol>
                    </div>

                    {/* Warning Message */}
                    <div className="mt-8 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg
                                    className="h-5 w-5 text-yellow-400"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm text-yellow-700">
                                    Solo descarga la aplicación desde esta página oficial para garantizar
                                    tu seguridad.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
