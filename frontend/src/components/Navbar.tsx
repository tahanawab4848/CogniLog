import React from 'react';
import { useApp, ViewType } from '../context/AppContext';
import {
  Home, Brain, Upload, Tag, GitCommit, Network,
  Gavel, TrendingUp, LogOut, Database, Unplug,
  Sparkles, MessageSquare, Trophy, Code2
} from 'lucide-react';

const NAV_ITEMS: { view: ViewType; label: string; icon: React.ElementType }[] = [
  { view: 'home',       label: 'Home',         icon: Home },
  { view: 'hub',        label: 'Hub',          icon: Brain },
  { view: 'devlab',     label: 'Dev Lab',      icon: Code2 },
  { view: 'import',     label: 'Import',       icon: Upload },
  { view: 'categories', label: 'Categories',   icon: Tag },
  { view: 'timeline',   label: 'Timeline',     icon: GitCommit },
  { view: 'graph',      label: 'Graph',        icon: Network },
  { view: 'analyst',    label: 'Analyst',      icon: Sparkles },
  { view: 'decisions',  label: 'Decisions',    icon: Gavel },
  { view: 'progress',   label: 'Progress',     icon: TrendingUp },
  { view: 'chats',      label: 'Chats',        icon: MessageSquare },
  { view: 'coach',      label: 'Coach',        icon: Trophy },
];

export const Navbar: React.FC = () => {
  const { activeView, setActiveView, isBackendConnected, logout } = useApp();
  const activeIndex = NAV_ITEMS.findIndex(i => i.view === activeView);

  return (
    <aside
      className="w-60 flex flex-col shrink-0 h-full py-8 px-5 relative z-20 rounded-[2rem]"
      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
    >
      {/* Logo */}
      <div className="mb-10">
        <h2 className="text-xl font-black tracking-tighter mb-2" style={{ color: 'var(--accent)' }}>
          Chronicle
        </h2>
        {isBackendConnected === false ? (
          <span className="inline-flex items-center gap-1.5 terminal-text px-2 py-1 rounded-full text-red-400"
            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)' }}>
            <Unplug size={10} /> MOCK
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 terminal-text px-2 py-1 rounded-full"
            style={{ background: 'var(--accent-dim)', border: '1px solid var(--border)', color: 'var(--accent)' }}>
            <Database size={10} /> LIVE
          </span>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto relative">
        {/* Sliding pill */}
        <div
          className="absolute left-0 w-[3px] rounded-full transition-transform duration-300"
          style={{
            height: 40,
            background: 'var(--accent)',
            transform: `translateY(${activeIndex * 48}px)`,
          }}
        />
        <div className="space-y-1">
          {NAV_ITEMS.map(item => {
            const Icon = item.icon;
            const active = activeView === item.view;
            return (
              <button
                key={item.view}
                onClick={() => setActiveView(item.view)}
                className="w-full flex items-center gap-3 px-4 h-10 rounded-xl text-xs font-bold uppercase tracking-widest transition-colors duration-150"
                style={{
                  color:      active ? 'var(--accent)' : 'var(--text-muted)',
                  background: active ? 'var(--accent-dim)' : 'transparent',
                }}
                onMouseEnter={e => {
                  if (!active) (e.currentTarget as HTMLElement).style.background = 'var(--bg-raised)';
                }}
                onMouseLeave={e => {
                  if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent';
                }}
              >
                <Icon size={15} />
                {item.label}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="pt-4 mt-auto" style={{ borderTop: '1px solid var(--border-subtle)' }}>
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-colors duration-150"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.background = 'var(--bg-raised)';
            (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.background = 'transparent';
            (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)';
          }}
        >
          <LogOut size={15} /> Sign Out
        </button>
      </div>
    </aside>
  );
};
