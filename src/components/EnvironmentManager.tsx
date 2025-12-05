import React, { useState } from 'react';
import { useEnvStore } from '../store';
import { KeyValueEditor } from './KeyValueEditor';
import { X, Settings } from 'lucide-react';
import clsx from 'clsx';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

export const EnvironmentManager: React.FC = () => {
  const { environments, activeEnvId, setActiveEnv, addEnvironment, updateEnvironment, deleteEnvironment } = useEnvStore();
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedEnvId, setSelectedEnvId] = useState<string>('default');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [envToDelete, setEnvToDelete] = useState<string | null>(null);
  const [newEnvName, setNewEnvName] = useState('');
  const contentTabRef = React.useRef<'variables' | 'headers'>('variables');
  const [, forceUpdate] = React.useReducer(x => x + 1, 0);

  const activeEnv = environments.find(e => e.id === activeEnvId);
  const editingEnv = React.useMemo(
    () => environments.find(e => e.id === selectedEnvId),
    [environments, selectedEnvId]
  );

  const setContentTab = (tab: 'variables' | 'headers') => {
    contentTabRef.current = tab;
    forceUpdate();
  };

  const contentTab = contentTabRef.current;

  const handleCreate = () => {
    setShowCreateModal(true);
    setNewEnvName('');
  };

  const handleCreateConfirm = () => {
    if (newEnvName.trim()) {
      addEnvironment(newEnvName.trim());
      toast.success(t('toast.envCreated'));
      setShowCreateModal(false);
      setNewEnvName('');
    }
  };

  const handleDeleteClick = (envId: string) => {
    setEnvToDelete(envId);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = () => {
    if (envToDelete) {
      deleteEnvironment(envToDelete);
      toast.success(t('toast.envDeleted'));
      setSelectedEnvId('default');
      setShowDeleteModal(false);
      setEnvToDelete(null);
    }
  };

  if (!isOpen) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <span className="text-slate-400 text-xs">Env:</span>
        <div
          className="flex items-center gap-2 cursor-pointer hover:text-white text-primary"
          onClick={() => setIsOpen(true)}
        >
          <span className="font-medium truncate max-w-[100px]">{activeEnv?.name || 'No Environment'}</span>
          <Settings size={14} />
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Create Environment Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-surface border border-slate-700 w-full max-w-md rounded-lg shadow-xl overflow-hidden">
            <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-background">
              <h3 className="text-lg font-bold">{t('modals.newEnvironment')}</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              <label className="block text-sm font-medium text-slate-300 mb-2">{t('modals.environmentName')}</label>
              <input
                type="text"
                value={newEnvName}
                onChange={(e) => setNewEnvName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateConfirm()}
                placeholder="e.g., Production, Staging..."
                className="w-full bg-background border border-slate-600 rounded px-3 py-2 text-sm text-white focus:border-primary focus:outline-none"
                autoFocus
              />
            </div>
            <div className="p-4 bg-background/50 border-t border-slate-700 flex justify-end gap-2">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-sm text-slate-400 hover:text-white"
              >
                {t('modals.cancel')}
              </button>
              <button
                onClick={handleCreateConfirm}
                disabled={!newEnvName.trim()}
                className="px-4 py-2 bg-primary hover:bg-primary/90 text-white text-sm font-bold rounded disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('modals.create')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && envToDelete && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-surface border border-slate-700 w-full max-w-md rounded-lg shadow-xl overflow-hidden">
            <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-background">
              <h3 className="text-lg font-bold text-red-400">{t('modals.deleteEnvironment')}</h3>
              <button onClick={() => setShowDeleteModal(false)} className="text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              <p className="text-slate-300">
                {t('modals.deleteConfirm')} <strong className="text-white">"{environments.find(e => e.id === envToDelete)?.name}"</strong>?
              </p>
              <p className="text-sm text-slate-400 mt-2">
                {t('modals.deleteWarning')}
              </p>
            </div>
            <div className="p-4 bg-background/50 border-t border-slate-700 flex justify-end gap-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-sm text-slate-400 hover:text-white"
              >
                {t('modals.cancel')}
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded"
              >
                {t('modals.delete')}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center">
        <div className="bg-surface border border-slate-700 w-[800px] h-[600px] rounded-lg shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-background">
            <h2 className="text-lg font-bold">{t('environmentManager.title')}</h2>
            <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white"><X /></button>
          </div>

          <div className="flex flex-1 overflow-hidden">
            {/* Sidebar */}
            <div className="w-48 border-r border-slate-700 bg-background/50 p-2 overflow-y-auto">
              <button onClick={handleCreate} className="w-full text-left p-2 mb-2 text-xs font-bold uppercase text-primary hover:bg-slate-800 rounded">{t('environmentManager.newEnv')}</button>
              {environments.map(env => (
                <div
                  key={env.id}
                  onClick={() => setSelectedEnvId(env.id)}
                  className={`p-2 rounded cursor-pointer text-sm mb-1 flex justify-between items-center group ${selectedEnvId === env.id ? 'bg-primary text-white' : 'text-slate-300 hover:bg-slate-800'}`}
                >
                  <span className="truncate">{env.name}</span>
                  {activeEnvId === env.id && <span className="w-2 h-2 rounded-full bg-green-400 block" title={t('environmentManager.active')}></span>}
                </div>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col bg-surface">
              {editingEnv ? (
                <>
                  <div className="p-4 border-b border-slate-700 flex justify-between items-center">
                    <h3 className="font-bold">{editingEnv.name}</h3>
                    <div className="flex gap-2">
                      {activeEnvId !== editingEnv.id && (
                        <button onClick={() => setActiveEnv(editingEnv.id)} className="px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded text-xs">{t('environmentManager.setActive')}</button>
                      )}
                      {editingEnv.id !== 'default' && (
                        <button
                          onClick={() => handleDeleteClick(editingEnv.id)}
                          className="px-3 py-1 bg-red-900/50 text-red-400 hover:bg-red-900 rounded text-xs"
                        >
                          {t('environmentManager.delete')}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Sub-tabs for Variables and Headers */}
                  <div className="flex border-b border-slate-700 px-4 gap-4 bg-surface/30">
                    <button
                      onClick={() => setContentTab('variables')}
                      className={clsx(
                        "py-2 text-xs font-bold border-b-2 uppercase tracking-wide",
                        contentTab === 'variables' ? "border-primary text-primary" : "border-transparent text-slate-500 hover:text-slate-300"
                      )}
                    >
                      {t('environmentManager.variables')}
                    </button>
                    <button
                      onClick={() => setContentTab('headers')}
                      className={clsx(
                        "py-2 text-xs font-bold border-b-2 uppercase tracking-wide",
                        contentTab === 'headers' ? "border-primary text-primary" : "border-transparent text-slate-500 hover:text-slate-300"
                      )}
                    >
                      {t('environmentManager.sharedHeaders')}
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4">
                    <div className={contentTab === 'variables' ? 'block' : 'hidden'}>
                      <div className="mb-4 p-3 bg-blue-900/10 border border-blue-900/50 rounded text-xs text-blue-300">
                        {t('environmentManager.variablesHelp')}
                      </div>
                      <KeyValueEditor
                        key={`${editingEnv.id}-variables`}
                        items={editingEnv.variables}
                        onChange={(vars) => updateEnvironment(editingEnv.id, { variables: vars })}
                      />
                    </div>
                    <div className={contentTab === 'headers' ? 'block' : 'hidden'}>
                      <div className="mb-4 p-3 bg-purple-900/10 border border-purple-900/50 rounded text-xs text-purple-300">
                        {t('environmentManager.headersHelp')}
                      </div>
                      <KeyValueEditor
                        key={`${editingEnv.id}-headers`}
                        items={editingEnv.headers || []}
                        onChange={(headers) => updateEnvironment(editingEnv.id, { headers })}
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-slate-500">{t('environmentManager.selectEnvironment')}</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};