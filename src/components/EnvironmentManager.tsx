import React, { useState } from 'react';
import { useEnvStore } from '../store';
import { KeyValueEditor } from './KeyValueEditor';
import { X, Settings } from 'lucide-react';
import clsx from 'clsx';

export const EnvironmentManager: React.FC = () => {
  const { environments, activeEnvId, setActiveEnv, addEnvironment, updateEnvironment, deleteEnvironment } = useEnvStore();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedEnvId, setSelectedEnvId] = useState<string>('default');
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
    const name = prompt("Environment Name:");
    if (name) addEnvironment(name);
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
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center">
      <div className="bg-surface border border-slate-700 w-[800px] h-[600px] rounded-lg shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-background">
          <h2 className="text-lg font-bold">Manage Environments</h2>
          <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white"><X /></button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-48 border-r border-slate-700 bg-background/50 p-2 overflow-y-auto">
            <button onClick={handleCreate} className="w-full text-left p-2 mb-2 text-xs font-bold uppercase text-primary hover:bg-slate-800 rounded">+ New Env</button>
            {environments.map(env => (
              <div
                key={env.id}
                onClick={() => setSelectedEnvId(env.id)}
                className={`p-2 rounded cursor-pointer text-sm mb-1 flex justify-between items-center group ${selectedEnvId === env.id ? 'bg-primary text-white' : 'text-slate-300 hover:bg-slate-800'}`}
              >
                <span className="truncate">{env.name}</span>
                {activeEnvId === env.id && <span className="w-2 h-2 rounded-full bg-green-400 block" title="Active"></span>}
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
                      <button onClick={() => setActiveEnv(editingEnv.id)} className="px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded text-xs">Set Active</button>
                    )}
                    {editingEnv.id !== 'default' && (
                      <button onClick={() => {
                        if (confirm('Delete?')) {
                          deleteEnvironment(editingEnv.id);
                          setSelectedEnvId('default');
                        }
                      }} className="px-3 py-1 bg-red-900/50 text-red-400 hover:bg-red-900 rounded text-xs">Delete</button>
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
                    Variables
                  </button>
                  <button
                    onClick={() => setContentTab('headers')}
                    className={clsx(
                      "py-2 text-xs font-bold border-b-2 uppercase tracking-wide",
                      contentTab === 'headers' ? "border-primary text-primary" : "border-transparent text-slate-500 hover:text-slate-300"
                    )}
                  >
                    Shared Headers
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                  <div className={contentTab === 'variables' ? 'block' : 'hidden'}>
                    <div className="mb-4 p-3 bg-blue-900/10 border border-blue-900/50 rounded text-xs text-blue-300">
                      Variables globales disponibles en todas las colecciones.
                    </div>
                    <KeyValueEditor
                      key={`${editingEnv.id}-variables`}
                      items={editingEnv.variables}
                      onChange={(vars) => updateEnvironment(editingEnv.id, { variables: vars })}
                    />
                  </div>
                  <div className={contentTab === 'headers' ? 'block' : 'hidden'}>
                    <div className="mb-4 p-3 bg-purple-900/10 border border-purple-900/50 rounded text-xs text-purple-300">
                      Headers globales que se agregarán a todas las peticiones.
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
              <div className="flex-1 flex items-center justify-center text-slate-500">Select an environment</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};