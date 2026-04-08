'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

interface AuditPaginationProps {
    page: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

export function AuditPagination({ page, totalPages, onPageChange }: AuditPaginationProps) {
    if (totalPages <= 1) return null;

    return (
        <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
                Página {page + 1} de {totalPages}
            </p>
            <div className="flex gap-2">
                <button
                    onClick={() => onPageChange(Math.max(0, page - 1))}
                    disabled={page === 0}
                    className="btn-secondary p-2 disabled:opacity-50"
                >
                    <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                    onClick={() => onPageChange(Math.min(totalPages - 1, page + 1))}
                    disabled={page >= totalPages - 1}
                    className="btn-secondary p-2 disabled:opacity-50"
                >
                    <ChevronRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
