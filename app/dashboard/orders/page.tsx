"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { FilterToolbar } from "@/components/orders/FilterToolbar";
import { OrdersTable, OrderData } from "@/components/orders/OrdersTable";
import { Pagination } from "@/components/orders/Pagination";
import { NewOrderModal } from "@/components/orders/NewOrderModal";
import axios from "axios";

export default function OrdersPage() {
    const router = useRouter();
    const [searchValue, setSearchValue] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [typeFilter, setTypeFilter] = useState("all");
    const [createdAtRange, setCreatedAtRange] = useState<{ start: string; end: string } | null>(null);
    const [updatedAtRange, setUpdatedAtRange] = useState<{ start: string; end: string } | null>(null);
    const [completionDateRange, setCompletionDateRange] = useState<{ start: string; end: string } | null>(null);
    const [crewFilter, setCrewFilter] = useState("all");
    const [isSentFilter, setIsSentFilter] = useState("all");
    const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const [orders, setOrders] = useState<OrderData[]>([]);
    const [totalItems, setTotalItems] = useState(0);
    const [totalPages, setTotalPages] = useState(1);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false);

    // Fetch orders from API
    const fetchOrders = async () => {
        try {
            setLoading(true);
            setError(null);

            const params = new URLSearchParams();
            params.append("page", currentPage.toString());
            params.append("limit", itemsPerPage.toString());

            if (searchValue.trim()) params.append("search", searchValue.trim());
            if (statusFilter !== "all") params.append("status", statusFilter);
            if (typeFilter !== "all") params.append("type", typeFilter);
            if (crewFilter !== "all") params.append("assignedTo", crewFilter);
            if (isSentFilter !== "all") params.append("isSent", isSentFilter);

            // Handle date ranges (only one at a time for the API logic right now, prioritizing completion, then updated, then created)
            if (completionDateRange) {
                params.append("startDate", completionDateRange.start);
                params.append("endDate", completionDateRange.end);
                params.append("dateField", "completionDate");
            } else if (updatedAtRange) {
                params.append("startDate", updatedAtRange.start);
                params.append("endDate", updatedAtRange.end);
                params.append("dateField", "updatedAt");
            } else if (createdAtRange) {
                params.append("startDate", createdAtRange.start);
                params.append("endDate", createdAtRange.end);
                params.append("dateField", "createdAt");
            }

            const response = await axios.get(`/api/web/orders?${params.toString()}`);

            // Expected backend format when page/limit is provided
            if (response.data.data && response.data.pagination) {
                setOrders(response.data.data);
                setTotalItems(response.data.pagination.total || 0);
                setTotalPages(response.data.pagination.pages || 1);
            } else {
                // Fallback if backend didn't return paginated structure
                setOrders(Array.isArray(response.data) ? response.data : []);
                setTotalItems(response.data.length || 0);
                setTotalPages(1);
            }
        } catch (err) {
            console.error("Error fetching orders:", err);
            setError("Error al cargar las órdenes. Por favor, intenta de nuevo.");
        } finally {
            setLoading(false);
        }
    };

    // Re-fetch when filters or page changes
    useEffect(() => {
        fetchOrders();
    }, [currentPage, searchValue, statusFilter, typeFilter, crewFilter, isSentFilter, createdAtRange, updatedAtRange, completionDateRange]);

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

    const handleSearchChange = (value: string) => {
        setSearchValue(value);
        setCurrentPage(1); // Reset to first page on search
        setSelectedOrders(new Set()); // Clear selection
    };

    const handleStatusChange = (value: string) => {
        setStatusFilter(value);
        setCurrentPage(1); // Reset to first page on filter
        setSelectedOrders(new Set()); // Clear selection
    };

    const handleTypeChange = (value: string) => {
        setTypeFilter(value);
        setCurrentPage(1); // Reset to first page on filter
        setSelectedOrders(new Set()); // Clear selection
    };

    const handleCreatedAtRangeChange = (range: { start: string; end: string } | null) => {
        console.debug('[Filter Change] createdAt range:', range);
        setCreatedAtRange(range);
        setCurrentPage(1);
        setSelectedOrders(new Set());
    };

    const handleUpdatedAtRangeChange = (range: { start: string; end: string } | null) => {
        console.debug('[Filter Change] updatedAt range:', range);
        setUpdatedAtRange(range);
        setCurrentPage(1);
        setSelectedOrders(new Set());
    };

    const handleCompletionDateRangeChange = (range: { start: string; end: string } | null) => {
        console.debug('[Filter Change] completionDate range:', range);
        setCompletionDateRange(range);
        setCurrentPage(1);
        setSelectedOrders(new Set());
    };

    const handleCrewChange = (value: string) => {
        setCrewFilter(value);
        setCurrentPage(1);
        setSelectedOrders(new Set());
    };

    const handleIsSentChange = (value: string) => {
        setIsSentFilter(value);
        setCurrentPage(1);
        setSelectedOrders(new Set());
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        setSelectedOrders(new Set()); // Clear selection on page change
    };

    const handleNewOrder = () => {
        setIsNewOrderModalOpen(true);
    };

    const handleNewOrderSuccess = () => {
        setIsNewOrderModalOpen(false);
        fetchOrders(); // Refresh orders list
    };

    const handleViewOrder = (orderId: string) => {
        router.push(`/dashboard/orders/${orderId}`);
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
                onSearchChange={handleSearchChange}
                statusFilter={statusFilter}
                onStatusChange={handleStatusChange}
                typeFilter={typeFilter}
                onTypeChange={handleTypeChange}
                createdAtRange={createdAtRange}
                onCreatedAtRangeChange={handleCreatedAtRangeChange}
                updatedAtRange={updatedAtRange}
                onUpdatedAtRangeChange={handleUpdatedAtRangeChange}
                completionDateRange={completionDateRange}
                onCompletionDateRangeChange={handleCompletionDateRangeChange}
                crewFilter={crewFilter}
                onCrewChange={handleCrewChange}
                isSentFilter={isSentFilter}
                onIsSentChange={handleIsSentChange}
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
            {!loading && !error && orders.length === 0 && (
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
            {!loading && !error && orders.length > 0 && (
                <>
                    <OrdersTable
                        orders={orders}
                        selectedOrders={selectedOrders}
                        onSelectOrder={handleSelectOrder}
                        onSelectAll={handleSelectAll}
                        onViewOrder={handleViewOrder}
                        onRefresh={fetchOrders}
                    />

                    {/* Pagination */}
                    {orders.length > 0 && (
                        <div className="mt-4">
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                totalItems={totalItems}
                                itemsPerPage={itemsPerPage}
                                onPageChange={handlePageChange}
                            />
                        </div>
                    )}
                </>
            )}

            {/* New Order Modal */}
            <NewOrderModal
                isOpen={isNewOrderModalOpen}
                onClose={() => setIsNewOrderModalOpen(false)}
                onSuccess={handleNewOrderSuccess}
            />
        </main>
    );
}
