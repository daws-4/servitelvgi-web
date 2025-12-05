"use client";
import React, { useState, useEffect } from "react";
import { WelcomeBanner } from "@/components/dashboard/WelcomeBanner";
import { StatCard } from "@/components/dashboard/StatCard";
import { PerformanceChart } from "@/components/dashboard/PerformanceChart";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { OrdersTable, OrderData } from "@/components/dashboard/OrdersTable";
import {
  OrdersIcon,
  InstallersIcon,
  InventoryIcon
} from "@/components/dashboard-icons";
import axios from "axios";
import Link from "next/link";

// Icons for StatCards (using FontAwesome classes or SVGs if available, here using SVGs)
// Note: The original HTML used FontAwesome. I'm using my SVG components where possible or placeholders if I missed some.
// I'll reuse the icons I created.

export default function DashboardPage() {
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());

  // Fetch orders from API
  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get('/api/web/orders');
      // Get only the 5 most recent orders
      const recentOrders = response.data.slice(0, 5);
      setOrders(recentOrders);
    } catch (err) {
      console.error("Error fetching orders:", err);
      setError("Error al cargar las órdenes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleSelectOrder = (orderId: string) => {
    const newSelected = new Set(selectedOrders);
    if (newSelected.has(orderId)) {
      newSelected.delete(orderId);
    } else {
      newSelected.add(orderId);
    }
    setSelectedOrders(newSelected);
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedOrders(new Set(orders.map((order) => order._id)));
    } else {
      setSelectedOrders(new Set());
    }
  };

  const handleViewOrder = (orderId: string) => {
    console.log("View order:", orderId);
    // TODO: Navigate to order details
    // Example: router.push(`/dashboard/orders/${orderId}`)
  };

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
        <div className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-dark">Órdenes Recientes</h2>
            <Link
              href="/dashboard/orders"
              className="text-sm text-primary hover:text-secondary transition-colors font-medium"
            >
              Ver todas →
            </Link>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="bg-white rounded-xl shadow-sm border border-neutral/10 p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              <p className="mt-3 text-sm text-gray-500">Cargando órdenes...</p>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
              <i className="fa-solid fa-triangle-exclamation text-red-500 text-xl mb-2"></i>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && orders.length === 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-neutral/10 p-8 text-center">
              <i className="fa-solid fa-inbox text-gray-300 text-4xl mb-3"></i>
              <p className="text-sm text-gray-500">No hay órdenes registradas</p>
            </div>
          )}

          {/* Orders Table */}
          {!loading && !error && orders.length > 0 && (
            <OrdersTable
              orders={orders}
              selectedOrders={selectedOrders}
              onSelectOrder={handleSelectOrder}
              onSelectAll={handleSelectAll}
              onViewOrder={handleViewOrder}
              onRefresh={fetchOrders}
            />
          )}
        </div>

      </main>
    </div>
  );
}
