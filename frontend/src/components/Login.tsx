import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { KeyRound, Mail, User, ShieldAlert, ArrowRight, Brain, Trophy } from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';

export const Login: React.FC = () => {
  const { login, register, isBackendConnected } = useApp();
  const [isSignUp, setIsSignUp] = useState<boolean>(false);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [fullName, setFullName] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const { scrollYProgress } = useScroll();
  const y1 = useTransform(scrollYProgress, [0, 1], [0, -200]);
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (isSignUp) await register(email, password, fullName);
      else await login(email, password);
    } catch (err: any) {
      setError(err.message || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-screen min-h-screen overflow-x-hidden" style={{ background: 'var(--bg-void)', color: 'var(--text-primary)' }}>

      {/* Ambient green orbs */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <motion.div
          animate={{ x: [0, 80, 0], y: [0, -40, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          className="absolute -top-[20%] -left-[10%] w-[50vw] h-[50vw] rounded-full blur-[150px]"
          style={{ background: 'rgba(16,185,129,0.12)' }}
        />
        <motion.div
          animate={{ x: [0, -80, 0], y: [0, 80, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
          className="absolute top-[20%] -right-[10%] w-[60vw] h-[60vw] rounded-full blur-[150px]"
          style={{ background: 'rgba(45,212,191,0.07)' }}
        />
        <motion.div
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -bottom-[20%] left-[20%] w-[70vw] h-[70vw] rounded-full blur-[150px]"
          style={{ background: 'rgba(16,185,129,0.05)' }}
        />
      </div>

      <div className="relative z-10">

        {/* Header */}
        <header className="flex justify-between items-center p-8 md:px-16">
          <div className="text-xl font-black tracking-tighter" style={{ color: 'var(--accent)' }}>Chronicle.</div>
          <button
            onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}
            className="px-6 py-2 rounded-full font-bold text-xs uppercase tracking-widest transition"
            style={{ background: 'var(--accent)', color: 'var(--bg-void)' }}
          >
            Access Platform
          </button>
        </header>

        {/* Hero */}
        <section className="h-[90vh] flex flex-col justify-center px-8 md:px-16 max-w-7xl mx-auto relative">
          <motion.div style={{ y: y1, opacity }} className="max-w-4xl">
            <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.9] mb-8">
              Your AI <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#10b981] to-[#2dd4bf]">
                Knowledge Graph.
              </span>
            </h1>
            <p className="text-xl md:text-2xl font-light max-w-2xl leading-relaxed mb-12" style={{ color: 'var(--text-muted)' }}>
              Chronicle automatically parses your fragmented AI conversations and weaves them into an interactive, evolving intelligence network.
            </p>
            <button
              onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}
              className="px-8 py-4 rounded-full font-bold text-sm flex items-center gap-2 transition-all"
              style={{ background: 'var(--accent)', color: 'var(--bg-void)' }}
            >
              Get Started <ArrowRight size={16} />
            </button>
          </motion.div>
        </section>

        {/* Feature Sections */}
        <section className="py-32 px-8 md:px-16 max-w-7xl mx-auto space-y-48">

          <motion.div
            initial={{ opacity: 0, y: 100 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }} transition={{ duration: 0.8 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center"
          >
            <div>
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-8"
                style={{ background: 'var(--accent-dim)', border: '1px solid var(--border)' }}>
                <Brain style={{ color: 'var(--accent)' }} size={32} />
              </div>
              <h2 className="text-4xl font-black tracking-tighter mb-4">Automated Insight Extraction</h2>
              <p className="text-lg font-light leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                Connect your ChatGPT, Claude, or DeepSeek histories. Chronicle reads between the lines, automatically extracting core decisions, project ideas, and open questions without any manual tagging.
              </p>
            </div>
            <div className="h-96 rounded-[3rem] flex items-center justify-center relative overflow-hidden"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
              <h3 className="text-3xl font-black" style={{ color: 'var(--accent)' }}>Data Ingestion Active</h3>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 100 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }} transition={{ duration: 0.8 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center"
          >
            <div className="order-2 md:order-1 h-96 rounded-[3rem] flex items-center justify-center relative overflow-hidden"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
              <div className="text-center">
                <div className="text-6xl font-black mb-2" style={{ color: 'var(--accent)' }}>42/100</div>
                <div className="text-xs uppercase tracking-widest font-bold" style={{ color: 'var(--text-muted)' }}>Prompt Mastery Score</div>
              </div>
            </div>
            <div className="order-1 md:order-2">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-8"
                style={{ background: 'var(--accent-dim)', border: '1px solid var(--border)' }}>
                <Trophy style={{ color: 'var(--accent)' }} size={32} />
              </div>
              <h2 className="text-4xl font-black tracking-tighter mb-4">Prompt Coach Diagnostics</h2>
              <p className="text-lg font-light leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                Stop writing vague prompts. Chronicle analyzes your interaction history to critique your engineering style, offering side-by-side case studies and daily practice scenarios.
              </p>
            </div>
          </motion.div>

        </section>

        {/* Login Form */}
        <section className="min-h-screen flex items-center justify-center px-4 py-32 relative">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="w-full max-w-md p-10 rounded-[2.5rem]"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
          >
            <div className="text-center mb-10">
              <h1 className="text-3xl font-black tracking-tighter">Initialize System</h1>
              <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>Authenticate to access your intelligence core.</p>
            </div>

            {isBackendConnected === false && (
              <div className="mb-8 p-4 rounded-2xl text-xs flex items-start gap-3"
                style={{ border: '1px solid rgba(251,191,36,0.3)', background: 'rgba(251,191,36,0.08)', color: '#fbbf24' }}>
                <ShieldAlert size={18} className="shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold tracking-wide uppercase">Backend Offline</p>
                  <p className="mt-1 opacity-80 leading-relaxed font-mono">Running in local Mock Mode. Credentials will grant instant sandbox access.</p>
                </div>
              </div>
            )}

            {error && (
              <div className="mb-6 p-3 rounded-lg text-sm font-semibold text-center"
                style={{ border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.08)', color: '#f87171' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {isSignUp && (
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>Full Name</label>
                  <div className="relative">
                    <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                    <input type="text" required value={fullName} onChange={e => setFullName(e.target.value)}
                      className="glass-input w-full pl-12 pr-4 py-3.5 text-sm" placeholder="John Doe" />
                  </div>
                </div>
              )}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>Email Address</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                  <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                    className="glass-input w-full pl-12 pr-4 py-3.5 text-sm" placeholder="you@example.com" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>Password</label>
                <div className="relative">
                  <KeyRound size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                  <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
                    className="glass-input w-full pl-12 pr-4 py-3.5 text-sm" placeholder="••••••••" />
                </div>
              </div>
              <button type="submit" disabled={loading}
                className="w-full py-4 rounded-xl text-xs uppercase tracking-widest font-bold transition-all duration-300 active:scale-[0.98] disabled:opacity-50 mt-4"
                style={{ background: 'var(--accent)', color: 'var(--bg-void)' }}>
                {loading ? 'Processing...' : isSignUp ? 'Initialize Core' : 'Enter Network'}
              </button>
            </form>

            <div className="mt-8 text-center text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
              {isSignUp ? 'Existing Operative?' : 'New to the Network?'}{' '}
              <button onClick={() => { setIsSignUp(!isSignUp); setError(null); }}
                className="font-bold uppercase tracking-widest transition-colors"
                style={{ color: 'var(--accent)' }}>
                {isSignUp ? 'Sign In' : 'Sign Up'}
              </button>
            </div>
          </motion.div>
        </section>

      </div>
    </div>
  );
};
