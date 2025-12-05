import React, { useState } from 'react';
import { useCollectionStore } from '../store';
import { KeyValueEditor } from './KeyValueEditor';
import { Plus, Trash2, Layers, X } from 'lucide-react';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';

export const CollectionPanel: React.FC = () => {
  const {
    collections,
    activeCollectionId,
    addCollectionEnv,
    updateCollectionEnv,
    removeCollectionEnv,
    openRequestView,
    collectionContentTabs,
    setCollectionContentTab
  } = useCollectionStore();
  const { t } = useTranslation();

  const collection = collections.find(c => c.id === activeCollectionId);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [showAddEnvModal, setShowAddEnvModal] = useState(false);
  const [newEnvName, setNewEnvName] = useState('');

  // Set initial tab if none selected
  React.useEffect(() => {
    if (collection && collection.environments.length > 0 && !activeTabId) {
      setActiveTabId(collection.environments[0].id);
    }
  }, [collection, activeTabId]);

  if (!collection) {
    return <div className="p-4 text-slate-500">No collection selected</div>;
  }

  const activeEnv = collection.environments.find(e => e.id === activeTabId);
  const contentTab = collectionContentTabs[collection.id] || 'variables';

  const handleAddTab = () => {
    setShowAddEnvModal(true);
    setNewEnvName('');
  };

  const handleAddEnvConfirm = () => {
    if (newEnvName.trim() && collection) {
      addCollectionEnv(collection.id, newEnvName.trim());
      setShowAddEnvModal(false);
      setNewEnvName('');
    }
  };

  return (
    <>
      {/* Add Environment Modal */}
      {showAddEnvModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-surface border border-slate-700 w-full max-w-md rounded-lg shadow-xl overflow-hidden">
            <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-background">
              <h3 className="text-lg font-bold">{t('modals.newEnvironment')}</h3>
              <button onClick={() => setShowAddEnvModal(false)} className="text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              <label className="block text-sm font-medium text-slate-300 mb-2">{t('modals.environmentName')}</label>
              <input
                type="text"
                value={newEnvName}
                onChange={(e) => setNewEnvName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddEnvConfirm()}
                placeholder="e.g., Staging, Production..."
                className="w-full bg-background border border-slate-600 rounded px-3 py-2 text-sm text-white focus:border-primary focus:outline-none"
                autoFocus
              />
            </div>
            <div className="p-4 bg-background/50 border-t border-slate-700 flex justify-end gap-2">
              <button
                onClick={() => setShowAddEnvModal(false)}
                className="px-4 py-2 text-sm text-slate-400 hover:text-white"
              >
                {t('modals.cancel')}
              </button>
              <button
                onClick={handleAddEnvConfirm}
                disabled={!newEnvName.trim()}
                className="px-4 py-2 bg-primary hover:bg-primary/90 text-white text-sm font-bold rounded disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('modals.create')}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col h-full bg-background">
        {/* Header */}
        <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-surface">
          <div className="flex items-center gap-2">
            <Layers className="text-primary" size={20} />
            <div>
              <h2 className="text-xl font-bold text-white">{collection.name}</h2>
              <p className="text-xs text-slate-400">{t('collectionPanel.title')}</p>
            </div>
          </div>
          <button onClick={openRequestView} className="text-slate-400 hover:text-white p-2">
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-700 px-4 gap-1 pt-2 bg-surface/50 overflow-x-auto">
          {collection.environments.map(env => (
            <div key={env.id} className="group relative">
              <button
                onClick={() => setActiveTabId(env.id)}
                className={clsx(
                  "px-4 py-2 text-sm font-medium border-t-2 border-x border-slate-700 rounded-t transition-colors min-w-[100px] text-left relative top-[1px]",
                  activeTabId === env.id
                    ? "bg-background border-b-background text-primary border-primary/50"
                    : "bg-surface text-slate-400 hover:text-slate-200 hover:bg-slate-700"
                )}
              >
                {env.name}
              </button>
              {collection.environments.length > 1 && (
                <button
                  onClick={(e) => { e.stopPropagation(); if (confirm('Delete tab?')) removeCollectionEnv(collection.id, env.id); }}
                  className="absolute right-1 top-2 opacity-0 group-hover:opacity-100 text-slate-500 hover:text-danger"
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          ))}
          <button
            onClick={handleAddTab}
            className="px-3 py-2 text-slate-500 hover:text-primary hover:bg-slate-800 rounded-t"
            title="Add Environment Tab"
          >
            <Plus size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 bg-background overflow-hidden flex flex-col">
          {activeEnv ? (
            <>
              {/* Sub-tabs for Variables and Headers */}
              <div className="flex border-b border-slate-700 px-4 gap-4 bg-surface/30">
                <button
                  onClick={() => setCollectionContentTab(collection.id, 'variables')}
                  className={clsx(
                    "py-2 text-xs font-bold border-b-2 uppercase tracking-wide transition-colors",
                    contentTab === 'variables' ? "border-primary text-primary" : "border-transparent text-slate-500 hover:text-slate-300"
                  )}
                >
                  Variables
                </button>
                <button
                  onClick={() => setCollectionContentTab(collection.id, 'headers')}
                  className={clsx(
                    "py-2 text-xs font-bold border-b-2 uppercase tracking-wide transition-colors",
                    contentTab === 'headers' ? "border-primary text-primary" : "border-transparent text-slate-500 hover:text-slate-300"
                  )}
                >
                  Shared Headers
                </button>
              </div>            <div className="flex-1 overflow-y-auto p-4">
                <div className="max-w-4xl mx-auto">
                  <div className={contentTab === 'variables' ? 'block' : 'hidden'}>
                    <div className="mb-4 p-4 bg-blue-900/10 border border-blue-900/50 rounded text-sm text-blue-300">
                      Variables defined here are specific to the <strong>{activeEnv.name}</strong> environment of this collection.
                    </div>
                    <KeyValueEditor
                      key={`${activeEnv.id}-variables`}
                      items={activeEnv.variables}
                      onChange={(vars) => updateCollectionEnv(collection.id, activeEnv.id, { variables: vars })}
                    />
                  </div>
                  <div className={contentTab === 'headers' ? 'block' : 'hidden'}>
                    <div className="mb-4 p-4 bg-purple-900/10 border border-purple-900/50 rounded text-sm text-purple-300">
                      Headers definidos aquí se agregarán automáticamente a <strong>todas las peticiones</strong> de este environment. Útil para Authorization, Content-Type, etc.
                    </div>
                    <KeyValueEditor
                      key={`${activeEnv.id}-headers`}
                      items={activeEnv.headers || []}
                      onChange={(headers) => updateCollectionEnv(collection.id, activeEnv.id, { headers })}
                    />
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-500">
              <Layers size={48} className="mb-2 opacity-20" />
              <p>Select or create a tab to configure variables.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};