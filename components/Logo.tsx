import React from "react";
import Image from "next/image";
import logo from "@/public/logo_bgless.png";

/**
 * Logo - Reusable logo component with white background
 * Uses the logo_bgless.png image
 */
export const Logo: React.FC<{ size?: number }> = ({ size = 64 }) => {
    return (
        <div
            className="bg-white rounded-full flex items-center justify-center shadow-md"
            style={{ width: size, height: size, padding: size * 0.15 }}
        >
            <Image
                src={logo}
                alt="ENLARED Logo"
                width={size * 0.7}
                height={size * 0.7}
                className="object-contain"
            />
        </div>
    );
};
