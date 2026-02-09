import React from "react";
import { Logo } from "../Logo";

/**
 * LoginHeader - Header section with logo and branding
 * Features gradient background and satellite dish icon
 */
export const LoginHeader: React.FC = () => {
    return (
        <div className="bg-gradient-to-r from-primary to-secondary p-8 text-center relative overflow-hidden">
            {/* Decorative circle in corner */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-10 -mt-10"></div>

            <div className="relative z-10">
                <div className="flex items-center justify-center mx-auto mb-4">
                    <Logo size={96} />
                </div>
                <h1 className="text-2xl font-bold text-white tracking-wide">ENLARED</h1>
                <p className="text-blue-100 text-sm mt-1">Gestión de Operaciones</p>
            </div>
        </div>
    );
};
