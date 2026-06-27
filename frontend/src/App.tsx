import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { Home } from './components/Home';
import { Login } from './components/Login';
import { IntelligenceHub } from './components/IntelligenceHub';
import { ImportSystem } from './components/ImportSystem';
import { Categories } from './components/Categories';
import { TimelineView } from './components/TimelineView';
import { GraphView } from './components/GraphView';
import { AIAnalyst } from './components/AIAnalyst';
import { DecisionHub } from './components/DecisionHub';
import { PersonalProgress } from './components/PersonalProgress';
import { ChatDirectory } from './components/ChatDirectory';
import { PromptCoach } from './components/PromptCoach';
import { DevLab } from './components/DevLab';

const AppContent: React.FC = () => {
  const { isLoggedIn, activeView } = useApp();

  if (!isLoggedIn) return <Login />;

  const views: Record<string, React.ReactNode> = {
    home:       <Home />,
    hub:        <IntelligenceHub />,
    import:     <ImportSystem />,
    categories: <Categories />,
    timeline:   <TimelineView />,
    graph:      <GraphView />,
    analyst:    <AIAnalyst />,
    decisions:  <DecisionHub />,
    progress:   <PersonalProgress />,
    chats:      <ChatDirectory />,
    coach:      <PromptCoach />,
    devlab:     <DevLab />,
  };

  return (
    <div
      className="w-screen h-screen flex p-4 md:p-6 overflow-hidden"
      style={{ background: 'var(--bg-void)' }}
    >
      <Navbar />

      {/* Main panel */}
      <main
        className="flex-1 ml-4 md:ml-6 rounded-[2rem] relative overflow-hidden flex flex-col min-w-0"
        style={{
          background: 'var(--bg-base)',
          border: '1px solid var(--border)',
        }}
      >
        {/* Top command bar */}
        <header
          className="h-14 w-full flex items-center justify-between px-8 absolute top-0 z-20 backdrop-blur-md"
          style={{
            background: 'rgba(8,18,9,0.85)',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
            <span style={{ color: 'var(--accent)' }}>Chronicle</span>
            <span>/</span>
            <span>{activeView}</span>
          </div>
          <div className="terminal-text flex items-center gap-2" style={{ color: 'var(--accent)' }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--accent)' }} />
            SYSTEM ONLINE
            <span className="animate-[cursorBlink_1s_infinite]">█</span>
          </div>
        </header>

        {/* View canvas */}
        <div className="flex-1 mt-14 overflow-hidden relative z-10">
          {views[activeView] ?? <Home />}
        </div>
      </main>
    </div>
  );
};

const App: React.FC = () => (
  <AppProvider>
    <AppContent />
  </AppProvider>
);

export default App;
