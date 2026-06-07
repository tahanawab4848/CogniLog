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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async (text?: string) => {
    const q = (text || query).trim();
    if (!q || loading) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: q };
    setMessages(m => [...m, userMsg]);
    setQuery('');
    setLoading(true);
    setTimeout(scrollToBottom, 50);

    try {
      // Global ask — no project ID needed
      const res = await api.askGlobalAnalyst(q);
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: res.answer,
        sources: res.sources,
        decisions: res.key_decisions,
      };
      setMessages(m => [...m, botMsg]);
    } catch {
      setMessages(m => [...m, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'An error occurred. Please try again.',
      }]);
    } finally {
      setLoading(false);
      setTimeout(scrollToBottom, 100);
    }
  };

  const formatContent = (text: string) => {
    return text
      .replace(/^### (.+)$/gm, '<h3 class="text-sm font-bold text-white mt-4 mb-2">$1</h3>')
      .replace(/^## (.+)$/gm,  '<h2 class="text-base font-bold text-white mt-4 mb-2">$1</h2>')
      .replace(/\*\*(.+?)\*\*/g, '<strong class="text-white font-bold">$1</strong>')
      .replace(/\*(.+?)\*/g,     '<em class="text-slate-300 italic">$1</em>')
      .replace(/^[-•→] (.+)$/gm, '<div class="flex gap-2 my-1"><span class="text-primary-400 flex-shrink-0 mt-0.5">→</span><span>$1</span></div>')
      .replace(/\n/g,            '<br/>');
  };

  return (
    <div className="flex flex-col h-full bg-[#060910]">
      {/* Header */}
      <div className="px-8 py-5 border-b border-darkBorder bg-[#080b12]/80 backdrop-blur flex items-center gap-3 shrink-0">
        <div className="p-2 bg-gradient-to-br from-primary-600/20 to-accent-purple/20 rounded-xl border border-primary-500/20">
          <Brain size={18} className="text-primary-400" />
        </div>
        <div>
          <h1 className="text-base font-black text-white">AI Analyst</h1>
          <p className="text-xs text-slate-500">Queries across your entire conversation history</p>
        </div>
        <div className="ml-auto text-[10px] px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-md font-bold">
          GLOBAL CONTEXT
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
        {messages.map(msg => (
          <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary-600/30 to-accent-purple/20 flex items-center justify-center flex-shrink-0 mt-0.5 border border-primary-500/20">
                <Brain size={13} className="text-primary-400" />
              </div>
            )}
            <div className={`max-w-[75%] ${msg.role === 'user'
              ? 'bg-primary-600/20 border border-primary-500/25 text-slate-200'
              : 'glass-panel text-slate-300'
            } px-4 py-3.5 rounded-2xl text-sm leading-relaxed`}>
              <div
                className="prose prose-invert prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: formatContent(msg.content) }}
              />
              {/* Sources */}
              {msg.sources && msg.sources.length > 0 && (
                <div className="mt-3 pt-3 border-t border-darkBorder">
                  <div className="text-[10px] font-bold uppercase text-slate-600 mb-1.5 flex items-center gap-1">
                    <BookOpen size={9}/> Sources
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {msg.sources.map((s, i) => (
                      <span key={i} className="text-[10px] px-2 py-0.5 bg-slate-800 text-slate-400 rounded-md border border-darkBorder">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {/* Decisions */}
              {msg.decisions && msg.decisions.length > 0 && (
                <div className="mt-3 pt-3 border-t border-darkBorder">
                  <div className="text-[10px] font-bold uppercase text-slate-600 mb-1.5 flex items-center gap-1">
                    <Gavel size={9}/> Related Decisions
                  </div>
                  {msg.decisions.map((d, i) => (
                    <div key={i} className="text-[11px] text-slate-400 flex gap-1.5 mt-1">
                      <GitCommit size={10} className="text-accent-purple mt-0.5 flex-shrink-0"/>
                      {d}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-3 justify-start">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary-600/30 to-accent-purple/20 flex items-center justify-center flex-shrink-0 border border-primary-500/20">
              <Brain size={13} className="text-primary-400 animate-pulse" />
            </div>
            <div className="glass-panel px-4 py-3 rounded-2xl flex items-center gap-2">
              <div className="flex gap-1">
                {[0,1,2].map(i => (
                  <div key={i} className="w-1.5 h-1.5 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: `${i*120}ms` }} />
                ))}
              </div>
              <span className="text-xs text-slate-500">Analysing your full history…</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestions */}
      {messages.length <= 1 && (
        <div className="px-6 pb-3">
          <p className="text-[10px] text-slate-600 mb-2 uppercase font-bold tracking-wide">Suggested questions</p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((s, i) => (
              <button
                key={i}
                onClick={() => handleSend(s)}
                className="text-[11px] px-3 py-1.5 rounded-lg border border-slate-700 text-slate-400 hover:text-white hover:border-primary-500/50 transition"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-darkBorder bg-[#080b12]/60 shrink-0">
        <form onSubmit={e => { e.preventDefault(); handleSend(); }} className="relative">
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Ask anything about all your AI conversations…"
            className="w-full pl-4 pr-14 py-3.5 rounded-xl text-sm glass-input text-slate-200 placeholder-slate-600"
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-2 bg-gradient-to-r from-primary-600 to-accent-purple text-white rounded-lg transition disabled:opacity-40"
          >
            <Send size={14} />
          </button>
        </form>
      </div>
    </div>
  );
};
