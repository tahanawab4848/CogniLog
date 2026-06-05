import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useApi } from '../hooks/useApi';
import { Tag, Search, ChevronRight, MessageSquare, Gavel, Lightbulb } from 'lucide-react';

export const Categories: React.FC = () => {
  const { categories } = useApp();
  const api = useApi();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<any | null>(null);
  const [details, setDetails] = useState<any | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const filtered = categories.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const openCategory = async (cat: any) => {
    setSelected(cat);
    setLoadingDetails(true);
    try {
      const d = await api.getCategoryDetails(cat.id);
      setDetails(d);
    } catch { setDetails(null); }
    setLoadingDetails(false);
  };

  return (
    <div className="flex-1 flex h-full overflow-hidden">

      {/* Left — category list */}
      <div className="w-72 border-r border-darkBorder flex flex-col bg-[#080b12]">
        <div className="p-5 border-b border-darkBorder">
          <h1 className="text-base font-black text-white mb-3 flex items-center gap-2">
            <Tag size={16} className="text-accent-purple" /> Categories
          </h1>
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search topics…"
              className="w-full pl-8 pr-3 py-2 rounded-lg text-xs glass-input text-slate-300"
            />
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {filtered.map(cat => (
            <button
              key={cat.id}
              onClick={() => openCategory(cat)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-150 ${
                selected?.id === cat.id
                  ? 'bg-primary-600/20 border border-primary-500/25 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
              }`}
            >
              <span className="text-lg flex-shrink-0">{cat.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold truncate">{cat.name}</div>
                <div className="text-[10px] text-slate-600 mt-0.5">{cat.count} conversations</div>
              </div>
              <ChevronRight size={12} className="text-slate-600 flex-shrink-0" />
            </button>
          ))}
        </div>
      </div>

      {/* Right — category detail */}
      <div className="flex-1 overflow-y-auto p-8 bg-[#060910]">
        {!selected && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-4xl mb-4">🗂️</div>
              <p className="text-slate-500 text-sm">Select a category to explore its conversations and insights</p>
            </div>
          </div>
        )}

        {selected && (
          <>
            {/* Category header */}
            <div className="mb-8">
              <div className="flex items-center gap-4 mb-3">
                <span className="text-4xl">{selected.icon}</span>
                <div>
                  <h2 className="text-2xl font-black text-white">{selected.name}</h2>
                  <p className="text-slate-400 text-sm mt-1">{selected.description}</p>
                </div>
              </div>
              <div className="flex gap-4 mt-4">
                {[
                  { icon: <MessageSquare size={13}/>, label: `${selected.count} conversations` },
                  { icon: <Gavel size={13}/>,         label: `${selected.decisions ?? 0} decisions` },
                  { icon: <Lightbulb size={13}/>,     label: `${selected.insights ?? 0} insights` },
                ].map((item, i) => (
                  <span key={i} className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-800/50 px-3 py-1.5 rounded-lg border border-darkBorder">
                    {item.icon} {item.label}
                  </span>
                ))}
              </div>
            </div>

            {loadingDetails && (
              <div className="flex items-center gap-2 text-slate-500 text-sm">
                <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"/>
                Loading insights…
              </div>
            )}

            {details && !loadingDetails && (
              <div className="space-y-6">

                {/* Key insights */}
                {details.insights?.length > 0 && (
                  <div className="glass-panel p-6 rounded-xl">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-2">
                      <Lightbulb size={12} className="text-amber-400"/> Key Insights
                    </h3>
                    <div className="space-y-3">
                      {details.insights.map((insight: string, i: number) => (
                        <div key={i} className="flex gap-3 text-sm">
                          <span className="text-primary-500 font-bold mt-0.5 flex-shrink-0">→</span>
                          <p className="text-slate-300 leading-relaxed">{insight}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Decisions */}
                {details.decisions?.length > 0 && (
                  <div className="glass-panel p-6 rounded-xl">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-2">
                      <Gavel size={12} className="text-accent-purple"/> Decisions Made
                    </h3>
                    <div className="space-y-3">
                      {details.decisions.map((d: any, i: number) => (
                        <div key={i} className="bg-slate-900/40 p-4 rounded-lg border border-darkBorder">
                          <div className="text-xs font-bold text-white mb-1">{d.title}</div>
                          <p className="text-[11px] text-slate-400 leading-relaxed">{d.reason}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Conversations */}
                {details.conversations?.length > 0 && (
                  <div className="glass-panel p-6 rounded-xl">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-2">
                      <MessageSquare size={12} className="text-blue-400"/> Conversations
                    </h3>
                    <div className="space-y-2">
                      {details.conversations.map((c: any, i: number) => (
                        <div key={i} className="flex items-center justify-between px-4 py-3 rounded-lg bg-slate-900/30 border border-darkBorder text-xs">
                          <span className="text-slate-300 font-medium">{c.title}</span>
                          <span className="text-slate-600">{c.date}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
