"use client";

import React, { useState, useEffect } from 'react';
import { AppVersionsTable } from '@/components/apk/AppVersionsTable';
import { NewVersionModal } from '@/components/apk/NewVersionModal';

interface AppVersion {
    id: string;
    version: string;
    version_code: number;
    download_url: string; // URL de descarga proporcionada por el usuario
    release_notes: string;
    is_active: boolean;
    force_update: boolean;
    min_android_version?: number;
    created_at: string;
}

export default function ApkManagementPage() {
    const [versions, setVersions] = useState<AppVersion[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingVersion, setEditingVersion] = useState<AppVersion | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchVersions();
    }, []);

    const fetchVersions = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await fetch('/api/web/app-versions?perPage=50');
            const data = await response.json();

            if (data.success) {
                setVersions(data.data.items);
            } else {
                setError(data.error || 'Error al cargar versiones');
            }
        } catch (err) {
            setError('Error al conectar con el servidor');
            console.error('Error fetching versions:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (version: AppVersion) => {
        setEditingVersion(version);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        try {
            const response = await fetch(`/api/web/app-versions?id=${id}`, {
                method: 'DELETE',
            });

            const data = await response.json();

            if (data.success) {
                await fetchVersions();
            } else {
                alert(data.error || 'Error al eliminar versión');
            }
        } catch (err) {
            console.error('Error deleting version:', err);
            alert('Error al eliminar versión');
        }
    };

    const handleDownload = (version: AppVersion) => {
        // Usar download_url directamente desde Google Drive
        window.open(version.download_url, '_blank');
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingVersion(null);
    };

    return (
        <main className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
            {/* Page Header */}
            <div className="mb-6">
                <h1 className="text-xl font-semibold text-dark">Gestión de Versiones APK</h1>
                <p className="text-sm text-gray-600 mt-1">
                    Administra las versiones de la aplicación móvil disponibles para descarga
                </p>
            </div>

            {/* Actions Bar */}
            <div className="mb-6 flex justify-between items-center">
                <div className="text-sm text-gray-500">
                    Total: {versions.length} versión{versions.length !== 1 ? 'es' : ''}
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-secondary transition-colors font-medium flex items-center gap-2 shadow-sm"
                >
                    <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 4v16m8-8H4"
                        />
                    </svg>
                    Nueva Versión
                </button>
            </div>

            {/* Error Message */}
            {error && !loading && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center mb-6">
                    <i className="fa-solid fa-triangle-exclamation text-red-500 text-2xl mb-2"></i>
                    <p className="text-red-700">{error}</p>
                    <button
                        onClick={fetchVersions}
                        className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                        Reintentar
                    </button>
                </div>
            )}

            {/* Loading State */}
            {loading && (
                <div className="bg-white rounded-xl shadow-sm border border-neutral/10 p-12 text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <p className="mt-4 text-gray-500">Cargando versiones...</p>
                </div>
            )}

            {/* Empty State */}
            {!loading && !error && versions.length === 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-neutral/10 p-12 text-center">
                    <i className="fa-solid fa-inbox text-gray-300 text-5xl mb-4"></i>
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">No hay versiones disponibles</h3>
                    <p className="text-gray-500">Comienza creando una nueva versión de la aplicación</p>
                </div>
            )}

            {/* Versions Table */}
            {!loading && !error && versions.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-neutral/10 overflow-hidden">
                    <AppVersionsTable
                        versions={versions}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onDownload={handleDownload}
                    />
                </div>
            )}

            {/* Modal */}
            <NewVersionModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSuccess={fetchVersions}
                editMode={!!editingVersion}
                initialData={editingVersion ? {
                    id: editingVersion.id,
                    release_notes: editingVersion.release_notes,
                    is_active: editingVersion.is_active,
                    force_update: editingVersion.force_update,
                    min_android_version: editingVersion.min_android_version,
                } : undefined}
            />
        </main>
    );
}
