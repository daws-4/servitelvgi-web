import React from "react";
import { RegisterAdminHeader } from "./RegisterAdminHeader";
import { RegisterAdminForm, AdminFormData } from "./RegisterAdminForm";
import { RegisterAdminFooter } from "./RegisterAdminFooter";

interface RegisterAdminCardProps {
    onSubmit: (data: AdminFormData) => Promise<void>;
    loading: boolean;
    error: string | null;
}

/**
 * RegisterAdminCard - Main container combining header, form, and footer
 * White card with rounded corners and shadow effects (wider than login card)
 */
export const RegisterAdminCard: React.FC<RegisterAdminCardProps> = ({ onSubmit, loading, error }) => {
    return (
        <div className="relative z-10 w-[95%] max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-white/50 transition-all duration-300 hover:shadow-primary/20">
            <RegisterAdminHeader />
            <RegisterAdminForm onSubmit={onSubmit} loading={loading} error={error} />
            <RegisterAdminFooter />
        </div>
    );
};
