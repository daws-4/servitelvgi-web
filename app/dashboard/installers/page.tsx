'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { InstallersFilterToolbar } from '@/components/installers/InstallersFilterToolbar';
import { InstallersTable, Installer } from '@/components/installers/InstallersTable';
import { BulkActionBar } from '@/components/orders/BulkActionBar';
import { Pagination } from '@/components/orders/Pagination';

export default function InstallersPage() {
  // State management
  const [installers, setInstallers] = useState<Installer[]>([]);
  const [searchValue, setSearchValue] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const itemsPerPage = 10;

  // Mock data - Replace with actual API call
  useEffect(() => {
    const mockData: Installer[] = [
      { id: 1, name: "Juan Perez", phone: "0424-1234567", status: "active", currentCrew: null },
      { id: 2, name: "Maria Rodriguez", phone: "0412-9876543", status: "on_duty", currentCrew: "Cuadrilla Alfa" },
      { id: 3, name: "Carlos Martinez", phone: "0414-5556677", status: "off_duty", currentCrew: null },
      { id: 4, name: "Ana Lopez", phone: "0416-1112233", status: "inactive", currentCrew: null },
      { id: 5, name: "Roberto Gomez", phone: "0424-9998877", status: "active", currentCrew: "Cuadrilla Beta" },
      { id: 6, name: "Sofia Garcia", phone: "0426-5554321", status: "on_duty", currentCrew: "Cuadrilla Alfa" },
      { id: 7, name: "Luis Torres", phone: "0424-7778899", status: "active", currentCrew: null },
      { id: 8, name: "Carmen Vega", phone: "0412-3334455", status: "off_duty", currentCrew: "Cuadrilla Beta" },
      { id: 9, name: "Pedro Sanchez", phone: "0414-6667788", status: "active", currentCrew: null },
      { id: 10, name: "Isabel Morales", phone: "0416-9990011", status: "inactive", currentCrew: null },
    ];

    // Simulate API call
    setTimeout(() => {
      setInstallers(mockData);
      setLoading(false);
    }, 500);
  }, []);

  // Filtered data
  const filteredInstallers = useMemo(() => {
    return installers.filter((installer) => {
      const matchesSearch =
        installer.name.toLowerCase().includes(searchValue.toLowerCase()) ||
        installer.phone.toLowerCase().includes(searchValue.toLowerCase());

      const matchesStatus = statusFilter === 'all' || installer.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [installers, searchValue, statusFilter]);

  // Paginated data
  const paginatedInstallers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredInstallers.slice(startIndex, endIndex);
  }, [filteredInstallers, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredInstallers.length / itemsPerPage);

  // Event handlers
  const handleSearchChange = (value: string) => {
    setSearchValue(value);
    setCurrentPage(1); // Reset to first page on search
    setSelectedIds([]); // Clear selection
  };

  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(1); // Reset to first page on filter
    setSelectedIds([]); // Clear selection
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedIds(paginatedInstallers.map(i => i.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id: number, selected: boolean) => {
    if (selected) {
      setSelectedIds([...selectedIds, id]);
    } else {
      setSelectedIds(selectedIds.filter(selectedId => selectedId !== id));
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setSelectedIds([]); // Clear selection on page change
  };

  const handleArchive = () => {
    const count = selectedIds.length;
    if (confirm(`¿Estás seguro de archivar ${count} instalador(es)?`)) {
      // TODO: Implement archive functionality
      console.log('Archiving installers:', selectedIds);
      setSelectedIds([]);
    }
  };

  const handleDelete = () => {
    const count = selectedIds.length;
    if (confirm(`¿Estás seguro de eliminar ${count} instalador(es)? Esta acción no se puede deshacer.`)) {
      // TODO: Implement delete functionality
      console.log('Deleting installers:', selectedIds);
      setInstallers(installers.filter(i => !selectedIds.includes(i.id)));
      setSelectedIds([]);
    }
  };

  const handleEdit = (installer: Installer) => {
    // TODO: Implement edit functionality
    console.log('Editing installer:', installer);
    alert(`Editar instalador: ${installer.name}`);
  };

  const handleViewDetails = (installer: Installer) => {
    // TODO: Implement view details functionality
    console.log('Viewing installer details:', installer);
    alert(`Ver detalles de: ${installer.name}`);
  };

  const handleNewInstaller = () => {
    // TODO: Implement new installer modal/form
    alert('Abrir modal de creación de instalador');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <i className="fa-solid fa-spinner fa-spin text-4xl text-primary mb-4"></i>
          <p className="text-gray-600">Cargando instaladores...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm flex items-center justify-between px-6 py-4 border-b border-neutral/20">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-primary">Gestión de Instaladores</h1>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={handleNewInstaller}
            className="bg-primary hover:bg-secondary text-white px-4 py-2 rounded-lg text-sm font-medium shadow-md shadow-primary/20 transition-all flex items-center gap-2"
          >
            <i className="fa-solid fa-user-plus"></i>
            <span className="hidden sm:inline">Nuevo Instalador</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
        {/* Filter Toolbar */}
        <InstallersFilterToolbar
          searchValue={searchValue}
          onSearchChange={handleSearchChange}
          statusFilter={statusFilter}
          onStatusChange={handleStatusChange}
          totalCount={filteredInstallers.length}
        />

        {/* Bulk Action Bar */}
        <BulkActionBar
          selectedCount={selectedIds.length}
          onArchive={handleArchive}
          onDelete={handleDelete}
        />

        {/* Installers Table */}
        <InstallersTable
          installers={paginatedInstallers}
          selectedIds={selectedIds}
          onSelectAll={handleSelectAll}
          onSelectRow={handleSelectRow}
          onEdit={handleEdit}
          onViewDetails={handleViewDetails}
        />

        {/* Pagination */}
        {filteredInstallers.length > 0 && (
          <div className="mt-4">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredInstallers.length}
              itemsPerPage={itemsPerPage}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </main>
    </div>
  );
}
