import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { RequestPanel } from './components/RequestPanel';
import { ResponsePanel } from './components/ResponsePanel';
import { EnvironmentManager } from './components/EnvironmentManager';
import { ConfigModal } from './components/ConfigModal';
import { ImportModal } from './components/ImportModal';
import { CollectionPanel } from './components/CollectionPanel';
import { ResizableSplit } from './components/ResizableSplit';
import { TitleBar } from './components/TitleBar';
import { Zap, Settings, Palette } from 'lucide-react';
import { useSettingsStore, useCollectionStore, useRequestStore } from './store';
import { useTranslation } from 'react-i18next';
import { Toaster } from 'sonner';
import clsx from 'clsx';
import './App.css';

const App: React.FC = () => {
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const { applyThemeToDom, themes, activeThemeId, language, setTheme } = useSettingsStore();
  const { viewMode } = useCollectionStore();
  const { isResponseDrawerOpen } = useRequestStore();
  const { t, i18n } = useTranslation();

  // Apply theme on mount and when theme/colors change
  useEffect(() => {
    console.log('Applying theme:', activeThemeId);
    applyThemeToDom();
  }, [activeThemeId, themes, applyThemeToDom]);

  // Sync language when it changes in the store
  useEffect(() => {
    if (language && i18n.language !== language) {
      console.log('Syncing language to:', language);
      i18n.changeLanguage(language);
    }
  }, [language, i18n]);

  // Main Content Component based on View Mode
  const MainContent = () => {
    if (viewMode === 'request') {
      return (
        <div className="flex flex-col h-full overflow-hidden relative">
          {/* Request Panel - Takes remaining space */}
          <div className="flex-1 overflow-hidden">
            <RequestPanel />
          </div>

          {/* Response Drawer - Fixed or Resizable bottom section */}
          <div
            className={clsx(
              "transition-all duration-300 ease-in-out flex-shrink-0 border-t border-slate-700 bg-background",
              isResponseDrawerOpen ? "h-[45%]" : "h-[32px]"
            )}
          >
            <ResponsePanel />
          </div>
        </div>
      );
    }
    return <CollectionPanel />;
  };

  return (
    <div className="flex flex-col h-screen text-slate-200 font-sans">
      <Toaster
        position="top-right"
        theme="dark"
        toastOptions={{
          style: {
            background: 'rgb(31 41 55)',
            border: '1px solid rgb(55 65 81)',
            color: 'rgb(226 232 240)',
          },
        }}
      />
      <ConfigModal isOpen={isConfigOpen} onClose={() => setIsConfigOpen(false)} />
      <ImportModal />

      {/* Custom Title Bar */}
      <TitleBar />

      {/* Header */}
      <header className="h-12 bg-background border-b border-slate-700 flex items-center px-4 justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="bg-primary p-1 rounded">
            <Zap size={16} className="text-white" fill="currentColor" />
          </div>
          <h1 className="font-bold text-lg tracking-tight">Getty</h1>
        </div>

        <div className="flex items-center gap-4">
          {/* Theme Switcher */}
          <div className="flex items-center gap-2 text-xs">
            <Palette size={14} className="text-slate-400" />
            <select
              value={activeThemeId}
              onChange={(e) => setTheme(e.target.value)}
              className="bg-surface border border-slate-700 rounded px-2 py-1 focus:outline-none focus:border-primary text-slate-200"
            >
              {themes.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          <div className="h-4 w-[1px] bg-slate-700"></div>

          <EnvironmentManager />

          <div className="h-4 w-[1px] bg-slate-700"></div>

          <button
            onClick={() => setIsConfigOpen(true)}
            className="text-slate-400 hover:text-white transition-colors"
            title={t('app.settings')}
          >
            <Settings size={18} />
          </button>
        </div>
      </header>

      {/* Main Layout */}
      <main className="flex-1 flex overflow-hidden">
        <ResizableSplit
          initialLeftWidth={260}
          minLeftWidth={200}
          maxLeftWidth={400}
          left={<Sidebar />}
          right={<MainContent />}
        />
      </main>
    </div>
  );
};

export default App;