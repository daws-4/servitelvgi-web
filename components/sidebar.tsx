"use client";
import { Tooltip } from "@heroui/react";
import React from "react";
import axios from "axios";
import { useRouter, usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Logo } from "@/components/Logo_letters"
import {
    DashboardIcon,
    OrdersIcon,
    InstallersIcon,
    InventoryIcon,
    ReportsIcon,
    SatelliteIcon,
    LogoutIcon,
    CrewsIcon,
    MobileIcon
} from "@/components/dashboard-icons";
import Link from "next/link";
import { UserCell } from "@/components/dataView/User";
import { useUser } from "@/contexts/UserContext";
export interface SidebarProps {
    children?: React.ReactNode;
    isOpen?: boolean;
    onClose?: () => void;
}

interface NavItem {
    href: string;
    label: string;
    icon: React.ComponentType<{ className?: string; size?: number }>;
}

const principalItems: NavItem[] = [
    { href: "/dashboard", label: "Dashboard", icon: DashboardIcon },
    { href: "/dashboard/orders", label: "Órdenes", icon: OrdersIcon },
    { href: "/dashboard/installers", label: "Instaladores", icon: InstallersIcon },
    { href: "/dashboard/crews", label: "Cuadrillas", icon: CrewsIcon }
];

const gestionItems: NavItem[] = [
    { href: "/dashboard/inventory", label: "Inventario", icon: InventoryIcon },
    { href: "/dashboard/reports", label: "Reportes", icon: ReportsIcon },
    { href: "/dashboard/apk", label: "Versiones APK", icon: MobileIcon },
];

export const Sidebar: React.FC<SidebarProps> = ({ children, isOpen = false, onClose }) => {
    const router = useRouter();
    const pathname = usePathname();
    const { user } = useUser();
    const logout = async () => {
        const logout = await axios.get('/api/auth/logout')
        if (logout.status === 200) {
            console.log("Logout successful:", logout.data);
            router.push('/login');
        }
        if (logout.status !== 200) {
            console.error("Logout failed:", logout.data);
        }
    }

    const isActive = (href: string) => {
        // Special case for dashboard root - only match exactly
        if (href === "/dashboard") {
            return pathname === "/dashboard";
        }
        // For other routes, match if pathname starts with href
        return pathname.startsWith(href);
    };



    return (
        <>
            {/* Mobile Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={onClose}
                />
            )}

            <aside
                id="sidebar"
                className={`fixed inset-y-0 left-0 z-50 w-64 bg-primary text-white transform transition-transform duration-300 ease-in-out shadow-xl flex flex-col md:relative md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                {/* Logo Area */}
                <div className="h-28 flex items-center justify-center border-b border-secondary/30 bg-secondary/20">
                    <div className="flex items-center gap-2 font-bold text-xl tracking-wider">
                        <Logo size={102} width={200} />
                    </div>
                </div>

                {/* Navigation Links */}
                <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
                    {/* Principal Section */}
                    <p className="text-xs font-semibold text-neutral uppercase tracking-wider mb-2 pl-2">Principal</p>

                    {principalItems.map((item) => {
                        const Icon = item.icon;
                        const active = isActive(item.href);

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className="relative flex items-center gap-3 px-4 py-3 text-white/80 hover:text-white rounded-lg transition-colors group"
                            >
                                {active && (
                                    <>
                                        <motion.div
                                            layoutId="activeBackground"
                                            className="absolute inset-0 bg-secondary/40 rounded-lg"
                                            transition={{
                                                type: "spring",
                                                stiffness: 350,
                                                damping: 30
                                            }}
                                        />
                                        <motion.div
                                            layoutId="activeBorder"
                                            className="absolute left-0 top-0 bottom-0 w-1 bg-background rounded-r"
                                            transition={{
                                                type: "spring",
                                                stiffness: 350,
                                                damping: 30
                                            }}
                                        />
                                    </>
                                )}
                                <Icon className={active ? "w-5 h-5 relative z-10 text-white" : "w-5 h-5 group-hover:text-background transition-colors relative z-10"} />
                                <span className={active ? "font-medium relative z-10 text-white" : "font-medium relative z-10"}>{item.label}</span>
                            </Link>
                        );
                    })}

                    {/* Gestión Section */}
                    <p className="text-xs font-semibold text-neutral uppercase tracking-wider mt-6 mb-2 pl-2">Gestión</p>

                    {gestionItems.map((item) => {
                        const Icon = item.icon;
                        const active = isActive(item.href);

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className="relative flex items-center gap-3 px-4 py-3 text-white/80 hover:text-white rounded-lg transition-colors group"
                            >
                                {active && (
                                    <>
                                        <motion.div
                                            layoutId="activeBackground"
                                            className="absolute inset-0 bg-secondary/40 rounded-lg"
                                            transition={{
                                                type: "spring",
                                                stiffness: 350,
                                                damping: 30
                                            }}
                                        />
                                        <motion.div
                                            layoutId="activeBorder"
                                            className="absolute left-0 top-0 bottom-0 w-1 bg-background rounded-r"
                                            transition={{
                                                type: "spring",
                                                stiffness: 350,
                                                damping: 30
                                            }}
                                        />
                                    </>
                                )}
                                <Icon className={active ? "w-5 h-5 relative z-10 text-white" : "w-5 h-5 group-hover:text-background transition-colors relative z-10"} />
                                <span className={active ? "font-medium relative z-10 text-white" : "font-medium relative z-10"}>{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* User Profile (Bottom) */}
                <div className="flex-shrink-0 mt-auto p-4 border-t border-secondary/30 bg-secondary/10">
                    <div className="flex items-center justify-center gap-3">
                        <UserCell name={user?.name} surname={user?.surname} email={user?.email} avatarUrl={`https://ui-avatars.com/api/?name=${user?.name}+${user?.surname}&background=deefb7&color=004ba8`} role={user?.role} id={user?._id} />
                        <Tooltip content="Cerrar Sesión">
                            <button onClick={() => logout()} className="text-neutral hover:text-white transition-colors cursor-pointer">
                                <LogoutIcon size={18} />
                            </button>
                        </Tooltip>
                    </div>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
