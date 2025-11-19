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
        // Sidebar fijo: más ancho por defecto (w-24) y se expande más (w-72) al pasar el mouse
        <aside
            aria-label="Sidebar"
            className="fixed left-0 top-0 h-full z-50 w-1/12 hover:w-72 transition-all duration-300 ease-in-out bg-[#7D8CA3] text-white backdrop-blur-sm border-r border-[#004ba8] shadow-lg"
        >
            <div className="h-full flex flex-col items-center py-6 gap-6 overflow-y-auto">
                {/* Placeholder/logo area - Logo más grande */}
                <div className="w-full flex items-center justify-center px-2 overflow-hidden">
                    <div className="flex items-center gap-4">
                        {/* Marca circular usando el color #3 (#deefb7) */}
                        <span className="w-10 h-10 rounded-full bg-[#deefb7] inline-block shrink-0 shadow-sm" aria-hidden />
                        {/* Texto del menú un poco más grande y legible */}
                        <div className="text-lg font-bold tracking-wide whitespace-nowrap text-[#deefb7]">
                            Menu
                        </div>
                    </div>
                </div>

                {/* Área de botones de navegación */}
                <nav className="w-full flex flex-col items-center gap-3 px-3">
                    {children ? (
                        children
                    ) : (
                        // Placeholders con estilos actualizados: más grandes y con la nueva paleta
                        <>
                            <Button
                                href="/"
                                    className="w-full bg-[#004ba8] text-left px-4 py-3 text-lg font-medium rounded-xl transition-colors duration-200 text-white hover:bg-[#deefb7] hover:text-[#004ba8] focus:outline-none focus:ring-2 focus:ring-[#deefb7]"
                            >
                                Inicio
                            </Button>
                            <Button
                                href="/orders"
                                className="w-full bg-[#004ba8] text-left px-4 py-3 text-lg font-medium rounded-xl transition-colors duration-200 text-white hover:bg-[#deefb7] hover:text-[#004ba8] focus:outline-none focus:ring-2 focus:ring-[#deefb7]"
                            >
                                Ordenes
                            </Button>
                            <Button
                                href="/inventory"
                                className="w-full bg-[#004ba8] text-left px-4 py-3 text-lg font-medium rounded-xl transition-colors duration-200 text-white hover:bg-[#deefb7] hover:text-[#004ba8] focus:outline-none focus:ring-2 focus:ring-[#deefb7]"
                            >
                                Inventario
                            </Button>
                            <Button
                                href="/installers"
                                className="w-full bg-[#004ba8] text-left px-4 py-3 text-lg font-medium rounded-xl transition-colors duration-200 text-white hover:bg-[#deefb7] hover:text-[#004ba8] focus:outline-none focus:ring-2 focus:ring-[#deefb7]"
                            >
                                Instaladores
                            </Button>

                            {/* Asumiendo que LogoutButton acepta clases o se ajusta al contenedor */}
                            <div className="w-full mt-auto pt-4 border-t border-[#004ba8]">
                                <LogoutButton />
                            </div>
                        </>
                    )}
                </nav>
            </div>
        </aside>
    );
};

export default Sidebar;