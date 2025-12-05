import React from 'react';
import { useRequestStore, useCollectionStore, useEnvStore } from '../store';
import { Play, Save, Copy, Import, Layers } from 'lucide-react';
import Editor from '@monaco-editor/react';
import { KeyValueEditor } from './KeyValueEditor';
import { HttpMethod } from '../types';
import clsx from 'clsx';
import { requestToCurl, curlToRequest } from '../utils/curl';
import { SaveRequestModal } from './SaveRequestModal';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

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
    setCookies,
    setBody,
    loadRequest,
    activeTab,
    setActiveTab
  } = useRequestStore();
  const { t } = useTranslation();

  // Estado local para el body del editor (evita re-renders constantes)
  const [localBody, setLocalBody] = React.useState(activeRequest.body);
  const [showImportCurlModal, setShowImportCurlModal] = React.useState(false);
  const [curlInput, setCurlInput] = React.useState('');

  // Sincronizar el estado local cuando cambia el activeRequest (ej: al cargar otro request)
  React.useEffect(() => {
    setLocalBody(activeRequest.body);
  }, [activeRequest.id]);

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
    toast.success(t('toast.curlCopied'));
  };

  const handleImportCurl = () => {
    setShowImportCurlModal(true);
    setCurlInput('');
  };

  const handleImportCurlConfirm = () => {
    if (curlInput.trim()) {
      try {
        const parsed = curlToRequest(curlInput.trim());
        loadRequest({ ...activeRequest, ...parsed });
        toast.success(t('toast.curlImported'));
        setShowImportCurlModal(false);
        setCurlInput('');
      } catch (error) {
        toast.error(t('toast.invalidCurl'));
      }
    }
  };

  const handleSaveClick = () => {
    // Primero sincronizar el body local con el store
    setBody(localBody);

    // Pequeño delay para asegurar que el estado se actualice
    setTimeout(() => {
      const currentRequest = useRequestStore.getState().activeRequest;
      if (currentRequest.id && currentRequest.id !== 'temp' && savedRequests[currentRequest.id]) {
        // Already saved, update directly
        updateSavedRequest(currentRequest);
        toast.success(`${t('toast.savedChanges')} "${currentRequest.name}"`);
      } else {
        // New request, open modal
        setSaveModalOpen(true);
      }
    }, 50);
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <SaveRequestModal isOpen={saveModalOpen} onClose={() => setSaveModalOpen(false)} />

      {/* Import cURL Modal */}
      {showImportCurlModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-surface border border-slate-700 w-full max-w-2xl rounded-lg shadow-xl overflow-hidden">
            <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-background">
              <h3 className="text-lg font-bold">{t('modals.importCurl')}</h3>
              <button onClick={() => setShowImportCurlModal(false)} className="text-slate-400 hover:text-white">
                <Import size={20} />
              </button>
            </div>
            <div className="p-6">
              <label className="block text-sm font-medium text-slate-300 mb-2">{t('request.pasteCurl')}</label>
              <textarea
                value={curlInput}
                onChange={(e) => setCurlInput(e.target.value)}
                placeholder={t('modals.importCurlPlaceholder')}
                className="w-full bg-background border border-slate-600 rounded px-3 py-2 text-sm text-white focus:border-primary focus:outline-none font-mono h-32 resize-none"
                autoFocus
              />
              <p className="text-xs text-slate-400 mt-2">
                {t('modals.importCurlHelp')}
              </p>
            </div>
            <div className="p-4 bg-background/50 border-t border-slate-700 flex justify-end gap-2">
              <button
                onClick={() => setShowImportCurlModal(false)}
                className="px-4 py-2 text-sm text-slate-400 hover:text-white"
              >
                {t('modals.cancel')}
              </button>
              <button
                onClick={handleImportCurlConfirm}
                disabled={!curlInput.trim()}
                className="px-4 py-2 bg-primary hover:bg-primary/90 text-white text-sm font-bold rounded disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('modals.import')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Environment Indicator */}
      <div className={clsx(
        "px-4 py-2 border-b border-slate-700 flex items-center justify-between text-xs relative",
        envInfo.type === 'collection' ? 'bg-purple-900/20 text-purple-300' :
          envInfo.type === 'global' ? 'bg-blue-900/20 text-blue-300' :
            'bg-orange-900/20 text-orange-400'
      )}>
        <div className="flex items-center gap-2">
          <Layers size={14} />
          <span className="font-medium">{t('environment.title')}:</span>
          <button
            onClick={() => setShowEnvDropdown(!showEnvDropdown)}
            className="font-bold hover:opacity-80 transition-opacity flex items-center gap-1"
          >
            {envInfo.name}
            <span className="text-xs">▼</span>
          </button>
          {envInfo.type === 'collection' && <span className="text-xs opacity-60">({t('environment.collection')})</span>}
          {envInfo.type === 'global' && <span className="text-xs opacity-60">({t('environment.global')})</span>}
          {envInfo.type === 'none' && <span className="text-xs opacity-60">⚠️ {t('environment.configure')}</span>}
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
          onClick={() => {
            // Sincronizar el body antes de enviar
            setBody(localBody);
            setTimeout(() => sendRequest(), 10);
          }}
          disabled={loading}
          className="bg-primary hover:bg-blue-600 text-white px-6 rounded font-bold flex items-center gap-2 disabled:opacity-50 transition-colors"
        >
          {loading ? t('request.sending') : <><Play size={16} fill="currentColor" /> {t('request.send')}</>}
        </button>

        <button
          onClick={handleSaveClick}
          className="bg-slate-700 hover:bg-slate-600 text-white px-4 rounded font-bold flex items-center gap-2 transition-colors"
          title={t('request.save')}
        >
          <Save size={16} /> {t('request.save')}
        </button>

        <div className="flex gap-1 ml-2">
          <button onClick={handleCopyCurl} title={t('request.copyCurl')} className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded"><Copy size={18} /></button>
          <button onClick={handleImportCurl} title={t('request.importCurl')} className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded"><Import size={18} /></button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-700 px-4 gap-6">
        {['params', 'headers', 'cookies', 'body'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={clsx(
              "py-3 text-sm font-medium border-b-2 transition-colors",
              activeTab === tab
                ? "border-primary text-primary"
                : "border-transparent text-slate-400 hover:text-slate-200"
            )}
          >
            {t(`tabs.${tab}`)}
            {tab === 'headers' && activeRequest.headers.length > 0 && <span className="ml-2 text-xs bg-slate-700 px-1.5 rounded-full">{activeRequest.headers.length}</span>}
            {tab === 'cookies' && activeRequest.cookies?.length > 0 && <span className="ml-2 text-xs bg-slate-700 px-1.5 rounded-full">{activeRequest.cookies.length}</span>}
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

        {activeTab === 'cookies' && (
          <KeyValueEditor items={activeRequest.cookies || []} onChange={setCookies} />
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
                value={localBody}
                onChange={(val) => setLocalBody(val || '')}
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