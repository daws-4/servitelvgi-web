"use client";
import React from "react";
import { useUser } from "@/contexts/UserContext";

export const WelcomeBanner = () => {
    const { user, loading } = useUser();

    return (
        <div className="mb-8 bg-gradient-to-r from-primary to-secondary rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
            <div className="relative z-10">
                <h2 className="text-2xl font-bold mb-1">
                    ¡Hola, {loading ? "..." : user ? `${user.name}` : "Administrador"}! 👋
                </h2>
                <p className="text-background/90">Aquí tienes el resumen de las operaciones de hoy.</p>
            </div>
            {/* Decorative circle */}
            <div className="absolute -right-10 -bottom-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        </div>
    );
};
