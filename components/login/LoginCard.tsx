import React from "react";
import { LoginHeader } from "./LoginHeader";
import { LoginForm } from "./LoginForm";
import { LoginFooter } from "./LoginFooter";

interface LoginCardProps {
    usuario: string;
    setUsuario: (value: string) => void;
    password: string;
    setPassword: (value: string) => void;
    onSubmit: (e: React.FormEvent) => void;
    loading: boolean;
    error: string | null;
}

/**
 * LoginCard - Main container combining header, form, and footer
 * White card with rounded corners and shadow effects
 */
export const LoginCard: React.FC<LoginCardProps> = (props) => {
    return (
        <div className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-white/50">
            <LoginHeader />
            <LoginForm {...props} />
            <LoginFooter />
        </div>
    );
};
