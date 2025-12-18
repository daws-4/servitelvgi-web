"use client";

import React, { useState, useEffect } from "react";
import { useDisclosure } from "@heroui/react";
import InventoryKPICards from "@/components/inventory/InventoryKPICards";
import InventoryFilterToolbar from "@/components/inventory/InventoryFilterToolbar";
import InventoryTable, { InventoryItem } from "@/components/inventory/InventoryTable";
import CreateItemModal from "@/components/inventory/CreateItemModal";
import EditItemModal from "@/components/inventory/EditItemModal";
import RestockModal from "@/components/inventory/RestockModal";
import AssignMaterialsModal from "@/components/inventory/AssignMaterialsModal";
import InventoryHistoryModal from "@/components/inventory/InventoryHistoryModal";

export default function InventoryPage() {
    // Modal states
    const createModal = useDisclosure();
    const editModal = useDisclosure();
    const restockModal = useDisclosure();
    const assignModal = useDisclosure();
    const historyModal = useDisclosure();

    // Data states
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [stats, setStats] = useState({
        totalItems: 0,
        criticalStock: 0,
        totalUnits: 0,
        todayMovements: 0,
        inboundToday: 0,
    });
    const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

    // Filter states
    const [searchValue, setSearchValue] = useState("");
    const [typeFilter, setTypeFilter] = useState("all");
    const [showOnlyLowStock, setShowOnlyLowStock] = useState(false);

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const itemsPerPage = 10;

    // Loading states
    const [loadingItems, setLoadingItems] = useState(false);
    const [loadingStats, setLoadingStats] = useState(false);

    // Fetch inventory items
    const fetchItems = async () => {
        setLoadingItems(true);
        try {
            // Build query params
            const params = new URLSearchParams();
            if (searchValue) params.append("search", searchValue);
            if (typeFilter && typeFilter !== "all") params.append("type", typeFilter);
            if (showOnlyLowStock) params.append("lowStock", "true");

            const response = await fetch(`/api/web/inventory?${params.toString()}`);
            const data = await response.json();

            if (data.success) {
                setItems(data.items || []);
                setTotalItems(data.count || 0);
            } else {
                console.error("Error fetching items:", data.error);
                setItems([]);
            }
        } catch (error) {
            console.error("Error fetching inventory:", error);
            setItems([]);
        } finally {
            setLoadingItems(false);
        }
    };

    // Fetch statistics
    const fetchStats = async () => {
        setLoadingStats(true);
        try {
            // Calcular primer y último día del mes actual
            const now = new Date();
            const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
            const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

            // Formatear fechas para query params (ISO string)
            const params = new URLSearchParams({
                startDate: firstDay.toISOString(),
                endDate: lastDay.toISOString(),
            });

            const response = await fetch(`/api/web/inventory/statistics?${params.toString()}`);
            const data = await response.json();

            if (data.success && data.statistics) {
                const stats = data.statistics;

                // Calcular métricas desde la respuesta
                const entryMovements = stats.movementsByType?.find((m: any) => m.type === "entry")?.count || 0;
                const totalMovements = stats.totalMovements || 0;

                setStats({
                    totalItems: stats.totalItems || 0,
                    criticalStock: stats.criticalStock || 0,
                    totalUnits: stats.totalWarehouseStock || 0,
                    todayMovements: totalMovements,
                    inboundToday: entryMovements,
                });
            }
        } catch (error) {
            console.error("Error fetching stats:", error);
        } finally {
            setLoadingStats(false);
        }
    };

    // Initial load
    useEffect(() => {
        fetchItems();
        fetchStats();
    }, [searchValue, typeFilter, showOnlyLowStock, currentPage]);

    // Handle edit item
    const handleEdit = (item: InventoryItem) => {
        setSelectedItem(item);
        editModal.onOpen();
    };

    // Handle delete item
    const handleDelete = async (itemId: string) => {
        if (!confirm("¿Estás seguro de eliminar este ítem?")) return;

        try {
            const response = await fetch(`/api/web/inventory?id=${itemId}`, {
                method: "DELETE",
            });

            const data = await response.json();

            if (data.success) {
                fetchItems();
                fetchStats();
            } else {
                alert(`Error: ${data.error}`);
            }
        } catch (error) {
            console.error("Error deleting item:", error);
            alert("Error al eliminar el ítem");
        }
    };

    // Handle success callbacks
    const handleSuccess = () => {
        fetchItems();
        fetchStats();
    };

    const totalPages = Math.ceil(totalItems / itemsPerPage);

    return (
        <>
            {/* Page Header */}
            <div className="bg-white shadow-sm border-b border-neutral/20 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center gap-4">
                        <div className="flex flex-col">
                            <h1 className="text-xl font-semibold text-dark">Gestión de Inventario</h1>
                            <span className="text-xs text-neutral">Dashboard &gt; Inventario</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto bg-gray-50/50">
                <div className="max-w-7xl mx-auto px-6 py-6">
                    {/* Page Title & Actions */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                        <div>
                            <h2 className="text-2xl font-bold text-dark">Catálogo de Materiales</h2>
                            <p className="text-sm text-neutral mt-1">
                                Administra el stock central, equipos y herramientas.
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            <button
                                onClick={historyModal.onOpen}
                                className="px-4 py-2 border border-primary text-primary rounded-lg hover:bg-primary/5 transition-colors flex items-center gap-2 cursor-pointer"
                            >
                                <i className="fa-solid fa-clock-rotate-left"></i> Historial
                            </button>
                            <button
                                onClick={assignModal.onOpen}
                                className="px-4 py-2 bg-secondary text-white rounded-lg hover:bg-secondary/90 transition-colors flex items-center gap-2 shadow-sm cursor-pointer"
                            >
                                <i className="fa-solid fa-truck"></i> Asignar a Cuadrilla
                            </button>
                            <button
                                onClick={restockModal.onOpen}
                                className="px-4 py-2 bg-background text-secondary font-semibold rounded-lg hover:bg-background/80 transition-colors flex items-center gap-2 shadow-sm cursor-pointer"
                            >
                                <i className="fa-solid fa-box-open"></i> Ingreso Manual
                            </button>
                            <button
                                onClick={createModal.onOpen}
                                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2 shadow-lg shadow-primary/20 cursor-pointer"
                            >
                                <i className="fa-solid fa-plus"></i> Nuevo Ítem
                            </button>
                        </div>
                    </div>

                    {/* KPI Cards */}
                    <InventoryKPICards stats={stats} loading={loadingStats} />

                    {/* Filter Toolbar */}
                    <InventoryFilterToolbar
                        searchValue={searchValue}
                        onSearchChange={setSearchValue}
                        typeFilter={typeFilter}
                        onTypeChange={setTypeFilter}
                        showOnlyLowStock={showOnlyLowStock}
                        onLowStockToggle={setShowOnlyLowStock}
                    />

                    {/* Inventory Table */}
                    <InventoryTable
                        items={items}
                        loading={loadingItems}
                        selectedItems={selectedItems}
                        onSelectionChange={setSelectedItems}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        currentPage={currentPage}
                        totalPages={totalPages}
                        totalItems={totalItems}
                        itemsPerPage={itemsPerPage}
                        onPageChange={setCurrentPage}
                    />
                </div>
            </main>

            {/* Modals */}
            <CreateItemModal
                isOpen={createModal.isOpen}
                onClose={createModal.onClose}
                onSuccess={handleSuccess}
            />

            <EditItemModal
                isOpen={editModal.isOpen}
                onClose={editModal.onClose}
                onSuccess={handleSuccess}
                item={selectedItem}
            />

            <RestockModal
                isOpen={restockModal.isOpen}
                onClose={restockModal.onClose}
                onSuccess={handleSuccess}
            />

            <AssignMaterialsModal
                isOpen={assignModal.isOpen}
                onClose={assignModal.onClose}
                onSuccess={handleSuccess}
            />

            <InventoryHistoryModal
                isOpen={historyModal.isOpen}
                onClose={historyModal.onClose}
            />
        </>
    );
}
