import React, { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { 
  Gavel, 
  Search, 
  HelpCircle,
  Clock,
  BookOpen,
  CheckCircle,
  Archive
} from 'lucide-react';

export const DecisionHub: React.FC = () => {
  const api = useApi();
  const [decisions, setDecisions] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    const fetchDecisions = async () => {
      setLoading(true);
      try {
        const res = await api.getProjectDecisions(0);
        setDecisions(res);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchDecisions();
  }, []);

  if (loading) {
    return (
      <div className="flex-1 h-screen flex items-center justify-center bg-darkBg text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-primary-500 border-t-transparent animate-spin" />
          <span className="text-xs tracking-wider font-semibold">Extracting decision matrices...</span>
        </div>
      </div>
    );
  }

  // Filter lists
  const filteredDecisions = decisions.filter(d => {
    const matchSearch = d.title.toLowerCase().includes(search.toLowerCase()) || 
                        d.reason.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || d.status.toLowerCase() === statusFilter.toLowerCase();
    return matchSearch && matchStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <CheckCircle size={10} /> Active
          </span>
        );
      case 'superseded':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full bg-slate-800 border border-slate-700 text-slate-400">
            <Archive size={10} /> Superseded
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-400">
            <Clock size={10} /> Proposed
          </span>
        );
    }
  };

  return (
    <div className="flex-1 p-8 overflow-y-auto max-h-screen bg-[#070a10] relative">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-accent-purple/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Decision Intelligence Hub
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Track all historical pivots, technology decisions, and their justifications.
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <input 
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search decisions..."
              className="pl-9 pr-4 py-2 w-48 rounded-lg text-xs glass-input text-slate-300"
            />
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-lg text-xs glass-input text-slate-300 appearance-none cursor-pointer pr-8 bg-darkCard"
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="superseded">Superseded</option>
            <option value="proposed">Proposed</option>
          </select>
        </div>
      </div>

      {filteredDecisions.length === 0 ? (
        <div className="glass-panel p-12 rounded-xl text-center max-w-xl mx-auto mt-12">
          <Gavel className="text-slate-500 mx-auto mb-4" size={32} />
          <h3 className="text-base font-bold text-white mb-2">No Decisions Found</h3>
          <p className="text-slate-400 text-xs">
            No decisions match your active search filters or project extraction.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {filteredDecisions.map((dec) => (
            <div key={dec.id} className="glass-panel p-6 rounded-xl hover:border-slate-700 transition duration-300 flex flex-col justify-between relative group">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] text-slate-500 font-semibold flex items-center gap-1">
                    <Clock size={12} /> {dec.date || "Date Unknown"}
                  </span>
                  {getStatusBadge(dec.status)}
                </div>

                <h3 className="text-sm font-bold text-white mb-3 group-hover:text-primary-300 transition leading-snug">
                  {dec.title}
                </h3>

                <div className="space-y-3.5 mt-4">
                  <div className="bg-slate-950/35 p-3 rounded-lg border border-darkBorder">
                    <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider flex items-center gap-1">
                      <HelpCircle size={10} className="text-primary-400" /> Justification / Reason
                    </span>
                    <p className="text-xs text-slate-300 mt-1.5 leading-relaxed font-medium">
                      {dec.reason}
                    </p>
                  </div>

                  {dec.evidence && (
                    <div className="p-3 rounded-lg border border-dashed border-darkBorder">
                      <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider flex items-center gap-1">
                        <BookOpen size={10} className="text-accent-purple" /> Ingestion Evidence
                      </span>
                      <p className="text-[11px] text-slate-400 italic mt-1.5 leading-relaxed">
                        "{dec.evidence}"
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
