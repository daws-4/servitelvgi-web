import React from "react";
import Image from "next/image";
import logo from "@/public/logo_.jpeg";

/**
 * Logo - Reusable logo component with white background
 * Uses the logo_bgless.png image
 */
export const Logo: React.FC<{ size?: number }> = ({ size = 64 }) => {
    return (
        <div
            className="bg-white rounded-lg flex items-center justify-center shadow-md"
            style={{ width: size * 1.5, height: size, padding: size * 0.1 }}
        >
            <Image
                src={logo}
                alt="ENLARED Logo"
                width={size * 1.3}
                height={size * 0.8}
                className="object-contain"
            />
        </div>
    );
};
