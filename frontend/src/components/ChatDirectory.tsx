import React, { useEffect, useState } from 'react';
import { useApi } from '../hooks/useApi';
import { MessageSquare, Calendar, Search, Filter } from 'lucide-react';

interface Chat {
  id: string;
  title: string;
  preview: string;
  platform?: string;
  date: string;
}

export const ChatDirectory: React.FC = () => {
  const api = useApi();
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activePlatform, setActivePlatform] = useState<string>('All');

  useEffect(() => {
    const loadChats = async () => {
      try {
        const data = await api.getIndividualChats();
        setChats(data);
      } catch (err) {
        console.error("Failed to load chats", err);
      } finally {
        setLoading(false);
      }
    };
    loadChats();
  }, []);

  const platforms = ['All', ...Array.from(new Set(chats.map(c => c.platform || 'Unknown')))];

  const filtered = chats.filter(c => {
    const matchesSearch = c.title.toLowerCase().includes(search.toLowerCase()) || c.preview.toLowerCase().includes(search.toLowerCase());
    const matchesPlatform = activePlatform === 'All' || (c.platform || 'Unknown') === activePlatform;
    return matchesSearch && matchesPlatform;
  });

  return (
    <div className="flex-1 p-8 overflow-y-auto max-h-screen bg-[#060910]">
      <div className="pointer-events-none fixed top-0 left-1/2 -translate-x-1/2 w-[700px] h-[300px] bg-primary-600/8 rounded-full blur-[120px]" />

      <div className="mb-8 relative">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-blue-600/30 to-accent-purple/20 rounded-xl border border-blue-500/20">
              <MessageSquare size={22} className="text-blue-400" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-white">
                Raw Conversations
              </h1>
              <p className="text-slate-400 text-sm mt-0.5">
                Every single chat extracted from your batch files. ({chats.length} total)
              </p>
            </div>
          </div>
          
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search conversations..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-slate-800/50 border border-slate-700/50 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-primary-500/50 transition w-64"
            />
          </div>
        </div>
      </div>

      {/* Platform Tabs */}
      {!loading && platforms.length > 1 && (
        <div className="flex gap-2 mb-6 border-b border-slate-800 pb-2">
          <Filter size={16} className="text-slate-500 mt-2 mr-2" />
          {platforms.map(platform => (
            <button
              key={platform}
              onClick={() => setActivePlatform(platform)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                activePlatform === platform
                  ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/20'
                  : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700 hover:text-white'
              }`}
            >
              {platform}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="text-center text-slate-500 mt-20 animate-pulse">Loading all conversations...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(chat => (
            <div key={chat.id} className="glass-panel p-5 rounded-2xl hover:border-slate-600 transition-all cursor-default group relative overflow-hidden flex flex-col h-full">
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-white font-bold text-sm leading-tight group-hover:text-primary-300 transition-colors line-clamp-2 pr-4">{chat.title}</h3>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <div className="flex items-center gap-1 text-[10px] text-slate-500 bg-slate-800/50 px-2 py-1 rounded-md">
                    <Calendar size={10} />
                    {chat.date.split(' ')[0]}
                  </div>
                  {chat.platform && (
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                      chat.platform === 'ChatGPT' ? 'bg-emerald-500/20 text-emerald-400' :
                      chat.platform === 'DeepSeek' ? 'bg-blue-500/20 text-blue-400' :
                      'bg-slate-700 text-slate-300'
                    }`}>
                      {chat.platform}
                    </span>
                  )}
                </div>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed line-clamp-3 mb-2 flex-1">
                {chat.preview}
              </p>
              <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-blue-500/5 rounded-full blur-xl group-hover:bg-blue-500/10 transition-colors" />
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full text-center text-slate-500 mt-10">
              No conversations found for this filter.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
