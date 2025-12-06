"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeftIcon } from '../icons';

export const NewOrderHeader: React.FC = () => {
    const router = useRouter();

    return (
        <header className="h-16 bg-white shadow-sm flex items-center justify-between px-6 border-b border-gray-200 sticky top-0 z-10">
            <div className="flex items-center gap-3">
                <button
                    onClick={() => router.back()}
                    className="text-gray-500 hover:text-primary transition-colors"
                    aria-label="Volver"
                >
                    <ArrowLeftIcon className="w-5 h-5" />
                </button>
                <h1 className="text-xl font-bold text-primary">
                    Nueva Orden de Servicio
                </h1>
            </div>
        </header>
    );
};

export default NewOrderHeader;
