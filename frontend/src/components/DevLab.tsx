import React, { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { Trash2, Code2, Lightbulb, Gavel, BarChart2, Filter, X, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Types ────────────────────────────────────────────────────────────────────

interface TechIdea {
  id: string;
  projectId: number;
  projectName: string;
  title: string;
  description: string;
  tags: string[];
  source: 'idea' | 'decision' | 'event';
  date: string;
}

// ─── Mock tech data extracted from chats ─────────────────────────────────────

const MOCK_TECH_IDEAS: TechIdea[] = [
  { id: 'ti1', projectId: 101, projectName: 'CampusVerse', title: 'Unity WebGL Portal', description: '3D virtual campus playable directly in browser using Unity WebGL compilation — no plugin required, runs on Chromebooks.', tags: ['Unity', 'WebGL', 'Browser'], source: 'idea', date: '2026-06-01' },
  { id: 'ti2', projectId: 101, projectName: 'CampusVerse', title: 'AI NPC Teachers', description: 'NPC teachers powered by local Ollama models answering curriculum questions in real-time inside the simulation.', tags: ['Ollama', 'LLM', 'AI'], source: 'idea', date: '2026-05-28' },
  { id: 'ti3', projectId: 101, projectName: 'CampusVerse', title: 'WebSocket Multiplayer Sync', description: 'Persistent WebSocket rooms for sub-50ms avatar position sync. HTTP polling caused excessive server load.', tags: ['WebSocket', 'Realtime', 'Multiplayer'], source: 'decision', date: '2026-06-05' },
  { id: 'ti4', projectId: 101, projectName: 'CampusVerse', title: 'Engine Pivot: Unreal → Unity', description: 'Unreal Engine 5 deprecated WebGL compilation. Migrated to Unity to keep browser deployment viable on school hardware.', tags: ['Unity', 'Unreal', 'Architecture'], source: 'decision', date: '2026-06-01' },
  { id: 'ti5', projectId: 102, projectName: 'Project Chronicle', title: 'SQLite Zero-Setup Default', description: 'SQLite as default dev database allows immediate preview without installing Postgres/Neo4j. Seamless migration path preserved.', tags: ['SQLite', 'Database', 'DevEx'], source: 'decision', date: '2026-06-08' },
  { id: 'ti6', projectId: 102, projectName: 'Project Chronicle', title: 'Vector + Graph Hybrid Index', description: 'ChromaDB for semantic vector search combined with Neo4j for relational graph traversal — dual-index strategy for knowledge retrieval.', tags: ['ChromaDB', 'Neo4j', 'Search'], source: 'idea', date: '2026-06-10' },
  { id: 'ti7', projectId: 102, projectName: 'Project Chronicle', title: 'FastAPI + SQLAlchemy ORM', description: 'FastAPI chosen over Django REST for async support and auto-generated OpenAPI docs. SQLAlchemy ORM for type-safe DB access.', tags: ['FastAPI', 'Python', 'ORM'], source: 'decision', date: '2026-06-08' },
  { id: 'ti8', projectId: 101, projectName: 'CampusVerse', title: 'Activity Token Economy', description: 'Cryptographic activity tokens for peer-to-peer tutoring rewards. Students earn tokens by helping others.', tags: ['Gamification', 'Economy', 'Crypto'], source: 'idea', date: '2026-05-20' },
  { id: 'ti9', projectId: 102, projectName: 'Project Chronicle', title: 'Browser Extension Bridge', description: 'Chrome MV3 extension with content scripts for ChatGPT, Claude, Gemini, DeepSeek. Auto-extracts chat DOM and syncs to backend.', tags: ['Chrome Extension', 'MV3', 'Scraping'], source: 'idea', date: '2026-06-12' },
  { id: 'ti10', projectId: 101, projectName: 'CampusVerse', title: 'Unity Addressables for Assets', description: 'Incremental asset loading via Unity Addressables to stay under 1GB browser heap limit. Avoids tab crashes on audio-heavy scenes.', tags: ['Unity', 'Performance', 'Memory'], source: 'event', date: '2026-06-07' },
  { id: 'ti11', projectId: 102, projectName: 'Project Chronicle', title: 'TF-IDF Semantic Fallback', description: 'Python-based TF-IDF vector search as offline fallback when ChromaDB is unavailable. Zero external dependencies.', tags: ['NLP', 'Search', 'Python'], source: 'idea', date: '2026-06-09' },
  { id: 'ti12', projectId: 101, projectName: 'CampusVerse', title: 'WebGL Canvas vs Pixel Streaming', description: 'Rejected GPU pixel streaming ($1.50/hr per user). Client-side WebGL compilation runs on local CPU — infrastructure cost zero.', tags: ['WebGL', 'Cost', 'Architecture'], source: 'decision', date: '2026-06-03' },
];

const CHART_DATA = [
  { week: 'W1', ideas: 4, decisions: 2, events: 1 },
  { week: 'W2', ideas: 6, decisions: 3, events: 2 },
  { week: 'W3', ideas: 3, decisions: 5, events: 3 },
  { week: 'W4', ideas: 8, decisions: 4, events: 1 },
  { week: 'W5', ideas: 5, decisions: 6, events: 4 },
  { week: 'W6', ideas: 9, decisions: 3, events: 2 },
];

const TECH_TAGS = ['All', 'Unity', 'WebGL', 'Python', 'AI', 'LLM', 'Database', 'Architecture', 'Realtime', 'Search'];

const SOURCE_COLORS: Record<string, string> = {
  idea:     'rgba(56,189,248,0.15)',
  decision: 'rgba(20,184,166,0.15)',
  event:    'rgba(251,191,36,0.15)',
};
const SOURCE_BORDER: Record<string, string> = {
  idea:     'rgba(56,189,248,0.4)',
  decision: 'rgba(20,184,166,0.4)',
  event:    'rgba(251,191,36,0.4)',
};
const SOURCE_TEXT: Record<string, string> = {
  idea:     '#38bdf8',
  decision: '#14b8a6',
  event:    '#fbbf24',
};
const SOURCE_ICON: Record<string, React.ElementType> = {
  idea:     Lightbulb,
  decision: Gavel,
  event:    BarChart2,
};

// ─── Mini bar chart ───────────────────────────────────────────────────────────

const ActivityChart: React.FC = () => {
  const maxVal = Math.max(...CHART_DATA.map(d => d.ideas + d.decisions + d.events));
  return (
    <div className="flex items-end gap-2 h-28 w-full">
      {CHART_DATA.map((d, i) => {
        const total = d.ideas + d.decisions + d.events;
        const heightPct = (total / maxVal) * 100;
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
            <div className="relative w-full flex flex-col-reverse rounded-md overflow-hidden" style={{ height: 90 }}>
              {/* stacked bars */}
              <div style={{ height: `${(d.ideas / total) * heightPct}%`, background: '#38bdf8', opacity: 0.8 }} />
              <div style={{ height: `${(d.decisions / total) * heightPct}%`, background: '#14b8a6', opacity: 0.8 }} />
              <div style={{ height: `${(d.events / total) * heightPct}%`, background: '#fbbf24', opacity: 0.8 }} />
              {/* tooltip */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background: 'rgba(7,14,26,0.85)', fontSize: 10, color: 'var(--text-primary)', borderRadius: 6 }}>
                {total}
              </div>
            </div>
            <span className="text-[9px] font-bold" style={{ color: 'var(--text-muted)' }}>{d.week}</span>
          </div>
        );
      })}
    </div>
  );
};

// ─── Delete confirmation toast ────────────────────────────────────────────────

const DeleteToast: React.FC<{ item: TechIdea; onConfirm: () => void; onCancel: () => void }> = ({ item, onConfirm, onCancel }) => (
  <motion.div
    initial={{ opacity: 0, y: 20, scale: 0.95 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, y: 20, scale: 0.95 }}
    className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 rounded-xl px-6 py-4 flex items-center gap-4 shadow-2xl"
    style={{ background: 'var(--bg-surface)', border: '1px solid rgba(239,68,68,0.3)', minWidth: 380 }}
  >
    <Trash2 size={16} style={{ color: '#f87171', flexShrink: 0 }} />
    <div className="flex-1 min-w-0">
      <p className="text-xs font-bold truncate" style={{ color: 'var(--text-primary)' }}>Remove "{item.title}"?</p>
      <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>This removes it from the Dev Lab view only.</p>
    </div>
    <button onClick={onCancel} className="px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors"
      style={{ border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
      Cancel
    </button>
    <button onClick={onConfirm} className="px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors"
      style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}>
      Remove
    </button>
  </motion.div>
);

// ─── Main component ───────────────────────────────────────────────────────────

export const DevLab: React.FC = () => {
  const [items, setItems] = useState<TechIdea[]>(MOCK_TECH_IDEAS);
  const [activeTag, setActiveTag] = useState('All');
  const [activeSource, setActiveSource] = useState<string>('all');
  const [pendingDelete, setPendingDelete] = useState<TechIdea | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkMode, setBulkMode] = useState(false);

  // Stats
  const ideaCount    = items.filter(i => i.source === 'idea').length;
  const decisionCount = items.filter(i => i.source === 'decision').length;
  const eventCount   = items.filter(i => i.source === 'event').length;
  const projectCount = new Set(items.map(i => i.projectId)).size;

  // Filtering
  const filtered = items.filter(item => {
    const tagMatch = activeTag === 'All' || item.tags.some(t => t.toLowerCase().includes(activeTag.toLowerCase()));
    const srcMatch = activeSource === 'all' || item.source === activeSource;
    return tagMatch && srcMatch;
  });

  const confirmDelete = (item: TechIdea) => setPendingDelete(item);

  const doDelete = () => {
    if (pendingDelete) {
      setItems(prev => prev.filter(i => i.id !== pendingDelete.id));
      setSelectedIds(prev => { const s = new Set(prev); s.delete(pendingDelete.id); return s; });
      setPendingDelete(null);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  };

  const bulkDelete = () => {
    setItems(prev => prev.filter(i => !selectedIds.has(i.id)));
    setSelectedIds(new Set());
    setBulkMode(false);
  };

  return (
    <div className="h-full w-full p-6 overflow-y-auto custom-scrollbar flex flex-col gap-6 animate-fade-in-up"
      style={{ color: 'var(--text-primary)' }}>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Code2 size={18} style={{ color: 'var(--accent)' }} />
            <span className="badge-accent">Dev Lab</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight">
            Developer <span style={{ color: 'var(--accent)' }}>Workspace</span>
          </h1>
          <p className="text-sm mt-1.5 max-w-lg" style={{ color: 'var(--text-muted)' }}>
            All tech projects, decisions, and ideas extracted from your AI conversations — filtered to what matters for developers.
          </p>
        </div>
        <button
          onClick={() => { setBulkMode(b => !b); setSelectedIds(new Set()); }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all"
          style={{
            background: bulkMode ? 'rgba(239,68,68,0.1)' : 'var(--bg-raised)',
            border: `1px solid ${bulkMode ? 'rgba(239,68,68,0.3)' : 'var(--border)'}`,
            color: bulkMode ? '#f87171' : 'var(--text-muted)',
          }}
        >
          <Trash2 size={13} />
          {bulkMode ? 'Cancel Selection' : 'Select to Delete'}
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Projects',  value: projectCount,  color: 'var(--accent)'  },
          { label: 'Ideas',     value: ideaCount,     color: '#38bdf8'        },
          { label: 'Decisions', value: decisionCount, color: 'var(--accent)'  },
          { label: 'Events',    value: eventCount,    color: '#fbbf24'        },
        ].map(({ label, value, color }) => (
          <div key={label} className="bento-card p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>{label}</p>
            <p className="text-2xl font-black terminal-text" style={{ color }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Chart + Legend */}
      <div className="bento-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold">Weekly Extraction Activity</h3>
            <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>Ideas, decisions & events pulled from chats over 6 weeks</p>
          </div>
          <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest">
            {[['Ideas','#38bdf8'],['Decisions','#14b8a6'],['Events','#fbbf24']].map(([l,c]) => (
              <span key={l} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-sm" style={{ background: c }} />
                <span style={{ color: 'var(--text-muted)' }}>{l}</span>
              </span>
            ))}
          </div>
        </div>
        <ActivityChart />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <Filter size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
        {/* Source filter */}
        {['all','idea','decision','event'].map(src => (
          <button key={src} onClick={() => setActiveSource(src)}
            className="px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all"
            style={{
              background: activeSource === src ? 'var(--accent-dim)' : 'var(--bg-raised)',
              border: `1px solid ${activeSource === src ? 'var(--accent)' : 'var(--border)'}`,
              color: activeSource === src ? 'var(--accent)' : 'var(--text-muted)',
            }}>
            {src === 'all' ? 'All Types' : src}
          </button>
        ))}
        <div className="w-px h-5 mx-1" style={{ background: 'var(--border)' }} />
        {/* Tag filter */}
        {TECH_TAGS.map(tag => (
          <button key={tag} onClick={() => setActiveTag(tag)}
            className="px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all"
            style={{
              background: activeTag === tag ? 'rgba(56,189,248,0.1)' : 'var(--bg-raised)',
              border: `1px solid ${activeTag === tag ? 'rgba(56,189,248,0.4)' : 'var(--border)'}`,
              color: activeTag === tag ? '#38bdf8' : 'var(--text-muted)',
            }}>
            {tag}
          </button>
        ))}
      </div>

      {/* Bulk delete bar */}
      <AnimatePresence>
        {bulkMode && selectedIds.size > 0 && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="flex items-center justify-between rounded-xl px-5 py-3"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}>
            <p className="text-sm font-bold" style={{ color: '#f87171' }}>{selectedIds.size} item{selectedIds.size > 1 ? 's' : ''} selected</p>
            <button onClick={bulkDelete}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold"
              style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}>
              <Trash2 size={13} /> Delete Selected
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 pb-8">
        <AnimatePresence mode="popLayout">
          {filtered.length === 0 ? (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="col-span-full bento-card p-12 text-center">
              <Code2 size={28} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
              <p className="text-sm font-bold" style={{ color: 'var(--text-muted)' }}>No items match your filters.</p>
            </motion.div>
          ) : filtered.map(item => {
            const Icon = SOURCE_ICON[item.source];
            const isSelected = selectedIds.has(item.id);
            return (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
                onClick={bulkMode ? () => toggleSelect(item.id) : undefined}
                className="bento-card p-5 flex flex-col gap-3 relative group"
                style={{
                  cursor: bulkMode ? 'pointer' : 'default',
                  borderColor: isSelected ? 'rgba(239,68,68,0.5)' : undefined,
                  background: isSelected ? 'rgba(239,68,68,0.05)' : undefined,
                }}
              >
                {/* Selection checkbox */}
                {bulkMode && (
                  <div className="absolute top-4 right-4 w-5 h-5 rounded-md border-2 flex items-center justify-center"
                    style={{ borderColor: isSelected ? '#f87171' : 'var(--border)', background: isSelected ? 'rgba(239,68,68,0.2)' : 'transparent' }}>
                    {isSelected && <X size={11} style={{ color: '#f87171' }} />}
                  </div>
                )}

                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg" style={{ background: SOURCE_COLORS[item.source], border: `1px solid ${SOURCE_BORDER[item.source]}` }}>
                      <Icon size={13} style={{ color: SOURCE_TEXT[item.source] }} />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: SOURCE_TEXT[item.source] }}>
                      {item.source}
                    </span>
                  </div>
                  {!bulkMode && (
                    <button
                      onClick={() => confirmDelete(item)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg"
                      style={{ color: '#f87171', background: 'rgba(239,68,68,0.1)' }}
                      title="Remove from Dev Lab"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>

                {/* Title + description */}
                <div>
                  <h3 className="text-sm font-bold leading-snug mb-1.5" style={{ color: 'var(--text-primary)' }}>
                    {item.title}
                  </h3>
                  <p className="text-[12px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                    {item.description}
                  </p>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 mt-auto pt-2" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                  {item.tags.map(tag => (
                    <span key={tag} className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                      style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                      #{tag}
                    </span>
                  ))}
                  <span className="ml-auto text-[10px]" style={{ color: 'var(--text-dim)' }}>{item.date}</span>
                </div>

                {/* Project badge */}
                <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-dim)' }}>
                  ↳ {item.projectName}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Delete confirmation toast */}
      <AnimatePresence>
        {pendingDelete && (
          <DeleteToast item={pendingDelete} onConfirm={doDelete} onCancel={() => setPendingDelete(null)} />
        )}
      </AnimatePresence>
    </div>
  );
};
