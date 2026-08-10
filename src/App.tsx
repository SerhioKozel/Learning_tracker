import { useState, useEffect, useCallback, useRef } from 'react';
import { Search, Command, Plus, Moon, Sun, X } from 'lucide-react';
import Sidebar, { type View } from './components/Sidebar';
import Dashboard from './components/Dashboard';
import BoardsList from './components/BoardsList';
import BoardView from './components/BoardView';
import Statistics from './components/Statistics';
import CalendarView from './components/CalendarView';
import SettingsView from './components/SettingsView';
import TopicDrawer from './components/TopicDrawer';
import { useDataStore } from './hooks/useDataStore';
import type { Topic } from './types';

export type Theme = 'dark' | 'light';

export default function App() {
  const store = useDataStore();

  const [view, setView] = useState<View>('dashboard');
  const [activeBoardId, setActiveBoardId] = useState<string | null>(null);
  const [activeTopicId, setActiveTopicId] = useState<string | null>(null);
  const [theme, setTheme] = useState<Theme>(
    () => (typeof document !== 'undefined' && document.documentElement.classList.contains('light'))
      ? 'light'
      : 'dark',
  );

  // Search palette
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // New topic modal
  const [newTopicOpen, setNewTopicOpen] = useState(false);
  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [newTopicBoardId, setNewTopicBoardId] = useState<string>('');

  // ─── Theme ─────────────────────────────────────────────────────────────────

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      document.documentElement.classList.remove('dark', 'light');
      document.documentElement.classList.add(next);
      localStorage.setItem('theme', next);
      return next;
    });
  }, []);

  // ─── Keyboard shortcuts ────────────────────────────────────────────────────

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (searchOpen) { setSearchOpen(false); setSearchQuery(''); return; }
        if (activeTopicId) { setActiveTopicId(null); return; }
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [searchOpen, activeTopicId]);

  useEffect(() => {
    if (searchOpen && searchInputRef.current) searchInputRef.current.focus();
  }, [searchOpen]);

  // Pre-select first board for new topic modal
  useEffect(() => {
    if (store.boards.length > 0 && !newTopicBoardId) {
      setNewTopicBoardId(store.boards[0].id);
    }
  }, [store.boards, newTopicBoardId]);

  // ─── Navigation ────────────────────────────────────────────────────────────

  const handleView = (v: View) => {
    if (v === 'board' && !activeBoardId && store.boards.length > 0) {
      setActiveBoardId(store.boards[0].id);
    }
    setView(v);
  };

  const handleSelectBoard = (id: string) => {
    setActiveBoardId(id);
    setView('board');
  };

  // ─── New topic ─────────────────────────────────────────────────────────────

  const handleCreateTopic = async () => {
    if (!newTopicTitle.trim() || !newTopicBoardId) return;
    const topic = await store.createTopic({ title: newTopicTitle.trim(), boardId: newTopicBoardId });
    setNewTopicOpen(false);
    setNewTopicTitle('');
    if (topic) {
      setActiveBoardId(newTopicBoardId);
      setView('board');
    }
  };

  // ─── Search ────────────────────────────────────────────────────────────────

  const searchResults: { topics: Topic[]; boards: typeof store.boards } = {
    topics: searchQuery
      ? store.topics
          .filter((t) =>
            t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase())),
          )
          .slice(0, 6)
      : [],
    boards: searchQuery
      ? store.boards
          .filter((b) => b.title.toLowerCase().includes(searchQuery.toLowerCase()))
          .slice(0, 4)
      : [],
  };

  const closeSearch = () => { setSearchOpen(false); setSearchQuery(''); };

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-screen overflow-hidden bg-ink-980">
      <div className="pointer-events-none fixed inset-0 bg-ink-900" />

      <Sidebar
        view={view}
        onView={handleView}
        activeBoardId={activeBoardId}
        onSelectBoard={handleSelectBoard}
        boards={store.boards}
        topics={store.topics}
        loading={store.loading}
      />

      <div className="relative flex min-w-0 flex-1 flex-col">
        {/* Header */}
        <header className="glass-strong flex h-14 shrink-0 items-center justify-between px-6">
          <button
            onClick={() => setSearchOpen(true)}
            className="relative w-80 rounded-lg border border-white/[0.06] bg-ink-800/60 py-2 pl-9 pr-16 text-left text-sm text-ink-500 transition-colors hover:border-white/[0.1] focus:border-sky-500/40 focus:outline-none focus:ring-1 focus:ring-sky-500/30"
          >
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
            <span>Search topics, boards, tags…</span>
            <kbd className="absolute right-2.5 top-1/2 flex -translate-y-1/2 items-center gap-0.5 rounded border border-white/[0.08] bg-ink-700 px-1.5 py-0.5 text-[10px] text-ink-500">
              <Command className="h-2.5 w-2.5" /> K
            </kbd>
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.06] bg-ink-800 text-ink-400 transition-colors hover:bg-white/[0.06] hover:text-ink-100"
              title={theme === 'dark' ? 'Switch to light' : 'Switch to dark'}
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <button onClick={() => setNewTopicOpen(true)} className="btn-primary text-xs">
              <Plus className="h-4 w-4" /> New topic
            </button>
          </div>
        </header>

        {/* Main content */}
        <main className="relative min-h-0 flex-1 overflow-y-auto">
          {store.loading ? (
            <div className="flex h-full items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-ink-700 border-t-sky-400" />
                <span className="text-sm text-ink-500">Loading your learning data…</span>
              </div>
            </div>
          ) : store.error ? (
            <div className="flex h-full items-center justify-center p-8">
              <div className="max-w-md text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-rose-500/15 ring-1 ring-rose-500/20">
                  <X className="h-6 w-6 text-rose-400" />
                </div>
                <h2 className="text-lg font-semibold text-white">Connection error</h2>
                <p className="mt-1.5 text-sm text-ink-500">{store.error}</p>
                <button onClick={() => store.refresh()} className="btn-primary mt-4">Retry</button>
              </div>
            </div>
          ) : (
            <div key={view} className="animate-fade-in">
              {view === 'dashboard' && (
                <Dashboard
                  boards={store.boards}
                  topics={store.topics}
                  onView={handleView}
                  onSelectBoard={handleSelectBoard}
                  onSelectTopic={setActiveTopicId}
                />
              )}
              {view === 'boards' && (
                <BoardsList
                  boards={store.boards}
                  topics={store.topics}
                  onSelectBoard={handleSelectBoard}
                  onCreateBoard={store.createBoard}
                  onUpdateBoard={store.updateBoard}
                  onDeleteBoard={store.deleteBoard}
                  onDuplicateBoard={store.duplicateBoard}
                />
              )}
              {view === 'board' && (
                <BoardView
                  boardId={activeBoardId}
                  boards={store.boards}
                  topics={store.topics}
                  onSelectTopic={setActiveTopicId}
                  onBack={() => handleView('boards')}
                  onCreateTopic={store.createTopic}
                  onDeleteTopic={store.deleteTopic}
                />
              )}
              {view === 'stats' && <Statistics boards={store.boards} topics={store.topics} />}
              {view === 'calendar' && <CalendarView topics={store.topics} onSelectTopic={setActiveTopicId} />}
              {view === 'settings' && (
                <SettingsView
                  theme={theme}
                  onToggleTheme={toggleTheme}
                  boards={store.boards}
                  topics={store.topics}
                  onExport={store.exportData}
                  onImport={store.importData}
                  onReset={store.resetData}
                />
              )}
            </div>
          )}
        </main>
      </div>

      {/* Topic drawer */}
      {activeTopicId && (
        <TopicDrawer
          topic={store.topics.find((t) => t.id === activeTopicId) ?? null}
          boards={store.boards}
          onClose={() => setActiveTopicId(null)}
          onUpdate={store.updateTopic}
          onAddChecklistItem={store.addChecklistItem}
          onDeleteChecklistItem={store.deleteChecklistItem}
          onAddResource={store.addResource}
          onDeleteResource={store.deleteResource}
          onDeleteTopic={store.deleteTopic}
        />
      )}

      {/* Search palette */}
      {searchOpen && (
        <div
          className="fixed inset-0 z-[70] flex items-start justify-center pt-[15vh]"
          onClick={closeSearch}
        >
          <div className="overlay absolute inset-0 animate-fade-in backdrop-blur-sm" />
          <div
            className="relative w-full max-w-xl animate-scale-in rounded-2xl border border-white/[0.08] bg-ink-800 shadow-lift"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 border-b border-white/[0.06] px-4 py-3">
              <Search className="h-4 w-4 text-ink-500" />
              <input
                ref={searchInputRef}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search topics, boards, tags…"
                className="flex-1 bg-transparent text-sm text-ink-100 placeholder:text-ink-600 focus:outline-none"
              />
              <kbd className="rounded border border-white/[0.08] bg-ink-700 px-1.5 py-0.5 text-[10px] text-ink-500">
                ESC
              </kbd>
            </div>
            <div className="max-h-96 overflow-y-auto p-2">
              {searchQuery === '' && (
                <p className="px-3 py-6 text-center text-sm text-ink-600">Start typing to search…</p>
              )}
              {searchQuery !== '' && searchResults.boards.length === 0 && searchResults.topics.length === 0 && (
                <p className="px-3 py-6 text-center text-sm text-ink-600">No results found</p>
              )}
              {searchResults.boards.length > 0 && (
                <div className="mb-2">
                  <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-ink-600">
                    Boards
                  </div>
                  {searchResults.boards.map((b) => (
                    <button
                      key={b.id}
                      onClick={() => { handleSelectBoard(b.id); closeSearch(); }}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-white/[0.06]"
                    >
                      <span className="text-sm font-medium text-ink-100">{b.title}</span>
                      <span className="text-xs text-ink-600">{b.topicCount} topics</span>
                    </button>
                  ))}
                </div>
              )}
              {searchResults.topics.length > 0 && (
                <div>
                  <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-ink-600">
                    Topics
                  </div>
                  {searchResults.topics.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => { setActiveTopicId(t.id); closeSearch(); }}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-white/[0.06]"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
                      <span className="flex-1 truncate text-sm font-medium text-ink-100">{t.title}</span>
                      {t.tags.slice(0, 2).map((tag) => (
                        <span key={tag} className="chip bg-ink-700 text-[10px] text-ink-400">{tag}</span>
                      ))}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* New topic modal */}
      {newTopicOpen && (
        <div
          className="overlay fixed inset-0 z-[70] flex items-center justify-center animate-fade-in backdrop-blur-sm"
          onClick={() => setNewTopicOpen(false)}
        >
          <div
            className="w-full max-w-md animate-scale-in rounded-2xl border border-white/[0.08] bg-ink-800 p-6 shadow-lift"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">New topic</h3>
              <button
                onClick={() => setNewTopicOpen(false)}
                className="rounded-md p-1.5 text-ink-500 transition-colors hover:bg-white/[0.06] hover:text-ink-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-medium text-ink-500">Title</label>
                <input
                  autoFocus
                  value={newTopicTitle}
                  onChange={(e) => setNewTopicTitle(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleCreateTopic(); }}
                  placeholder="What do you want to learn?"
                  className="mt-1.5 w-full rounded-lg border border-white/[0.06] bg-ink-900 px-3 py-2.5 text-sm text-ink-100 placeholder:text-ink-600 focus:border-sky-500/40 focus:outline-none focus:ring-1 focus:ring-sky-500/30"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-ink-500">Board</label>
                <select
                  value={newTopicBoardId}
                  onChange={(e) => setNewTopicBoardId(e.target.value)}
                  className="mt-1.5 w-full appearance-none rounded-lg border border-white/[0.06] bg-ink-900 px-3 py-2.5 text-sm text-ink-100 focus:border-sky-500/40 focus:outline-none"
                >
                  {store.boards.map((b) => (
                    <option key={b.id} value={b.id} className="bg-ink-700">{b.title}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setNewTopicOpen(false)} className="btn-soft">Cancel</button>
              <button
                onClick={handleCreateTopic}
                disabled={!newTopicTitle.trim()}
                className="btn-primary disabled:opacity-40"
              >
                Create topic
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
