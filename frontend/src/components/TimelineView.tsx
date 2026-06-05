import React, { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { 
  Trophy, 
  Shuffle, 
  ShieldAlert, 
  Calendar,
  Sparkles
} from 'lucide-react';
import { motion } from 'framer-motion';

export const TimelineView: React.FC = () => {
  const api = useApi();
  const [timeline, setTimeline] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        // Pass 0 to signal global — backend returns all events; mock returns combined
        const res = await api.getProjectTimeline(0);
        setTimeline(res);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading) {
    return (
      <div className="flex-1 h-screen flex items-center justify-center bg-darkBg text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-primary-500 border-t-transparent animate-spin" />
          <span className="text-xs tracking-wider font-semibold">Tracing project chronology...</span>
        </div>
      </div>
    );
  }

  const getEventStyle = (type: string) => {
    switch (type.toLowerCase()) {
      case 'creation':
        return {
          icon: Sparkles,
          bg: 'bg-emerald-500/10 border-emerald-500/25',
          text: 'text-emerald-400'
        };
      case 'pivot':
        return {
          icon: Shuffle,
          bg: 'bg-accent-purple/10 border-accent-purple/25',
          text: 'text-accent-purple'
        };
      case 'blocker':
        return {
          icon: ShieldAlert,
          bg: 'bg-accent-rose/10 border-accent-rose/25',
          text: 'text-accent-rose'
        };
      default:
        return {
          icon: Trophy,
          bg: 'bg-primary-600/10 border-primary-500/25',
          text: 'text-primary-400'
        };
    }
  };

  return (
    <div className="flex-1 p-8 overflow-y-auto max-h-screen bg-[#070a10] relative">
      {/* Background glow */}
      <div className="absolute top-10 right-10 w-96 h-96 bg-primary-600/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Header */}
      <div className="mb-10">
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          Global Timeline
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          All pivots, milestones, decisions, and events across every conversation — chronologically.
        </p>
      </div>

      {timeline.length === 0 ? (
        <div className="glass-panel p-12 rounded-xl text-center max-w-xl mx-auto mt-12">
          <Calendar className="text-slate-500 mx-auto mb-4" size={32} />
          <h3 className="text-base font-bold text-white mb-2">Timeline Empty</h3>
          <p className="text-slate-400 text-xs mb-0">
            No events have been extracted. Upload chat histories or documents in the Data Ingestion panel to reconstruct history.
          </p>
        </div>
      ) : (
        <div className="max-w-3xl mx-auto relative pl-8 md:pl-0">
          {/* Vertical axis line */}
          <div className="absolute left-[18px] md:left-1/2 top-4 bottom-4 w-[2px] bg-gradient-to-b from-primary-500/80 via-accent-purple/40 to-slate-800 pointer-events-none" />

          {/* Timeline Cards */}
          <div className="space-y-12">
            {timeline.map((ev, idx) => {
              const style = getEventStyle(ev.event_type);
              const EventIcon = style.icon;
              const isEven = idx % 2 === 0;

              return (
                <motion.div
                  key={ev.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.4, delay: idx * 0.05 }}
                  className={`flex flex-col md:flex-row relative items-start md:items-center ${
                    isEven ? 'md:flex-row-reverse' : ''
                  }`}
                >
                  {/* Axis Node Icon */}
                  <div className="absolute left-[-26px] md:left-1/2 md:-translate-x-1/2 w-9 h-9 rounded-full bg-slate-900 border-2 border-slate-800 flex items-center justify-center z-10 shadow-[0_0_15px_rgba(0,0,0,0.5)]">
                    <div className={`w-6 h-6 rounded-full border flex items-center justify-center ${style.bg} ${style.text}`}>
                      <EventIcon size={12} />
                    </div>
                  </div>

                  {/* Card Content block */}
                  <div className={`w-full md:w-1/2 ${
                    isEven ? 'md:pl-12' : 'md:pr-12'
                  }`}>
                    <div className="glass-panel p-5 rounded-xl hover:border-slate-700 transition duration-300 relative group">
                      {/* Arrow tail indicators */}
                      <div className={`absolute top-4 w-2 h-2 bg-slate-900 border-slate-800 border-t border-l rotate-45 hidden md:block ${
                        isEven 
                          ? 'left-[-5px] border-b-0 border-r-0' 
                          : 'right-[-5px] border-t border-l border-b-0 border-r-0 rotate-[135deg]'
                      }`} />

                      <div className="flex items-center justify-between gap-3 mb-3">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-950/40 border border-darkBorder px-2.5 py-1 rounded-md">
                          {ev.date || "Date Unknown"}
                        </span>
                        <span className={`text-[10px] font-bold uppercase tracking-widest ${style.text}`}>
                          {ev.event_type}
                        </span>
                      </div>

                      <h3 className="text-sm font-bold text-white mb-2 leading-tight group-hover:text-primary-300 transition">
                        {ev.title}
                      </h3>
                      <p className="text-xs text-slate-400 leading-relaxed font-medium">
                        {ev.description}
                      </p>
                    </div>
                  </div>

                  {/* Empty spacer block for side alignment */}
                  <div className="hidden md:block w-1/2" />
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
