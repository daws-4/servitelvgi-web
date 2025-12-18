import React from "react";

/**
 * RegisterAdminHeader - Header section for admin registration page
 * Features gradient background and user-plus icon
 */
export const RegisterAdminHeader: React.FC = () => {
    return (
        <div className="bg-gradient-to-r from-primary to-secondary p-8 text-center relative overflow-hidden">
            {/* Decorative circle in corner */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-10 -mt-10"></div>

            <div className="relative z-10 flex flex-col items-center">
                {/* Logo Container with user-plus icon */}
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4 backdrop-blur-sm border border-white/30 text-white shadow-lg">
                    <i className="fa-solid fa-user-plus text-background text-2xl"></i>
                </div>
                <h1 className="text-2xl font-bold text-white tracking-wide">SERVITEL SGO</h1>
                <p className="text-blue-100 text-sm mt-1 font-light">Registro de Nuevo Administrador</p>
            </div>
        </div>
    );
};
