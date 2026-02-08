"use client";
import React, { useState, useEffect, Suspense } from "react";
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

// Icons for StatCards (using FontAwesome classes or SVGs if available, here using SVGs)
// Note: The original HTML used FontAwesome. I'm using my SVG components where possible or placeholders if I missed some.
// I'll reuse the icons I created.

export default function DashboardPage() {
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());

  // StatCard data states
  const [averiasCompletadas, setAveriasCompletadas] = useState<number>(0);
  const [instalacionesCompletadas, setInstalacionesCompletadas] = useState<number>(0);
  const [visitasCompletadas, setVisitasCompletadas] = useState<number>(0);
  const [averiasSinCompletar, setAveriasSinCompletar] = useState<number>(0);
  const [instalacionesSinCompletar, setInstalacionesSinCompletar] = useState<number>(0);

  // Fetch statCard data
  const fetchStatCardData = async () => {
    try {
      // Fetch all orders
      const ordersResponse = await axios.get('/api/web/orders');
      const allOrders = ordersResponse.data;

      // Calcular órdenes de averías completadas
      const averiasCompletadasCount = allOrders.filter((order: any) =>
        order.orderType === "averia" && order.status === "completed"
      ).length;
      setAveriasCompletadas(averiasCompletadasCount);

      // Calcular órdenes de instalaciones completadas
      const instalacionesCompletadasCount = allOrders.filter((order: any) =>
        order.orderType === "instalacion" && order.status === "completed"
      ).length;
      setInstalacionesCompletadas(instalacionesCompletadasCount);

      // Calcular órdenes de visitas completadas
      const visitasCompletadasCount = allOrders.filter((order: any) =>
        order.orderType === "visita" && order.status === "completed"
      ).length;
      setVisitasCompletadas(visitasCompletadasCount);

      // Calcular órdenes de averías sin completar (pending, in-progress, etc.)
      const averiasSinCompletarCount = allOrders.filter((order: any) =>
        order.orderType === "averia" && order.status !== "completed"
      ).length;
      setAveriasSinCompletar(averiasSinCompletarCount);

      // Calcular órdenes de instalaciones sin completar
      const instalacionesSinCompletarCount = allOrders.filter((order: any) =>
        order.orderType === "instalacion" && order.status !== "completed"
      ).length;
      setInstalacionesSinCompletar(instalacionesSinCompletarCount);

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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">

            <StatCard
              title="Averías Completadas"
              value={averiasCompletadas.toString()}
              icon={<WrenchIcon size={24} />}
              iconBgColor="bg-green-100"
              iconColor="text-green-600"
            />

            <StatCard
              title="Instalaciones Completadas"
              value={instalacionesCompletadas.toString()}
              icon={<CheckCircleIcon size={24} />}
              iconBgColor="bg-blue-100"
              iconColor="text-blue-600"
            />

            <StatCard
              title="Visitas Completadas"
              value={visitasCompletadas.toString()}
              icon={<EyeIcon size={24} />}
              iconBgColor="bg-purple-100"
              iconColor="text-purple-600"
            />

            <StatCard
              title="Averías Sin Completar"
              value={averiasSinCompletar.toString()}
              icon={<ClockIcon size={24} />}
              iconBgColor="bg-yellow-100"
              iconColor="text-yellow-600"
            />

            <StatCard
              title="Instalaciones Sin Completar"
              value={instalacionesSinCompletar.toString()}
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
