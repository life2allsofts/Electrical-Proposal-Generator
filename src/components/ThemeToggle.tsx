import { Palette } from 'lucide-react';
import { ThemeType } from '../types';

interface ThemeToggleProps {
  currentTheme: ThemeType;
  onChangeTheme: (theme: ThemeType) => void;
}

const THEME_OPTIONS: { id: ThemeType; name: string; color: string }[] = [
  { id: 'default', name: 'Ambient Slate', color: 'bg-blue-600' },
  { id: 'dark', name: 'Cyber Neon', color: 'bg-cyan-500' },
  { id: 'electrical-blue', name: 'Electric Volt', color: 'bg-amber-400' },
  { id: 'high-contrast', name: 'Monochrome', color: 'bg-white border border-neutral-600' },
];

export default function ThemeToggle({ currentTheme, onChangeTheme }: ThemeToggleProps) {
  return (
    <div className="flex items-center space-x-2" id="theme-selector-container">
      <Palette className="w-4 h-4 text-brand-muted" />
      <span className="text-xs font-medium text-brand-muted mr-1 hidden sm:inline">Theme:</span>
      <div className="flex space-x-1">
        {THEME_OPTIONS.map((theme) => (
          <button
            key={theme.id}
            id={`theme-btn-${theme.id}`}
            onClick={() => onChangeTheme(theme.id)}
            title={theme.name}
            className={`w-5 h-5 rounded-full ${theme.color} flex items-center justify-center transition-all ${
              currentTheme === theme.id 
                ? 'ring-2 ring-offset-2 ring-brand-primary scale-110' 
                : 'opacity-70 hover:opacity-100 hover:scale-105'
            }`}
            aria-label={`Switch to ${theme.name} theme`}
          >
            {currentTheme === theme.id && (
              <span className={`w-1.5 h-1.5 rounded-full ${theme.id === 'high-contrast' ? 'bg-black' : 'bg-brand-bg'}`} />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
