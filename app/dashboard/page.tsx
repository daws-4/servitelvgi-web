"use client";
import React from "react";
import { WelcomeBanner } from "@/components/dashboard/WelcomeBanner";
import { StatCard } from "@/components/dashboard/StatCard";
import { PerformanceChart } from "@/components/dashboard/PerformanceChart";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { OrdersTable } from "@/components/dashboard/OrdersTable";
import {
  OrdersIcon,
  InstallersIcon,
  InventoryIcon
} from "@/components/dashboard-icons";

// Icons for StatCards (using FontAwesome classes or SVGs if available, here using SVGs)
// Note: The original HTML used FontAwesome. I'm using my SVG components where possible or placeholders if I missed some.
// I'll reuse the icons I created.

export default function DashboardPage() {
  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden h-full">
      <main className="flex-1 overflow-y-auto p-6 bg-gray-50/50">

        <WelcomeBanner />

        {/* KPI CARDS GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">

          <StatCard
            title="Órdenes Hoy"
            value="24"
            icon={<OrdersIcon className="text-lg" size={24} />}
            iconBgColor="bg-background/50"
            iconColor="text-primary"
            trend={{ value: "12%", isPositive: true, label: "vs ayer" }}
          />

          <StatCard
            title="Pendientes"
            value="8"
            icon={<div className="text-lg font-bold">🕒</div>} // Placeholder for Clock icon if not created
            iconBgColor="bg-yellow-100"
            iconColor="text-yellow-600"
            trend={{ value: "2", isPositive: false, label: "vs ayer" }}
          />

          <StatCard
            title="Técnicos Activos"
            value="12"
            icon={<InstallersIcon className="text-lg" size={24} />}
            iconBgColor="bg-blue-100"
            iconColor="text-secondary"
            trend={{ value: "100%", isPositive: true, label: "operatividad" }}
          />

          <StatCard
            title="Inventario Crítico"
            value="3"
            subValue="items"
            icon={<InventoryIcon className="text-lg" size={24} />}
            iconBgColor="bg-red-100"
            iconColor="text-red-600"
            alertMessage="Requiere atención"
          />
        </div>

        {/* CHARTS & TABLES SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <PerformanceChart />
          <RecentActivity />
        </div>

        {/* RECENT ORDERS TABLE */}
        <OrdersTable />

      </main>
    </div>
  );
}
