import React, { useState } from 'react';
import { useCollectionStore } from '../store';
import { UploadCloud, X, FileJson } from 'lucide-react';
import clsx from 'clsx';

export const ImportModal: React.FC = () => {
  const { isImportModalOpen, importTargetProjectId, importCollection, closeImportModal } = useCollectionStore();
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const processFile = (file: File) => {
    // Relaxed check: Accept anything with .json extension OR application/json type
    if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
      setError('Only .json files are supported');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        if (importTargetProjectId) {
          importCollection(importTargetProjectId, json);
          closeImportModal();
        } else {
          setError('No target project selected');
        }
      } catch (err) {
        console.error(err);
        setError('Invalid JSON format or structure');
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    setError(null);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  if (!isImportModalOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface border border-slate-700 w-full max-w-lg rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-background">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <UploadCloud size={20} className="text-primary" /> Import Collection
          </h2>
          <button onClick={closeImportModal} className="text-slate-400 hover:text-white"><X size={20} /></button>
        </div>

        <div className="p-8">
          <div
            className={clsx(
              "border-2 border-dashed rounded-xl h-64 flex flex-col items-center justify-center transition-all cursor-pointer relative",
              isDragging
                ? "border-primary bg-primary/10 scale-[1.02]"
                : "border-slate-600 bg-background hover:border-slate-500"
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => document.getElementById('file-upload')?.click()}
          >
            <input
              id="file-upload"
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={handleFileSelect}
            />

            <div className="bg-surface p-4 rounded-full mb-4 shadow-lg">
              <FileJson size={32} className="text-primary" />
            </div>

            <p className="text-slate-200 font-bold text-lg">Drag & Drop OpenAPI JSON</p>
            <p className="text-slate-500 text-sm mt-2">or click to browse files</p>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-900/20 border border-red-900/50 rounded text-red-400 text-sm text-center">
              {error}
            </div>
          )}
        </div>

        <div className="p-4 bg-background/50 text-center text-xs text-slate-500">
          Supports OpenAPI 3.0 / Swagger JSON
        </div>
      </div>
    </div>
  );
};