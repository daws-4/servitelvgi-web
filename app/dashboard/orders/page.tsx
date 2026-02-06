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
    const [dateRange, setDateRange] = useState<{ start: string; end: string } | null>(null);
    const [crewFilter, setCrewFilter] = useState("all");
    const [isSentFilter, setIsSentFilter] = useState("all");
    const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
    const [currentPage, setCurrentPage] = useState(1);
    const [orders, setOrders] = useState<OrderData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false);

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
                order.email?.toLowerCase().includes(search) ||
                order.ticket_id?.toLowerCase().includes(search)
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

        // Apply crew filter
        if (crewFilter !== "all") {
            filtered = filtered.filter(order => order.assignedTo?._id === crewFilter);
        }

        // Apply isSent filter
        if (isSentFilter !== "all") {
            const isSent = isSentFilter === "true";
            filtered = filtered.filter(order => !!order.sentToNetuno === isSent);
        }

        // Apply date range filter
        if (dateRange) {
            filtered = filtered.filter(order => {
                const orderDate = new Date(order.createdAt || order.updatedAt || Date.now());
                const start = dateRange.start ? new Date(dateRange.start) : null;
                const end = dateRange.end ? new Date(dateRange.end) : null;

                // Set end date to end of day for inclusive filtering
                if (end) {
                    end.setHours(23, 59, 59, 999);
                }

                if (start && end) {
                    return orderDate >= start && orderDate <= end;
                } else if (start) {
                    return orderDate >= start;
                } else if (end) {
                    return orderDate <= end;
                }
                return true;
            });
        }

        return filtered;
    }, [orders, searchValue, statusFilter, typeFilter, dateRange, crewFilter, isSentFilter]);

    // Pagination logic
    const itemsPerPage = 10;
    const totalItems = filteredOrders.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    // Get current page items
    const paginatedOrders = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return filteredOrders.slice(startIndex, endIndex);
    }, [filteredOrders, currentPage]);

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

    const handleDateRangeChange = (range: { start: string; end: string } | null) => {
        setDateRange(range);
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
                dateRange={dateRange}
                onDateRangeChange={handleDateRangeChange}
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
                    {filteredOrders.length > 0 && (
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
