import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Download, MessageSquare, Shield, Users } from 'lucide-react';
import Button from '../components/ui/Button.js';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const getIsInstalled = () =>
  typeof window !== 'undefined' &&
  (window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true);

export const Welcome: React.FC = () => {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(getIsInstalled);

  useEffect(() => {
    const onInstallable = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };

    const onInstalled = () => {
      setIsInstalled(true);
      setInstallPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', onInstallable);
    window.addEventListener('appinstalled', onInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', onInstallable);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-10 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(#1e1e1e_1px,transparent_1px)] [background-size:24px_24px] opacity-20 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2.5 mb-6">
            <div className="w-5 h-5 rounded-full bg-accent" />
            <span className="font-mono text-lg font-bold tracking-[0.35em] text-primaryText hacker-text">
              ALIAS
            </span>
          </div>

          <h1 className="text-xl md:text-2xl font-bold text-primaryText tracking-tight leading-snug">
            Anonymous 1:1 chat.
            <br />
            <span className="text-accent">Connect by alias, not identity.</span>
          </h1>

          <p className="mt-3 text-xs text-secondaryText font-mono uppercase tracking-wider">
            Private relays • Discover profiles • Disappearing chats
          </p>
        </div>

        <div className="panel-primary rounded-2xl p-5 md:p-6 space-y-4 mb-6">
          <div className="flex items-start gap-3">
            <Users className="w-4 h-4 text-accent mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-mono font-bold text-primaryText uppercase">Discover by alias</p>
              <p className="text-[11px] text-secondaryText mt-1">Find people through profiles and interests, not real names.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <MessageSquare className="w-4 h-4 text-accent mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-mono font-bold text-primaryText uppercase">Real-time relays</p>
              <p className="text-[11px] text-secondaryText mt-1">Private chats with typing indicators and read receipts.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Shield className="w-4 h-4 text-accent mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-mono font-bold text-primaryText uppercase">Privacy-first</p>
              <p className="text-[11px] text-secondaryText mt-1">Temporary conversations that auto-delete on your schedule.</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Link to="/login" className="w-full">
            <Button variant="primary" className="w-full font-mono uppercase tracking-wider">
              Enter
            </Button>
          </Link>
          <Link to="/register" className="w-full">
            <Button variant="secondary" className="w-full font-mono uppercase tracking-wider">
              Create Alias
            </Button>
          </Link>

          {installPrompt && !isInstalled && (
            <Button
              variant="ghost"
              onClick={handleInstall}
              className="w-full font-mono uppercase tracking-wider border border-border"
            >
              <Download className="w-4 h-4" />
              Install App
            </Button>
          )}

          {isInstalled && (
            <p className="text-center text-[10px] font-mono uppercase tracking-wider text-secondaryText">
              Running as installed app
            </p>
          )}
        </div>

        <p className="mt-8 text-center text-[10px] text-zinc-600 font-mono uppercase tracking-widest">
          [TLS] enabled • [node] relay active
        </p>
      </motion.div>
    </div>
  );
};

export default Welcome;
