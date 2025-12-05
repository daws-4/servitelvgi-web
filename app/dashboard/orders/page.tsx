"use client";

import React, { useState, useEffect, useMemo } from "react";
import { FilterToolbar } from "@/components/orders/FilterToolbar";
import { OrdersTable, OrderData } from "@/components/dashboard/OrdersTable";
import { Pagination } from "@/components/orders/Pagination";
import axios from "axios";

export default function OrdersPage() {
    const [searchValue, setSearchValue] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [typeFilter, setTypeFilter] = useState("all");
    const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
    const [currentPage, setCurrentPage] = useState(1);
    const [orders, setOrders] = useState<OrderData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch orders from API
    const fetchOrders = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await axios.get('/api/web/orders');
            setOrders(response.data);
        } catch (err) {
            console.error("Error fetching orders:", err);
            setError("Error al cargar las órdenes. Por favor, intenta de nuevo.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    // Filter and search logic
    const filteredOrders = useMemo(() => {
        let filtered = [...orders];

        // Apply search filter
        if (searchValue.trim()) {
            const search = searchValue.toLowerCase().trim();
            filtered = filtered.filter(order =>
                order.subscriberNumber.toLowerCase().includes(search) ||
                order.subscriberName.toLowerCase().includes(search) ||
                order.email?.toLowerCase().includes(search)
            );
        }

        // Apply status filter
        if (statusFilter !== "all") {
            filtered = filtered.filter(order => order.status === statusFilter);
        }

        // Apply type filter
        if (typeFilter !== "all") {
            filtered = filtered.filter(order => order.type === typeFilter);
        }

        return filtered;
    }, [orders, searchValue, statusFilter, typeFilter]);

    // Pagination logic
    const itemsPerPage = 10;
    const totalItems = filteredOrders.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    // Get current page items
    const paginatedOrders = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return filteredOrders.slice(startIndex, endIndex);
    }, [filteredOrders, currentPage, itemsPerPage]);

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchValue, statusFilter, typeFilter]);

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
            setSelectedOrders(new Set(paginatedOrders.map((order) => order._id)));
        } else {
            setSelectedOrders(new Set());
        }
    };

    const handleNewOrder = () => {
        console.log("Nueva orden clicked");
        // TODO: Open new order modal/form
    };

    const handleViewOrder = (orderId: string) => {
        console.log("View order:", orderId);
        // TODO: Navigate to order details
        // Example: router.push(`/dashboard/orders/${orderId}`)
    };

    return (
        <main className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
            {/* Page Header */}
            <div className="mb-6">
                <h1 className="text-xl font-semibold text-dark">Gestión de Órdenes</h1>
            </div>

            {/* Filter Toolbar */}
            <FilterToolbar
                searchValue={searchValue}
                onSearchChange={setSearchValue}
                statusFilter={statusFilter}
                onStatusChange={setStatusFilter}
                typeFilter={typeFilter}
                onTypeChange={setTypeFilter}
                onNewOrder={handleNewOrder}
            />

            {/* Loading State */}
            {loading && (
                <div className="bg-white rounded-xl shadow-sm border border-neutral/10 p-12 text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <p className="mt-4 text-gray-500">Cargando órdenes...</p>
                </div>
            )}

            {/* Error State */}
            {error && !loading && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                    <i className="fa-solid fa-triangle-exclamation text-red-500 text-2xl mb-2"></i>
                    <p className="text-red-700">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                        Reintentar
                    </button>
                </div>
            )}

            {/* Empty State */}
            {!loading && !error && filteredOrders.length === 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-neutral/10 p-12 text-center">
                    <i className="fa-solid fa-inbox text-gray-300 text-5xl mb-4"></i>
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">No se encontraron órdenes</h3>
                    <p className="text-gray-500">
                        {searchValue || statusFilter !== "all" || typeFilter !== "all"
                            ? "Intenta ajustar los filtros de búsqueda"
                            : "No hay órdenes registradas en el sistema"}
                    </p>
                </div>
            )}

            {/* Orders Table */}
            {!loading && !error && filteredOrders.length > 0 && (
                <>
                    <OrdersTable
                        orders={paginatedOrders}
                        selectedOrders={selectedOrders}
                        onSelectOrder={handleSelectOrder}
                        onSelectAll={handleSelectAll}
                        onViewOrder={handleViewOrder}
                        onRefresh={fetchOrders}
                    />

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="mt-4">
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                totalItems={totalItems}
                                itemsPerPage={itemsPerPage}
                                onPageChange={setCurrentPage}
                            />
                        </div>
                    )}
                </>
            )}
        </main>
    );
}
