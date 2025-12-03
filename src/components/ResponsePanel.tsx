import React, { useState } from 'react';
import { useRequestStore, useCollectionStore, useEnvStore } from '../store';
import Editor from '@monaco-editor/react';
import clsx from 'clsx';
import { Globe, Clock, Database, AlertCircle, Copy, ChevronDown, ChevronUp, Layers } from 'lucide-react';

export const ResponsePanel: React.FC = () => {
  const { response, error, loading, isResponseDrawerOpen, setResponseDrawerOpen } = useRequestStore();
  const { activeCollectionId, collections } = useCollectionStore();
  const { environments, activeEnvId } = useEnvStore();
  const [view, setView] = useState<'json' | 'headers' | 'preview'>('json');

  // Get active environment name
  const getActiveEnvName = () => {
    if (activeCollectionId) {
      const col = collections.find(c => c.id === activeCollectionId);
      if (col && col.activeEnvironmentId) {
        const env = col.environments.find(e => e.id === col.activeEnvironmentId);
        if (env) return `${col.name} > ${env.name}`;
      }
    }
    const globalEnv = environments.find(e => e.id === activeEnvId);
    return globalEnv ? globalEnv.name : 'No Environment';
  };

  const handleCopy = () => {
    if (!response) return;
    const textToCopy = typeof response.body === 'object'
      ? JSON.stringify(response.body, null, 2)
      : String(response.body);

    navigator.clipboard.writeText(textToCopy);
    // You might want a toast notification here
    const btn = document.getElementById('copy-response-btn');
    if (btn) {
      const originalText = btn.innerHTML;
      btn.innerHTML = '<span class="text-green-400">Copied!</span>';
      setTimeout(() => btn.innerHTML = originalText, 1500);
    }
  };

  if (loading) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-surface border-t border-slate-700">
        <div className="flex flex-col items-center gap-2">
          <div className="animate-spin w-5 h-5 border-2 border-slate-700 border-t-primary rounded-full"></div>
          <p className="text-xs text-slate-400 animate-pulse">Sending...</p>
        </div>
      </div>
    );
  }

  // Minimized State (Bottom Bar)
  if (!isResponseDrawerOpen) {
    return (
      <div
        onClick={() => setResponseDrawerOpen(true)}
        className="h-full flex items-center justify-between px-4 bg-background border-t border-slate-700 cursor-pointer hover:bg-slate-800 transition-colors"
      >
        <div className="flex items-center gap-4 text-xs font-bold text-slate-400">
          <span className="uppercase">Response</span>
          {response ? (
            <span className={clsx(response.statusCode >= 200 && response.statusCode < 300 ? "text-green-400" : "text-red-400")}>
              {response.statusCode} {response.statusCode >= 200 && response.statusCode < 300 ? 'OK' : 'Error'}
            </span>
          ) : (
            <span>-</span>
          )}
          {response && <span>{response.time}ms</span>}
        </div>
        <ChevronUp size={16} className="text-slate-500" />
      </div>
    );
  }

  // Full Drawer State
  if (error) {
    return (
      <div className="h-full flex flex-col bg-surface border-t border-slate-700">
        <div className="p-2 border-b border-slate-700 flex justify-between items-center bg-background">
          <span className="text-danger font-bold text-sm flex items-center gap-2"><AlertCircle size={14} /> Error</span>
          <button onClick={() => setResponseDrawerOpen(false)}><ChevronDown size={16} className="text-slate-400 hover:text-white" /></button>
        </div>
        <div className="flex flex-col items-center justify-center h-full text-danger gap-4 p-8 text-center">
          <h3 className="text-lg font-bold">Request Failed</h3>
          <p className="text-slate-400 bg-background p-4 rounded border border-slate-700 text-sm font-mono">{error}</p>
        </div>
      </div>
    );
  }

  if (!response) {
    return (
      <div className="h-full flex flex-col bg-surface border-t border-slate-700">
        <div className="p-2 border-b border-slate-700 flex justify-between items-center bg-background">
          <span className="text-slate-500 font-bold text-xs uppercase">Response</span>
          <button onClick={() => setResponseDrawerOpen(false)}><ChevronDown size={16} className="text-slate-400 hover:text-white" /></button>
        </div>
        <div className="flex flex-col items-center justify-center h-full text-slate-600 gap-2">
          <Globe size={32} strokeWidth={1} />
          <p className="text-sm">No response yet.</p>
        </div>
      </div>
    );
  }

  const isSuccess = response.statusCode >= 200 && response.statusCode < 300;
  const sizeKB = (response.size / 1024).toFixed(2);

  return (
    <div className="flex flex-col h-full bg-surface border-t border-slate-700 shadow-xl">
      {/* Drawer Header / Status Bar */}
      <div className="p-2 px-4 border-b border-slate-700 flex justify-between items-center bg-background shrink-0">
        <div className="flex items-center gap-4">
          <span className={clsx("font-bold px-2 py-0.5 rounded text-xs", isSuccess ? "bg-green-900/50 text-green-400" : "bg-red-900/50 text-red-400")}>
            {response.statusCode} {isSuccess ? 'OK' : 'Error'}
          </span>
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <Clock size={12} /> {response.time}ms
          </span>
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <Database size={12} /> {sizeKB} KB
          </span>
          <div className="h-3 w-[1px] bg-slate-700"></div>
          <span className="text-xs text-primary flex items-center gap-1" title="Environment activo">
            <Layers size={12} /> {getActiveEnvName()}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            id="copy-response-btn"
            onClick={handleCopy}
            className="text-xs flex items-center gap-1 text-slate-400 hover:text-white transition-colors"
            title="Copy Response Body"
          >
            <Copy size={12} /> Copy
          </button>
          <div className="h-4 w-[1px] bg-slate-700"></div>
          <button onClick={() => setResponseDrawerOpen(false)} title="Close Drawer" className="text-slate-400 hover:text-white">
            <ChevronDown size={16} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-700 px-4 gap-4 bg-surface shrink-0">
        <button onClick={() => setView('json')} className={clsx("py-2 text-xs font-bold border-b-2 uppercase tracking-wide", view === 'json' ? "border-primary text-primary" : "border-transparent text-slate-500 hover:text-slate-300")}>Body</button>
        <button onClick={() => setView('headers')} className={clsx("py-2 text-xs font-bold border-b-2 uppercase tracking-wide", view === 'headers' ? "border-primary text-primary" : "border-transparent text-slate-500 hover:text-slate-300")}>Headers</button>
        {response.contentType.includes('html') && (
          <button onClick={() => setView('preview')} className={clsx("py-2 text-xs font-bold border-b-2 uppercase tracking-wide", view === 'preview' ? "border-primary text-primary" : "border-transparent text-slate-500 hover:text-slate-300")}>Preview</button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden relative bg-surface">
        {view === 'json' && (
          <Editor
            height="100%"
            defaultLanguage="json"
            theme="vs-dark"
            value={typeof response.body === 'object' ? JSON.stringify(response.body, null, 2) : response.body}
            options={{
              readOnly: true,
              minimap: { enabled: false },
              fontSize: 12,
              scrollBeyondLastLine: false,
              wordWrap: 'on'
            }}
          />
        )}

        {view === 'headers' && (
          <div className="p-4 overflow-y-auto h-full text-sm">
            <div className="grid grid-cols-3 gap-2 font-bold text-slate-500 mb-2 pb-2 border-b border-slate-700 text-xs uppercase">
              <div className="col-span-1">Key</div>
              <div className="col-span-2">Value</div>
            </div>
            {Object.entries(response.headers).map(([k, v]) => (
              <div key={k} className="grid grid-cols-3 gap-2 py-1 border-b border-slate-800 last:border-0 text-xs">
                <div className="col-span-1 text-slate-300 truncate font-mono" title={k}>{k}</div>
                <div className="col-span-2 text-primary truncate font-mono" title={String(v)}>{String(v)}</div>
              </div>
            ))}
          </div>
        )}

        {view === 'preview' && (
          <iframe
            srcDoc={response.body}
            title="Preview"
            className="w-full h-full bg-white"
            sandbox="allow-scripts"
          />
        )}
      </div>
    </div>
  );
};