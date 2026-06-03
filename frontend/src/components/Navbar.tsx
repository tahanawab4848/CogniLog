import React from 'react';
import { useApp, ViewType } from '../context/AppContext';
import {
  Brain, Upload, Tag, GitCommit, Network,
  Gavel, TrendingUp, LogOut, Database, Unplug,
  Sparkles
} from 'lucide-react';

const NAV_ITEMS: { view: ViewType; label: string; icon: React.ElementType; desc: string }[] = [
  { view: 'hub',        label: 'Intelligence Hub',    icon: Brain,      desc: 'Global overview' },
  { view: 'import',     label: 'Import History',      icon: Upload,     desc: 'Add conversations' },
  { view: 'categories', label: 'Categories',          icon: Tag,        desc: 'Auto-discovered topics' },
  { view: 'timeline',   label: 'Timeline',            icon: GitCommit,  desc: 'All events, chronologically' },
  { view: 'graph',      label: 'Knowledge Graph',     icon: Network,    desc: 'Connected concepts' },
  { view: 'analyst',    label: 'AI Analyst',          icon: Sparkles,   desc: 'Ask across all chats' },
  { view: 'decisions',  label: 'Decisions',           icon: Gavel,      desc: 'All extracted decisions' },
  { view: 'progress',   label: 'My Progress',         icon: TrendingUp, desc: 'Intellectual evolution' },
];

export const Navbar: React.FC = () => {
  const { activeView, setActiveView, isBackendConnected, globalStats, logout } = useApp();

  return (
    <aside className="w-60 border-r border-darkBorder bg-[#080c14] flex flex-col shrink-0 h-screen">

      {/* Logo */}
      <div className="px-5 py-5 border-b border-darkBorder">
        <div className="flex items-center justify-between mb-0.5">
          <h2 className="text-base font-black tracking-tight bg-gradient-to-r from-primary-400 to-accent-purple bg-clip-text text-transparent">
            Chronicle
          </h2>
          {isBackendConnected === false ? (
            <div className="flex items-center gap-1 text-[9px] bg-yellow-500/10 border border-yellow-500/25 px-1.5 py-0.5 rounded text-yellow-300 font-bold">
              <Unplug size={8}/> MOCK
            </div>
          ) : (
            <div className="flex items-center gap-1 text-[9px] bg-emerald-500/10 border border-emerald-500/25 px-1.5 py-0.5 rounded text-emerald-300 font-bold">
              <Database size={8}/> LIVE
            </div>
          )}
        </div>
        <span className="text-[9px] text-slate-600 font-semibold uppercase tracking-widest">
          AI Knowledge Intelligence
        </span>
      </div>

      {/* Global stats strip */}
      {globalStats.totalConversations > 0 && (
        <div className="px-4 py-3 border-b border-darkBorder grid grid-cols-3 gap-2">
          {[
            { label: 'Convos',    value: globalStats.totalConversations },
            { label: 'Topics',    value: globalStats.topicsDiscovered },
            { label: 'Decisions', value: globalStats.totalDecisions },
          ].map(s => (
            <div key={s.label} className="text-center">
              <div className="text-sm font-black text-white">{s.value}</div>
              <div className="text-[8px] text-slate-600 font-semibold">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
        {NAV_ITEMS.map(item => {
          const Icon = item.icon;
          const active = activeView === item.view;
          return (
            <button
              key={item.view}
              onClick={() => setActiveView(item.view)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-150 group ${
                active
                  ? 'bg-gradient-to-r from-primary-600/25 to-accent-purple/10 text-white border-l-2 border-primary-500'
                  : 'text-slate-500 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Icon
                size={15}
                className={active ? 'text-primary-400' : 'text-slate-600 group-hover:text-slate-400'}
              />
              <div>
                <div className="text-[11px] font-semibold leading-tight">{item.label}</div>
                {active && (
                  <div className="text-[9px] text-slate-500 mt-0.5">{item.desc}</div>
                )}
              </div>
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-darkBorder">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2 text-[11px] font-medium text-slate-600 hover:text-slate-300 hover:bg-slate-800/30 rounded-lg transition"
        >
          <LogOut size={13}/> Sign Out
        </button>
      </div>
    </aside>
  );
};
