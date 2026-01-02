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

        // Create blob URLs immediately for preview
        const newImages: ImageItem[] = Array.from(files).map((file) => ({
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
            // Upload each image
            const uploadResults = await Promise.all(
                imagesToUpload.map(async (imageItem) => {
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

                        // Get the URL for the uploaded image
                        console.log('Fetching URL for recordId:', data.recordId);
                        const urlResponse = await fetch(
                            `/api/web/orders/uploads?recordId=${data.recordId}`
                        );
                        const urlData = await urlResponse.json();
                        console.log('URL response:', urlData);
                        const { url } = urlData;
                        console.log('Final image URL:', url);

                        return {
                            tempId: imageItem.id,
                            success: true,
                            imageId,
                            url,
                        };
                    } catch (error) {
                        console.error('Error uploading image:', error);
                        return {
                            tempId: imageItem.id,
                            success: false,
                            error,
                        };
                    }
                })
            );

            // Update images state with final URLs
            setImages((prev) =>
                prev.map((img) => {
                    const result = uploadResults.find((r) => r.tempId === img.id);
                    if (result) {
                        if (result.success) {
                            // Revoke blob URL to free memory
                            URL.revokeObjectURL(img.thumbUrl);
                            return {
                                id: result.imageId!,
                                thumbUrl: result.url!,
                                isUploading: false,
                            };
                        } else {
                            // Upload failed, mark as error but keep preview
                            return {
                                ...img,
                                isUploading: false,
                            };
                        }
                    }
                    return img;
                })
            );

            // Update parent with final IDs (only successful uploads)
            const successfulIds = uploadResults
                .filter((r) => r.success)
                .map((r) => r.imageId!);

            const allIds = [
                ...initialPhotoIds,
                ...successfulIds,
            ];
            onChange(allIds);
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

                    // Call DELETE endpoint
                    const response = await fetch(`/api/web/orders/uploads?recordId=${recordId}`, {
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

                // Update parent with final IDs only
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
                    <span className="ml-auto text-xs text-primary font-medium">
                        <i className="fa-solid fa-spinner fa-spin mr-1"></i>
                        Subiendo...
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
              flex items-center justify-center gap-2 px-4 py-3 
              border-2 border-dashed border-gray-300 rounded-lg 
              hover:border-primary hover:bg-primary/5 
              transition-all cursor-pointer
            `}
                    >
                        <i className="fa-solid fa-cloud-upload-alt text-primary"></i>
                        <span className="text-sm font-medium text-primary">Seleccionar imágenes</span>
                    </label>
                    <input
                        id="photo-upload"
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleFileSelect}
                        className="hidden"
                    />
                    <p className="text-xs text-gray-500 text-center">
                        Puedes seleccionar múltiples imágenes a la vez
                    </p>
                </div>

                {/* Thumbnail Gallery */}
                {isLoadingInitial ? (
                    <div className="flex items-center justify-center py-8">
                        <i className="fa-solid fa-spinner fa-spin text-primary text-2xl"></i>
                    </div>
                ) : images.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {images.map((image, index) => (
                            <div
                                key={image.id}
                                className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200 hover:border-primary transition-all"
                            >
                                {/* Thumbnail Image */}
                                <img
                                    src={image.thumbUrl}
                                    alt={`Evidencia ${index + 1}`}
                                    className={`w-full h-full object-cover ${!image.isUploading ? 'cursor-pointer' : 'opacity-70'}`}
                                    onClick={() => !image.isUploading && handleOpenViewer(index)}
                                />

                                {/* Upload Progress Overlay */}
                                {image.isUploading && (
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                        <div className="text-center">
                                            <i className="fa-solid fa-spinner fa-spin text-white text-2xl mb-2"></i>
                                            <p className="text-white text-xs font-medium">Subiendo...</p>
                                        </div>
                                    </div>
                                )}

                                {/* Overlay with actions (only for uploaded images) */}
                                {!image.isUploading && (
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

                                {/* Image number badge */}
                                <div className="absolute top-2 left-2 px-2 py-1 rounded-md bg-black/60 text-white text-xs font-semibold">
                                    {index + 1}
                                </div>
                            </div>
                        ))}
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
                images={images.filter(img => !img.isUploading).map(img => img.thumbUrl)}
                currentIndex={currentImageIndex}
                onNavigate={setCurrentImageIndex}
            />
        </div>
    );
};
