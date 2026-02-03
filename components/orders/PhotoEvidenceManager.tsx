"use client";

import React, { useState, useEffect } from 'react';
import { ImageViewer } from './ImageViewer';
import { getImageUrls, getImageUrl } from '@/lib/getImageUrl';

interface PhotoEvidenceManagerProps {
    orderId: string;
    installerId?: string;
    crewId?: string;
    initialPhotoIds: string[]; // ["recordId:filename", ...]
    onChange: (photoIds: string[]) => void;
}

interface ImageItem {
    id: string; // Temporary ID or final "recordId:filename"
    thumbUrl: string; // Thumbnail URL or blob URL
    fullUrl?: string; // Full-size URL (loaded on demand)
    isUploading: boolean;
    file?: File; // Original file for uploading images
}



export const PhotoEvidenceManager: React.FC<PhotoEvidenceManagerProps> = ({
    orderId,
    installerId,
    crewId,
    initialPhotoIds,
    onChange
}) => {
    const [images, setImages] = useState<ImageItem[]>([]);
    const [isLoadingInitial, setIsLoadingInitial] = useState(false);
    const [viewerOpen, setViewerOpen] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    // Load initial images from photoIds
    useEffect(() => {
        const loadInitialImages = async () => {
            if (initialPhotoIds.length === 0) {
                setImages([]);
                return;
            }

            setIsLoadingInitial(true);
            try {
                const urls = await getImageUrls(initialPhotoIds);
                const loadedImages: ImageItem[] = initialPhotoIds.map((id, index) => ({
                    id,
                    thumbUrl: urls[index],
                    isUploading: false,
                }));
                setImages(loadedImages);
            } catch (error) {
                console.error('Error loading initial images:', error);
                setImages([]);
            } finally {
                setIsLoadingInitial(false);
            }
        };

        loadInitialImages();
    }, [initialPhotoIds.join(',')]); // Only reload when IDs actually change

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        // Helper function to compress image (Optimización #3)
        const compressImage = async (file: File): Promise<File> => {
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const img = new Image();
                    img.onload = () => {
                        const canvas = document.createElement('canvas');
                        const ctx = canvas.getContext('2d')!;

                        // Max dimensions
                        const MAX_WIDTH = 1920;
                        const MAX_HEIGHT = 1920;

                        let width = img.width;
                        let height = img.height;

                        // Calculate new dimensions
                        if (width > height) {
                            if (width > MAX_WIDTH) {
                                height = Math.round((height * MAX_WIDTH) / width);
                                width = MAX_WIDTH;
                            }
                        } else {
                            if (height > MAX_HEIGHT) {
                                width = Math.round((width * MAX_HEIGHT) / height);
                                height = MAX_HEIGHT;
                            }
                        }

                        canvas.width = width;
                        canvas.height = height;

                        // Draw and compress
                        ctx.drawImage(img, 0, 0, width, height);

                        canvas.toBlob(
                            (blob) => {
                                if (blob) {
                                    const compressedFile = new File([blob], file.name, {
                                        type: 'image/jpeg',
                                        lastModified: Date.now(),
                                    });
                                    console.log(`Compressed: ${(file.size / 1024).toFixed(2)}KB → ${(compressedFile.size / 1024).toFixed(2)}KB`);
                                    resolve(compressedFile);
                                } else {
                                    resolve(file); // Fallback to original
                                }
                            },
                            'image/jpeg',
                            0.85 // Quality 85%
                        );
                    };
                    img.src = event.target?.result as string;
                };
                reader.readAsDataURL(file);
            });
        };

        // Compress all images
        const compressedFiles = await Promise.all(
            Array.from(files).map(file => compressImage(file))
        );

        // Create blob URLs immediately for preview
        const newImages: ImageItem[] = compressedFiles.map((file) => ({
            id: `temp-${Date.now()}-${Math.random()}`, // Temporary ID
            thumbUrl: URL.createObjectURL(file), // Local blob URL for immediate preview
            isUploading: true,
            file,
        }));

        // Add images to state immediately for preview
        setImages((prev) => [...prev, ...newImages]);

        // Upload files in background
        uploadFiles(newImages);

        // Reset input
        e.target.value = '';
    };

    const uploadFiles = async (imagesToUpload: ImageItem[]) => {
        try {
            // Subir imágenes SECUENCIALMENTE para evitar auto-cancelación de PocketBase
            // Esto evita el error ABORT_ERR cuando hay muchas peticiones simultáneas
            const uploadResults = [];

            for (const imageItem of imagesToUpload) {
                try {
                    const formData = new FormData();
                    formData.append('imagen', imageItem.file!); // Campo 'imagen' en PocketBase
                    formData.append('order_id', orderId);
                    if (installerId) formData.append('installer_id', installerId);
                    if (crewId) formData.append('crew_id', crewId);

                    console.log('Uploading image...');
                    const response = await fetch('/api/web/orders/uploads', {
                        method: 'POST',
                        body: formData,
                    });

                    if (!response.ok) {
                        throw new Error('Failed to upload image');
                    }

                    const data = await response.json();
                    console.log('Upload response:', data);
                    const imageId = `${data.recordId}:${data.filename}`;
                    console.log('Image ID:', imageId);

                    // Usar la URL que viene directamente del POST (Optimización #2)
                    const url = data.url;
                    console.log('Image URL from response:', url);

                    uploadResults.push({
                        tempId: imageItem.id,
                        success: true,
                        imageId,
                        url,
                    });

                    // Actualizar estado inmediatamente después de cada subida exitosa
                    setImages((prev) =>
                        prev.map((img) => {
                            if (img.id === imageItem.id) {
                                // Revoke blob URL to free memory
                                URL.revokeObjectURL(img.thumbUrl);
                                return {
                                    id: imageId,
                                    thumbUrl: url,
                                    isUploading: false,
                                };
                            }
                            return img;
                        })
                    );
                } catch (error) {
                    console.error('Error uploading image:', error);
                    uploadResults.push({
                        tempId: imageItem.id,
                        success: false,
                        error,
                    });

                    // Marcar como fallida
                    setImages((prev) =>
                        prev.map((img) => {
                            if (img.id === imageItem.id) {
                                return {
                                    ...img,
                                    isUploading: false,
                                };
                            }
                            return img;
                        })
                    );
                }
            }

            // Ya no es necesario llamar onChange aquí
            // El backend actualiza automáticamente el campo photoEvidence de la orden
            // onChange solo se mantiene para compatibilidad pero puede ser removido en el futuro
        } catch (error) {
            console.error('Error in upload process:', error);
            alert('Error al subir algunas imágenes. Por favor, intenta de nuevo.');
        }
    };

    const handleDeleteImage = async (index: number) => {
        const imageToDelete = images[index];

        if (imageToDelete.isUploading) {
            alert('Esta imagen aún se está subiendo. Por favor, espera a que termine.');
            return;
        }

        if (confirm('¿Estás seguro de eliminar esta imagen?')) {
            try {
                // Extract recordId from the image ID (format: "recordId:filename")
                // Only delete from backend if it's not a temporary image
                if (!imageToDelete.id.startsWith('temp-')) {
                    const recordId = imageToDelete.id.split(':')[0];

                    console.log('Deleting image from backend:', recordId);

                    // Call DELETE endpoint with orderId for auto-update
                    const response = await fetch(`/api/web/orders/uploads?recordId=${recordId}&orderId=${orderId}`, {
                        method: 'DELETE',
                    });

                    if (!response.ok) {
                        throw new Error('Failed to delete image from backend');
                    }

                    console.log('Image deleted from backend successfully');
                }

                // Revoke blob URL if it exists
                if (imageToDelete.thumbUrl?.startsWith('blob:')) {
                    URL.revokeObjectURL(imageToDelete.thumbUrl);
                }

                // Update local state
                const updatedImages = images.filter((_, i) => i !== index);
                setImages(updatedImages);

                // Ya no es necesario llamar onChange aquí porque el backend actualizó la orden
                // pero lo mantenemos para sincronización de UI
                const finalIds = updatedImages
                    .filter((img) => !img.isUploading && !img.id.startsWith('temp-'))
                    .map((img) => img.id);
                onChange(finalIds);
            } catch (error) {
                console.error('Error deleting image:', error);
                alert('Error al eliminar la imagen. Por favor, intenta de nuevo.');
            }
        }
    };

    const handleOpenViewer = (index: number) => {
        const image = images[index];
        if (image.isUploading) {
            return; // Don't open viewer for uploading images
        }
        setCurrentImageIndex(index);
        setViewerOpen(true);
    };

    // Cleanup blob URLs on unmount
    useEffect(() => {
        return () => {
            images.forEach((img) => {
                if (img.thumbUrl?.startsWith('blob:')) {
                    URL.revokeObjectURL(img.thumbUrl);
                }
            });
        };
    }, []);

    const isAnyUploading = images.some((img) => img.isUploading);

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Header */}
            <div className="bg-gray-50/50 border-b border-gray-100 px-6 py-4 flex items-center gap-2">
                <i className="fa-solid fa-camera text-secondary"></i>
                <h3 className="font-semibold text-secondary">Evidencia Fotográfica</h3>
                {isAnyUploading && (
                    <span className="ml-auto text-xs text-primary font-medium flex items-center gap-2">
                        <i className="fa-solid fa-spinner fa-spin"></i>
                        <span>
                            Subiendo {images.filter(img => img.isUploading).length}
                            {images.filter(img => img.isUploading).length === 1 ? ' imagen' : ' imágenes'}...
                        </span>
                    </span>
                )}
                {!isAnyUploading && images.length > 0 && (
                    <span className="ml-auto text-xs text-gray-500">
                        {images.length} {images.length === 1 ? 'imagen' : 'imágenes'}
                    </span>
                )}
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
                {/* Upload Section */}
                <div className="flex flex-col gap-3">
                    <label
                        htmlFor="photo-upload"
                        className={`
              flex flex-col items-center justify-center gap-2 px-6 py-4 
              border-2 border-dashed border-gray-300 rounded-lg 
              hover:border-primary hover:bg-primary/5 
              transition-all cursor-pointer relative group
            `}
                    >
                        <div className="flex items-center gap-2">
                            <i className="fa-solid fa-images text-primary text-xl"></i>
                            <span className="text-sm font-semibold text-primary">Seleccionar Imágenes</span>
                        </div>
                        <p className="text-xs text-gray-500 text-center">
                            <i className="fa-solid fa-info-circle mr-1"></i>
                            Selecciona <strong>una o varias imágenes</strong> para subirlas automáticamente
                        </p>
                        <div className="text-xs text-gray-400 flex items-center gap-2 mt-1">
                            <i className="fa-solid fa-compress-alt"></i>
                            <span>Auto-compresión · Max 1920px · JPEG 85%</span>
                        </div>
                    </label>
                    <input
                        id="photo-upload"
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleFileSelect}
                        className="hidden"
                    />
                </div>

                {/* Thumbnail Gallery */}
                {isLoadingInitial ? (
                    <div className="flex items-center justify-center py-8">
                        <i className="fa-solid fa-spinner fa-spin text-primary text-2xl"></i>
                    </div>
                ) : images.length > 0 ? (
                    <div className="max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {images.map((image, index) => (
                                <div
                                    key={image.id}
                                    className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200 hover:border-primary transition-all"
                                >
                                    {/* Thumbnail Image */}
                                    {image.thumbUrl ? (
                                        <img
                                            src={image.thumbUrl}
                                            alt={`Evidencia ${index + 1}`}
                                            className={`w-full h-full object-cover ${!image.isUploading ? 'cursor-pointer' : 'opacity-70'}`}
                                            onClick={() => !image.isUploading && handleOpenViewer(index)}
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gray-50 flex flex-col items-center justify-center text-gray-400 p-2 border-2 border-dashed border-gray-200">
                                            <i className="fa-solid fa-image-slash text-2xl mb-1 text-gray-300"></i>
                                            <span className="text-[10px] text-center font-medium">No disponible</span>
                                        </div>
                                    )}

                                    {/* Upload Progress Overlay */}
                                    {image.isUploading && (
                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                            <div className="text-center">
                                                <i className="fa-solid fa-spinner fa-spin text-white text-2xl mb-2"></i>
                                                <p className="text-white text-xs font-medium">Subiendo...</p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Overlay with actions (only for uploaded images with URLs) */}
                                    {!image.isUploading && image.thumbUrl && (
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center gap-2">
                                            {/* View Button */}
                                            <button
                                                onClick={() => handleOpenViewer(index)}
                                                className="opacity-0 group-hover:opacity-100 transition-opacity w-10 h-10 rounded-full bg-white/90 hover:bg-white text-primary flex items-center justify-center"
                                                title="Ver imagen"
                                            >
                                                <i className="fa-solid fa-eye"></i>
                                            </button>

                                            {/* Delete Button */}
                                            <button
                                                onClick={() => handleDeleteImage(index)}
                                                className="opacity-0 group-hover:opacity-100 transition-opacity w-10 h-10 rounded-full bg-red-500/90 hover:bg-red-500 text-white flex items-center justify-center"
                                                title="Eliminar imagen"
                                            >
                                                <i className="fa-solid fa-trash"></i>
                                            </button>
                                        </div>
                                    )}

                                    {/* Allow deleting broken images too */}
                                    {!image.isUploading && !image.thumbUrl && (
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all flex items-center justify-center">
                                            <button
                                                onClick={() => handleDeleteImage(index)}
                                                className="opacity-0 group-hover:opacity-100 transition-opacity w-8 h-8 rounded-full bg-red-500/90 hover:bg-red-500 text-white flex items-center justify-center shadow-sm"
                                                title="Eliminar imagen rota"
                                            >
                                                <i className="fa-solid fa-trash text-xs"></i>
                                            </button>
                                        </div>
                                    )}

                                    {/* Image number badge */}
                                    <div className="absolute top-2 left-2 px-2 py-1 rounded-md bg-black/60 text-white text-xs font-semibold z-10">
                                        {index + 1}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-8 text-gray-400">
                        <i className="fa-solid fa-image text-4xl mb-2"></i>
                        <p className="text-sm">No hay imágenes cargadas</p>
                    </div>
                )}
            </div>

            {/* Image Viewer Modal */}
            <ImageViewer
                isOpen={viewerOpen}
                onClose={() => setViewerOpen(false)}
                images={images.filter(img => !img.isUploading && img.thumbUrl).map(img => img.thumbUrl)}
                currentIndex={currentImageIndex}
                onNavigate={setCurrentImageIndex}
            />
        </div>
    );
};
