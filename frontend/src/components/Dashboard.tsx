import React, { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { useApp } from '../context/AppContext';
import { 
  Folder, 
  Lightbulb, 
  Gavel, 
  HelpCircle, 
  ArrowRight,
  TrendingUp,
  Activity
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const api = useApi();
  const { setActiveView } = useApp();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const res = await api.getDashboardStats();
        setStats(res);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex-1 h-screen flex items-center justify-center bg-darkBg text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-primary-500 border-t-transparent animate-spin" />
          <span className="text-xs tracking-wider">Syncing dashboard metrics...</span>
        </div>
      </div>
    );
  }

  // Calculate SVG Points for knowledge growth graph
  const renderGrowthChart = () => {
    if (!stats || !stats.growth_chart_data || stats.growth_chart_data.length === 0) {
      return (
        <div className="h-48 flex items-center justify-center border border-dashed border-darkBorder rounded-xl text-xs text-slate-500">
          Upload documents to populate growth activity.
        </div>
      );
    }

    const data = stats.growth_chart_data;
    const maxVal = Math.max(...data.map((d: any) => d.count), 4);
    const width = 500;
    const height = 140;
    const padding = 20;

    const points = data.map((d: any, index: number) => {
      const x = padding + (index * (width - padding * 2)) / (data.length - 1);
      const y = height - padding - (d.count * (height - padding * 2)) / maxVal;
      return { x, y, label: d.date, val: d.count };
    });

    const pathD = points.reduce((acc: string, p: any, idx: number) => {
      return acc + (idx === 0 ? `M ${p.x} ${p.y}` : ` L ${p.x} ${p.y}`);
    }, "");

    const areaD = points.reduce((acc: string, p: any, idx: number) => {
      return acc + (idx === 0 ? `M ${p.x} ${p.y}` : ` L ${p.x} ${p.y}`);
    }, "") + ` L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;

    return (
      <div className="relative w-full">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
          <defs>
            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="rgba(255,255,255,0.05)" />
          <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="rgba(255,255,255,0.02)" />

          {/* Area under curve */}
          <path d={areaD} fill="url(#areaGrad)" />

          {/* Line path */}
          <path d={pathD} fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

          {/* Value dots */}
          {points.map((p: any, idx: number) => (
            <g key={idx}>
              <circle cx={p.x} cy={p.y} r="4.5" fill="#111827" stroke="#8b5cf6" strokeWidth="2" className="cursor-pointer hover:r-6 transition-all" />
              {/* Tooltip on top */}
              <text x={p.x} y={p.y - 10} textAnchor="middle" fill="#e2e8f0" fontSize="9" className="font-semibold opacity-80">
                {p.val}
              </text>
              {/* Date tag below */}
              <text x={p.x} y={height - 4} textAnchor="middle" fill="#64748b" fontSize="8" className="font-medium">
                {p.label}
              </text>
            </g>
          ))}
        </svg>
      </div>
    );
  };

  const cards = [
    { label: "Total Projects", val: stats?.total_projects || 0, icon: Folder, color: "text-accent-cyan bg-accent-cyan/10" },
    { label: "Extracted Ideas", val: stats?.total_ideas || 0, icon: Lightbulb, color: "text-yellow-400 bg-yellow-400/10" },
    { label: "Decisions Tracked", val: stats?.total_decisions || 0, icon: Gavel, color: "text-accent-purple bg-accent-purple/10" },
    { label: "Open Questions", val: stats?.total_open_questions || 0, icon: HelpCircle, color: "text-accent-rose bg-accent-rose/10" }
  ];

  return (
    <div className="flex-1 p-8 overflow-y-auto max-h-screen bg-[#070a10]">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          Workspace Overview
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Global workspace overview — all conversations, decisions, and insights.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {cards.map((c, i) => {
          const Icon = c.icon;
          return (
            <div key={i} className="glass-panel p-5 rounded-xl flex items-center justify-between hover:border-slate-700 transition duration-300">
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                  {c.label}
                </span>
                <span className="text-3xl font-bold text-white tracking-tight">
                  {c.val}
                </span>
              </div>
              <div className={`p-3 rounded-lg ${c.color}`}>
                <Icon size={20} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Knowledge growth chart */}
        <div className="glass-panel p-6 rounded-xl lg:col-span-2 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <TrendingUp size={16} className="text-primary-400" />
                Knowledge Base Growth
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Documents indexed over the last 7 days</p>
            </div>
            <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 border border-darkBorder px-2.5 py-1 rounded-full bg-slate-900/40">
              Active Logs
            </span>
          </div>

          <div className="flex-1 flex items-center justify-center">
            {renderGrowthChart()}
          </div>
        </div>

        {/* Activity feed */}
        <div className="glass-panel p-6 rounded-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-6">
              <Activity size={16} className="text-accent-purple" />
              <h3 className="text-sm font-bold text-white">Recent Activities</h3>
            </div>
            
            <div className="space-y-4">
              {stats?.recent_activity.map((act: string, idx: number) => (
                <div key={idx} className="flex gap-3 text-xs leading-relaxed">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-1.5 shrink-0 animate-pulse" />
                  <p className="text-slate-300 font-medium">{act}</p>
                </div>
              ))}
            </div>
          </div>

            <div className="mt-6 pt-4 border-t border-darkBorder">
              <button 
                onClick={() => setActiveView('import')}
                className="w-full flex items-center justify-center gap-2 text-xs font-semibold text-primary-400 hover:text-primary-300 py-2 border border-darkBorder hover:border-slate-700 rounded-lg transition"
              >
                Upload new logs <ArrowRight size={14} />
              </button>
            </div>
        </div>
      </div>
    </div>
  );
};
