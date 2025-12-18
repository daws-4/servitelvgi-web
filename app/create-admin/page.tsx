"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { LoginBackground } from "@/components/login/LoginBackground";
import { RegisterAdminCard } from "@/components/login/RegisterAdminCard";
import { AdminFormData } from "@/components/login/RegisterAdminForm";

/**
 * Create Admin Page - Public registration page for creating admin users
 * Replicates registerAdmin.html with modular React components
 */
export default function CreateAdminPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (data: AdminFormData) => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/auth/createAdmin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Error al crear el administrador');
            }

            // Success - redirect to login page
            router.push('/');
        } catch (err: any) {
            setError(err.message || 'Error al conectar con el servidor');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center relative bg-gray-100 py-6 px-4 sm:px-6 overflow-x-hidden">
            {/* Animated background gradient (fixed position) */}
            <div className="fixed inset-0 bg-animated opacity-10 pointer-events-none -z-10"></div>

            {/* Decorative background elements */}
            <LoginBackground />

            {/* Main registration card */}
            <RegisterAdminCard
                onSubmit={handleSubmit}
                loading={loading}
                error={error}
            />

            <style jsx global>{`
                @keyframes gradient {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
                .bg-animated {
                    background: linear-gradient(-45deg, #3e78b2, #004ba8, #2a5298);
                    background-size: 400% 400%;
                    animation: gradient 15s ease infinite;
                }
            `}</style>
        </div>
    );
}
