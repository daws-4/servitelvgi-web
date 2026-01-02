"use client";

import React, { useEffect } from 'react';

interface ImageViewerProps {
    isOpen: boolean;
    onClose: () => void;
    images: string[]; // Array of URLs
    currentIndex: number;
    onNavigate: (index: number) => void;
}

export const ImageViewer: React.FC<ImageViewerProps> = ({
    isOpen,
    onClose,
    images,
    currentIndex,
    onNavigate
}) => {
    // Handle keyboard navigation
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            } else if (e.key === 'ArrowLeft') {
                handlePrevious();
            } else if (e.key === 'ArrowRight') {
                handleNext();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, currentIndex, images.length]);

    const handlePrevious = () => {
        if (currentIndex > 0) {
            onNavigate(currentIndex - 1);
        }
    };

    const handleNext = () => {
        if (currentIndex < images.length - 1) {
            onNavigate(currentIndex + 1);
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
            onClick={onClose}
        >
            {/* Close Button */}
            <button
                onClick={onClose}
                className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all flex items-center justify-center"
                aria-label="Cerrar"
            >
                <i className="fa-solid fa-times text-xl"></i>
            </button>

            {/* Image Counter */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 px-4 py-2 rounded-full bg-white/10 text-white font-semibold">
                {currentIndex + 1} / {images.length}
            </div>

            {/* Previous Button */}
            {currentIndex > 0 && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        handlePrevious();
                    }}
                    className="absolute left-4 z-10 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all flex items-center justify-center"
                    aria-label="Anterior"
                >
                    <i className="fa-solid fa-chevron-left text-xl"></i>
                </button>
            )}

            {/* Image */}
            <div
                className="max-w-7xl max-h-[90vh] p-4"
                onClick={(e) => e.stopPropagation()}
            >
                <img
                    src={images[currentIndex]}
                    alt={`Imagen ${currentIndex + 1}`}
                    className="max-w-full max-h-full object-contain rounded-lg"
                />
            </div>

            {/* Next Button */}
            {currentIndex < images.length - 1 && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        handleNext();
                    }}
                    className="absolute right-4 z-10 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all flex items-center justify-center"
                    aria-label="Siguiente"
                >
                    <i className="fa-solid fa-chevron-right text-xl"></i>
                </button>
            )}
        </div>
    );
};
