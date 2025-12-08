'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { InstallersFilterToolbar } from '@/components/installers/InstallersFilterToolbar';
import { InstallersTable, Installer } from '@/components/installers/InstallersTable';
import { BulkActionBar } from '@/components/orders/BulkActionBar';
import { Pagination } from '@/components/orders/Pagination';
import { NewInstallerModal } from '@/components/installers/NewInstallerModal';

export default function InstallersPage() {
  const router = useRouter();
  const [installers, setInstallers] = useState<Installer[]>([]);
  const [crews, setCrews] = useState<any[]>([]);
  const [searchValue, setSearchValue] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [crewFilter, setCrewFilter] = useState('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isNewInstallerModalOpen, setIsNewInstallerModalOpen] = useState(false);
  const itemsPerPage = 10;

  // Fetch installers and crews from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch installers and crews in parallel
        const [installersResponse, crewsResponse] = await Promise.all([
          fetch('/api/web/installers'),
          fetch('/api/web/crews')
        ]);

        if (!installersResponse.ok) {
          throw new Error('Error al cargar los instaladores');
        }

        const installersData = await installersResponse.json();
        setInstallers(installersData);

        // Crews might not exist yet, so don't throw error
        if (crewsResponse.ok) {
          const crewsData = await crewsResponse.json();
          setCrews(crewsData);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err instanceof Error ? err.message : 'Error al cargar los datos');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filtered data
  const filteredInstallers = useMemo(() => {
    return installers.filter((installer) => {
      const matchesSearch =
        installer.name.toLowerCase().includes(searchValue.toLowerCase()) ||
        installer.phone.toLowerCase().includes(searchValue.toLowerCase()) ||
        installer.surname.toLowerCase().includes(searchValue.toLowerCase());

      const matchesStatus = statusFilter === 'all' || installer.status === statusFilter;

      const matchesCrew = crewFilter === 'all' || installer.currentCrew === crewFilter;

      return matchesSearch && matchesStatus && matchesCrew;
    });
  }, [installers, searchValue, statusFilter, crewFilter]);

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

  const handleCrewChange = (value: string) => {
    setCrewFilter(value);
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

  const handleSelectRow = (id: string, selected: boolean) => {
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
    // Navigate to the dynamic edit route
    router.push(`/dashboard/installers/${installer.id}`);
  };

  const handleViewDetails = (installer: Installer) => {
    // TODO: Implement view details functionality
    console.log('Viewing installer details:', installer);
    alert(`Ver detalles de: ${installer.name}`);
  };

  const handleDeleteSingle = (installer: Installer) => {
    if (confirm(`¿Estás seguro de eliminar a ${installer.name}? Esta acción no se puede deshacer.`)) {
      // TODO: Implement delete API call
      console.log('Deleting installer:', installer.id);
      setInstallers(installers.filter(i => i.id !== installer.id));
    }
  };

  const handleNewInstaller = () => {
    setIsNewInstallerModalOpen(true);
  };

  const handleNewInstallerSuccess = async () => {
    // Close the modal
    setIsNewInstallerModalOpen(false);

    // Refresh the installers list
    try {
      const response = await fetch('/api/web/installers');
      if (response.ok) {
        const data = await response.json();
        setInstallers(data);
      }
    } catch (err) {
      console.error('Error refreshing installers:', err);
    }
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

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <i className="fa-solid fa-triangle-exclamation text-4xl text-red-500 mb-4"></i>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Error al cargar instaladores</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-secondary transition-colors"
          >
            Reintentar
          </button>
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
            className="bg-primary hover:bg-secondary text-white px-4 py-2 rounded-lg text-sm font-medium shadow-md shadow-primary/20 transition-all flex items-center gap-2 cursor-pointer"
          >
            <i className="fa-solid fa-user-plus"></i>
            <span className="hidden sm:inline ">Nuevo Instalador</span>
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
          crewFilter={crewFilter}
          onCrewChange={handleCrewChange}
          crews={crews}
          totalCount={filteredInstallers.length}
        />

        {/* Bulk Action Bar */}
        <BulkActionBar
          selectedCount={selectedIds.length}
          onArchive={handleArchive}
          onDelete={handleDelete}
        />

        {/* Empty State */}
        {filteredInstallers.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-neutral/10 p-12 text-center">
            <i className="fa-solid fa-inbox text-gray-300 text-5xl mb-4"></i>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No se encontraron instaladores</h3>
            <p className="text-gray-500">
              {searchValue || statusFilter !== 'all'
                ? 'Intenta ajustar los filtros de búsqueda'
                : 'No hay instaladores registrados en el sistema'}
            </p>
          </div>
        ) : (
          <>
            {/* Installers Table */}
            <InstallersTable
              installers={paginatedInstallers}
              selectedIds={selectedIds}
              onSelectAll={handleSelectAll}
              onSelectRow={handleSelectRow}
              onEdit={handleEdit}
              onViewDetails={handleViewDetails}
              onDelete={handleDeleteSingle}
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
          </>
        )}
      </main>

      {/* New Installer Modal */}
      <NewInstallerModal
        isOpen={isNewInstallerModalOpen}
        onClose={() => setIsNewInstallerModalOpen(false)}
        onSuccess={handleNewInstallerSuccess}
      />
    </div>
  );
}
