import { create } from 'zustand';

interface UIState {
  darkMode: boolean;
  sidebarOpen: boolean;
  toggleDarkMode: () => void;
  toggleSidebar: () => void;
}

const getInitialDark = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('darkMode') === 'true';
  }
  return false;
};

export const useUIStore = create<UIState>((set) => ({
  darkMode: getInitialDark(),
  sidebarOpen: true,
  toggleDarkMode: () =>
    set((state) => {
      const next = !state.darkMode;
      localStorage.setItem('darkMode', String(next));
      if (next) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return { darkMode: next };
    }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
}));
