import React from 'react';
import { useAuth } from '../context';
import { Sun, Moon } from 'lucide-react';

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useAuth();

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-xl bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
      title={theme === 'light' ? 'Переключить на тёмную тему' : 'Переключить на светлую тему'}
    >
      {theme === 'light' ? (
        <Moon className="w-5 h-5 text-gray-700" />
      ) : (
        <Sun className="w-5 h-5 text-yellow-400" />
      )}
    </button>
  );
};
