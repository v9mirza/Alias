import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings as SettingsIcon, ShieldAlert, Palette, LogOut, Info } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore.js';
import Button from '../components/ui/Button.js';

export const Settings: React.FC = () => {
  const { logout } = useAuthStore();
  const [accent, setAccent] = useState<'violet' | 'indigo'>(
    (localStorage.getItem('alias_accent') as 'violet' | 'indigo') || 'violet'
  );

  const updateAccentCss = (color: 'violet' | 'indigo') => {
    const root = document.documentElement;
    if (color === 'violet') {
      root.style.setProperty('--accent', '#8B5CF6');
      root.style.setProperty('--accent-hover', '#7C4DF2');
    } else {
      root.style.setProperty('--accent', '#6366F1');
      root.style.setProperty('--accent-hover', '#4F46E5');
    }
  };

  const applyAccent = (color: 'violet' | 'indigo') => {
    setAccent(color);
    localStorage.setItem('alias_accent', color);
    updateAccentCss(color);
  };

  // Run on mount to ensure localstorage configuration is applied
  useEffect(() => {
    updateAccentCss(accent);
  }, [accent]);

  return (
    <div className="flex-1 flex flex-col p-6 overflow-y-auto max-w-2xl">
      {/* Title */}
      <div className="flex items-center gap-3 mb-8">
        <SettingsIcon className="w-5 h-5 text-accent" />
        <h1 className="text-lg font-bold tracking-tight text-primaryText uppercase font-mono">
          SETTINGS
        </h1>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Appearance Card */}
        <div className="bg-card/10 border border-border p-6 rounded-2xl space-y-4">
          <h2 className="text-sm font-mono font-bold text-primaryText uppercase flex items-center gap-2">
            <Palette className="w-4.5 h-4.5 text-accent" /> APPEARANCE
          </h2>
          <p className="text-xs text-secondaryText font-mono uppercase tracking-tight">
            Customize the look and feel of the app
          </p>

          <div className="flex items-center justify-between border-t border-border/40 pt-4">
            <span className="text-xs text-primaryText font-medium">UI Accent Color</span>
            <div className="flex gap-2 bg-card border border-border p-1 rounded-lg">
              <button
                onClick={() => applyAccent('violet')}
                className={`px-3 py-1.5 rounded-md text-xs font-mono font-bold tracking-wider transition-all ${
                  accent === 'violet'
                    ? 'bg-accent text-white shadow-sm'
                    : 'text-secondaryText hover:text-primaryText'
                }`}
              >
                VIOLET
              </button>
              <button
                onClick={() => applyAccent('indigo')}
                className={`px-3 py-1.5 rounded-md text-xs font-mono font-bold tracking-wider transition-all ${
                  accent === 'indigo'
                    ? 'bg-[#6366F1] text-white shadow-sm'
                    : 'text-secondaryText hover:text-primaryText'
                }`}
              >
                INDIGO
              </button>
            </div>
          </div>
        </div>

        {/* Security & Protocol Info Card */}
        <div className="bg-card/10 border border-border p-6 rounded-2xl space-y-4">
          <h2 className="text-sm font-mono font-bold text-primaryText uppercase flex items-center gap-2">
            <ShieldAlert className="w-4.5 h-4.5 text-yellow-500" /> SECURITY INFORMATION
          </h2>
          <div className="text-xs text-secondaryText space-y-2 leading-relaxed">
            <p>
              • Disappearing messages are automatically deleted according to the conversation timer.
            </p>
            <p>
              • Your login session is kept secure. Logging out clears all session data.
            </p>
          </div>
        </div>

        {/* About Card */}
        <div className="bg-card/10 border border-border p-6 rounded-2xl space-y-2">
          <h2 className="text-xs font-mono font-bold text-primaryText uppercase flex items-center gap-2">
            <Info className="w-4 h-4 text-zinc-500" /> ABOUT ALIAS
          </h2>
          <p className="text-[10px] text-zinc-500 font-mono uppercase">
            Alias is designed for fast, secure, and private messaging.
          </p>
        </div>

        {/* Logout button */}
        <div className="pt-4 flex">
          <Button
            variant="danger"
            onClick={logout}
            className="w-full sm:w-auto font-mono text-xs uppercase px-6"
          >
            <LogOut className="w-4.5 h-4.5" /> LOG OUT
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default Settings;
