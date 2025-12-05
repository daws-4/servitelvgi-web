"use client";

import React from "react";

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    onPageChange?: (page: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    onPageChange,
}) => {
    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            onPageChange?.(page);
        }
    };

    // Generate page numbers to display
    const getPageNumbers = () => {
        const pages: number[] = [];
        const maxPagesToShow = 3;

        if (totalPages <= maxPagesToShow) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            // Always show first page
            pages.push(1);

            // Show current page and neighbors if not at start
            if (currentPage > 2) {
                if (currentPage > 3) pages.push(-1); // Ellipsis
                pages.push(currentPage);
            }

            // Show last page if not already shown
            if (currentPage < totalPages - 1) {
                if (currentPage < totalPages - 2) pages.push(-2); // Ellipsis
                pages.push(totalPages);
            }
        }

        return pages;
    };

    return (
        <div className="p-4 border-t border-gray-100 flex items-center justify-between">
            <span className="text-xs text-gray-500">
                Mostrando {startItem}-{endItem} de {totalItems} órdenes
            </span>
            <div className="flex gap-1">
                <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1 text-xs border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Anterior
                </button>

                {getPageNumbers().map((page, index) => {
                    if (page < 0) {
                        return (
                            <span key={`ellipsis-${index}`} className="px-2 py-1 text-xs text-gray-400">
                                ...
                            </span>
                        );
                    }

                    return (
                        <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`px-3 py-1 text-xs rounded font-medium ${currentPage === page
                                    ? "bg-primary text-white"
                                    : "border hover:bg-gray-50 text-gray-600"
                                }`}
                        >
                            {page}
                        </button>
                    );
                })}

                <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 text-xs border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Siguiente
                </button>
            </div>
        </div>
    );
};
