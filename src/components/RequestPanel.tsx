import React from 'react';
import { useRequestStore, useCollectionStore, useEnvStore } from '../store';
import { Play, Save, Copy, Import, Layers } from 'lucide-react';
import Editor from '@monaco-editor/react';
import { KeyValueEditor } from './KeyValueEditor';
import { HttpMethod } from '../types';
import clsx from 'clsx';
import { requestToCurl, curlToRequest } from '../utils/curl';
import { SaveRequestModal } from './SaveRequestModal';

const methods: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

export const RequestPanel: React.FC = () => {
  const {
    activeRequest,
    loading,
    sendRequest,
    setMethod,
    setUrl,
    setHeaders,
    setParams,
    setBody,
    loadRequest,
    activeTab,
    setActiveTab
  } = useRequestStore();

  const { updateSavedRequest, savedRequests, activeCollectionId, collections, setCollectionActiveEnv } = useCollectionStore();
  const { environments, activeEnvId, setActiveEnv } = useEnvStore();
  const [showEnvDropdown, setShowEnvDropdown] = React.useState(false);

  // Get active environment info
  const getActiveEnvInfo = () => {
    if (activeCollectionId) {
      const col = collections.find(c => c.id === activeCollectionId);
      if (col && col.activeEnvironmentId) {
        const env = col.environments.find(e => e.id === col.activeEnvironmentId);
        if (env) return { name: `${col.name} > ${env.name}`, type: 'collection' as const, collectionId: col.id, envId: env.id };
      }
      // Collection exists but no active env
      if (col) return { name: 'No Environment', type: 'none' as const, collectionId: col.id, envId: null };
    }
    const globalEnv = environments.find(e => e.id === activeEnvId);
    if (globalEnv) return { name: globalEnv.name, type: 'global' as const, collectionId: null, envId: globalEnv.id };
    return { name: 'No Environment', type: 'none' as const, collectionId: null, envId: null };
  };

  const envInfo = getActiveEnvInfo();

  // Get all available environments
  const getAllEnvs = () => {
    const envs: Array<{ id: string; name: string; type: 'global' | 'collection'; collectionId?: string }> = [];

    // Add global environments
    environments.forEach(env => {
      envs.push({ id: env.id, name: `Global: ${env.name}`, type: 'global' });
    });

    // Add collection environments
    if (activeCollectionId) {
      const col = collections.find(c => c.id === activeCollectionId);
      if (col) {
        col.environments.forEach(env => {
          envs.push({ id: env.id, name: `${col.name} > ${env.name}`, type: 'collection', collectionId: col.id });
        });
      }
    }

    return envs;
  };

  const handleEnvChange = (env: { id: string; type: 'global' | 'collection'; collectionId?: string }) => {
    if (env.type === 'global') {
      setActiveEnv(env.id);
    } else if (env.type === 'collection' && env.collectionId) {
      setCollectionActiveEnv(env.collectionId, env.id);
    }
    setShowEnvDropdown(false);
  };

  const [saveModalOpen, setSaveModalOpen] = React.useState(false);

  const handleCopyCurl = () => {
    const curl = requestToCurl(activeRequest);
    navigator.clipboard.writeText(curl);
    alert('cURL copied to clipboard!');
  };

  const handleImportCurl = () => {
    const curl = prompt("Paste cURL command:");
    if (curl) {
      const parsed = curlToRequest(curl);
      loadRequest({ ...activeRequest, ...parsed });
    }
  };

  const handleSaveClick = () => {
    if (activeRequest.id && activeRequest.id !== 'temp' && savedRequests[activeRequest.id]) {
      // Already saved, update directly
      updateSavedRequest(activeRequest);
      alert(`Saved changes to "${activeRequest.name}"`);
    } else {
      // New request, open modal
      setSaveModalOpen(true);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <SaveRequestModal isOpen={saveModalOpen} onClose={() => setSaveModalOpen(false)} />

      {/* Environment Indicator */}
      <div className={clsx(
        "px-4 py-2 border-b border-slate-700 flex items-center justify-between text-xs relative",
        envInfo.type === 'collection' ? 'bg-purple-900/20 text-purple-300' :
          envInfo.type === 'global' ? 'bg-blue-900/20 text-blue-300' :
            'bg-orange-900/20 text-orange-400'
      )}>
        <div className="flex items-center gap-2">
          <Layers size={14} />
          <span className="font-medium">Environment:</span>
          <button
            onClick={() => setShowEnvDropdown(!showEnvDropdown)}
            className="font-bold hover:opacity-80 transition-opacity flex items-center gap-1"
          >
            {envInfo.name}
            <span className="text-xs">▼</span>
          </button>
          {envInfo.type === 'collection' && <span className="text-xs opacity-60">(Collection)</span>}
          {envInfo.type === 'global' && <span className="text-xs opacity-60">(Global)</span>}
          {envInfo.type === 'none' && <span className="text-xs opacity-60">⚠️ Configure uno para usar variables</span>}
        </div>

        {/* Dropdown */}
        {showEnvDropdown && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setShowEnvDropdown(false)}
            />
            <div className="absolute top-full left-0 mt-1 bg-surface border border-slate-700 rounded shadow-xl z-20 min-w-[300px] max-h-[400px] overflow-y-auto">
              {getAllEnvs().map(env => (
                <button
                  key={`${env.type}-${env.id}`}
                  onClick={() => handleEnvChange(env)}
                  className={clsx(
                    "w-full text-left px-4 py-2 text-sm hover:bg-slate-700 transition-colors flex items-center gap-2",
                    (envInfo.type === env.type && envInfo.envId === env.id) && "bg-slate-800 text-primary"
                  )}
                >
                  <Layers size={12} />
                  {env.name}
                  {envInfo.type === env.type && envInfo.envId === env.id && <span className="ml-auto text-xs">✓</span>}
                </button>
              ))}
              {getAllEnvs().length === 0 && (
                <div className="px-4 py-3 text-xs text-slate-500 text-center">
                  No hay environments configurados
                </div>
              )}
            </div>
          </>
        )}
      </div>      {/* Top Bar */}
      <div className="p-4 border-b border-slate-700 flex gap-2">
        <div className="flex flex-1 gap-0">
          <select
            value={activeRequest.method}
            onChange={(e) => setMethod(e.target.value as HttpMethod)}
            className="bg-surface border border-slate-700 rounded-l px-4 font-bold text-sm focus:outline-none focus:border-primary appearance-none text-center min-w-[100px]"
            style={{
              color: activeRequest.method === 'GET' ? '#60a5fa' :
                activeRequest.method === 'POST' ? '#34d399' :
                  activeRequest.method === 'DELETE' ? '#f87171' : '#fcd34d'
            }}
          >
            {methods.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <input
            type="text"
            value={activeRequest.url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://api.example.com/v1/users"
            className="flex-1 bg-background border-y border-r border-slate-700 rounded-r px-4 focus:outline-none focus:border-primary font-mono text-sm"
          />
        </div>

        <button
          onClick={sendRequest}
          disabled={loading}
          className="bg-primary hover:bg-blue-600 text-white px-6 rounded font-bold flex items-center gap-2 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Sending...' : <><Play size={16} fill="currentColor" /> Send</>}
        </button>

        <button
          onClick={handleSaveClick}
          className="bg-slate-700 hover:bg-slate-600 text-white px-4 rounded font-bold flex items-center gap-2 transition-colors"
          title="Save Request"
        >
          <Save size={16} /> Save
        </button>

        <div className="flex gap-1 ml-2">
          <button onClick={handleCopyCurl} title="Copy as cURL" className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded"><Copy size={18} /></button>
          <button onClick={handleImportCurl} title="Import cURL" className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded"><Import size={18} /></button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-700 px-4 gap-6">
        {['params', 'headers', 'body'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={clsx(
              "py-3 text-sm font-medium border-b-2 transition-colors capitalize",
              activeTab === tab
                ? "border-primary text-primary"
                : "border-transparent text-slate-400 hover:text-slate-200"
            )}
          >
            {tab}
            {tab === 'headers' && activeRequest.headers.length > 0 && <span className="ml-2 text-xs bg-slate-700 px-1.5 rounded-full">{activeRequest.headers.length}</span>}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 relative overflow-hidden">
        {activeTab === 'params' && (
          <KeyValueEditor items={activeRequest.params} onChange={setParams} />
        )}

        {activeTab === 'headers' && (
          <KeyValueEditor items={activeRequest.headers} onChange={setHeaders} />
        )}

        {activeTab === 'body' && (
          <div className="h-full flex flex-col">
            <div className="flex gap-4 p-2 text-xs text-slate-400 border-b border-slate-800 bg-surface/50">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" checked={activeRequest.bodyType === 'none'} onChange={() => { }} className="accent-primary" /> None
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" checked={activeRequest.bodyType === 'json'} onChange={() => { }} className="accent-primary" /> JSON
              </label>
            </div>
            <div className="flex-1 pt-2">
              <Editor
                height="100%"
                defaultLanguage="json"
                theme="vs-dark"
                value={activeRequest.body}
                onChange={(val) => setBody(val || '')}
                options={{
                  minimap: { enabled: false },
                  fontSize: 13,
                  scrollBeyondLastLine: false,
                  automaticLayout: true
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};