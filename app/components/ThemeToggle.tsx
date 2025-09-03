'use client';

import { useTheme } from './ThemeProvider';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="
        flex items-center justify-center
        w-10 h-10
        rounded-lg
        bg-surface hover:bg-surface-hover
        border border-border
        text-text
        transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-accent focus:ring-opacity-50
      "
      aria-label={`Alternar para tema ${theme === 'light' ? 'escuro' : 'claro'}`}
      title={`Alternar para tema ${theme === 'light' ? 'escuro' : 'claro'}`}
    >
      <span className="text-lg">
        {theme === 'light' ? '🌙' : '☀️'}
      </span>
    </button>
  );
}