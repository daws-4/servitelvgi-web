"use client";
import React, { useState, useEffect, Suspense } from "react";
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
import { NotFoundHandler } from "@/components/dashboard/NotFoundHandler";

// Icons for StatCards (using FontAwesome classes or SVGs if available, here using SVGs)
// Note: The original HTML used FontAwesome. I'm using my SVG components where possible or placeholders if I missed some.
// I'll reuse the icons I created.

export default function DashboardPage() {
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());

  // StatCard data states
  const [todayOrdersCount, setTodayOrdersCount] = useState<number>(0);
  const [todayOrdersTrend, setTodayOrdersTrend] = useState<{ value: string; isPositive: boolean } | null>(null);
  const [pendingOrdersCount, setPendingOrdersCount] = useState<number>(0);
  const [pendingOrdersTrend, setPendingOrdersTrend] = useState<{ value: string; isPositive: boolean } | null>(null);
  const [activeCrewsCount, setActiveCrewsCount] = useState<number>(0);
  const [activeCrewsTrend, setActiveCrewsTrend] = useState<{ value: string; isPositive: boolean } | null>(null);
  const [criticalInventoryCount, setCriticalInventoryCount] = useState<number>(0);


  // Helper function to check if a date is today
  const isToday = (date: Date | string) => {
    const d = new Date(date);
    const today = new Date();
    return d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear();
  };

  // Helper function to check if a date is yesterday
  const isYesterday = (date: Date | string) => {
    const d = new Date(date);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return d.getDate() === yesterday.getDate() &&
      d.getMonth() === yesterday.getMonth() &&
      d.getFullYear() === yesterday.getFullYear();
  };

  // Fetch statCard data
  const fetchStatCardData = async () => {
    try {
      // Fetch all orders
      const ordersResponse = await axios.get('/api/web/orders');
      const allOrders = ordersResponse.data;

      // Calculate today's orders
      const todayOrders = allOrders.filter((order: any) =>
        isToday(order.receptionDate || order.createdAt)
      );
      const yesterdayOrders = allOrders.filter((order: any) =>
        isYesterday(order.receptionDate || order.createdAt)
      );

      setTodayOrdersCount(todayOrders.length);

      // Calculate trend for today's orders
      if (yesterdayOrders.length > 0) {
        const change = ((todayOrders.length - yesterdayOrders.length) / yesterdayOrders.length) * 100;
        setTodayOrdersTrend({
          value: `${Math.abs(Math.round(change))}%`,
          isPositive: change >= 0
        });
      } else if (todayOrders.length > 0) {
        setTodayOrdersTrend({ value: "100%", isPositive: true });
      }

      // Calculate pending orders
      const todayPending = allOrders.filter((order: any) =>
        order.status === "pending" && isToday(order.receptionDate || order.createdAt)
      );
      const yesterdayPending = allOrders.filter((order: any) =>
        order.status === "pending" && isYesterday(order.receptionDate || order.createdAt)
      );

      setPendingOrdersCount(todayPending.length);

      // Calculate trend for pending orders
      if (yesterdayPending.length > 0) {
        const change = todayPending.length - yesterdayPending.length;
        setPendingOrdersTrend({
          value: `${Math.abs(change)}`,
          isPositive: change <= 0 // For pending, less is better
        });
      } else if (todayPending.length > 0) {
        setPendingOrdersTrend({ value: `${todayPending.length}`, isPositive: false });
      }

      // Fetch active crews
      const crewsResponse = await axios.get('/api/web/crews');
      const allCrews = crewsResponse.data;

      // Count crews (all crews are considered active by default)
      setActiveCrewsCount(allCrews.length);

      // For crews, we could show total count or calculate based on members
      if (allCrews.length > 0) {
        setActiveCrewsTrend({
          value: `${allCrews.length}`,
          isPositive: true
        });
      }

      // Fetch critical inventory (low stock items)
      const inventoryResponse = await axios.get('/api/web/inventory');
      const inventoryData = inventoryResponse.data;

      // The API returns { success, count, items } structure
      const allInventory = inventoryData.items || [];

      // Count items with current stock at or below minimum stock
      const criticalItems = allInventory.filter((item: any) =>
        item.currentStock <= item.minimumStock
      );
      setCriticalInventoryCount(criticalItems.length);

    } catch (err) {
      console.error("Error fetching statCard data:", err);
    }
  };

  // Fetch orders from API (for table)
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
    fetchStatCardData();
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
    <>
      {/* Suspense boundary for useSearchParams */}
      <Suspense fallback={null}>
        <NotFoundHandler />
      </Suspense>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden h-full">
        <main className="flex-1 overflow-y-auto p-6 bg-gray-50/50">

          <WelcomeBanner />

          {/* KPI CARDS GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">

            <StatCard
              title="Órdenes Hoy"
              value={todayOrdersCount.toString()}
              icon={<OrdersIcon className="text-lg" size={24} />}
              iconBgColor="bg-background/50"
              iconColor="text-primary"
              trend={todayOrdersTrend ? { ...todayOrdersTrend, label: "vs ayer" } : undefined}
            />

            <StatCard
              title="Pendientes"
              value={pendingOrdersCount.toString()}
              icon={<div className="text-lg font-bold">🕒</div>} // Placeholder for Clock icon if not created
              iconBgColor="bg-yellow-100"
              iconColor="text-yellow-600"
              trend={pendingOrdersTrend ? { ...pendingOrdersTrend, label: "vs ayer" } : undefined}
            />

            <StatCard
              title="Cuadrillas Activas"
              value={activeCrewsCount.toString()}
              icon={<div className="text-lg font-bold text-secondary"><i className="fa-solid fa-users"></i></div>}
              iconBgColor="bg-blue-100"
              iconColor="text-secondary"
              trend={activeCrewsTrend ? { ...activeCrewsTrend, label: "total" } : undefined}
            />

            <StatCard
              title="Inventario Crítico"
              value={criticalInventoryCount.toString()}
              subValue="items"
              icon={<InventoryIcon className="text-lg" size={24} />}
              iconBgColor="bg-red-100"
              iconColor="text-red-600"
              alertMessage={criticalInventoryCount > 0 ? "Requiere atención" : undefined}
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
    </>
  );
}
