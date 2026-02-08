import React from 'react';
import { clsx } from 'clsx';

interface Column<T> {
  header: string;
  accessor: keyof T | ((item: T) => React.ReactNode);
  className?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  onRowClick?: (item: T) => void;
  isLoading?: boolean;
  emptyMessage?: string;
  rowClassName?: (item: T) => string;
}

function DataTable<T extends { id: string | number }>({ 
  data, 
  columns, 
  onRowClick, 
  isLoading = false,
  emptyMessage = "暂无数据",
  rowClassName
}: DataTableProps<T>) {
  
  if (isLoading) {
    return (
      <div className="w-full h-64 flex items-center justify-center bg-white border border-slate-200 rounded-lg">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600"></div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="w-full h-32 flex items-center justify-center bg-white border border-slate-200 rounded-lg text-slate-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto border border-slate-200 rounded-lg shadow-sm">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr>
            {columns.map((col, index) => (
              <th
                key={index}
                scope="col"
                className={clsx(
                  "px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider",
                  col.className
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-slate-200">
          {data.map((item) => (
            <tr 
              key={item.id} 
              onClick={() => onRowClick && onRowClick(item)}
              className={clsx(
                onRowClick ? "cursor-pointer hover:bg-slate-50 transition-colors" : "",
                rowClassName && rowClassName(item)
              )}
            >
              {columns.map((col, index) => (
                <td 
                  key={index} 
                  className="px-6 py-4 whitespace-nowrap text-sm text-slate-700"
                >
                  {typeof col.accessor === 'function' 
                    ? col.accessor(item) 
                    : (item[col.accessor] as React.ReactNode)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default DataTable;
