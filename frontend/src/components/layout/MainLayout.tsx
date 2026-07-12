import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useUIStore } from '../../stores/uiStore';
import { cn } from '../../utils/cn';

export function MainLayout() {
  const { sidebarOpen, toggleSidebar } = useUIStore();

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar collapsed={!sidebarOpen} onToggle={toggleSidebar} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className={cn('flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-gray-900')}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
