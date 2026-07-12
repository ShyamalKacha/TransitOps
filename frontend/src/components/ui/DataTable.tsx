import { cn } from '../../utils/cn';
import { LoadingSpinner } from './LoadingSpinner';

export interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  sortable?: boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  onRowClick?: (item: T) => void;
  emptyMessage?: string;
}

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  loading,
  onRowClick,
  emptyMessage = 'No data found',
}: DataTableProps<T>) {
  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  if (!data.length) {
    return <p className="text-center py-12 text-gray-500 dark:text-gray-400">{emptyMessage}</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b dark:border-gray-700">
            {columns.map((col) => (
              <th key={col.key} className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item, idx) => (
            <tr
              key={(item.id as string) || idx}
              className={cn(
                'border-b dark:border-gray-700 transition-colors',
                onRowClick && 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800'
              )}
              onClick={() => onRowClick?.(item)}
            >
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-3 dark:text-gray-200">
                  {col.render ? col.render(item) : String(item[col.key] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
