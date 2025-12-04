"use client";

import React, { useState } from "react";
import { UserIcon, LockIcon, EyeOpenIcon, EyeCloseIcon, ArrowRightIcon } from "@/components/icons";
import { Link } from "@heroui/link";

interface LoginFormProps {
    usuario: string;
    setUsuario: (value: string) => void;
    password: string;
    setPassword: (value: string) => void;
    onSubmit: (e: React.FormEvent) => void;
    loading: boolean;
    error: string | null;
}

/**
 * LoginForm - Form component with username and password inputs
 * Includes password visibility toggle, remember me checkbox, and forgot password link
 */
export const LoginForm: React.FC<LoginFormProps> = ({
    usuario,
    setUsuario,
    password,
    setPassword,
    onSubmit,
    loading,
    error
}) => {
    const [showPassword, setShowPassword] = useState(false);

    return (
        <div className="p-8">
            <div className="mb-6 text-center">
                <h2 className="text-xl font-semibold text-dark">Iniciar Sesión</h2>
                <p className="text-sm text-gray-400 mt-1">Ingresa tus credenciales para acceder</p>
            </div>

            <form onSubmit={onSubmit}>
                {/* Usuario Input */}
                <div className="mb-5 relative group">
                    <label className="block text-xs font-semibold text-neutral uppercase mb-1.5 ml-1">
                        Usuario
                    </label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-primary transition-colors">
                            <UserIcon />
                        </div>
                        <input
                            type="text"
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-dark focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all placeholder-gray-300"
                            placeholder="Ej. admin"
                            value={usuario}
                            onChange={(e) => setUsuario(e.target.value)}
                            required
                        />
                    </div>
                </div>

                {/* Password Input */}
                <div className="mb-2 relative group">
                    <label className="block text-xs font-semibold text-neutral uppercase mb-1.5 ml-1">
                        Contraseña
                    </label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-primary transition-colors">
                            <LockIcon />
                        </div>
                        <input
                            type={showPassword ? "text" : "password"}
                            className="w-full pl-10 pr-12 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-dark focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all placeholder-gray-300"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />

                        {/* Toggle Password Visibility */}
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-primary cursor-pointer focus:outline-none"
                        >
                            {showPassword ? <EyeCloseIcon /> : <EyeOpenIcon />}
                        </button>
                    </div>
                </div>

                {/* Forgot Password & Remember Me */}
                <div className="flex items-center justify-between mb-6">
                    <Link href="/recuperar-contrasena" className="text-xs font-semibold text-primary hover:text-secondary hover:underline">
                        ¿Olvidaste tu contraseña?
                    </Link>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-600">{error}</p>
                    </div>
                )}

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-primary hover:bg-secondary text-white font-bold py-3 px-4 rounded-lg shadow-lg shadow-primary/30 transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2 group disabled:opacity-75 disabled:cursor-not-allowed cursor-pointer "
                >
                    {loading ? (
                        <>
                            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>Verificando...</span>
                        </>
                    ) : (
                        <>
                            <span>Ingresar al Sistema</span>
                            <ArrowRightIcon className="group-hover:translate-x-1 transition-transform" />
                        </>
                    )}
                </button>
            </form>
        </div>
    );
};
