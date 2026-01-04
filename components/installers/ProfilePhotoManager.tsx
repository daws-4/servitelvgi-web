"use client";

import React, { useState, useRef } from 'react';
import ReactCrop, { Crop, PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

interface ProfilePhotoManagerProps {
    installerId: string;
    initialPhotoUrl?: string;
    onChange: (photoUrl: string | null) => void;
}

export const ProfilePhotoManager: React.FC<ProfilePhotoManagerProps> = ({
    installerId,
    initialPhotoUrl,
    onChange
}) => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(initialPhotoUrl || null);
    const [cropModalOpen, setCropModalOpen] = useState(false);
    const [imageSrc, setImageSrc] = useState<string>('');
    const [crop, setCrop] = useState<Crop>({
        unit: '%',
        width: 50,
        height: 50,
        x: 25,
        y: 25
    });
    const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const imgRef = useRef<HTMLImageElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validar que sea una imagen
        if (!file.type.startsWith('image/')) {
            alert('Por favor selecciona un archivo de imagen');
            return;
        }

        // Crear preview para cropping
        const reader = new FileReader();
        reader.onload = () => {
            setImageSrc(reader.result as string);
            setCropModalOpen(true);
        };
        reader.readAsDataURL(file);
        setSelectedFile(file);
    };

    const getCroppedImg = async (): Promise<Blob | null> => {
        if (!completedCrop || !imgRef.current) return null;

        const image = imgRef.current;
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) return null;

        const scaleX = image.naturalWidth / image.width;
        const scaleY = image.naturalHeight / image.height;

        // Tamaño final: 512x512 (1:1 ratio)
        const targetSize = 512;
        canvas.width = targetSize;
        canvas.height = targetSize;

        ctx.drawImage(
            image,
            completedCrop.x * scaleX,
            completedCrop.y * scaleY,
            completedCrop.width * scaleX,
            completedCrop.height * scaleY,
            0,
            0,
            targetSize,
            targetSize
        );

        return new Promise((resolve) => {
            canvas.toBlob(
                (blob) => {
                    resolve(blob);
                },
                'image/jpeg',
                0.90
            );
        });
    };

    const handleCropConfirm = async () => {
        if (!selectedFile) return;

        try {
            setIsUploading(true);
            const croppedBlob = await getCroppedImg();

            if (!croppedBlob) {
                throw new Error('Error al recortar la imagen');
            }

            // Crear archivo desde blob
            const croppedFile = new File(
                [croppedBlob],
                `profile_${installerId}_${Date.now()}.jpg`,
                { type: 'image/jpeg' }
            );

            // Subir a PocketBase
            const formData = new FormData();
            formData.append('imagen', croppedFile);
            formData.append('installer_id', installerId);

            console.log('Uploading profile photo...');
            const response = await fetch('/api/web/installers/profile-photo', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Failed to upload profile photo');
            }

            const data = await response.json();
            console.log('Upload response:', data);

            // Actualizar preview
            setPreviewUrl(data.url);
            setCropModalOpen(false);
            onChange(data.url);

            // Resetear input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        } catch (error) {
            console.error('Error uploading profile photo:', error);
            alert('Error al subir la foto de perfil');
        } finally {
            setIsUploading(false);
        }
    };

    const handleRemovePhoto = async () => {
        if (!confirm('¿Estás seguro de eliminar la foto de perfil?')) return;

        try {
            setIsUploading(true);

            // Llamar al endpoint de eliminación
            const response = await fetch(`/api/web/installers/profile-photo?installerId=${installerId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('Failed to delete profile photo');
            }

            setPreviewUrl(null);
            onChange(null);
        } catch (error) {
            console.error('Error deleting profile photo:', error);
            alert('Error al eliminar la foto de perfil');
        } finally {
            setIsUploading(false);
        }
    };

    const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
        const { width, height } = e.currentTarget;

        // Calcular crop inicial cuadrado centrado
        const size = Math.min(width, height) * 0.8;
        const x = (width - size) / 2;
        const y = (height - size) / 2;

        setCrop({
            unit: 'px',
            width: size,
            height: size,
            x,
            y
        });
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Header */}
            <div className="bg-gray-50/50 border-b border-gray-100 px-6 py-4 flex items-center gap-2">
                <i className="fa-solid fa-user-circle text-secondary"></i>
                <h3 className="font-semibold text-secondary">Foto de Perfil</h3>
                {isUploading && (
                    <span className="ml-auto text-xs text-primary font-medium flex items-center gap-2">
                        <i className="fa-solid fa-spinner fa-spin"></i>
                        <span>Procesando...</span>
                    </span>
                )}
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
                {/* Preview */}
                <div className="flex flex-col items-center gap-4">
                    <div className="relative w-48 h-48 rounded-full overflow-hidden border-4 border-gray-200 bg-gray-100">
                        {previewUrl ? (
                            <img
                                src={previewUrl}
                                alt="Foto de perfil"
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                                <i className="fa-solid fa-user text-6xl"></i>
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                        <label
                            htmlFor="profile-photo-upload"
                            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-all cursor-pointer flex items-center gap-2"
                        >
                            <i className="fa-solid fa-camera"></i>
                            <span>{previewUrl ? 'Cambiar Foto' : 'Subir Foto'}</span>
                        </label>
                        <input
                            ref={fileInputRef}
                            id="profile-photo-upload"
                            type="file"
                            accept="image/*"
                            onChange={handleFileSelect}
                            className="hidden"
                        />
                        {previewUrl && (
                            <button
                                onClick={handleRemovePhoto}
                                disabled={isUploading}
                                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all disabled:opacity-50 flex items-center gap-2"
                            >
                                <i className="fa-solid fa-trash"></i>
                                <span>Eliminar</span>
                            </button>
                        )}
                    </div>

                    <p className="text-xs text-gray-500 text-center">
                        <i className="fa-solid fa-info-circle mr-1"></i>
                        La foto debe ser <strong>cuadrada (1:1)</strong>. Podrás recortarla después de seleccionarla.
                    </p>
                </div>
            </div>

            {/* Crop Modal */}
            {cropModalOpen && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-auto">
                        <div className="p-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-secondary">
                                    Recortar Foto de Perfil
                                </h3>
                                <button
                                    onClick={() => setCropModalOpen(false)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <i className="fa-solid fa-times text-xl"></i>
                                </button>
                            </div>

                            <div className="flex justify-center">
                                <ReactCrop
                                    crop={crop}
                                    onChange={(c) => setCrop(c)}
                                    onComplete={(c) => setCompletedCrop(c)}
                                    aspect={1}
                                    circularCrop
                                >
                                    <img
                                        ref={imgRef}
                                        src={imageSrc}
                                        alt="Crop preview"
                                        onLoad={onImageLoad}
                                        className="max-w-full max-h-[60vh]"
                                    />
                                </ReactCrop>
                            </div>

                            <div className="flex gap-3 justify-end">
                                <button
                                    onClick={() => setCropModalOpen(false)}
                                    disabled={isUploading}
                                    className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all disabled:opacity-50"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleCropConfirm}
                                    disabled={isUploading || !completedCrop}
                                    className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center gap-2"
                                >
                                    {isUploading ? (
                                        <>
                                            <i className="fa-solid fa-spinner fa-spin"></i>
                                            <span>Subiendo...</span>
                                        </>
                                    ) : (
                                        <>
                                            <i className="fa-solid fa-check"></i>
                                            <span>Confirmar</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
