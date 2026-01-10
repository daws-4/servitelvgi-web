import React from "react";
import Link from "next/link";

/**
 * RegisterAdminFooter - Footer section for admin registration page
 * Includes back to login link and copyright information
 */
export const RegisterAdminFooter: React.FC = () => {
    return (
        <div className="bg-gray-50 p-4 border-t border-gray-100 flex justify-between items-center px-8 text-sm">
            <Link
                href="/"
                className="font-semibold text-primary hover:text-secondary hover:underline transition-colors flex items-center gap-1"
            >
                <i className="fa-solid fa-arrow-left"></i> Volver al Login
            </Link>
            <p className="text-gray-400 text-xs">
                ENLARED SGO &copy; 2025
            </p>
        </div>
    );
};
