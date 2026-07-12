import { useAuthStore } from '../../stores/authStore';
import { useUIStore } from '../../stores/uiStore';
import { Moon, Sun, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function Header() {
  const { user, logout } = useAuthStore();
  const { darkMode, toggleDarkMode } = useUIStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="h-16 bg-white dark:bg-gray-800 border-b dark:border-gray-700 flex items-center justify-between px-6">
      <div />
      <div className="flex items-center gap-4">
        <button onClick={toggleDarkMode} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
          {darkMode ? <Sun size={20} className="text-gray-400" /> : <Moon size={20} className="text-gray-500" />}
        </button>
        {user && (
          <button onClick={handleLogout} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        )}
      </div>
    </header>
  );
}
