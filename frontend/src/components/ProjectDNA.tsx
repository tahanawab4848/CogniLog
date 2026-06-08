import React from 'react';
import { useApp } from '../context/AppContext';
import { Dna, BookOpen, Compass, Lightbulb, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

// ProjectDNA now reflects the global knowledge identity, not a single project
export const ProjectDNA: React.FC = () => {
  const { globalStats } = useApp();

  const dnaBlocks = [
    {
      title: 'Origin & Purpose',
      content: 'Your AI conversations span software engineering, AI/ML, business strategy, and personal development. Chronicle synthesizes these into a unified knowledge identity that shows how your thinking has evolved.',
      icon: BookOpen,
      color: 'text-accent-cyan bg-accent-cyan/10 border-accent-cyan/20',
    },
    {
      title: 'Core Knowledge Domains',
      content: `${globalStats.topicsDiscovered} topic categories discovered. Dominant themes include technical architecture, AI system design, and product strategy — with ${globalStats.totalDecisions} decisions made across all sessions.`,
      icon: Compass,
      color: 'text-primary-400 bg-primary-400/10 border-primary-500/20',
    },
    {
      title: 'Future Opportunities',
      content: 'Recurring open questions and unresolved debates point toward emerging areas of growth. Import more conversations to refine these forward-looking insights.',
      icon: Lightbulb,
      color: 'text-yellow-400 bg-yellow-400/10 border-yellow-500/20',
    },
  ];

  return (
    <div className="flex-1 p-8 overflow-y-auto max-h-screen bg-[#070a10] relative">
      <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-primary-600/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="mb-10 flex items-center gap-3">
        <div className="p-2.5 bg-gradient-to-r from-primary-600/20 to-accent-purple/20 text-primary-400 rounded-xl border border-primary-500/20">
          <Dna size={22} className="animate-pulse" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Knowledge DNA</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            Your global intellectual identity — auto-synthesized across all AI conversations.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto space-y-6">
        {dnaBlocks.map((block, idx) => {
          const Icon = block.icon;
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: idx * 0.1 }}
              className="glass-panel p-6 rounded-xl border-l-4 hover:border-slate-700 transition duration-300"
            >
              <div className="flex gap-4 items-start">
                <div className={`p-3 rounded-lg border shrink-0 ${block.color}`}>
                  <Icon size={20} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-white tracking-wide">{block.title}</h3>
                  <p className="text-xs text-slate-300 leading-relaxed font-medium">{block.content}</p>
                </div>
              </div>
            </motion.div>
          );
        })}

        <div className="p-4 rounded-lg border border-darkBorder bg-slate-950/20 text-slate-400 text-xs flex gap-2.5 max-w-2xl mx-auto">
          <AlertCircle size={16} className="text-slate-500 shrink-0 mt-0.5" />
          <p className="leading-normal">
            Knowledge DNA is generated dynamically. As you import more conversations via the Chronicle Bridge extension or file uploads, the AI Engine automatically expands and recalibrates these insights.
          </p>
        </div>
      </div>
    </div>
  );
};
