import { cn } from '../../utils/cn';

const colors: Record<string, string> = {
  green: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  yellow: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  red: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  gray: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
};

export function StatusBadge({ label, color = 'gray' }: { label: string; color?: string }) {
  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', colors[color] || colors.gray)}>
      {label}
    </span>
  );
}
