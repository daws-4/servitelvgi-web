import React from "react";

/**
 * LoginBackground - Decorative background elements for the login page
 * Includes skewed overlays and blur circles to match the aesthetic from login.html
 */
export const LoginBackground: React.FC = () => {
    return (
        <>
            {/* Skewed overlay at top */}
            <div className="absolute top-0 left-0 w-full h-1/2 bg-primary/10 skew-y-3 origin-top-left"></div>

            {/* Bottom right blur circle */}
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-background rounded-full blur-3xl opacity-50 translate-x-1/2 translate-y-1/2"></div>

            {/* Top left blur circle */}
            <div className="absolute top-10 left-10 w-32 h-32 bg-secondary/10 rounded-full blur-xl"></div>
        </>
    );
};
