/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Column<T> {
  key?: keyof T | string;
  header: string;
  render?: (item: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  emptyMessage?: string;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  keyExtractor?: (item: T) => React.Key;  // ✅ NEW: Flexible key support
}

function DataTable<T>({
  columns,
  data,
  isLoading = false,
  emptyMessage = 'No data available',
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  keyExtractor,  // ✅ NEW PROP
}: DataTableProps<T>) {
  const getValue = (item: T, key: keyof T | string): React.ReactNode => {
    const keys = String(key).split('.');
    let value: unknown = item;
    
    for (const k of keys) {
      if (value && typeof value === 'object') {
        value = (value as Record<string, unknown>)[k];
      } else {
        return '';
      }
    }
    
    return String(value ?? '');
  };

  // ✅ FIXED: Generate unique row key
  const getRowKey = (item: T): React.Key => {
    if (keyExtractor) return keyExtractor(item);
    
    // Auto-detect common ID fields
    const idFields = ['id', 'uid', 'orderId', '_id'] as const;
    for (const field of idFields) {
      if ((item as any)[field]) {
        return (item as any)[field];
      }
    }
    
    // Fallback: create stable composite key from multiple fields
    const parts = [
      (item as any)?.displayName || (item as any)?.name || '',
      (item as any)?.email || '',
    ].filter(Boolean);
    return parts.join('-') || `row-${Math.random()}`;
  };

  if (isLoading) {
    return (
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="p-8 text-center">
          <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="admin-table">
          <thead>
            <tr>
              {/* ✅ FIXED: Use column key instead of index */}
              {columns.map((column, index) => (
                <th 
                  key={String(column.key || `header-${index}`)} 
                  className={column.className}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="text-center py-12">
                  <p className="text-muted-foreground">{emptyMessage}</p>
                </td>
              </tr>
            ) : (
              data.map((item, rowIndex) => {
                const rowKey = getRowKey(item);  // ✅ STABLE KEYS
                return (
                  <tr key={rowKey} className="transition-colors">
                    {columns.map((column, colIndex) => (
                      <td 
                        key={String(column.key || `cell-${rowIndex}-${colIndex}`)} 
                        className={column.className}
                      >
                        {column.render 
                          ? column.render(item) 
                          : getValue(item, column.key!)
                        }
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && onPageChange && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/50">
          <p className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages} • {data.length} items
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="admin-btn-ghost p-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-accent"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-1 text-sm bg-background border rounded-md">
              {currentPage}
            </span>
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="admin-btn-ghost p-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-accent"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DataTable;
