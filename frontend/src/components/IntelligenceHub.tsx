import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { useApi } from '../hooks/useApi';
import {
  Brain, MessageSquare, Lightbulb, Gavel,
  HelpCircle, Tag, TrendingUp, Upload,
  ArrowRight, Zap, Clock, CheckCircle2
} from 'lucide-react';

const StatCard: React.FC<{
  icon: React.ReactNode; label: string; value: string | number;
  sub?: string; color: string; onClick?: () => void;
}> = ({ icon, label, value, sub, color, onClick }) => (
  <div
    onClick={onClick}
    className={`glass-panel p-5 rounded-2xl flex flex-col gap-3 relative overflow-hidden
      ${onClick ? 'cursor-pointer hover:border-slate-600 transition-all duration-200 hover:scale-[1.01]' : ''}`}
  >
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
      {icon}
    </div>
    <div>
      <div className="text-2xl font-black text-white tracking-tight">{value}</div>
      <div className="text-xs font-semibold text-slate-400 mt-0.5">{label}</div>
      {sub && <div className="text-[10px] text-slate-600 mt-1">{sub}</div>}
    </div>
    <div className={`absolute -bottom-4 -right-4 w-20 h-20 rounded-full opacity-10 blur-xl ${color}`} />
  </div>
);

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
    <div className="flex-1 p-8 overflow-y-auto max-h-screen bg-[#060910]">
      {/* Ambient glows */}
      <div className="pointer-events-none fixed top-0 left-1/2 -translate-x-1/2 w-[700px] h-[300px] bg-primary-600/8 rounded-full blur-[120px]" />
      <div className="pointer-events-none fixed bottom-10 right-10 w-[400px] h-[400px] bg-accent-purple/5 rounded-full blur-[100px]" />

      {/* Header */}
      <div className="mb-10 relative">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 bg-gradient-to-br from-primary-600/30 to-accent-purple/20 rounded-xl border border-primary-500/20">
            <Brain size={22} className="text-primary-400" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-white">
              Intelligence Hub
            </h1>
            <p className="text-slate-400 text-sm mt-0.5">
              Your complete AI conversation knowledge — auto-analyzed, categorized, and evolving.
            </p>
          </div>
        </div>
      </div>

      {/* Empty state — prompt to import */}
      {!hasData && !loading && (
        <div className="max-w-2xl mx-auto mt-16 text-center">
          <div className="glass-panel p-12 rounded-2xl border border-dashed border-slate-700">
            <div className="w-20 h-20 bg-gradient-to-br from-primary-600/20 to-accent-purple/20 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-primary-500/20">
              <Upload size={36} className="text-primary-400" />
            </div>
            <h2 className="text-xl font-black text-white mb-3">No conversations analyzed yet</h2>
            <p className="text-slate-400 text-sm leading-relaxed mb-8 max-w-md mx-auto">
              Import your complete ChatGPT, Claude, or Gemini history using the Chronicle Bridge
              browser extension or upload exported files. The AI will automatically categorize
              everything and build your personal knowledge map.
            </p>
            <button
              onClick={() => setActiveView('import')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-accent-purple text-white text-sm font-bold rounded-xl hover:opacity-90 transition"
            >
              <Upload size={16} /> Import Conversations <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {hasData && (
        <>
          {/* Analysis progress bar */}
          {globalStats.analysisProgress < 100 && (
            <div className="glass-panel p-4 rounded-xl mb-8 flex items-center gap-4">
              <div className="p-2 bg-primary-600/20 rounded-lg">
                <Zap size={16} className="text-primary-400 animate-pulse" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-xs font-semibold text-white">AI Analysis in Progress</span>
                  <span className="text-xs text-primary-400 font-bold">{globalStats.analysisProgress}%</span>
                </div>
                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary-600 to-accent-purple rounded-full transition-all duration-700"
                    style={{ width: `${globalStats.analysisProgress}%` }}
                  />
                </div>
              </div>
              <span className="text-[10px] text-slate-500">Extracting entities…</span>
            </div>
          )}

          {/* Stats grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            <StatCard
              icon={<MessageSquare size={18} />}
              label="Conversations"
              value={globalStats.totalConversations.toLocaleString()}
              sub={`${globalStats.totalMessages.toLocaleString()} total messages`}
              color="bg-blue-500/20 text-blue-400"
            />
            <StatCard
              icon={<Tag size={18} />}
              label="Topics Discovered"
              value={globalStats.topicsDiscovered}
              sub="Auto-categorized by AI"
              color="bg-accent-purple/20 text-accent-purple"
              onClick={() => setActiveView('categories')}
            />
            <StatCard
              icon={<Gavel size={18} />}
              label="Decisions Extracted"
              value={globalStats.totalDecisions.toLocaleString()}
              sub="Across all conversations"
              color="bg-emerald-500/20 text-emerald-400"
              onClick={() => setActiveView('decisions')}
            />
            <StatCard
              icon={<HelpCircle size={18} />}
              label="Open Questions"
              value={globalStats.totalQuestions.toLocaleString()}
              sub="Unresolved topics"
              color="bg-amber-500/20 text-amber-400"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Top Categories */}
            <div className="lg:col-span-2 glass-panel p-6 rounded-2xl">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Tag size={15} className="text-accent-purple" /> Top Categories
                </h3>
                <button
                  onClick={() => setActiveView('categories')}
                  className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1 transition"
                >
                  View all <ArrowRight size={12} />
                </button>
              </div>
              <div className="space-y-3">
                {categories.slice(0, 6).map((cat) => {
                  const pct = Math.round((cat.count / Math.max(...categories.map((c: any) => c.count))) * 100);
                  return (
                    <div
                      key={cat.id}
                      onClick={() => setActiveView('categories')}
                      className="flex items-center gap-3 cursor-pointer group"
                    >
                      <span className="text-lg w-7 flex-shrink-0">{cat.icon}</span>
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs font-semibold text-slate-300 group-hover:text-white transition">
                            {cat.name}
                          </span>
                          <span className="text-[10px] text-slate-500">{cat.count} convos</span>
                        </div>
                        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${pct}%`,
                              background: cat.color || 'linear-gradient(to right, #6366f1, #8b5cf6)'
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Activity Feed */}
            <div className="glass-panel p-6 rounded-2xl flex flex-col">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-5">
                <Clock size={15} className="text-primary-400" /> Recent Insights
              </h3>
              <div className="flex-1 space-y-3 overflow-y-auto">
                {activity.length > 0 ? activity.map((item, i) => (
                  <div key={i} className="flex gap-2.5 text-xs">
                    <CheckCircle2 size={13} className="text-primary-500 mt-0.5 flex-shrink-0" />
                    <p className="text-slate-400 leading-relaxed">{item}</p>
                  </div>
                )) : (
                  <p className="text-slate-600 text-xs italic">No recent activity.</p>
                )}
              </div>

              {/* Quick actions */}
              <div className="mt-5 pt-4 border-t border-darkBorder space-y-2">
                {[
                  { label: 'Explore Timeline', view: 'timeline' as const, icon: <TrendingUp size={12} /> },
                  { label: 'Ask AI Analyst', view: 'analyst' as const, icon: <Brain size={12} /> },
                  { label: 'View Progress', view: 'progress' as const, icon: <Lightbulb size={12} /> },
                ].map(action => (
                  <button
                    key={action.view}
                    onClick={() => setActiveView(action.view)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-slate-800/50 transition group"
                  >
                    <span className="flex items-center gap-2">{action.icon} {action.label}</span>
                    <ArrowRight size={11} className="opacity-0 group-hover:opacity-100 transition" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
