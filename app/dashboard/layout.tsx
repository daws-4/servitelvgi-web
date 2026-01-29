"use client";

import { useState } from "react";
import { Sidebar } from "@/components/sidebar";
import { UserProvider } from "@/contexts/UserContext";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <UserProvider>
            <div className="flex h-screen overflow-hidden bg-gray-50">
                {/* Hamburger Menu Button - Mobile Only */}
                <button
                    onClick={() => setSidebarOpen(true)}
                    className="fixed top-4 left-4 z-30 md:hidden bg-primary text-white p-2 rounded-lg shadow-lg hover:bg-primary/90 transition-colors opacity-70"
                    aria-label="Open sidebar"
                >
                    <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 6h16M4 12h16M4 18h16"
                        />
                    </svg>
                </button>

                <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

                {/* Main Content Wrapper */}
                <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                    {children}
                </div>
            </div>
        </UserProvider>
    )
}