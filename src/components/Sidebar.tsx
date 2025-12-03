import React, { useState } from 'react';
import { useCollectionStore, useRequestStore } from '../store';
import { Plus, ChevronRight, ChevronDown, Archive, Settings, Briefcase, Trash2, X, Check, UploadCloud } from 'lucide-react';
import clsx from 'clsx';

export const Sidebar: React.FC = () => {
  const {
    projects,
    collections,
    savedRequests,
    createProject,
    createCollection,
    openCollectionSettings,
    deleteProject,
    deleteCollection,
    openImportModal
  } = useCollectionStore();

  const { loadRequest } = useRequestStore();

  // Expanded states for Projects and Collections
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ 'default-project': true });

  // Create Project State
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectColor, setNewProjectColor] = useState('#3b82f6');

  // Create Collection State (Inline)
  const [creatingCollectionIn, setCreatingCollectionIn] = useState<string | null>(null);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [newCollectionColor, setNewCollectionColor] = useState('#34d399');

  const toggleExpand = (id: string) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCreateProject = () => {
    if (newProjectName.trim()) {
      createProject(newProjectName, newProjectColor);
      setIsCreatingProject(false);
      setNewProjectName('');
      setNewProjectColor('#3b82f6');
    }
  };

  const startCreateCollection = (projectId: string) => {
    if (!expanded[projectId]) {
      setExpanded(prev => ({ ...prev, [projectId]: true }));
    }
    setCreatingCollectionIn(projectId);
    setNewCollectionName('');
    setNewCollectionColor('#34d399');
  };

  const handleCreateCollection = () => {
    if (creatingCollectionIn && newCollectionName.trim()) {
      createCollection(newCollectionName, creatingCollectionIn, newCollectionColor);
      setCreatingCollectionIn(null);
      setNewCollectionName('');
    }
  };

  const cancelCreateCollection = () => {
    setCreatingCollectionIn(null);
    setNewCollectionName('');
  };

  const handleLoadRequest = (req: any) => {
    loadRequest(req);
    useCollectionStore.getState().openRequestView();
  };

  return (
    <div className="w-full bg-surface border-r border-slate-700 flex flex-col h-full select-none">

      {/* Title Bar */}
      <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-background/50">
        <h2 className="font-bold text-slate-100 flex items-center gap-2 text-sm uppercase tracking-wider">
          <Briefcase size={16} className="text-primary" /> Workspace
        </h2>
        <button
          onClick={() => setIsCreatingProject(!isCreatingProject)}
          className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-colors"
          title="Create Project"
        >
          {isCreatingProject ? <X size={16} /> : <Plus size={16} />}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Create Project Inline Form */}
        {isCreatingProject && (
          <div className="p-3 bg-slate-800/50 border-b border-slate-700 animate-in slide-in-from-top-2">
            <div className="text-xs font-bold text-slate-400 mb-2 uppercase">New Project</div>
            <input
              type="text"
              placeholder="Project Name"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateProject()}
              className="w-full bg-surface border border-slate-600 rounded px-2 py-1 text-sm mb-2 focus:border-primary focus:outline-none text-slate-200"
              autoFocus
            />
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs text-slate-400">Color:</span>
              <input
                type="color"
                value={newProjectColor}
                onChange={(e) => setNewProjectColor(e.target.value)}
                className="bg-transparent border-0 w-6 h-6 p-0 cursor-pointer"
              />
            </div>
            <button
              onClick={handleCreateProject}
              className="w-full bg-primary hover:bg-primary/90 text-white text-xs font-bold py-1 rounded flex items-center justify-center gap-1"
            >
              <Check size={12} /> Create
            </button>
          </div>
        )}

        {projects.length === 0 && !isCreatingProject && (
          <div className="p-4 text-center text-slate-500 text-sm">No projects. Create one to start.</div>
        )}

        {/* Project Loop */}
        {projects.map(proj => (
          <div key={proj.id} className="border-b border-slate-700/50">
            {/* Project Header */}
            <div
              className="flex items-center justify-between group hover:bg-slate-700/30 transition-colors cursor-pointer bg-surface relative"
              onClick={() => toggleExpand(proj.id)}
            >
              {/* Color Indicator */}
              <div className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: proj.color }}></div>

              <div className="flex items-center gap-2 p-3 pl-4 flex-1 overflow-hidden">
                {expanded[proj.id] ? <ChevronDown size={14} className="text-slate-500" /> : <ChevronRight size={14} className="text-slate-500" />}
                <span className="font-bold text-slate-200 text-sm truncate">{proj.name}</span>
              </div>
              <div className="flex items-center pr-2 gap-1">
                <button
                  onClick={(e) => { e.stopPropagation(); openImportModal(proj.id); }}
                  className="p-1.5 text-slate-500 hover:text-white rounded hover:bg-slate-700 opacity-0 group-hover:opacity-100 transition-all"
                  title="Import Collection"
                >
                  <UploadCloud size={14} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); startCreateCollection(proj.id); }}
                  className="p-1.5 text-slate-500 hover:text-white rounded hover:bg-slate-700 opacity-0 group-hover:opacity-100 transition-all"
                  title="Add Collection"
                >
                  <Plus size={14} />
                </button>
                {proj.id !== 'default-project' && (
                  <button
                    onClick={(e) => { e.stopPropagation(); if (confirm(`Delete Project "${proj.name}"?`)) deleteProject(proj.id); }}
                    className="p-1.5 text-slate-500 hover:text-danger rounded hover:bg-slate-700 opacity-0 group-hover:opacity-100 transition-all ml-1"
                    title="Delete Project"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* Project Collections */}
            {expanded[proj.id] && (
              <div className="bg-background/20 pb-2 relative">
                {/* Visual guideline for hierarchy */}
                <div className="absolute left-4 top-0 bottom-0 w-[1px] bg-slate-800"></div>

                {/* Inline Collection Creation */}
                {creatingCollectionIn === proj.id && (
                  <div className="ml-6 mr-2 mt-2 mb-2 p-2 bg-slate-800 rounded border border-slate-600 animate-in fade-in zoom-in-95 duration-100">
                    <input
                      type="text"
                      placeholder="Collection Name"
                      value={newCollectionName}
                      onChange={(e) => setNewCollectionName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleCreateCollection()}
                      className="w-full bg-surface text-slate-200 text-xs px-2 py-1 rounded border border-slate-600 focus:border-primary focus:outline-none mb-2"
                      autoFocus
                    />
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs text-slate-400">Color:</span>
                      <input
                        type="color"
                        value={newCollectionColor}
                        onChange={(e) => setNewCollectionColor(e.target.value)}
                        className="bg-transparent border-0 w-5 h-5 p-0 cursor-pointer"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={handleCreateCollection} className="bg-primary text-white text-[10px] px-2 py-1 rounded hover:bg-primary/80 flex-1">Create</button>
                      <button onClick={cancelCreateCollection} className="bg-slate-700 text-slate-300 text-[10px] px-2 py-1 rounded hover:bg-slate-600 flex-1">Cancel</button>
                    </div>
                  </div>
                )}

                {collections.filter(c => c.projectId === proj.id).map(col => (
                  <div key={col.id} className="ml-0 relative">
                    <div className="flex items-center justify-between group/col hover:bg-slate-700 rounded-l mr-2 ml-2 pl-4 relative overflow-hidden">
                      {/* Collection Color Strip */}
                      <div className="absolute left-0 top-1 bottom-1 w-0.5 rounded-full" style={{ backgroundColor: col.color || '#34d399' }}></div>

                      <div
                        className="flex items-center gap-2 p-2 cursor-pointer text-slate-400 hover:text-white transition-colors flex-1 overflow-hidden ml-1"
                        onClick={() => toggleExpand(col.id)}
                      >
                        {expanded[col.id] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        <Archive size={14} className="shrink-0" style={{ color: col.color || '#94a3b8' }} />
                        <span className="font-medium text-sm truncate">{col.name}</span>
                      </div>
                      <div className="flex">
                        <button
                          onClick={(e) => { e.stopPropagation(); openCollectionSettings(col.id); }}
                          className="text-slate-500 hover:text-primary opacity-0 group-hover/col:opacity-100 p-1"
                          title="Collection Settings"
                        >
                          <Settings size={12} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); if (confirm('Delete Collection?')) deleteCollection(col.id); }}
                          className="text-slate-500 hover:text-danger opacity-0 group-hover/col:opacity-100 p-1"
                          title="Delete Collection"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>

                    {/* Content inside Collection */}
                    {expanded[col.id] && (
                      <div className="ml-6 border-l border-slate-700 pl-2 mt-1 space-y-1 mr-2 relative left-2">

                        {/* Folders Loop */}
                        {col.folders.map(folder => (
                          <div key={folder.id} className="mb-1">
                            <div className="flex items-center gap-2 p-1 text-slate-400 text-xs font-bold uppercase hover:text-slate-200">
                              <ChevronDown size={10} /> {folder.name}
                            </div>
                            <div className="pl-2 border-l border-slate-800 ml-1">
                              {folder.requests.map(reqId => {
                                const req = savedRequests[reqId];
                                if (!req) return null;
                                let methodColor = 'text-slate-400';
                                if (req.method === 'GET') methodColor = 'text-blue-400';
                                if (req.method === 'POST') methodColor = 'text-green-400';
                                if (req.method === 'DELETE') methodColor = 'text-red-400';
                                if (req.method === 'PUT') methodColor = 'text-orange-400';

                                return (
                                  <div
                                    key={reqId}
                                    onClick={() => handleLoadRequest(req)}
                                    className="flex items-center gap-2 p-2 text-sm rounded hover:bg-slate-700/50 cursor-pointer group/req"
                                  >
                                    <span className={clsx("text-[10px] font-bold w-8 shrink-0", methodColor)}>{req.method.substring(0, 3)}</span>
                                    <span className="text-slate-400 group-hover/req:text-slate-200 truncate text-xs">{req.name}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}

                        {/* Root Requests Loop */}
                        {col.requests.map(reqId => {
                          const req = savedRequests[reqId];
                          if (!req) return null;

                          let methodColor = 'text-slate-400';
                          if (req.method === 'GET') methodColor = 'text-blue-400';
                          if (req.method === 'POST') methodColor = 'text-green-400';
                          if (req.method === 'DELETE') methodColor = 'text-red-400';
                          if (req.method === 'PUT') methodColor = 'text-orange-400';

                          return (
                            <div
                              key={reqId}
                              onClick={() => handleLoadRequest(req)}
                              className="flex items-center gap-2 p-2 text-sm rounded hover:bg-slate-700/50 cursor-pointer group/req"
                            >
                              <span className={clsx("text-[10px] font-bold w-8 shrink-0", methodColor)}>{req.method.substring(0, 3)}</span>
                              <span className="text-slate-400 group-hover/req:text-slate-200 truncate text-xs">{req.name}</span>
                            </div>
                          );
                        })}
                        {col.requests.length === 0 && col.folders.length === 0 && (
                          <div className="text-xs text-slate-600 italic p-2">Empty</div>
                        )}
                      </div>
                    )}
                  </div>
                ))}

                {collections.filter(c => c.projectId === proj.id).length === 0 && !creatingCollectionIn && (
                  <div className="text-xs text-slate-600 italic pl-8 py-2">No collections</div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};