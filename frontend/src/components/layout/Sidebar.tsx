import { NavLink } from 'react-router-dom';
import { cn } from '../../utils/cn';
import { useAuthStore } from '../../stores/authStore';
import { ROLE_LABELS } from '../../utils/constants';
import {
  LayoutDashboard, Truck, Users, Route, Wrench, Fuel, BarChart3, Shield, ChevronLeft, UserCog,
} from 'lucide-react';

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
  roles: string[];
}

const allNavItems: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} />, roles: ['admin', 'fleet_manager'] },
  { to: '/vehicles', label: 'Vehicles', icon: <Truck size={20} />, roles: ['admin', 'fleet_manager', 'dispatcher'] },
  { to: '/drivers', label: 'Drivers', icon: <Users size={20} />, roles: ['admin', 'fleet_manager', 'dispatcher', 'safety_officer'] },
  { to: '/trips', label: 'Trips', icon: <Route size={20} />, roles: ['admin', 'fleet_manager', 'dispatcher'] },
  { to: '/my-trips', label: 'My Trips', icon: <Route size={20} />, roles: ['driver'] },
  { to: '/maintenance', label: 'Maintenance', icon: <Wrench size={20} />, roles: ['admin', 'fleet_manager', 'financial_analyst'] },
  { to: '/fuel-expenses', label: 'Fuel & Expenses', icon: <Fuel size={20} />, roles: ['admin', 'fleet_manager', 'financial_analyst'] },
  { to: '/analytics/financial', label: 'Financial Analytics', icon: <BarChart3 size={20} />, roles: ['admin', 'financial_analyst'] },
  { to: '/analytics', label: 'Analytics', icon: <BarChart3 size={20} />, roles: ['admin', 'fleet_manager'] },
  { to: '/admin/users', label: 'User Management', icon: <UserCog size={20} />, roles: ['admin'] },
];

export function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const user = useAuthStore((s) => s.user);
  const items = user ? allNavItems.filter((item) => item.roles.includes(user.role)) : [];

  return (
    <aside className={cn(
      'bg-white dark:bg-gray-800 border-r dark:border-gray-700 flex flex-col transition-all duration-200',
      collapsed ? 'w-16' : 'w-60'
    )}>
      <div className="flex items-center justify-between h-16 px-4 border-b dark:border-gray-700">
        {!collapsed && <span className="font-bold text-lg dark:text-gray-100">TransitOps</span>}
        <button onClick={onToggle} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
          <ChevronLeft size={20} className={cn('text-gray-500 transition-transform', collapsed && 'rotate-180')} />
        </button>
      </div>

      <nav className="flex-1 py-4 space-y-1 px-2">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
              isActive
                ? 'bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
                : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-700',
              collapsed && 'justify-center'
            )}
          >
            {item.icon}
            {!collapsed && item.label}
          </NavLink>
        ))}
      </nav>

      {!collapsed && user && (
        <div className="px-4 py-3 border-t dark:border-gray-700">
          <p className="text-sm font-medium dark:text-gray-100">{user.name}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{ROLE_LABELS[user.role as keyof typeof ROLE_LABELS]}</p>
        </div>
      )}
    </aside>
  );
}
