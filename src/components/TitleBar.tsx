import React from 'react';
import { Minus, Square, X, Zap } from 'lucide-react';
import { getCurrentWindow } from '@tauri-apps/api/window';

export const TitleBar: React.FC = () => {
  const handleMinimize = async () => {
    const appWindow = getCurrentWindow();
    await appWindow.minimize();
  };

  const handleMaximize = async () => {
    const appWindow = getCurrentWindow();
    await appWindow.toggleMaximize();
  };

  const handleClose = async () => {
    const appWindow = getCurrentWindow();
    await appWindow.close();
  };

  return (
    <div
      data-tauri-drag-region
      className="h-8 bg-background border-b border-slate-800 flex items-center justify-between select-none shrink-0"
      style={{ userSelect: 'none', WebkitUserSelect: 'none', WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      {/* App Name */}
      <div data-tauri-drag-region className="flex items-center gap-2 px-3 flex-1" style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}>
        <div className="bg-primary p-0.5 rounded">
          <Zap size={12} className="text-white" fill="currentColor" />
        </div>
        <span className="text-xs font-semibold text-slate-300">Getty</span>
      </div>

      {/* Window Controls */}
      <div className="flex items-center h-full" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
        <button
          onClick={handleMinimize}
          className="h-full px-4 hover:bg-slate-800 transition-colors flex items-center justify-center"
          title="Minimizar"
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        >
          <Minus size={14} className="text-slate-400" />
        </button>
        <button
          onClick={handleMaximize}
          className="h-full px-4 hover:bg-slate-800 transition-colors flex items-center justify-center"
          title="Maximizar"
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        >
          <Square size={12} className="text-slate-400" />
        </button>
        <button
          onClick={handleClose}
          className="h-full px-4 hover:bg-red-600 transition-colors flex items-center justify-center"
          title="Cerrar"
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        >
          <X size={14} className="text-slate-400 hover:text-white" />
        </button>
      </div>
    </div>
  );
};
