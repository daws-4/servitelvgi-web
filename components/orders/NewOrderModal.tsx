"use client";

import React, { useEffect } from 'react';
import { NewOrderForm } from './NewOrderForm';

interface NewOrderModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export const NewOrderModal: React.FC<NewOrderModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
}) => {
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

    if (!isOpen) return null;

    const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const handleFormSuccess = () => {
        onSuccess();
    };

    return (
        <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto"
            onClick={handleBackdropClick}
        >
            <div className="bg-gray-50 rounded-xl shadow-2xl max-w-5xl w-full my-8 flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl flex items-center justify-between sticky top-0 z-10">
                    <h2 className="text-xl font-bold text-primary">Nueva Orden de Servicio</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                        aria-label="Cerrar modal"
                    >
                        <i className="fa-solid fa-times text-xl"></i>
                    </button>
                </div>

                {/* Content - Scrollable */}
                <div className="flex-1 overflow-y-auto p-6">
                    <NewOrderForm onSuccess={handleFormSuccess} onCancel={onClose} />
                </div>
            </div>
        </div>
    );
};

export default NewOrderModal;
