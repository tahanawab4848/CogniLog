import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { useApi } from '../hooks/useApi';
import {
  Brain, MessageSquare, Gavel,
  HelpCircle, Tag, Upload,
  ArrowRight, Zap, Trophy, CheckCircle2
} from 'lucide-react';

const V = {
  accent:    'var(--accent)',
  accent2:   'var(--accent-2)',
  accentDim: 'var(--accent-dim)',
  surface:   'var(--bg-surface)',
  raised:    'var(--bg-raised)',
  border:    'var(--border)',
  muted:     'var(--text-muted)',
  text:      'var(--text-primary)',
  dim:       'var(--text-dim)',
};

const getInsightBadge = (text: string) => {
  const base = 'px-1.5 py-0.5 rounded-sm text-[9px] uppercase tracking-widest mr-2 font-bold shrink-0 border';
  const t = text.toLowerCase();
  if (t.includes('decision') || t.includes('resolved'))
    return <span className={base} style={{ background: V.accentDim, color: V.accent, borderColor: V.border }}>DECISION</span>;
  if (t.includes('question') || t.includes('ask'))
    return <span className={base} style={{ background: 'rgba(45,212,191,0.1)', color: V.accent2, borderColor: 'rgba(45,212,191,0.2)' }}>QUESTION</span>;
  if (t.includes('failed') || t.includes('error'))
    return <span className={base} style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', borderColor: 'rgba(239,68,68,0.2)' }}>ALERT</span>;
  return <span className={base} style={{ background: V.accentDim, color: V.accent, borderColor: V.border }}>INFO</span>;
};

export const IntelligenceHub: React.FC = () => {
  const { globalStats, categories, setActiveView } = useApp();
  const api = useApi();
  const [activity, setActivity] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const stats = await api.getDashboardStats();
        setActivity(stats.recent_activity || []);
      } catch { /* silent */ }
      setLoading(false);
    };
    load();
  }, []);

  const hasData = globalStats.totalConversations > 0;

  return (
    <div className="flex-1 w-full h-full p-6 pb-32 overflow-y-auto custom-scrollbar">
      {!hasData && !loading ? (
        <div className="w-full h-full flex flex-col items-center justify-center">
          <div className="bento-card p-12 text-center max-w-xl">
            <Upload size={32} className="mx-auto mb-6" style={{ color: V.muted }} />
            <h2 className="text-2xl font-bold mb-3 tracking-tight">System Empty</h2>
            <p className="text-sm mb-8 leading-relaxed" style={{ color: V.muted }}>
              Upload your intelligence logs to begin automated graph structuring.
            </p>
            <button
              onClick={() => setActiveView('import')}
              className="px-6 py-3 font-semibold rounded-xl text-sm transition-transform hover:scale-105 active:scale-95"
              style={{ background: V.accent, color: 'var(--bg-void)' }}
            >
              Import Data
            </button>
          </div>
        </div>
      ) : (
        <div className="max-w-[1600px] mx-auto min-h-full grid grid-cols-1 md:grid-cols-4 lg:grid-cols-12 gap-6 auto-rows-min pb-12">

          {/* Header Bento */}
          <div
            className="bento-card col-span-1 md:col-span-4 lg:col-span-8 p-6 md:p-10 flex flex-col justify-between relative overflow-hidden group cursor-pointer"
            onClick={() => setActiveView('progress')}
          >
            <div className="relative z-10">
              <h1 className="text-4xl md:text-5xl lg:text-7xl font-black tracking-tighter mb-4" style={{ color: V.accent }}>
                Intelligence Hub
              </h1>
              <p className="text-sm md:text-base max-w-xl leading-relaxed" style={{ color: V.muted }}>
                Your neural architecture is continuously evolving. Total extraction mapping is active.
              </p>
            </div>
            {globalStats.analysisProgress < 100 && (
              <div className="mt-8 md:mt-12 rounded-2xl p-4 flex items-center gap-4 md:gap-6 relative z-10"
                style={{ background: V.raised, border: `1px solid ${V.border}` }}>
                <div className="flex items-center gap-2 text-[10px] md:text-xs font-bold uppercase tracking-widest" style={{ color: V.muted }}>
                  <Zap size={14} className="animate-pulse" style={{ color: V.accent }} /> Processing
                </div>
                <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: V.border }}>
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${globalStats.analysisProgress}%`, background: V.accent }} />
                </div>
                <span className="terminal-text text-[10px] md:text-[11px]" style={{ color: V.accent }}>{globalStats.analysisProgress}%</span>
              </div>
            )}
          </div>

          {/* Quick Stats Bento */}
          <div className="bento-card col-span-1 md:col-span-4 lg:col-span-4 p-6 md:p-8 grid grid-cols-2 gap-4 md:gap-8 relative overflow-hidden">
            {[
              { Icon: MessageSquare, count: globalStats.totalConversations, label: 'Chats',     view: null },
              { Icon: Gavel,         count: globalStats.totalDecisions,     label: 'Decisions', view: 'decisions' },
              { Icon: HelpCircle,    count: globalStats.totalQuestions,     label: 'Open Qs',   view: null },
              { Icon: Tag,           count: globalStats.topicsDiscovered,   label: 'Topics',    view: 'categories' },
            ].map(({ Icon, count, label, view }) => (
              <div key={label}
                className={`flex flex-col justify-between group ${view ? 'cursor-pointer' : 'cursor-default'}`}
                onClick={() => view && setActiveView(view as any)}
              >
                <Icon size={20} style={{ color: V.dim }} className="mb-2" />
                <div>
                  <div className="text-3xl md:text-4xl font-bold tracking-tighter mb-1" style={{ color: V.text }}>{count}</div>
                  <div className="text-[10px] md:text-xs uppercase tracking-widest font-semibold flex items-center gap-1" style={{ color: V.muted }}>
                    {label} {view && <ArrowRight size={10}/>}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Topics Distribution Bento */}
          <div className="bento-card col-span-1 md:col-span-2 lg:col-span-6 p-8 flex flex-col h-full min-h-[400px]">
            <div className="flex items-center justify-between mb-8 shrink-0">
              <h3 className="text-lg font-bold tracking-tight">Category Distribution</h3>
              <button onClick={() => setActiveView('categories')}
                className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95"
                style={{ background: V.raised, border: `1px solid ${V.border}` }}>
                <ArrowRight size={14} />
              </button>
            </div>
            <div className="flex-1 flex flex-col justify-center space-y-6 overflow-y-auto pr-2 custom-scrollbar">
              {categories.slice(0, 5).map((cat, idx) => {
                const pct = Math.round((cat.count / Math.max(...categories.map((c: any) => c.count))) * 100);
                return (
                  <div key={cat.id} className="group cursor-pointer" onClick={() => setActiveView('categories')}>
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-xl w-10 h-10 rounded-full flex items-center justify-center border transition-all group-hover:scale-110"
                          style={{ background: V.raised, borderColor: V.border }}>{cat.icon}</span>
                        <span className="font-semibold" style={{ color: V.text }}>{cat.name}</span>
                      </div>
                      <span className="font-mono" style={{ color: V.muted }}>{cat.count}</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ background: 'var(--border-subtle)' }}>
                      <div className="h-full rounded-full transition-all duration-700 origin-left"
                        style={{ transform: `scaleX(${pct / 100})`, background: V.accent, transitionDelay: `${idx * 50}ms` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Activity Feed Bento */}
          <div className="bento-card col-span-1 md:col-span-2 lg:col-span-6 p-8 flex flex-col h-full min-h-[400px]">
            <div className="flex items-center justify-between mb-8 shrink-0">
              <h3 className="text-lg font-bold tracking-tight">Neural Activity</h3>
              <div className="badge-accent flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: V.accent }}/> Live
              </div>
            </div>
            <div className="flex-1 flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar">
              {activity.length > 0 ? activity.map((item, i) => (
                <div key={i} className="flex gap-4 p-4 rounded-2xl transition-all cursor-default"
                  style={{ background: V.raised, border: `1px solid ${V.border}` }}>
                  <div className="w-10 h-10 shrink-0 rounded-full flex items-center justify-center border"
                    style={{ background: V.accentDim, borderColor: V.border, color: V.accent }}>
                    {item.toLowerCase().includes('decision') ? <Gavel size={16}/> :
                     item.toLowerCase().includes('question') ? <HelpCircle size={16}/> : <CheckCircle2 size={16}/>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-relaxed line-clamp-2" style={{ color: V.text }}>{item}</p>
                    <span className="text-[10px] uppercase tracking-widest font-bold mt-2 block" style={{ color: V.muted }}>
                      {i === 0 ? 'Just now' : `${i * 12} mins ago`}
                    </span>
                  </div>
                </div>
              )) : (
                <div className="flex-1 flex items-center justify-center text-sm italic border border-dashed rounded-2xl"
                  style={{ color: V.muted, borderColor: V.border }}>Waiting for incoming signals...</div>
              )}
            </div>
          </div>

        </div>
      )}
    </div>
  );
};
