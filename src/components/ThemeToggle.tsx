import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

/**
 * ThemeToggle – a simple button that switches between light and dark theme.
 * It works with Tailwind's "class" dark mode strategy.
 * The current theme is stored in localStorage under the key "stuvault_theme".
 */
export default function ThemeToggle() {
  const [isDark, setIsDark] = useState<boolean>(false);

  // Initialise theme based on localStorage or system preference
  useEffect(() => {
    const stored = localStorage.getItem('stuvault_theme');
    if (stored === 'dark') {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    } else if (stored === 'light') {
      setIsDark(false);
      document.documentElement.classList.remove('dark');
    } else {
      // No stored preference – fall back to system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDark(prefersDark);
      if (prefersDark) document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('stuvault_theme', 'light');
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('stuvault_theme', 'dark');
    }
    setIsDark(!isDark);
  };

  return (
    <button
      onClick={toggleTheme}
      className="ml-2 flex items-center rounded-full bg-white/10 p-2 text-slate-400 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      title="Toggle dark mode"
    >
      {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </button>
  );
}
