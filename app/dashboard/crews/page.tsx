'use client';

import React, { useEffect, useState } from "react";
import axios from "axios";
import { CrewsFilterToolbar } from "@/components/crews/CrewsFilterToolbar";
import { CrewsTable } from "@/components/crews/CrewsTable";
import { BulkActionBar } from "@/components/orders/BulkActionBar";
import { Pagination } from "@/components/orders/Pagination";
import { NewCrewModal } from "@/components/crews/NewCrewModal";

interface CrewMember {
  _id: string;
  name: string;
  surname: string;
}

interface Crew {
  _id: string;
  name: string;
  zone?: string;
  leader: CrewMember;
  members: CrewMember[];
  isActive: boolean;
}

export default function CrewsPage() {
  // State
  const [crews, setCrews] = useState<Crew[]>([]);
  const [filteredCrews, setFilteredCrews] = useState<Crew[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch crews data
  useEffect(() => {
    fetchCrews();
  }, []);

  const fetchCrews = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/web/crews");
      setCrews(response.data);
      setFilteredCrews(response.data);
    } catch (error) {
      console.error("Error fetching crews:", error);
    } finally {
      setLoading(false);
    }
  };

  // Apply filters
  useEffect(() => {
    let filtered = [...crews];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (crew) =>
          crew.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          `${crew.leader.name} ${crew.leader.surname}`
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          (crew.zone && crew.zone.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Status filter
    if (statusFilter === "active") {
      filtered = filtered.filter((crew) => crew.isActive);
    } else if (statusFilter === "inactive") {
      filtered = filtered.filter((crew) => !crew.isActive);
    }

    setFilteredCrews(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [searchQuery, statusFilter, crews]);

  // Pagination
  const totalPages = Math.ceil(filteredCrews.length / itemsPerPage);
  const paginatedCrews = filteredCrews.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(paginatedCrews.map((crew) => crew._id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds([...selectedIds, id]);
    } else {
      setSelectedIds(selectedIds.filter((selectedId) => selectedId !== id));
    }
  };

  // Action handlers
  const handleNewCrew = () => {
    setIsModalOpen(true);
  };

  const handleModalSuccess = async () => {
    setIsModalOpen(false);
    await fetchCrews();
    setSelectedIds([]);
  };

  const handleEditCrew = (id: string) => {
    console.log("Edit crew:", id);
    // TODO: Navigate to edit page or open modal
  };

  const handleArchive = () => {
    console.log("Archive crews:", selectedIds);
    // TODO: Implement archive functionality
    setSelectedIds([]);
  };

  const handleDelete = async () => {
    if (!confirm("¿Estás seguro de que deseas eliminar las cuadrillas seleccionadas?")) {
      return;
    }

    try {
      // Delete selected crews
      await Promise.all(
        selectedIds.map((id) => axios.delete(`/api/web/crews?id=${id}`))
      );

      // Refresh data
      await fetchCrews();
      setSelectedIds([]);
    } catch (error) {
      console.error("Error deleting crews:", error);
      alert("Error al eliminar cuadrillas");
    }
  };

  const handleAssignInstaller = () => {
    console.log("Assign installer to crews:", selectedIds);
    // TODO: Implement assign installer functionality
    setSelectedIds([]);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <i className="fa-solid fa-spinner fa-spin text-4xl text-primary mb-4"></i>
          <p className="text-neutral">Cargando cuadrillas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50/50">
      {/* Page Header */}
      <h1 className="text-2xl font-bold text-dark mb-6">Gestión de Cuadrillas</h1>

      {/* Filter Toolbar */}
      <CrewsFilterToolbar
        searchQuery={searchQuery}
        statusFilter={statusFilter}
        onSearchChange={setSearchQuery}
        onStatusFilterChange={setStatusFilter}
        onNewCrew={handleNewCrew}
      />

      {/* Bulk Action Bar */}
      <BulkActionBar
        selectedCount={selectedIds.length}
        onArchive={handleArchive}
        onDelete={handleDelete}
        onAssignInstaller={handleAssignInstaller}
      />

      {/* Crews Table */}
      <CrewsTable
        crews={paginatedCrews}
        selectedIds={selectedIds}
        onSelectAll={handleSelectAll}
        onSelectRow={handleSelectRow}
        onEditCrew={handleEditCrew}
      />

      {/* Pagination */}
      {filteredCrews.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredCrews.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />
      )}

      {/* New Crew Modal */}
      <NewCrewModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
}
