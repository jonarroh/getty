import React from 'react';
import { KeyValuePair } from '../types';
import { Trash2, Plus } from 'lucide-react';
import { AutocompleteInput } from './AutocompleteInput';

interface Props {
  items: KeyValuePair[];
  onChange: (items: KeyValuePair[]) => void;
}

const COMMON_HEADERS = [
  'Accept', 'Accept-Charset', 'Accept-Encoding', 'Accept-Language', 'Authorization',
  'Cache-Control', 'Connection', 'Content-Length', 'Content-Type', 'Cookie', 'Date',
  'Expect', 'Forwarded', 'Host', 'If-Match', 'If-Modified-Since', 'If-None-Match',
  'Origin', 'Pragma', 'Referer', 'User-Agent', 'X-Requested-With', 'X-Forwarded-For'
];

const COMMON_VALUES = [
  'application/json', 'application/xml', 'application/x-www-form-urlencoded',
  'multipart/form-data', 'text/html', 'text/plain', 'Bearer ', 'Basic ',
  'no-cache', 'keep-alive', 'gzip, deflate', 'utf-8'
];

interface RowProps {
  item: KeyValuePair;
  onUpdate: (id: string, field: keyof KeyValuePair, value: any) => void;
  onDelete: (id: string) => void;
}

const KeyValueRow: React.FC<RowProps> = React.memo(({ item, onUpdate, onDelete }) => {
  return (
    <div className="grid grid-cols-12 gap-2 items-center group">
      <div className="col-span-1 flex justify-center">
        <input
          type="checkbox"
          checked={item.enabled}
          onChange={(e) => onUpdate(item.id, 'enabled', e.target.checked)}
          className="accent-primary w-4 h-4 cursor-pointer"
        />
      </div>
      <div className="col-span-4">
        <AutocompleteInput
          placeholder="Key"
          value={item.key}
          suggestions={COMMON_HEADERS}
          onChange={(e) => onUpdate(item.id, 'key', e.target.value)}
          className="w-full bg-surface border border-slate-700 rounded px-2 py-1 focus:outline-none focus:border-primary text-slate-200"
        />
      </div>
      <div className="col-span-6">
        <AutocompleteInput
          placeholder="Value"
          value={item.value}
          suggestions={COMMON_VALUES}
          onChange={(e) => onUpdate(item.id, 'value', e.target.value)}
          className="w-full bg-surface border border-slate-700 rounded px-2 py-1 focus:outline-none focus:border-primary text-slate-200"
        />
      </div>
      <div className="col-span-1 flex justify-center">
        <button
          onClick={() => onDelete(item.id)}
          className="text-slate-600 hover:text-danger opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
});

export const KeyValueEditor: React.FC<Props> = ({ items, onChange }) => {
  const updateItem = React.useCallback((id: string, field: keyof KeyValuePair, value: any) => {
    onChange(items.map(i => i.id === id ? { ...i, [field]: value } : i));
  }, [items, onChange]);

  const deleteItem = React.useCallback((id: string) => {
    onChange(items.filter(i => i.id !== id));
  }, [items, onChange]);

  const addItem = React.useCallback(() => {
    onChange([...items, { id: crypto.randomUUID(), key: '', value: '', enabled: true }]);
  }, [items, onChange]);

  return (
    <div className="flex flex-col gap-2 p-4 text-sm">
      <div className="grid grid-cols-12 gap-2 text-secondary font-medium mb-1">
        <div className="col-span-1 text-center">On</div>
        <div className="col-span-4">Key</div>
        <div className="col-span-6">Value</div>
        <div className="col-span-1"></div>
      </div>

      {items.map(item => (
        <KeyValueRow
          key={item.id}
          item={item}
          onUpdate={updateItem}
          onDelete={deleteItem}
        />
      ))}

      <button
        onClick={addItem}
        className="flex items-center gap-1 text-secondary hover:text-primary w-max mt-2 text-xs uppercase tracking-wide font-bold"
      >
        <Plus size={14} /> Add Row
      </button>
    </div>
  );
};