import React, { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { 
  Sparkles, 
  AlertOctagon, 
  ListTodo, 
  FileWarning, 
  Network
} from 'lucide-react';
import { motion } from 'framer-motion';

export const FuturePredictor: React.FC = () => {
  const api = useApi();
  const [predictions, setPredictions] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchPredictions = async () => {
      setLoading(true);
      try {
        const res = await api.getPredictions(0);
        setPredictions(res);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchPredictions();
  }, []);

  if (loading) {
    return (
      <div className="flex-1 h-screen flex items-center justify-center bg-darkBg text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-primary-500 border-t-transparent animate-spin" />
          <span className="text-xs tracking-wider font-semibold">Running predictive modeling...</span>
        </div>
      </div>
    );
  }

  const sections = [
    {
      title: "Potential Blockers",
      desc: "Technical friction points or external dependency locks.",
      data: predictions?.blockers || [],
      icon: AlertOctagon,
      color: "text-accent-rose bg-accent-rose/10 border-accent-rose/20"
    },
    {
      title: "Recommended Next Tasks",
      desc: "Actions predicted based on open issues and active pivots.",
      data: predictions?.next_tasks || [],
      icon: ListTodo,
      color: "text-accent-green bg-accent-green/10 border-accent-green/20"
    },
    {
      title: "Missing Requirements",
      desc: "Gaps discussed in chats but not scheduled in timeline tasks.",
      data: predictions?.missing_requirements || [],
      icon: FileWarning,
      color: "text-yellow-400 bg-yellow-400/10 border-yellow-500/20"
    },
    {
      title: "Similar Patterns Observed",
      desc: "Analogous timelines and learnings from other workspaces.",
      data: predictions?.similar_patterns || [],
      icon: Network,
      color: "text-accent-purple bg-accent-purple/10 border-accent-purple/20"
    }
  ];

  return (
    <div className="flex-1 p-8 overflow-y-auto max-h-screen bg-[#070a10] relative">
      <div className="absolute bottom-10 left-10 w-96 h-96 bg-primary-600/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Header */}
      <div className="mb-10 flex items-center gap-3">
        <div className="p-2.5 bg-gradient-to-r from-primary-600/20 to-accent-purple/20 text-primary-400 rounded-xl border border-primary-500/20">
          <Sparkles size={22} className="animate-pulse" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Future Prediction Engine</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            AI analysis of historical timelines to forecast engineering blockers, requirements, and next steps across your conversations.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
        {sections.map((sec, idx) => {
          const Icon = sec.icon;
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: idx * 0.05 }}
              className="glass-panel p-6 rounded-xl hover:border-slate-700 transition duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className={`p-2 rounded-lg border ${sec.color}`}>
                    <Icon size={16} />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white tracking-wide">{sec.title}</h3>
                    <p className="text-[10px] text-slate-500 font-medium">{sec.desc}</p>
                  </div>
                </div>

                <div className="mt-4 space-y-2.5">
                  {sec.data.length === 0 ? (
                    <p className="text-[11px] text-slate-500 italic">No patterns detected yet.</p>
                  ) : (
                    sec.data.map((item: string, i: number) => (
                      <div key={i} className="flex gap-2.5 text-xs bg-slate-950/20 p-2.5 rounded-lg border border-darkBorder">
                        <span className="text-primary-500 font-bold shrink-0 mt-0.5">•</span>
                        <p className="text-slate-300 leading-relaxed font-medium">{item}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
