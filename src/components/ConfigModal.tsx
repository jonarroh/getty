import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { useSettingsStore } from '../store';
import { X, Check } from 'lucide-react';
import { Theme } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const ConfigModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { themes, updateThemes } = useSettingsStore();
  const [jsonValue, setJsonValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setJsonValue(JSON.stringify(themes, null, 2));
      setError(null);
    }
  }, [isOpen, themes]);

  const handleSave = () => {
    try {
      const parsed: Theme[] = JSON.parse(jsonValue);
      // Basic validation
      if (!Array.isArray(parsed) || parsed.length === 0 || !parsed[0].colors) {
        throw new Error("Invalid schema. Must be an array of Themes.");
      }
      updateThemes(parsed);
      onClose();
    } catch (e: any) {
      setError(e.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center">
      <div className="bg-surface border border-slate-700 w-[700px] h-[600px] rounded-lg shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-background">
          <h2 className="text-lg font-bold flex items-center gap-2">
            Configuration
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X /></button>
        </div>

        {/* Info */}
        <div className="p-4 bg-background/50 text-sm text-secondary border-b border-slate-800">
          Edit the JSON below to manage themes. You can add new themes to the list.
        </div>

        {/* Editor */}
        <div className="flex-1 border-b border-slate-700">
          <Editor
            height="100%"
            defaultLanguage="json"
            theme="vs-dark"
            value={jsonValue}
            onChange={(val) => setJsonValue(val || '')}
            options={{
              minimap: { enabled: false },
              fontSize: 13,
              scrollBeyondLastLine: false,
              automaticLayout: true
            }}
          />
        </div>

        {/* Footer */}
        <div className="p-4 bg-background flex justify-between items-center">
          <span className="text-danger text-sm">{error}</span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded text-slate-300 hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-primary hover:bg-primary/80 text-white rounded font-bold flex items-center gap-2"
            >
              <Check size={16} /> Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};