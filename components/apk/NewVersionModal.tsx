import React, { useState, useEffect } from 'react';

interface NewVersionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    editMode?: boolean;
    initialData?: {
        id: string;
        release_notes: string;
        is_active: boolean;
        force_update: boolean;
        min_android_version?: number;
    };
}

export const NewVersionModal: React.FC<NewVersionModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
    editMode = false,
    initialData,
}) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Handle escape key press
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    // Prevent body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }

        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const formData = new FormData(e.currentTarget);

            if (editMode && initialData) {
                // Modo edición: solo enviar campos editables via API
                const updateData = {
                    id: initialData.id,
                    release_notes: formData.get('release_notes'),
                    is_active: formData.get('is_active') === 'on',
                    force_update: formData.get('force_update') === 'on',
                    min_android_version: formData.get('min_android_version') || undefined,
                };

                await fetch('/api/web/app-versions', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updateData),
                }).then(async (res) => {
                    if (!res.ok) {
                        const data = await res.json();
                        throw new Error(data.error || 'Error al actualizar');
                    }
                });
            } else {
                // Modo creación: enviar JSON con URL de descarga
                const createData = {
                    version: formData.get('version') as string,
                    version_code: formData.get('version_code') as string,
                    download_url: formData.get('download_url') as string,
                    release_notes: formData.get('release_notes') as string,
                    is_active: formData.get('is_active') === 'on',
                    force_update: formData.get('force_update') === 'on',
                    min_android_version: formData.get('min_android_version') as string,
                };

                const response = await fetch('/api/web/app-versions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(createData),
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Error al crear la versión');
                }
            }

            onClose();

            // Refrescar la lista
            onSuccess();
        } catch (err: any) {
            console.error('Submit error:', err);
            setError(err.message || 'Error al procesar la solicitud');
        } finally {
            setLoading(false);
        }
    };

    const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto"
            onClick={handleBackdropClick}
        >
            <div className="bg-gray-50 rounded-xl shadow-2xl max-w-2xl w-full my-8 flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl flex items-center justify-between sticky top-0 z-10">
                    <h2 className="text-xl font-bold text-primary">
                        {editMode ? 'Editar Versión' : 'Nueva Versión APK'}
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                        aria-label="Cerrar modal"
                    >
                        <i className="fa-solid fa-times text-xl"></i>
                    </button>
                </div>

                {/* Content - Scrollable */}
                <div className="flex-1 overflow-y-auto p-6">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                                {error}
                            </div>
                        )}

                        {!editMode && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Versión *
                                    </label>
                                    <input
                                        type="text"
                                        name="version"
                                        required
                                        placeholder="1.0.0"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                                    />
                                    <p className="mt-1 text-xs text-gray-500">
                                        Formato recomendado: MAJOR.MINOR.PATCH
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Código de Versión *
                                    </label>
                                    <input
                                        type="number"
                                        name="version_code"
                                        required
                                        placeholder="1"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                                    />
                                    <p className="mt-1 text-xs text-gray-500">
                                        Número entero que se incrementa con cada versión
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        URL de Descarga *
                                    </label>
                                    <input
                                        type="url"
                                        name="download_url"
                                        required
                                        placeholder="https://ejemplo.com/app-v1.0.0.apk"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                                    />
                                    <p className="mt-1 text-xs text-gray-500">
                                        URL pública desde donde se puede descargar el APK
                                    </p>
                                </div>
                            </>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Notas de la Versión
                            </label>
                            <textarea
                                name="release_notes"
                                rows={4}
                                defaultValue={initialData?.release_notes}
                                placeholder="Describe las novedades de esta versión..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Versión Mínima de Android
                            </label>
                            <input
                                type="number"
                                name="min_android_version"
                                min="21"
                                max="35"
                                defaultValue={initialData?.min_android_version || 21}
                                placeholder="21"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                            />
                            <p className="mt-1 text-xs text-gray-500">
                                API Level mínimo (21 = Android 5.0)
                            </p>
                        </div>

                        <div className="flex items-center gap-6">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    name="is_active"
                                    defaultChecked={initialData?.is_active ?? true}
                                    className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                                />
                                <span className="text-sm font-medium text-gray-700">
                                    Versión activa
                                </span>
                            </label>

                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    name="force_update"
                                    defaultChecked={initialData?.force_update}
                                    className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                                />
                                <span className="text-sm font-medium text-gray-700">
                                    Forzar actualización
                                </span>
                            </label>
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 mt-6">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={loading}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 cursor-pointer"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-secondary transition-colors focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                            >
                                {loading ? 'Procesando...' : editMode ? 'Actualizar' : 'Crear Versión'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};
