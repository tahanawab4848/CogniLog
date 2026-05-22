import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { Login } from './components/Login';
import { IntelligenceHub } from './components/IntelligenceHub';
import { ImportSystem } from './components/ImportSystem';
import { Categories } from './components/Categories';
import { TimelineView } from './components/TimelineView';
import { GraphView } from './components/GraphView';
import { AIAnalyst } from './components/AIAnalyst';
import { DecisionHub } from './components/DecisionHub';
import { PersonalProgress } from './components/PersonalProgress';

const AppContent: React.FC = () => {
  const { isLoggedIn, activeView } = useApp();

  if (!isLoggedIn) return <Login />;

  const views: Record<string, React.ReactNode> = {
    hub:        <IntelligenceHub />,
    import:     <ImportSystem />,
    categories: <Categories />,
    timeline:   <TimelineView />,
    graph:      <GraphView />,
    analyst:    <AIAnalyst />,
    decisions:  <DecisionHub />,
    progress:   <PersonalProgress />,
  };

  return (
    <div className="w-screen h-screen flex overflow-hidden bg-darkBg text-slate-200">
      <Navbar />
      <main className="flex-1 flex flex-col min-w-0 bg-[#070a10] relative overflow-y-auto">
        {views[activeView] ?? <IntelligenceHub />}
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
