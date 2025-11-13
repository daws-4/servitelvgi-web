"use client";
import { Button } from "@heroui/react";
import React from "react";
import { LogoutButton } from "@/components/components";
export interface SidebarProps {
    // Optional: supply nav Buttons as children when ready
    children?: React.ReactNode;
}

export const Sidebar: React.FC<SidebarProps> = ({ children }) => {
    return (
        // fixed overlayed sidebar: narrow by default (1/12), expands on hover to 1/6
        <aside
            aria-label="Sidebar"
            className="fixed left-0 top-0 h-full z-50 w-1/12 hover:w-1/6 transition-all duration-200 ease-in-out bg-[#08203a] text-black backdrop-blur-sm border-r border-[#0f2b46]"
        >
            <div className="h-full flex flex-col items-center py-4 gap-4 overflow-y-auto">
                {/* Placeholder/logo area */}
                <div className="w-full flex items-center justify-center px-2">
                    <div className="flex items-center gap-2">
                        {/* circular mark in yellow */}
                        <span className="w-8 h-8 rounded-full bg-[#ffd166] inline-block" aria-hidden />
                        <div className="text-sm font-semibold">Menu</div>
                    </div>
                </div>

                {/* Navigation Buttons area. When the actual nav Buttons are ready, pass them as children. */}
                <nav className="w-full flex flex-col items-center gap-2 px-2">
                    {children ? (
                        children
                    ) : (
                        // Minimal placeholders while navigation Buttons are being fixed
                        <>
                            <Button href="/" className="w-full text-left px-3 py-2 rounded transition-colors duration-150 text-black hover:bg-[#ffd166] hover:text-[#08203a] focus:outline-none focus:ring-2 focus:ring-[#ffd166]">Inicio</Button>
                            <Button href="/orders" className="w-full text-left px-3 py-2 rounded transition-colors duration-150 text-black hover:bg-[#ffd166] hover:text-[#08203a] focus:outline-none focus:ring-2 focus:ring-[#ffd166]">Ordenes</Button>
                            <Button href="/inventory" className="w-full text-left px-3 py-2 rounded transition-colors duration-150 text-black hover:bg-[#ffd166] hover:text-[#08203a] focus:outline-none focus:ring-2 focus:ring-[#ffd166]">Inventario</Button>
                            <Button href="/installers" className="w-full text-left px-3 py-2 rounded transition-colors duration-150 text-black hover:bg-[#ffd166] hover:text-[#08203a] focus:outline-none focus:ring-2 focus:ring-[#ffd166]">Instaladores</Button>
                            <LogoutButton />
                        </>
                    )}
                </nav>
            </div>
        </aside>
    );
};

export default Sidebar;
