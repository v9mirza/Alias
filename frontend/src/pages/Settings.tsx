import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings as SettingsIcon, ShieldAlert, Palette, LogOut, Info } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore.js';
import Button from '../components/ui/Button.js';

export const Settings: React.FC = () => {
  const { logout, deleteAccount, isLoading, error, clearError } = useAuthStore();
  const [accent, setAccent] = useState<'violet' | 'indigo'>(
    (localStorage.getItem('alias_accent') as 'violet' | 'indigo') || 'violet'
  );
  const [confirmDelete, setConfirmDelete] = useState(false);

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

  const handleDeleteAccount = async () => {
    clearError();
    try {
      await deleteAccount();
    } catch (error) {
      console.error('Failed to delete account:', error);
    }
  };

  return (
    <div className="flex-1 flex flex-col px-4 md:px-6 py-4 md:py-6 overflow-y-auto max-w-3xl">
      <div className="flex items-center gap-3 mb-4">
        <SettingsIcon className="w-5 h-5 text-accent" />
        <h1 className="text-sm md:text-lg font-bold tracking-tight text-primaryText uppercase font-mono">SETTINGS</h1>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4 md:space-y-6"
      >
        <div className="bg-card/20 border border-border p-4 md:p-6 rounded-2xl space-y-4">
          <h2 className="text-sm font-mono font-bold text-primaryText uppercase flex items-center gap-2">
            <Palette className="w-4.5 h-4.5 text-accent" /> APPEARANCE
          </h2>
          <p className="text-xs text-secondaryText font-mono uppercase tracking-tight">
            Customize the look and feel of the app
          </p>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-border/40 pt-4">
            <span className="text-xs text-primaryText font-medium">UI Accent Color</span>
            <div className="flex gap-2 bg-card border border-border p-1 rounded-xl w-full sm:w-auto">
              <button
                onClick={() => applyAccent('violet')}
                className={`flex-1 sm:flex-none min-h-10 px-4 py-1.5 rounded-lg text-xs font-mono font-bold tracking-wider transition-all ${
                  accent === 'violet'
                    ? 'bg-accent text-white shadow-sm'
                    : 'text-secondaryText hover:text-primaryText'
                }`}
              >
                VIOLET
              </button>
              <button
                onClick={() => applyAccent('indigo')}
                className={`flex-1 sm:flex-none min-h-10 px-4 py-1.5 rounded-lg text-xs font-mono font-bold tracking-wider transition-all ${
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

        <div className="bg-card/20 border border-border p-4 md:p-6 rounded-2xl space-y-4">
          <h2 className="text-sm font-mono font-bold text-primaryText uppercase flex items-center gap-2">
            <ShieldAlert className="w-4.5 h-4.5 text-yellow-500" /> SECURITY INFORMATION
          </h2>
          <div className="text-xs text-secondaryText space-y-2 leading-relaxed">
            <p>• Disappearing chats auto-delete based on configured timers.</p>
            <p>• Login session is local-device scoped. Logging out clears session state.</p>
          </div>
        </div>

        <div className="bg-card/20 border border-border p-4 md:p-6 rounded-2xl space-y-2">
          <h2 className="text-xs font-mono font-bold text-primaryText uppercase flex items-center gap-2">
            <Info className="w-4 h-4 text-zinc-500" /> ABOUT ALIAS
          </h2>
          <p className="text-[10px] text-zinc-500 font-mono uppercase">
            Alias is designed for fast, secure, and private messaging.
          </p>
        </div>

        <div className="bg-card/20 border border-red-900/40 p-4 md:p-6 rounded-2xl space-y-3">
          <h2 className="text-sm font-mono font-bold text-red-300 uppercase">Danger Zone</h2>
          <p className="text-[11px] text-zinc-400 font-mono uppercase tracking-wide">
            Deleting your account permanently removes your profile, requests, conversations, and messages from the platform.
          </p>

          {!confirmDelete ? (
            <Button
              variant="danger"
              onClick={() => setConfirmDelete(true)}
              className="w-full sm:w-auto font-mono text-xs uppercase px-6"
            >
              Delete Account Permanently
            </Button>
          ) : (
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                variant="danger"
                onClick={handleDeleteAccount}
                isLoading={isLoading}
                className="w-full sm:w-auto font-mono text-xs uppercase px-6"
              >
                Confirm Permanent Delete
              </Button>
              <Button
                variant="secondary"
                onClick={() => setConfirmDelete(false)}
                className="w-full sm:w-auto font-mono text-xs uppercase px-6"
              >
                Cancel
              </Button>
            </div>
          )}

          {error && (
            <p className="text-[11px] text-red-400 font-mono uppercase tracking-wide">
              {error}
            </p>
          )}
        </div>

        <div className="pt-2 flex">
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
