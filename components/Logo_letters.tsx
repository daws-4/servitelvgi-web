import React from "react";
import Image from "next/image";
import logo from "@/public/logo_.jpeg";

/**
 * Logo - Reusable logo component with white background
 * Uses the logo_bgless.png image
 */
export const Logo: React.FC<{ size?: number; width?: number }> = ({ size = 64, width }) => {
    const containerWidth = width ?? size * 1.5;
    return (
        <div
            className="bg-white rounded-lg shadow-md overflow-hidden relative"
            style={{ width: containerWidth, height: size, padding: size * 0.08 }}
        >
            <Image
                src={logo}
                alt="ENLARED Logo"
                fill
                className="object-contain"
                style={{ padding: size * 0.08 }}
            />
        </div>
    );
};
