import React from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Compass, Inbox, MessageSquare, User as UserIcon, Settings as SettingsIcon, LogOut, Radio } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore.js';
import { useSocketStore } from '../store/useSocketStore.js';
import Avatar from '../components/ui/Avatar.js';

export const MainLayout: React.FC = () => {
  const { user, logout } = useAuthStore();
  const { isConnected } = useSocketStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems: { name: string; path: string; icon: React.ElementType }[] = [
    { name: 'CHATS', path: '/chats', icon: MessageSquare },
    { name: 'DISCOVER', path: '/discover', icon: Compass },
    { name: 'REQUESTS', path: '/requests', icon: Inbox },
    { name: 'PROFILE', path: '/profile', icon: UserIcon },
    { name: 'SETTINGS', path: '/settings', icon: SettingsIcon },
  ];

  const currentSection = navItems.find((item) => location.pathname.startsWith(item.path))?.name || 'ALIAS';

  return (
    <div className="min-h-screen bg-background text-primaryText flex font-sans selection:bg-accent/30 selection:text-white hacker-grid">
      {/* Sidebar - Desktop */}
      <aside className="w-72 border-r border-border bg-surface/95 hidden md:flex md:flex-col md:justify-between">
        <div className="flex flex-col">
          <div className="px-6 py-6 border-b border-border flex items-center gap-2.5">
            <div className="w-5 h-5 rounded-full bg-accent"></div>
            <span className="font-mono text-sm font-bold tracking-[0.3em] text-primaryText hacker-text">
              ALIAS
            </span>
          </div>

          <nav className="p-4 flex flex-col gap-2">
            {navItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl font-mono text-xs font-bold tracking-wider transition-all ${
                    isActive
                      ? 'bg-card text-accent border border-accent/40'
                      : 'text-secondaryText hover:text-primaryText hover:bg-card/45 border border-transparent'
                  }`
                }
              >
                <item.icon className="w-4 h-4" />
                {item.name}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="p-4 border-t border-border flex flex-col gap-4">
          {user && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-card/40 border border-border/50">
              <Avatar username={user.username} size="sm" />
              <div className="min-w-0">
                <p className="font-mono text-xs font-bold text-primaryText truncate">
                  {user.username}
                </p>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between px-2 text-[10px]">
            <span className="font-mono font-bold tracking-wider text-zinc-500 flex items-center gap-1.5">
              <Radio className={`w-3.5 h-3.5 ${isConnected ? 'text-green-500 animate-pulse' : 'text-zinc-600'}`} />
              CONNECTION:
            </span>
            <span className={`font-mono font-bold tracking-widest ${isConnected ? 'text-green-400' : 'text-zinc-500'}`}>
              {isConnected ? 'CONNECTED' : 'OFFLINE'}
            </span>
          </div>

          <button
            onClick={handleLogout}
            className="w-full min-h-11 rounded-xl border border-border bg-card/20 hover:bg-red-950/20 hover:border-red-950 hover:text-red-400 font-mono text-xs font-bold transition-all flex items-center justify-center gap-2"
          >
            <LogOut className="w-4.5 h-4.5" />
            LOG OUT
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <header className="h-14 border-b border-border bg-surface/95 backdrop-blur-sm flex items-center justify-between px-4 md:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-3.5 h-3.5 rounded-full bg-accent"></div>
            <div className="flex flex-col">
              <span className="font-mono text-[10px] font-bold tracking-[0.25em] text-primaryText hacker-text">ALIAS</span>
              <span className="text-[10px] text-secondaryText font-mono">{currentSection}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Radio className={`w-4 h-4 ${isConnected ? 'text-green-500' : 'text-zinc-600'}`} />
            <button onClick={handleLogout} className="p-1.5 text-zinc-500 hover:text-red-400" aria-label="Log out">
              <LogOut className="w-4.5 h-4.5" />
            </button>
          </div>
        </header>

        <main className="flex-1 flex flex-col min-h-0 bg-background overflow-hidden relative pb-16 md:pb-0">
          <Outlet />
        </main>

        <nav
          className="fixed bottom-0 inset-x-0 h-16 border-t border-border bg-surface/95 backdrop-blur-sm z-30 md:hidden"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          <div className="h-full grid grid-cols-5">
            {navItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center gap-1 text-[10px] font-mono tracking-wide ${
                    isActive ? 'text-accent font-bold' : 'text-secondaryText'
                  }`
                }
              >
                <item.icon className="w-4.5 h-4.5" />
                <span>{item.name}</span>
              </NavLink>
            ))}
          </div>
        </nav>
      </div>
    </div>
  );
};

export default MainLayout;
