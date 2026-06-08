import React, { useEffect, useState } from 'react';
import { useApi } from '../hooks/useApi';
import { TrendingUp, Calendar, Lightbulb, CheckCircle2, HelpCircle, Brain } from 'lucide-react';
import { motion } from 'framer-motion';

interface Milestone {
  date: string;
  title: string;
  description: string;
  type: 'breakthrough' | 'resolved' | 'recurring' | 'growth';
}

const TYPE_STYLE: Record<string, { color: string; icon: React.ReactNode }> = {
  breakthrough: { color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', icon: <Lightbulb size={12}/> },
  resolved:     { color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',           icon: <CheckCircle2 size={12}/> },
  recurring:    { color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',         icon: <HelpCircle size={12}/> },
  growth:       { color: 'text-accent-purple bg-accent-purple/10 border-accent-purple/20', icon: <TrendingUp size={12}/> },
};

export const PersonalProgress: React.FC = () => {
  const api = useApi();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getPersonalProgress().then(d => { setData(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex-1 flex items-center justify-center bg-[#060910]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"/>
        <span className="text-xs text-slate-500">Calculating your intellectual journey…</span>
      </div>
    </div>
  );

  const growth = data?.growth_chart || [];
  const maxCount = Math.max(...growth.map((g: any) => g.count), 1);
  const milestones: Milestone[] = data?.milestones || [];
  const topTopics: any[] = data?.top_topics || [];
  const resolvedQuestions: number = data?.resolved_questions ?? 0;
  const totalInsights: number = data?.total_insights ?? 0;
  const knowledgeScore: number = data?.knowledge_score ?? 0;

  return (
    <div className="flex-1 p-8 overflow-y-auto bg-[#060910] space-y-8">
      {/* Ambient */}
      <div className="pointer-events-none fixed top-0 right-0 w-[500px] h-[500px] bg-accent-purple/4 rounded-full blur-[150px]" />

      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-white flex items-center gap-2 mb-1">
          <TrendingUp size={22} className="text-primary-400" /> Personal Progress
        </h1>
        <p className="text-slate-400 text-sm">How your knowledge, decisions, and thinking have evolved across all your AI conversations.</p>
      </div>

      {/* Score banner */}
      <div className="glass-panel p-6 rounded-2xl flex items-center gap-8">
        <div className="text-center">
          <div className="text-5xl font-black text-white mb-1">{knowledgeScore}</div>
          <div className="text-xs text-slate-500 font-semibold uppercase tracking-wide">Knowledge Score</div>
        </div>
        <div className="w-px h-16 bg-darkBorder" />
        <div className="flex-1 grid grid-cols-3 gap-6">
          {[
            { label: 'Insights Gained',      value: totalInsights,      color: 'text-primary-400' },
            { label: 'Questions Resolved',   value: resolvedQuestions,  color: 'text-emerald-400' },
            { label: 'Topics Mastered',      value: topTopics.length,   color: 'text-accent-purple' },
          ].map((s, i) => (
            <div key={i} className="text-center">
              <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity chart */}
        <div className="glass-panel p-6 rounded-2xl">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-5 flex items-center gap-2">
            <Calendar size={12}/> Conversation Activity
          </h3>
          <div className="flex items-end gap-2 h-32">
            {growth.map((g: any, i: number) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.round((g.count / maxCount) * 100)}%` }}
                  transition={{ delay: i * 0.04, duration: 0.5 }}
                  className="w-full rounded-t-sm bg-gradient-to-t from-primary-600 to-accent-purple min-h-[3px]"
                />
                <span className="text-[8px] text-slate-600 rotate-45 origin-left whitespace-nowrap">{g.date}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top topics */}
        <div className="glass-panel p-6 rounded-2xl">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-5 flex items-center gap-2">
            <Brain size={12}/> Most Explored Topics
          </h3>
          <div className="space-y-3">
            {topTopics.slice(0, 6).map((t: any, i: number) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-[10px] font-black text-slate-600 w-4">{i+1}</span>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-slate-300 font-medium">{t.name}</span>
                    <span className="text-[10px] text-slate-600">{t.count}×</span>
                  </div>
                  <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.round((t.count / topTopics[0]?.count) * 100)}%` }}
                      transition={{ delay: i * 0.05, duration: 0.5 }}
                      className="h-full bg-gradient-to-r from-primary-600 to-accent-purple rounded-full"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Milestones timeline */}
      {milestones.length > 0 && (
        <div className="glass-panel p-6 rounded-2xl">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-6 flex items-center gap-2">
            <TrendingUp size={12}/> Intellectual Milestones
          </h3>
          <div className="space-y-4 relative pl-6">
            <div className="absolute left-2 top-0 bottom-0 w-px bg-gradient-to-b from-primary-500/60 to-transparent" />
            {milestones.map((m, i) => {
              const style = TYPE_STYLE[m.type] || TYPE_STYLE.growth;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.04 }}
                  className="relative"
                >
                  <div className="absolute -left-[22px] top-1.5 w-4 h-4 rounded-full bg-slate-900 border-2 border-slate-700 flex items-center justify-center">
                    <div className={`w-1.5 h-1.5 rounded-full ${style.color.split(' ')[0].replace('text-', 'bg-')}`} />
                  </div>
                  <div className="glass-panel p-4 rounded-xl">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`flex items-center gap-1 text-[9px] font-bold uppercase px-2 py-0.5 rounded-md border ${style.color}`}>
                            {style.icon} {m.type}
                          </span>
                          <span className="text-[10px] text-slate-600">{m.date}</span>
                        </div>
                        <p className="text-xs font-bold text-white">{m.title}</p>
                        <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{m.description}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
