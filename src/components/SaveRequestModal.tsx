import React, { useState } from 'react';
import { useCollectionStore, useRequestStore } from '../store';
import { X, Save } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const SaveRequestModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { projects, collections, saveRequest } = useCollectionStore();
  const { activeRequest, updateActiveRequestName } = useRequestStore();
  const { t } = useTranslation();

  const [requestName, setRequestName] = useState(activeRequest.name || 'New Request');
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projects[0]?.id || '');
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>('');

  React.useEffect(() => {
    if (isOpen) {
      setRequestName(activeRequest.name);
      // Try to select first project/collection if not set
      if (!selectedProjectId && projects.length > 0) setSelectedProjectId(projects[0].id);
    }
  }, [isOpen, activeRequest, projects]);

  const filteredCollections = collections.filter(c => c.projectId === selectedProjectId);

  const handleSave = () => {
    if (!selectedCollectionId) {
      toast.error(t('toast.selectCollection'));
      return;
    }

    // Update local name in RequestStore
    updateActiveRequestName(requestName);

    // Save to Collection Store (Creates new ID)
    saveRequest({ ...activeRequest, name: requestName }, selectedCollectionId);

    toast.success(`${t('toast.requestSaved')}`);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface border border-slate-700 w-full max-w-md rounded-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-background">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Save size={18} className="text-primary" /> {t('modals.saveRequest')}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={20} /></button>
        </div>

        <div className="p-6 flex flex-col gap-4">
          <div>
            <label className="text-xs text-slate-400 font-bold uppercase block mb-1">{t('modals.requestName')}</label>
            <input
              type="text"
              value={requestName}
              onChange={(e) => setRequestName(e.target.value)}
              className="w-full bg-background border border-slate-600 rounded p-2 text-sm text-white focus:border-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs text-slate-400 font-bold uppercase block mb-1">{t('modals.selectProject')}</label>
            <select
              value={selectedProjectId}
              onChange={(e) => { setSelectedProjectId(e.target.value); setSelectedCollectionId(''); }}
              className="w-full bg-background border border-slate-600 rounded p-2 text-sm text-white focus:border-primary focus:outline-none"
            >
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs text-slate-400 font-bold uppercase block mb-1">{t('modals.selectCollection')}</label>
            <select
              value={selectedCollectionId}
              onChange={(e) => setSelectedCollectionId(e.target.value)}
              className="w-full bg-background border border-slate-600 rounded p-2 text-sm text-white focus:border-primary focus:outline-none"
              disabled={filteredCollections.length === 0}
            >
              <option value="">{t('modals.chooseCollection')}</option>
              {filteredCollections.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            {filteredCollections.length === 0 && selectedProjectId && (
              <p className="text-xs text-orange-400 mt-1">{t('modals.noCollections')}</p>
            )}
          </div>
        </div>

        <div className="p-4 bg-background/50 border-t border-slate-700 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-slate-400 hover:text-white">{t('modals.cancel')}</button>
          <button
            onClick={handleSave}
            disabled={!selectedCollectionId || !requestName}
            className="px-4 py-2 bg-primary hover:bg-primary/90 text-white text-sm font-bold rounded disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t('modals.save')}
          </button>
        </div>
      </div>
    </div>
  );
};