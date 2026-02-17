'use client';

import { useTheme, ThemeMode } from '@/contexts/ThemeContext';
import { Sun, Moon, Monitor } from 'lucide-react';

const modes: { value: ThemeMode; icon: typeof Sun; label: string }[] = [
  { value: 'light', icon: Sun, label: 'Light' },
  { value: 'dark', icon: Moon, label: 'Dark' },
  { value: 'auto', icon: Monitor, label: 'System' },
];

export default function ThemeToggle() {
  const { mode, setMode } = useTheme();

  const cycle = () => {
    const order: ThemeMode[] = ['light', 'dark', 'auto'];
    const next = order[(order.indexOf(mode) + 1) % order.length];
    setMode(next);
  };

  const current = modes.find(m => m.value === mode) || modes[2];
  const Icon = current.icon;

  return (
    <button
      onClick={cycle}
      className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      title={`Theme: ${current.label}`}
      aria-label={`Switch theme (currently ${current.label})`}
    >
      <Icon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
    </button>
  );
}
