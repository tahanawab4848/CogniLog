import React from 'react';
import { useApp } from '../context/AppContext';
import { Network, Brain, Target, Activity, CheckCircle2, GitCommit } from 'lucide-react';

export const Home: React.FC = () => {
  const { globalStats, setActiveView } = useApp();

  const stats = [
    { title: 'Knowledge Nodes',  value: globalStats?.topicsDiscovered || 0,  icon: Network, color: 'var(--accent)',  view: 'graph'    },
    { title: 'Total Insights',   value: globalStats?.totalInsights    || 0,  icon: Brain,   color: 'var(--accent-2)', view: 'hub'     },
    { title: 'Decisions Logged', value: globalStats?.totalDecisions   || 0,  icon: Target,  color: 'var(--accent)',  view: 'decisions'},
    { title: 'System Health',    value: '100%',                              icon: Activity, color: 'var(--accent-2)', view: 'hub'    },
  ];

  return (
    <div className="h-full w-full p-8 overflow-y-auto custom-scrollbar flex flex-col gap-8 animate-fade-in-up"
      style={{ color: 'var(--text-primary)' }}>

      {/* Header */}
      <header>
        <div className="flex items-center gap-2 mb-3">
          <span className="badge-accent">Spatial OS</span>
        </div>
        <h1 className="text-4xl font-black tracking-tight mb-2">
          Workspace{' '}
          <span style={{ color: 'var(--accent)' }}>Overview</span>
        </h1>
        <p className="text-sm max-w-xl" style={{ color: 'var(--text-muted)' }}>
          Welcome to Chronicle — your personal intelligence OS. All your thinking, decisions,
          and knowledge organized and ready for exploration.
        </p>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ title, value, icon: Icon, color, view }) => (
          <button
            key={title}
            onClick={() => setActiveView(view as any)}
            className="bento-card p-5 text-left group cursor-pointer"
          >
            <div className="flex justify-between items-start mb-4">
              <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                {title}
              </span>
              <Icon size={15} style={{ color }} />
            </div>
            <div className="text-3xl font-black mb-1" style={{ color: 'var(--text-primary)' }}>
              {value}
            </div>
          </button>
        ))}
      </div>

      {/* Content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-[300px]">
        {/* Activity feed */}
        <div className="lg:col-span-2 bento-card p-6 flex flex-col">
          <div className="flex items-center justify-between mb-5 pb-4" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
            <h3 className="font-bold text-base">Recent Activity</h3>
            <span className="badge-accent">Live</span>
          </div>
          <div className="flex-1 space-y-3">
            {[
              'New memory cluster formed — 14 concepts linked automatically.',
              'AI Analyst generated 3 novel insights from imported conversations.',
              'Decision tree updated — 2 open decisions need your review.',
            ].map((msg, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg transition-colors duration-150 cursor-default"
                style={{ background: 'transparent' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--bg-raised)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
              >
                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: 'var(--accent-dim)', border: '1px solid var(--border)' }}>
                  <GitCommit size={12} style={{ color: 'var(--accent)' }} />
                </div>
                <div>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--text-primary)' }}>{msg}</p>
                  <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{i + 1}h ago</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Status panel */}
        <div className="bento-card p-6 flex flex-col">
          <h3 className="font-bold text-base mb-5 pb-4" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
            System Status
          </h3>
          <div className="space-y-3 flex-1">
            {[
              { label: 'Neural Sync',         status: 'Active',     active: true  },
              { label: 'Vector Database',     status: 'Connected',  active: true  },
              { label: 'Background Tasks',    status: 'Idle',       active: false },
              { label: 'Auto-Categorization', status: 'Running',    active: true  },
            ].map(({ label, status, active }) => (
              <div key={label} className="flex items-center justify-between p-3 rounded-lg"
                style={{ background: 'var(--bg-raised)', border: '1px solid var(--border-subtle)' }}>
                <div className="flex items-center gap-2 text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                  <CheckCircle2 size={13} style={{ color: active ? 'var(--accent)' : 'var(--text-muted)' }} />
                  {label}
                </div>
                <span className="text-[10px] font-bold"
                  style={{ color: active ? 'var(--accent)' : 'var(--text-muted)' }}>
                  {status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
