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

    const [zoomLevel, setZoomLevel] = React.useState(1);

    // Reset zoom when image changes
    useEffect(() => {
        setZoomLevel(1);
    }, [currentIndex]);

    const handleZoomIn = () => {
        setZoomLevel(prev => Math.min(prev + 0.5, 3));
    };

    const handleZoomOut = () => {
        setZoomLevel(prev => Math.max(prev - 0.5, 1));
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
                className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all flex items-center justify-center cursor-pointer"
                aria-label="Cerrar"
            >
                <i className="fa-solid fa-times text-xl"></i>
            </button>

            {/* Image Counter */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 px-4 py-2 rounded-full bg-white/10 text-white font-semibold">
                {currentIndex + 1} / {images.length}
            </div>

            {/* Zoom Controls */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        handleZoomOut();
                    }}
                    className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all flex items-center justify-center cursor-pointer disabled:opacity-50"
                    disabled={zoomLevel <= 1}
                    title="Reducir Zoom"
                >
                    <i className="fa-solid fa-magnifying-glass-minus text-lg"></i>
                </button>
                <div className="flex items-center justify-center bg-white/10 rounded-lg px-3 min-w-[60px] text-white text-sm font-medium">
                    {Math.round(zoomLevel * 100)}%
                </div>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        handleZoomIn();
                    }}
                    className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all flex items-center justify-center cursor-pointer disabled:opacity-50"
                    disabled={zoomLevel >= 3}
                    title="Aumentar Zoom"
                >
                    <i className="fa-solid fa-magnifying-glass-plus text-lg"></i>
                </button>
            </div>

            {/* Previous Button */}
            {currentIndex > 0 && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        handlePrevious();
                    }}
                    className="absolute left-4 z-20 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all flex items-center justify-center cursor-pointer"
                    aria-label="Anterior"
                >
                    <i className="fa-solid fa-chevron-left text-xl"></i>
                </button>
            )}

            {/* Image Container with Scroll for Zoom */}
            <div
                className="w-full h-full flex items-center justify-center overflow-auto p-4 cursor-default"
                onClick={(e) => e.stopPropagation()}
            >
                <div
                    style={{
                        transform: `scale(${zoomLevel})`,
                        transition: 'transform 0.2s ease-out',
                        transformOrigin: 'center center'
                    }}
                    className="flex items-center justify-center min-w-full min-h-full"
                >
                    <img
                        src={images[currentIndex]}
                        alt={`Imagen ${currentIndex + 1}`}
                        className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
                        style={{ cursor: zoomLevel > 1 ? 'grab' : 'default' }}
                    />
                </div>
            </div>

            {/* Next Button */}
            {currentIndex < images.length - 1 && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        handleNext();
                    }}
                    className="absolute right-4 z-20 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all flex items-center justify-center cursor-pointer"
                    aria-label="Siguiente"
                >
                    <i className="fa-solid fa-chevron-right text-xl"></i>
                </button>
            )}
        </div>
    );
};
