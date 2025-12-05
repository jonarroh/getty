import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { useSettingsStore } from '../store';
import { X, Check, Code, Palette, Moon, Sun, Download, Globe } from 'lucide-react';
import { Theme } from '../types';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const ConfigModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { themes, activeThemeId, language, setTheme, setLanguage, updateThemes, applyThemeToDom } = useSettingsStore();
  const { t, i18n } = useTranslation();
  const [viewMode, setViewMode] = useState<'visual' | 'json'>('visual');
  const [jsonValue, setJsonValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [editingTheme, setEditingTheme] = useState<Theme | null>(null);

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang);
    i18n.changeLanguage(lang);
  };

  useEffect(() => {
    if (isOpen) {
      setJsonValue(JSON.stringify(themes, null, 2));
      setError(null);
      setEditingTheme(null);
      // Aplicar el tema actual al DOM cuando se abre el modal
      applyThemeToDom();
    }
  }, [isOpen, themes, applyThemeToDom]);

  const handleSaveJson = () => {
    try {
      const parsed: Theme[] = JSON.parse(jsonValue);
      if (!Array.isArray(parsed) || parsed.length === 0 || !parsed[0].colors) {
        throw new Error("Invalid schema. Must be an array of Themes.");
      }
      updateThemes(parsed);
      setViewMode('visual');
      setError(null);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleExportConfig = () => {
    const dataStr = JSON.stringify(themes, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = 'getty-themes.json';

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleColorChange = (themeId: string, colorKey: keyof Theme['colors'], value: string) => {
    const updatedThemes = themes.map(t => {
      if (t.id === themeId) {
        return {
          ...t,
          colors: {
            ...t.colors,
            [colorKey]: value
          }
        };
      }
      return t;
    });
    console.log('Updating themes with new colors:', updatedThemes);
    updateThemes(updatedThemes);
  };

  if (!isOpen) return null;

  const activeTheme = themes.find(t => t.id === activeThemeId);

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface border border-slate-700 w-full max-w-5xl h-[90vh] rounded-lg shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-background">
          <div>
            <h2 className="text-2xl font-bold">{t('settings.title')}</h2>
            <p className="text-sm text-slate-400 mt-1">{t('settings.subtitle')}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportConfig}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded flex items-center gap-2 text-sm"
              title={t('settings.exportConfig')}
            >
              <Download size={16} /> {t('settings.exportConfig')}
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-white p-2"><X size={20} /></button>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="px-6 pt-4 flex gap-2 border-b border-slate-800">
          <button
            onClick={() => setViewMode('visual')}
            className={clsx(
              "px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2",
              viewMode === 'visual'
                ? "border-primary text-primary"
                : "border-transparent text-slate-400 hover:text-slate-200"
            )}
          >
            <Palette size={16} /> {t('settings.visualEditor')}
          </button>
          <button
            onClick={() => setViewMode('json')}
            className={clsx(
              "px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2",
              viewMode === 'json'
                ? "border-primary text-primary"
                : "border-transparent text-slate-400 hover:text-slate-200"
            )}
          >
            <Code size={16} /> {t('settings.jsonEditor')}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {viewMode === 'visual' ? (
            <div className="p-6 space-y-8">
              {/* Language Section */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Globe size={18} className="text-primary" />
                  <h3 className="text-lg font-bold uppercase tracking-wide text-slate-300">{t('settings.language')}</h3>
                </div>

                <div className="bg-background/50 rounded-lg p-6 border border-slate-800">
                  <label className="block text-sm font-medium text-slate-300 mb-3">{t('settings.selectLanguage')}</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => handleLanguageChange('en')}
                      className={clsx(
                        "p-4 rounded-lg border-2 transition-all text-left",
                        language === 'en'
                          ? "border-primary bg-primary/10"
                          : "border-slate-700 hover:border-slate-600 bg-surface"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold">English</span>
                        {language === 'en' && (
                          <span className="text-xs bg-primary text-white px-2 py-0.5 rounded-full">{t('settings.active')}</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-1">English (United States)</p>
                    </button>

                    <button
                      onClick={() => handleLanguageChange('es')}
                      className={clsx(
                        "p-4 rounded-lg border-2 transition-all text-left",
                        language === 'es'
                          ? "border-primary bg-primary/10"
                          : "border-slate-700 hover:border-slate-600 bg-surface"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold">Español</span>
                        {language === 'es' && (
                          <span className="text-xs bg-primary text-white px-2 py-0.5 rounded-full">{t('settings.active')}</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-1">Español (Latinoamérica)</p>
                    </button>
                  </div>
                </div>
              </section>

              {/* Appearance Section */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Palette size={18} className="text-primary" />
                  <h3 className="text-lg font-bold uppercase tracking-wide text-slate-300">{t('settings.appearance')}</h3>
                </div>

                <div className="bg-background/50 rounded-lg p-6 border border-slate-800">
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-slate-300 mb-3">{t('settings.activeTheme')}</label>
                    <div className="grid grid-cols-2 gap-3">
                      {themes.map(theme => (
                        <button
                          key={theme.id}
                          onClick={() => setTheme(theme.id)}
                          className={clsx(
                            "relative p-4 rounded-lg border-2 transition-all text-left",
                            activeThemeId === theme.id
                              ? "border-primary bg-primary/10"
                              : "border-slate-700 hover:border-slate-600 bg-surface"
                          )}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              {activeThemeId === theme.id ? <Moon size={16} className="text-primary" /> : <Sun size={16} className="text-slate-500" />}
                              <span className="font-bold">{theme.name}</span>
                            </div>
                            {activeThemeId === theme.id && (
                              <span className="text-xs bg-primary text-white px-2 py-0.5 rounded-full">{t('settings.active')}</span>
                            )}
                          </div>
                          <div className="flex gap-1.5">
                            {Object.entries(theme.colors).slice(0, 7).map(([key, color]) => (
                              <div
                                key={key}
                                className="w-6 h-6 rounded border border-slate-700"
                                style={{ backgroundColor: color }}
                                title={key}
                              />
                            ))}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Theme Color Editor */}
                  {activeTheme && (
                    <div className="mt-6 pt-6 border-t border-slate-800">
                      <div className="flex items-center justify-between mb-4">
                        <label className="block text-sm font-medium text-slate-300">
                          {t('settings.customize')} "{activeTheme.name}" {t('settings.colors')}
                        </label>
                        <button
                          onClick={() => setEditingTheme(editingTheme ? null : activeTheme)}
                          className="text-xs text-primary hover:text-primary/80"
                        >
                          {editingTheme ? t('settings.hideEditor') : t('settings.showEditor')}
                        </button>
                      </div>

                      {editingTheme && (
                        <div className="grid grid-cols-2 gap-4">
                          {Object.entries(activeTheme.colors).map(([key, value]) => (
                            <div key={key} className="flex items-center gap-3">
                              <input
                                type="color"
                                value={value}
                                onChange={(e) => handleColorChange(activeTheme.id, key as keyof Theme['colors'], e.target.value)}
                                className="w-12 h-10 rounded border border-slate-700 cursor-pointer bg-transparent"
                              />
                              <div className="flex-1">
                                <label className="text-xs text-slate-400 capitalize">{key}</label>
                                <input
                                  type="text"
                                  value={value}
                                  onChange={(e) => handleColorChange(activeTheme.id, key as keyof Theme['colors'], e.target.value)}
                                  className="w-full bg-surface border border-slate-700 rounded px-3 py-1.5 text-sm font-mono focus:outline-none focus:border-primary"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </section>

              {/* Info Section */}
              <section>
                <div className="bg-blue-900/20 border border-blue-800/50 rounded-lg p-4">
                  <p className="text-sm text-blue-300">
                    <strong>{t('settings.tip')}:</strong> {t('settings.tipText')}
                  </p>
                </div>
              </section>
            </div>
          ) : (
            <div className="h-full flex flex-col">
              <div className="p-4 bg-background/50 text-sm text-secondary border-b border-slate-800">
                {t('settings.editJson')}
              </div>
              <div className="flex-1">
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
              {error && (
                <div className="p-3 bg-red-900/20 border-t border-red-800 text-red-400 text-sm">
                  {error}
                </div>
              )}
              <div className="p-4 bg-background border-t border-slate-700 flex justify-end gap-2">
                <button
                  onClick={() => setViewMode('visual')}
                  className="px-4 py-2 rounded text-slate-300 hover:bg-slate-700"
                >
                  {t('settings.cancel')}
                </button>
                <button
                  onClick={handleSaveJson}
                  className="px-4 py-2 bg-primary hover:bg-primary/80 text-white rounded font-bold flex items-center gap-2"
                >
                  <Check size={16} /> {t('settings.apply')}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer - Only show in visual mode */}
        {viewMode === 'visual' && (
          <div className="p-4 bg-background border-t border-slate-700 flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-primary hover:bg-primary/80 text-white rounded font-bold"
            >
              {t('settings.done')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};