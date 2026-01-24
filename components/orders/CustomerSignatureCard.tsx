"use client";

import React from 'react';

interface CustomerSignatureCardProps {
    signature?: string;
    onDelete?: () => Promise<void>;
}

export const CustomerSignatureCard: React.FC<CustomerSignatureCardProps> = ({ signature, onDelete }) => {
    const [isDeleting, setIsDeleting] = React.useState(false);

    const handleDelete = async () => {
        if (!onDelete) return;
        if (!confirm('¿Estás seguro de eliminar la firma?')) return;

        setIsDeleting(true);
        try {
            await onDelete();
        } catch (error) {
            console.error("Error deleting signature:", error);
            alert("Error al eliminar la firma");
        } finally {
            setIsDeleting(false);
        }
    };

    if (!signature) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-gray-50/50 border-b border-gray-100 px-6 py-4 flex items-center gap-2">
                    <i className="fa-solid fa-signature text-secondary"></i>
                    <h3 className="font-semibold text-secondary">Firma del Cliente</h3>
                </div>
                <div className="p-6 text-center text-gray-400">
                    <i className="fa-solid fa-pen-nib text-4xl mb-3"></i>
                    <p className="text-sm">El cliente aún no ha firmado</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden group">
            <div className="bg-gray-50/50 border-b border-gray-100 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <i className="fa-solid fa-signature text-secondary"></i>
                    <h3 className="font-semibold text-secondary">Firma del Cliente</h3>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full border border-green-200 font-medium">
                        <i className="fa-solid fa-check mr-1"></i>
                        Firmado
                    </span>
                    {onDelete && (
                        <button
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="bg-white text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-full transition-colors border border-gray-200 shadow-sm cursor-pointer"
                            title="Eliminar firma"
                        >
                            {isDeleting ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-trash-can"></i>}
                        </button>
                    )}
                </div>
            </div>
            <div className="p-6">
                <div className="bg-white rounded-lg border-2 border-dashed border-gray-200 p-4 flex items-center justify-center relative">
                    <img
                        src={signature}
                        alt="Firma del cliente"
                        className="max-w-full max-h-48 object-contain"
                        style={{
                            // Ensure background is white to prevent black-on-black issues with transparency
                            backgroundColor: 'white',
                            filter: 'contrast(1.2)',
                            imageRendering: 'auto'
                        }}
                    />
                </div>
                <p className="text-xs text-gray-400 text-center mt-3">
                    <i className="fa-solid fa-shield-check mr-1"></i>
                    Firma capturada desde la aplicación móvil
                </p>
            </div>
        </div>
    );
};
