"use client";
import React from "react";
import { SearchIcon, BellIcon, GearIcon, BarsIcon } from "@/components/dashboard-icons";

export default function Navbar() {
    return (
        <header className="h-16 bg-white shadow-sm flex items-center justify-between px-6 z-10 border-b border-neutral/20 w-full">
            {/* Toggle Button (Mobile) & Title */}

            <div className="flex items-center gap-4">
                <button id="sidebarToggle" className="md:hidden text-primary hover:text-secondary focus:outline-none">
                    <BarsIcon size={24} />
                </button>
                <h1 className="text-xl font-semibold text-dark hidden sm:block">Panel de Control</h1>
            </div>

            {/* Search & Actions */}
            <div className="flex items-center gap-4">
                {/* Search Bar */}
                <div className="hidden md:flex items-center bg-gray-100 rounded-full px-4 py-1.5 border border-transparent focus-within:border-primary focus-within:bg-white transition-all">
                    <SearchIcon className="text-neutral" size={16} />
                    <input type="text" placeholder="Buscar orden..." className="bg-transparent border-none focus:ring-0 text-sm ml-2 w-48 text-dark placeholder-neutral outline-none" />
                </div>

                {/* Icons */}
                <button className="relative p-2 text-neutral hover:text-primary transition-colors">
                    <BellIcon size={20} />
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                </button>

                <button className="p-2 text-neutral hover:text-primary transition-colors">
                    <GearIcon size={20} />
                </button>
            </div>
        </header >
    );
}
