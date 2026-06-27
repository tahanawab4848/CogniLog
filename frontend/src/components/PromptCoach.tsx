import React, { useEffect, useState } from 'react';
import { useApi } from '../hooks/useApi';
import { Brain, Trophy, AlertTriangle, CheckCircle2, Sparkles, ArrowRight } from 'lucide-react';

export const PromptCoach: React.FC = () => {
  const api = useApi();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const result = await api.getPromptCoachAnalysis();
        setData(result);
      } catch (err) {
        console.error("Failed to load prompt coach data", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[500px]">
        <div className="w-12 h-12 border-4 border-[#00f0ff]/20 border-t-[#00f0ff] rounded-full animate-spin mb-6 shadow-[0_0_20px_rgba(0,240,255,0.3)]" />
        <p className="text-[#00f0ff]/70 text-xs font-bold uppercase tracking-widest animate-pulse">Running Neural Diagnostics...</p>
      </div>
    );
  }

  if (!data) return null;

  const scoreColor = data.score >= 80 ? 'text-[#00f0ff]' : data.score >= 50 ? 'text-[#ff5e00]' : 'text-[#ff003c]';
  const scoreGlow = data.score >= 80 ? 'drop-shadow-[0_0_10px_rgba(0,240,255,0.5)]' : data.score >= 50 ? 'drop-shadow-[0_0_10px_rgba(255,94,0,0.5)]' : 'drop-shadow-[0_0_10px_rgba(255,0,60,0.5)]';
  const strokeColor = data.score >= 80 ? '#00f0ff' : data.score >= 50 ? '#ff5e00' : '#ff003c';

  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (data.score / 100) * circumference;

  return (
    <div className="flex-1 p-6 pb-32 overflow-y-auto w-full h-full">
      <div className="max-w-[1600px] mx-auto min-h-full flex flex-col gap-6 pb-12">
        
        {/* Header Bento */}
        <div className="bento-card p-8 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#b026ff]/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/4 pointer-events-none" />
          <div className="relative z-10">
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter mb-4 text-transparent bg-clip-text bg-gradient-to-br from-white to-white/40">
              Prompt Mastery
            </h1>
            <p className="text-white/50 text-sm md:text-base max-w-xl leading-relaxed">
              Based on neural extraction of your query history, here is an objective diagnostic of your prompt architecture.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
          
          {/* Score & Diagnostic Bento */}
          <div className="col-span-1 lg:col-span-4 bento-card p-8 flex flex-col gap-8 relative">
            <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest flex items-center gap-2">
              <Brain size={14} /> Overall Synchronization
            </div>
            
            <div className="flex justify-center relative my-4">
              {/* Circular SVG Progress */}
              <svg className="w-48 h-48 transform -rotate-90">
                <circle cx="96" cy="96" r="45" stroke="currentColor" strokeWidth="2" fill="transparent" className="text-white/5" />
                <circle 
                  cx="96" cy="96" r="45" stroke={strokeColor} strokeWidth="4" fill="transparent" 
                  strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-1000 ease-out"
                  style={{ filter: `drop-shadow(0 0 8px ${strokeColor})` }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <span className={`text-5xl font-black tracking-tighter terminal-text ${scoreColor} ${scoreGlow}`}>
                  {data.score}
                </span>
              </div>
            </div>

            <div className="mt-auto">
              <div className="text-[10px] font-bold text-[#ff5e00] uppercase tracking-widest mb-3 flex items-center gap-2">
                <AlertTriangle size={14} /> Diagnostic Warning
              </div>
              <p className="text-sm text-white/80 leading-relaxed bg-[#ff5e00]/5 border border-[#ff5e00]/20 p-4 rounded-xl">
                "{data.critique}"
              </p>
            </div>
          </div>

          {/* Case Study Bento */}
          <div className="col-span-1 lg:col-span-8 bento-card p-8 flex flex-col gap-6">
            <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest flex items-center gap-2">
              <Sparkles size={14} /> Sub-optimal Case Study
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
              
              <div className="bento-card p-6 bg-black/40 border-[#ff003c]/20 hover:border-[#ff003c]/40 relative group">
                <div className="text-[10px] font-bold text-[#ff003c] uppercase tracking-widest mb-4 flex items-center gap-2">
                  Raw Input
                </div>
                <p className="text-white/60 text-sm leading-relaxed font-mono">
                  {data.worst_prompt}
                </p>
              </div>

              <div className="bento-card p-6 bg-black/40 border-[#00f0ff]/20 hover:border-[#00f0ff]/40 relative group">
                <div className="text-[10px] font-bold text-[#00f0ff] uppercase tracking-widest mb-4 flex items-center gap-2">
                  Optimized Architecture
                </div>
                <p className="text-white/90 text-sm leading-relaxed font-mono drop-shadow-[0_0_2px_rgba(0,240,255,0.5)]">
                  {data.improved_prompt}
                </p>
              </div>

            </div>
          </div>

          {/* Training Module Bento */}
          <div className="col-span-1 lg:col-span-12 bento-card p-8">
            <div className="text-[10px] font-bold text-[#b026ff] uppercase tracking-widest mb-6 flex items-center gap-2">
              <Trophy size={14} /> Training Protocol: {data.exercise_title}
            </div>
            
            <p className="text-white/70 text-sm leading-relaxed mb-8 max-w-4xl">
              {data.exercise_description}
            </p>

            <div className="relative group max-w-4xl">
              <div className="absolute -inset-0.5 bg-[#00f0ff]/20 rounded-xl blur opacity-0 group-focus-within:opacity-100 transition duration-500" />
              <div className="relative bg-black/40 border border-white/10 rounded-xl overflow-hidden focus-within:border-[#00f0ff]/50 transition-colors">
                <textarea 
                  className="w-full bg-transparent border-none text-white text-sm p-6 focus:outline-none resize-none terminal-text placeholder:text-white/20"
                  rows={4}
                  placeholder="> INITIATE OPTIMIZED INPUT SEQUENCE..."
                />
                <div className="flex justify-between items-center px-6 py-4 bg-black/60 border-t border-white/10">
                  <span className="text-[10px] text-white/30 terminal-text">AWAITING ENTER...</span>
                  <button className="text-black bg-[#00f0ff] hover:bg-white px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(0,240,255,0.3)] hover:scale-105 active:scale-95 flex items-center gap-2">
                    Execute <ArrowRight size={12} />
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
