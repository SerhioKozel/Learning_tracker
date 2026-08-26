import { useState, useRef } from 'react';
import {
  Palette,
  Download,
  Upload,
  Trash2,
  RotateCcw,
  Moon,
  Sun,
  Info,
  CheckCircle,
  AlertTriangle,
  Database,
  Code2,
  Lock,
  Cloud,
} from 'lucide-react';
import type { Theme } from '../App';
import type { Board, Topic } from '../types';

interface SettingsViewProps {
  theme: Theme;
  onToggleTheme: () => void;
  boards: Board[];
  topics: Topic[];
  onExport: () => string;
  onImport: (json: string) => Promise<boolean>;
  onResetStats: () => Promise<void>;
  onReset: () => Promise<void>;
}

export default function SettingsView({ theme, onToggleTheme, boards, topics, onExport, onImport, onResetStats, onReset }: SettingsViewProps) {
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showResetStatsConfirm, setShowResetStatsConfirm] = useState(false);
  const [exportFeedback, setExportFeedback] = useState(false);
  const [importFeedback, setImportFeedback] = useState<'success' | 'error' | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const totalSize = JSON.stringify({ boards, topics }).length;

  const handleExport = () => {
    const data = onExport();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `learning-tracker-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setExportFeedback(true);
    setTimeout(() => setExportFeedback(false), 3000);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const success = await onImport(text);
    setImportFeedback(success ? 'success' : 'error');
    setTimeout(() => setImportFeedback(null), 3000);
    e.target.value = '';
  };

  const handleResetStats = async () => {
    await onResetStats();
    setShowResetStatsConfirm(false);
  };

  const handleReset = async () => {
    await onReset();
    setShowResetConfirm(false);
  };

  return (
    <div className="mx-auto max-w-3xl px-8 py-8">
      {/* Header */}
      <div className="animate-fade-up">
        <h1 className="text-3xl font-bold tracking-tight text-white">Settings</h1>
        <p className="mt-1.5 text-sm text-ink-500">Manage appearance, data, and application preferences.</p>
      </div>

      {/* Appearance */}
      <section className="mt-8 animate-fade-up animate-delay-100">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
          <Palette className="h-4 w-4 text-ink-500" /> Appearance
        </h2>
        <div className="mt-3 surface rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-ink-100">Theme</div>
              <div className="mt-0.5 text-xs text-ink-600">Choose your preferred color scheme</div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => theme !== 'dark' && onToggleTheme()}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-all ${
                  theme === 'dark' ? 'border-sky-500/40 bg-sky-500/10 text-sky-300' : 'border-white/[0.06] text-ink-500 hover:text-ink-100'
                }`}
              >
                <Moon className="h-4 w-4" /> Dark
              </button>
              <button
                onClick={() => theme !== 'light' && onToggleTheme()}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-all ${
                  theme === 'light' ? 'border-sky-500/40 bg-sky-500/10 text-sky-300' : 'border-white/[0.06] text-ink-500 hover:text-ink-100'
                }`}
              >
                <Sun className="h-4 w-4" /> Light
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Data Management */}
      <section className="mt-6 animate-fade-up animate-delay-200">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
          <Database className="h-4 w-4 text-ink-500" /> Data Management
        </h2>
        <div className="mt-3 surface rounded-2xl divide-y divide-white/[0.04]">
          {/* Export */}
          <div className="flex items-center justify-between p-5">
            <div>
              <div className="text-sm font-medium text-ink-100">Export data</div>
              <div className="mt-0.5 text-xs text-ink-600">Download all your boards and topics as a JSON file</div>
            </div>
            <button onClick={handleExport} className="btn-soft">
              <Download className="h-4 w-4" /> Export
            </button>
          </div>

          {/* Import */}
          <div className="flex items-center justify-between p-5">
            <div>
              <div className="text-sm font-medium text-ink-100">Import data</div>
              <div className="mt-0.5 text-xs text-ink-600">Restore from a previously exported JSON file</div>
            </div>
            <button onClick={handleImportClick} className="btn-soft">
              <Upload className="h-4 w-4" /> Import
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json"
              onChange={handleImportFile}
              className="hidden"
            />
          </div>

          {/* Reset */}
          <div className="flex items-center justify-between p-5">
            <div>
              <div className="text-sm font-medium text-amber-300">Reset statistics</div>
              <div className="mt-0.5 text-xs text-ink-600">
                Clear progress, history and status on all topics. Boards and content are kept.
              </div>
            </div>
            <button
              onClick={() => setShowResetStatsConfirm(true)}
              className="inline-flex w-28 items-center justify-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3.5 py-2 text-sm font-semibold text-amber-300 transition-all hover:bg-amber-500/20 active:scale-[0.98]"
            >
              <RotateCcw className="h-4 w-4" /> Reset
            </button>
          </div>

          {/* Reset all */}
          <div className="flex items-center justify-between p-5">
            <div>
              <div className="text-sm font-medium text-rose-400">Reset application</div>
              <div className="mt-0.5 text-xs text-ink-600">Delete all data and restore defaults. This cannot be undone.</div>
            </div>
            <button
              onClick={() => setShowResetConfirm(true)}
              className="inline-flex w-28 items-center justify-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3.5 py-2 text-sm font-semibold text-rose-400 transition-all hover:bg-rose-500/20 active:scale-[0.98]"
            >
              <Trash2 className="h-4 w-4" /> Reset
            </button>
          </div>
        </div>

        {/* Feedback */}
        {exportFeedback && (
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/[0.08] px-4 py-2.5 animate-scale-in">
            <CheckCircle className="h-4 w-4 text-emerald-400" />
            <span className="text-sm text-emerald-200">Data exported successfully</span>
          </div>
        )}
        {importFeedback === 'success' && (
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/[0.08] px-4 py-2.5 animate-scale-in">
            <CheckCircle className="h-4 w-4 text-emerald-400" />
            <span className="text-sm text-emerald-200">Data imported successfully</span>
          </div>
        )}
        {importFeedback === 'error' && (
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-rose-500/20 bg-rose-500/[0.08] px-4 py-2.5 animate-scale-in">
            <AlertTriangle className="h-4 w-4 text-rose-400" />
            <span className="text-sm text-rose-200">Import failed — invalid file format</span>
          </div>
        )}
      </section>

      {/* Storage info */}
      <section className="mt-6 animate-fade-up animate-delay-300">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
          <Info className="h-4 w-4 text-ink-500" /> Storage
        </h2>
        <div className="mt-3 surface rounded-2xl p-5">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-2xl font-bold tabular-nums text-white">{boards.length}</div>
              <div className="mt-0.5 text-xs text-ink-600">Boards</div>
            </div>
            <div>
              <div className="text-2xl font-bold tabular-nums text-white">{topics.length}</div>
              <div className="mt-0.5 text-xs text-ink-600">Topics</div>
            </div>
            <div>
              <div className="text-2xl font-bold tabular-nums text-white">{(totalSize / 1024).toFixed(1)}<span className="text-sm text-ink-500"> KB</span></div>
              <div className="mt-0.5 text-xs text-ink-600">Data size</div>
            </div>
          </div>
        </div>
      </section>

      {/* App Info */}
      <section className="mt-6 animate-fade-up animate-delay-400">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
          <Info className="h-4 w-4 text-ink-500" /> Application
        </h2>
        <div className="mt-3 surface rounded-2xl divide-y divide-white/[0.04]">
          <div className="flex items-center justify-between p-4">
            <span className="text-sm text-ink-500">Version</span>
            <span className="text-sm font-medium tabular-nums text-ink-100">0.4</span>
          </div>
          <div className="flex items-center justify-between p-4">
            <span className="text-sm text-ink-500">Backend</span>
            <span className="flex items-center gap-1.5 text-sm font-medium text-ink-100">
              <Cloud className="h-3.5 w-3.5 text-sky-400" /> Supabase
            </span>
          </div>
          <div className="flex items-center justify-between p-4">
            <span className="flex items-center gap-1.5 text-sm text-ink-500"><Lock className="h-3.5 w-3.5" /> Mode</span>
            <span className="text-sm font-medium text-ink-100">Cloud-synced · Single user</span>
          </div>
          <div className="flex items-center justify-between p-4">
            <span className="flex items-center gap-1.5 text-sm text-ink-500"><Code2 className="h-3.5 w-3.5" /> Source</span>
            <span className="text-sm font-medium text-ink-100">Open source</span>
          </div>
        </div>
      </section>

      {/* Reset stats confirmation modal */}
      {showResetStatsConfirm && (
        <div className="overlay fixed inset-0 z-[60] flex items-center justify-center backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm rounded-2xl border border-white/[0.08] bg-ink-700 p-6 shadow-lift animate-scale-in">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/15 ring-1 ring-amber-500/20">
              <RotateCcw className="h-6 w-6 text-amber-400" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-white">Reset statistics?</h3>
            <p className="mt-1.5 text-sm text-ink-500">
              All topics will be reset to <span className="font-medium text-ink-300">To Learn</span>, progress set to 0%, checklists unchecked, and history cleared. Your boards, notes, resources and tags are kept.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowResetStatsConfirm(false)}
                className="btn-soft flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleResetStats}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-amber-500 px-3.5 py-2 text-sm font-semibold text-always-white transition-all hover:bg-amber-600 active:scale-[0.98]"
              >
                <RotateCcw className="h-4 w-4" /> Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset confirmation modal */}
      {showResetConfirm && (
        <div className="overlay fixed inset-0 z-[60] flex items-center justify-center backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm rounded-2xl border border-white/[0.08] bg-ink-700 p-6 shadow-lift animate-scale-in">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-500/15 ring-1 ring-rose-500/20">
              <AlertTriangle className="h-6 w-6 text-rose-400" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-white">Reset all data?</h3>
            <p className="mt-1.5 text-sm text-ink-500">
              This will permanently delete all boards, topics, notes, and resources. This action cannot be undone.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="btn-soft flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleReset}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-rose-500 px-3.5 py-2 text-sm font-semibold text-always-white transition-all hover:bg-rose-600 active:scale-[0.98]"
              >
                <Trash2 className="h-4 w-4" /> Reset everything
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
