import React, { useState } from 'react';
import { useApi } from '../hooks/useApi';
import { Brain, Send, BookOpen, Gavel, GitCommit } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: string[];
  decisions?: string[];
}

const SUGGESTIONS = [
  'What are the most common topics across all my conversations?',
  'What major decisions have I made and why?',
  'What questions do I keep asking but never resolve?',
  'How has my thinking evolved over time?',
  'What are the most important insights from my AI chats?',
  'Which topics have I spent the most time on?',
];

export const AIAnalyst: React.FC = () => {
  const api = useApi();
  const [messages, setMessages] = useState<Message[]>([{
    id: '0',
    role: 'assistant',
    content: `## Welcome to AI Analyst 🧠\n\nI have access to your **entire conversation history** — across all topics, categories, and time periods. Ask me anything:\n\n- *"What have I been working on this month?"*\n- *"Summarize all my decisions about technology choices"*\n- *"What problems have I been unable to solve?"*\n- *"How has my approach to [topic] changed over time?"*`,
  }]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

  const handleSend = async (text?: string) => {
    const q = (text || query).trim();
    if (!q || loading) return;
    setMessages(m => [...m, { id: Date.now().toString(), role: 'user', content: q }]);
    setQuery('');
    setLoading(true);
    setTimeout(scrollToBottom, 50);
    try {
      const res = await api.askGlobalAnalyst(q);
      setMessages(m => [...m, { id: (Date.now() + 1).toString(), role: 'assistant', content: res.answer, sources: res.sources, decisions: res.key_decisions }]);
    } catch {
      setMessages(m => [...m, { id: (Date.now() + 1).toString(), role: 'assistant', content: 'An error occurred. Please try again.' }]);
    } finally {
      setLoading(false);
      setTimeout(scrollToBottom, 100);
    }
  };

  const formatContent = (text: string) => text
    .replace(/^### (.+)$/gm, '<h3 style="color:var(--text-primary);font-weight:bold;margin:1rem 0 0.5rem;">$1</h3>')
    .replace(/^## (.+)$/gm,  '<h2 style="color:var(--text-primary);font-weight:bold;margin:1rem 0 0.5rem;">$1</h2>')
    .replace(/\*\*(.+?)\*\*/g, '<strong style="color:var(--text-primary)">$1</strong>')
    .replace(/\*(.+?)\*/g,     '<em style="color:var(--text-muted)">$1</em>')
    .replace(/^[-•→] (.+)$/gm, `<div style="display:flex;gap:0.5rem;margin:0.25rem 0"><span style="color:var(--accent);flex-shrink:0;margin-top:2px">→</span><span>$1</span></div>`)
    .replace(/\n/g, '<br/>');

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--bg-base)' }}>

      {/* Header */}
      <div className="px-8 py-5 flex items-center gap-3 shrink-0 backdrop-blur"
        style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
        <div className="p-2 rounded-xl" style={{ background: 'var(--accent-dim)', border: '1px solid var(--border)' }}>
          <Brain size={18} style={{ color: 'var(--accent)' }} />
        </div>
        <div>
          <h1 className="text-base font-black">AI Analyst</h1>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Queries across your entire conversation history</p>
        </div>
        <div className="ml-auto badge-accent">GLOBAL CONTEXT</div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5 custom-scrollbar">
        {messages.map(msg => (
          <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ background: 'var(--accent-dim)', border: '1px solid var(--border)' }}>
                <Brain size={13} style={{ color: 'var(--accent)' }} />
              </div>
            )}
            <div className="max-w-[75%] px-4 py-3.5 rounded-2xl text-sm leading-relaxed"
              style={msg.role === 'user'
                ? { background: 'var(--accent-dim)', border: '1px solid var(--border)', color: 'var(--text-primary)' }
                : { background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }
              }>
              <div className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: formatContent(msg.content) }} />
              {msg.sources && msg.sources.length > 0 && (
                <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                  <div className="text-[10px] font-bold uppercase mb-1.5 flex items-center gap-1" style={{ color: 'var(--text-dim)' }}>
                    <BookOpen size={9}/> Sources
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {msg.sources.map((s, i) => (
                      <span key={i} className="text-[10px] px-2 py-0.5 rounded-md"
                        style={{ background: 'var(--bg-raised)', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)' }}>
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {msg.decisions && msg.decisions.length > 0 && (
                <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                  <div className="text-[10px] font-bold uppercase mb-1.5 flex items-center gap-1" style={{ color: 'var(--text-dim)' }}>
                    <Gavel size={9}/> Related Decisions
                  </div>
                  {msg.decisions.map((d, i) => (
                    <div key={i} className="text-[11px] flex gap-1.5 mt-1" style={{ color: 'var(--text-muted)' }}>
                      <GitCommit size={10} className="mt-0.5 flex-shrink-0" style={{ color: 'var(--accent-2)' }}/> {d}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-3 justify-start">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: 'var(--accent-dim)', border: '1px solid var(--border)' }}>
              <Brain size={13} className="animate-pulse" style={{ color: 'var(--accent)' }} />
            </div>
            <div className="px-4 py-3 rounded-2xl flex items-center gap-2"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
              <div className="flex gap-1">
                {[0,1,2].map(i => (
                  <div key={i} className="w-1.5 h-1.5 rounded-full animate-bounce"
                    style={{ background: 'var(--accent)', animationDelay: `${i*120}ms` }} />
                ))}
              </div>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Analysing your full history…</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestions */}
      {messages.length <= 1 && (
        <div className="px-6 pb-3">
          <p className="text-[10px] mb-2 uppercase font-bold tracking-wide" style={{ color: 'var(--text-dim)' }}>Suggested questions</p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((s, i) => (
              <button key={i} onClick={() => handleSend(s)}
                className="text-[11px] px-3 py-1.5 rounded-lg transition"
                style={{ border: '1px solid var(--border)', color: 'var(--text-muted)' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'; }}>
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 shrink-0" style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
        <form onSubmit={e => { e.preventDefault(); handleSend(); }} className="relative">
          <input type="text" value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Ask anything about all your AI conversations…"
            className="glass-input w-full pl-4 pr-14 py-3.5 text-sm" />
          <button type="submit" disabled={loading || !query.trim()}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-2 rounded-lg transition disabled:opacity-40"
            style={{ background: 'var(--accent)', color: 'var(--bg-void)' }}>
            <Send size={14} />
          </button>
        </form>
      </div>
    </div>
  );
};
