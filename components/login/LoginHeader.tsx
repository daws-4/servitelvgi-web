import React from "react";
import { SatelliteDishIcon } from "@/components/icons";

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
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm border border-white/30">
                    <SatelliteDishIcon className="text-background text-3xl" size={32} />
                </div>
                <h1 className="text-2xl font-bold text-white tracking-wide">SERVITELV</h1>
                <p className="text-blue-100 text-sm mt-1">Gestión de Operaciones</p>
            </div>
        </div>
    );
};
