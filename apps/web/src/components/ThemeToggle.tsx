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
    setMode(order[(order.indexOf(mode) + 1) % order.length]);
  };
  const current = modes.find(m => m.value === mode) || modes[2];
  const Icon = current.icon;

  return (
    <button onClick={cycle}
      className="p-2.5 rounded-xl transition-colors"
      style={{ color: 'var(--text-muted)' }}
      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--elevated)'}
      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
      title={`Theme: ${current.label}`}
      aria-label={`Switch theme (currently ${current.label})`}>
      <Icon className="h-5 w-5" />
    </button>
  );
}
