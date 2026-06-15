import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Compass, Inbox, MessageSquare, User as UserIcon, Settings as SettingsIcon, LogOut, Radio } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore.js';
import { useSocketStore } from '../store/useSocketStore.js';
import Avatar from '../components/ui/Avatar.js';

export const MainLayout: React.FC = () => {
  const { user, logout } = useAuthStore();
  const { isConnected } = useSocketStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'CHATS', path: '/chats', icon: MessageSquare },
    { name: 'DISCOVER', path: '/discover', icon: Compass },
    { name: 'REQUESTS', path: '/requests', icon: Inbox },
    { name: 'PROFILE', path: '/profile', icon: UserIcon },
    { name: 'SETTINGS', path: '/settings', icon: SettingsIcon },
  ];

  return (
    <div className="min-h-screen bg-background text-primaryText flex font-sans selection:bg-accent/30 selection:text-white">
      {/* Sidebar - Desktop */}
      <aside className="w-64 border-r border-border bg-surface flex flex-col justify-between hidden md:flex">
        <div className="flex flex-col">
          {/* Logo Section */}
          <div className="p-6 border-b border-border flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-accent animate-pulse-slow"></div>
            <span className="font-mono text-sm font-bold tracking-[0.3em] text-primaryText">
              ALIAS
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 flex flex-col gap-1.5">
            {navItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg font-mono text-xs font-bold tracking-wider transition-all ${
                    isActive
                      ? 'bg-card text-accent border-l-2 border-accent'
                      : 'text-secondaryText hover:text-primaryText hover:bg-card/45'
                  }`
                }
              >
                <item.icon className="w-4 h-4" />
                {item.name}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Footer info: User details + Connection status */}
        <div className="p-4 border-t border-border flex flex-col gap-4">
          {user && (
            <div className="flex items-center gap-3 p-2.5 rounded-lg bg-card/40 border border-border/50">
              <Avatar username={user.username} size="sm" />
              <div className="min-w-0">
                <p className="font-mono text-xs font-bold text-primaryText truncate">
                  {user.username}
                </p>
              </div>
            </div>
          )}

          {/* Connection status (Nothing OS inspired) */}
          <div className="flex items-center justify-between px-2">
            <span className="text-[9px] font-mono font-bold tracking-wider text-zinc-500 flex items-center gap-1.5">
              <Radio className={`w-3.5 h-3.5 ${isConnected ? 'text-green-500 animate-pulse' : 'text-zinc-600'}`} />
              CONNECTION:
            </span>
            <span className={`text-[9px] font-mono font-bold tracking-widest ${isConnected ? 'text-green-400' : 'text-zinc-500'}`}>
              {isConnected ? 'CONNECTED' : 'OFFLINE'}
            </span>
          </div>

          <button
            onClick={handleLogout}
            className="w-full py-2.5 rounded-lg border border-border bg-card/20 hover:bg-red-950/20 hover:border-red-950 hover:text-red-400 font-mono text-xs font-bold transition-all flex items-center justify-center gap-2"
          >
            <LogOut className="w-4.5 h-4.5" />
            LOG OUT
          </button>
        </div>
      </aside>

      {/* Main Panel Content */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Mobile Navbar */}
        <header className="h-16 border-b border-border bg-surface flex items-center justify-between px-6 md:hidden">
          <div className="flex items-center gap-2">
            <div className="w-4.5 h-4.5 rounded-full bg-accent"></div>
            <span className="font-mono text-xs font-bold tracking-[0.25em] text-primaryText">
              ALIAS
            </span>
          </div>

          <nav className="flex items-center gap-4">
            {navItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) =>
                  `p-1.5 transition-all ${isActive ? 'text-accent' : 'text-secondaryText hover:text-primaryText'}`
                }
              >
                <item.icon className="w-5 h-5" />
              </NavLink>
            ))}
            <button onClick={handleLogout} className="p-1.5 text-zinc-500 hover:text-red-400">
              <LogOut className="w-5 h-5" />
            </button>
          </nav>
        </header>

        {/* Content Outlet with smooth Framer Motion page transitions */}
        <main className="flex-1 flex flex-col min-h-0 bg-background overflow-hidden relative">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
