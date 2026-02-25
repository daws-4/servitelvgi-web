"use client";
import React, { useState, useEffect, useCallback, Suspense } from "react";
import { WelcomeBanner } from "@/components/dashboard/WelcomeBanner";
import { StatCard } from "@/components/dashboard/StatCard";
import { PerformanceChart } from "@/components/dashboard/PerformanceChart";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { OrdersTable, OrderData } from "@/components/orders/OrdersTable";
import {
  OrdersIcon,
  InstallersIcon,
  InventoryIcon,
  CheckCircleIcon,
  WrenchIcon,
  EyeIcon,
  AlertTriangleIcon,
  ClockIcon
} from "@/components/dashboard-icons";
import axios from "axios";
import Link from "next/link";
import { NotFoundHandler } from "@/components/dashboard/NotFoundHandler";

interface DashboardStats {
  averiasCompletadas: number;
  instalacionesCompletadas: number;
  visitasCompletadas: number;
  averiasSinCompletar: number;
  instalacionesSinCompletar: number;
  generatedAt?: string;
}

const EMPTY_STATS: DashboardStats = {
  averiasCompletadas: 0,
  instalacionesCompletadas: 0,
  visitasCompletadas: 0,
  averiasSinCompletar: 0,
  instalacionesSinCompletar: 0,
};

export default function DashboardPage() {
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [stats, setStats] = useState<DashboardStats>(EMPTY_STATS);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());

  /**
   * fetchDashboard — single function that fires BOTH requests in parallel.
   *
   * Optimizations vs. previous version:
   *  1. Stats come from /api/web/dashboard-stats (MongoDB $group aggregation),
   *     so no documents are transferred for counting — just 5 integers.
   *  2. The table fetches only the 5 most recent orders by using `limit=5` so
   *     the server applies the limit before returning the payload.
   *  3. Both requests run in parallel (Promise.all) so total latency = max(a,b)
   *     instead of a+b.
   *  4. No polling — manual refresh button instead.
   */
  const fetchDashboard = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const [statsRes, ordersRes] = await Promise.all([
        axios.get<DashboardStats>("/api/web/dashboard-stats"),
        axios.get<OrderData[]>("/api/web/orders?limit=5"),
      ]);

      setStats(statsRes.data);
      setOrders(ordersRes.data.slice(0, 5));
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError("Error al cargar los datos del dashboard");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Load once on mount — no polling
  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">

            <StatCard
              title="Averías Completadas"
              value={stats.averiasCompletadas.toString()}
              icon={<WrenchIcon size={24} />}
              iconBgColor="bg-green-100"
              iconColor="text-green-600"
            />

            <StatCard
              title="Instalaciones Completadas"
              value={stats.instalacionesCompletadas.toString()}
              icon={<CheckCircleIcon size={24} />}
              iconBgColor="bg-blue-100"
              iconColor="text-blue-600"
            />

            <StatCard
              title="Visitas Completadas"
              value={stats.visitasCompletadas.toString()}
              icon={<EyeIcon size={24} />}
              iconBgColor="bg-purple-100"
              iconColor="text-purple-600"
            />

            <StatCard
              title="Averías Sin Completar"
              value={stats.averiasSinCompletar.toString()}
              icon={<ClockIcon size={24} />}
              iconBgColor="bg-yellow-100"
              iconColor="text-yellow-600"
            />

            <StatCard
              title="Instalaciones Sin Completar"
              value={stats.instalacionesSinCompletar.toString()}
              icon={<AlertTriangleIcon size={24} />}
              iconBgColor="bg-orange-100"
              iconColor="text-orange-600"
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

              <div className="flex items-center gap-3">
                {/* Manual refresh button — replaces polling */}
                <button
                  onClick={() => fetchDashboard(true)}
                  disabled={refreshing || loading}
                  title="Actualizar datos"
                  className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={refreshing ? "animate-spin" : ""}
                  >
                    <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
                    <path d="M21 3v5h-5" />
                  </svg>
                  {refreshing ? "Actualizando..." : "Actualizar"}
                </button>

                <Link
                  href="/dashboard/orders"
                  className="text-sm text-primary hover:text-secondary transition-colors font-medium"
                >
                  Ver todas →
                </Link>
              </div>
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
                <button
                  onClick={() => fetchDashboard(true)}
                  className="mt-2 text-sm text-red-600 underline hover:text-red-800"
                >
                  Reintentar
                </button>
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
                onRefresh={() => fetchDashboard(true)}
              />
            )}
          </div>

        </main>
      </div>
    </>
  );
}
