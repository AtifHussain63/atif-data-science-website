import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme, Theme } from '../../context/ThemeContext';

interface ThemeToggleProps {
  variant?: 'icon' | 'segmented' | 'dropdown';
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ variant = 'icon', className = '' }) => {
  const { theme, isDark, toggleTheme, setTheme } = useTheme();

  if (variant === 'segmented') {
    return (
      <div
        id="theme-segmented-control"
        className={`inline-flex items-center p-1 rounded-xl bg-slate-900/80 dark:bg-slate-900 light:bg-slate-100 border border-slate-800 dark:border-slate-800 light:border-slate-200 shadow-inner ${className}`}
      >
        <button
          id="theme-btn-light"
          type="button"
          onClick={() => setTheme('light')}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            theme === 'light'
              ? 'bg-amber-500 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Light Theme"
        >
          <Sun className="w-3.5 h-3.5" />
          <span>Light</span>
        </button>

        <button
          id="theme-btn-dark"
          type="button"
          onClick={() => setTheme('dark')}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            theme === 'dark'
              ? 'bg-amber-500 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Dark Theme"
        >
          <Moon className="w-3.5 h-3.5" />
          <span>Dark</span>
        </button>

        <button
          id="theme-btn-system"
          type="button"
          onClick={() => setTheme('system')}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            theme === 'system'
              ? 'bg-amber-500 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title="System Auto"
        >
          <Monitor className="w-3.5 h-3.5" />
          <span>Auto</span>
        </button>
      </div>
    );
  }

  return (
    <button
      id="theme-mode-toggle-btn"
      type="button"
      onClick={toggleTheme}
      className={`relative p-2.2 rounded-xl transition-all duration-300 flex items-center justify-center group ${
        isDark
          ? 'bg-slate-900 hover:bg-slate-800 text-amber-400 border border-slate-800 hover:border-amber-500/30 shadow-sm shadow-black/40'
          : 'bg-slate-100 hover:bg-amber-50 text-slate-800 border border-slate-200 hover:border-amber-400/50 shadow-xs'
      } ${className}`}
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
    >
      <div className="relative w-5 h-5 flex items-center justify-center">
        {isDark ? (
          <Sun className="w-4.5 h-4.5 text-amber-400 transition-transform duration-300 transform group-hover:rotate-45" />
        ) : (
          <Moon className="w-4.5 h-4.5 text-slate-700 transition-transform duration-300 transform group-hover:-rotate-12" />
        )}
      </div>
      <span className="sr-only">Toggle Dark / Light Theme</span>
    </button>
  );
};
