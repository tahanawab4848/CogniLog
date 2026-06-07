import React, { useState } from 'react';
import { useApi } from '../hooks/useApi';
import { 
  Bot, 
  Send, 
  GitCommit, 
  Gavel,
  BookOpen
} from 'lucide-react';

export const AIHistorian: React.FC = () => {
  const api = useApi();
  const [query, setQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [history, setHistory] = useState<any[]>([]);

  // Simple, robust inline markdown formatter to preserve styling without importing heavy md parsers
  const formatText = (text: string) => {
    return text.split('\n').map((line, idx) => {
      let trimmed = line.trim();
      
      // Header H3
      if (trimmed.startsWith('###')) {
        return <h3 key={idx} className="text-sm font-bold text-white mt-4 mb-2 first:mt-0">{trimmed.replace('###', '').trim()}</h3>;
      }
      // Header H4
      if (trimmed.startsWith('####')) {
        return <h4 key={idx} className="text-xs font-bold text-primary-400 mt-3 mb-1.5">{trimmed.replace('####', '').trim()}</h4>;
      }
      // Bullet list
      if (trimmed.startsWith('*')) {
        const content = trimmed.substring(1).trim();
        // Parse bold highlights inside bullet
        return (
          <li key={idx} className="text-xs text-slate-300 ml-4 list-disc mb-1 leading-relaxed">
            {parseBoldText(content)}
          </li>
        );
      }
      // General paragraph
      return trimmed ? <p key={idx} className="text-xs text-slate-300 leading-relaxed mb-2.5">{parseBoldText(trimmed)}</p> : <div key={idx} className="h-2" />;
    });
  };

  const parseBoldText = (text: string) => {
    const parts = text.split('**');
    return parts.map((part, index) => {
      if (index % 2 === 1) {
        return <strong key={index} className="text-white font-semibold">{part}</strong>;
      }
      return part;
    });
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    const userMsg = query;
    setQuery('');
    setLoading(true);

    // Append user question
    setHistory(prev => [...prev, { role: 'user', content: userMsg }]);

    try {
      const res = await api.askHistorian(0, userMsg);
      setHistory(prev => [...prev, { 
        role: 'assistant', 
        content: res.answer,
        sources: res.sources,
        timeline: res.timeline_suggested,
        decisions: res.key_decisions
      }]);
    } catch (e) {
      console.error(e);
      setHistory(prev => [...prev, { 
        role: 'assistant', 
        content: "I encountered an error querying the vector engine. Please verify the backend connection status." 
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 h-screen flex flex-col bg-darkBg overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-darkBorder bg-[#080b11]/80 backdrop-blur-md shrink-0">
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          AI Historian Console
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Ask questions across your entire AI conversation history.
        </p>
      </div>

      {/* Chat History Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-4xl w-full mx-auto">
        {history.length === 0 ? (
          <div className="h-full flex items-center justify-center text-center p-8">
            <div className="glass-panel p-8 rounded-2xl max-w-md space-y-4">
              <div className="w-12 h-12 rounded-full bg-primary-600/10 border border-primary-500/20 text-primary-400 flex items-center justify-center mx-auto animate-pulse">
                <Bot size={24} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Ask the Chronicle Historian</h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  "How did this project start?" or "Why did we decide to change engines?" to synthesize insights from all uploaded transcripts.
                </p>
              </div>
              <div className="pt-2 flex flex-wrap gap-2 justify-center">
                <button 
                  onClick={() => setQuery("How did this project evolve?")}
                  className="px-3 py-1.5 bg-slate-900 border border-darkBorder hover:border-slate-700 text-[10px] text-slate-300 rounded-md transition"
                >
                  "How did this project evolve?"
                </button>
                <button 
                  onClick={() => setQuery("What major architectural decisions were made?")}
                  className="px-3 py-1.5 bg-slate-900 border border-darkBorder hover:border-slate-700 text-[10px] text-slate-300 rounded-md transition"
                >
                  "What decisions were made?"
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {history.map((msg, idx) => (
              <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role !== 'user' && (
                  <div className="w-8 h-8 rounded-full bg-primary-600/10 border border-primary-500/20 text-primary-400 flex items-center justify-center shrink-0">
                    <Bot size={16} />
                  </div>
                )}
                
                <div className={`max-w-2xl rounded-xl p-5 border ${
                  msg.role === 'user'
                    ? 'bg-primary-600/10 border-primary-500/30 text-slate-200'
                    : 'glass-panel text-slate-300'
                }`}>
                  {msg.role === 'user' ? (
                    <p className="text-xs leading-relaxed font-semibold">{msg.content}</p>
                  ) : (
                    <div className="space-y-4">
                      <div className="leading-relaxed">{formatText(msg.content)}</div>

                      {/* Cited Sources & Suggestions */}
                      {(msg.sources || msg.timeline || msg.decisions) && (
                        <div className="border-t border-darkBorder/60 pt-4 mt-4 space-y-3">
                          {msg.sources && msg.sources.length > 0 && (
                            <div className="flex flex-wrap gap-2 items-center">
                              <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold flex items-center gap-1">
                                <BookOpen size={10} /> Ingestion Sources:
                              </span>
                              {msg.sources.map((s: string, i: number) => (
                                <span key={i} className="bg-slate-900 text-slate-400 text-[9px] px-2 py-0.5 rounded border border-darkBorder">
                                  {s}
                                </span>
                              ))}
                            </div>
                          )}

                          {msg.decisions && msg.decisions.length > 0 && (
                            <div className="flex flex-wrap gap-2 items-center">
                              <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold flex items-center gap-1">
                                <Gavel size={10} /> Linked Decisions:
                              </span>
                              {msg.decisions.map((d: string, i: number) => (
                                <span key={i} className="bg-accent-purple/10 text-accent-purple text-[9px] px-2 py-0.5 rounded border border-accent-purple/20 font-semibold">
                                  {d}
                                </span>
                              ))}
                            </div>
                          )}

                          {msg.timeline && msg.timeline.length > 0 && (
                            <div className="flex flex-wrap gap-2 items-center">
                              <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold flex items-center gap-1">
                                <GitCommit size={10} /> timeline Nodes:
                              </span>
                              {msg.timeline.map((t: string, i: number) => (
                                <span key={i} className="bg-primary-500/10 text-primary-400 text-[9px] px-2 py-0.5 rounded border border-primary-500/20 font-semibold">
                                  {t}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-4 justify-start">
                <div className="w-8 h-8 rounded-full bg-primary-600/10 border border-primary-500/20 text-primary-400 flex items-center justify-center shrink-0 animate-bounce">
                  <Bot size={16} />
                </div>
                <div className="glass-panel rounded-xl p-4 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-bounce [animation-delay:-0.3s]" />
                  <div className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-bounce [animation-delay:-0.15s]" />
                  <div className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-bounce" />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Input Form overlay */}
      <div className="p-6 border-t border-darkBorder bg-[#080b11] shrink-0">
        <form onSubmit={handleSend} className="max-w-4xl w-full mx-auto relative">
          <input
            type="text"
            required
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={loading ? 'Analysing history…' : 'Ask about decisions, evolution, or any topic…'}
            disabled={loading}
            className="w-full pl-4 pr-12 py-3 rounded-lg text-xs glass-input text-slate-200 focus:border-primary-500/50 resize-none disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-2 bg-gradient-to-r from-primary-600 to-accent-purple hover:from-primary-500 hover:to-accent-purple text-white rounded-lg transition disabled:opacity-50"
          >
            <Send size={14} />
          </button>
        </form>
      </div>
    </div>
  );
};
