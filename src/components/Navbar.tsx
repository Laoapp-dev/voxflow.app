import React from 'react';
import { 
  BookOpen, 
  Mic, 
  ListOrdered, 
  FileSpreadsheet, 
  Sparkles, 
  Flame, 
  LogOut, 
  LogIn, 
  BarChart3,
  CheckCircle2
} from 'lucide-react';
import { UserProfile } from '../types';

export type NavTab = 'flashcards' | 'shadowing' | 'vocabulary' | 'sheets' | 'aicoach' | 'stats';

interface NavbarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  user: UserProfile | null;
  onLoginGoogle: () => void;
  onLoginGuest: () => void;
  onLogout: () => void;
  dueCount: number;
  masteredCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  user,
  onLoginGoogle,
  onLoginGuest,
  onLogout,
  dueCount,
  masteredCount,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-slate-100 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 p-0.5 shadow-lg shadow-indigo-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-indigo-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                  LinguaSync
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                  SRS & Shadowing
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">Spaced Repetition & Audio AI Coach</p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1 bg-slate-950/60 p-1.5 rounded-xl border border-slate-800/80">
            <button
              onClick={() => setActiveTab('flashcards')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'flashcards'
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Flashcards</span>
              {dueCount > 0 && (
                <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500 text-slate-950">
                  {dueCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('shadowing')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'shadowing'
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Mic className="w-4 h-4" />
              <span>Shadowing</span>
            </button>

            <button
              onClick={() => setActiveTab('vocabulary')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'vocabulary'
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <ListOrdered className="w-4 h-4" />
              <span>Vocabulary</span>
              {masteredCount > 0 && (
                <span className="ml-0.5 flex items-center gap-0.5 text-[10px] text-emerald-400 font-semibold">
                  <CheckCircle2 className="w-3 h-3" />
                  {masteredCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('sheets')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'sheets'
                  ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Google Sheets</span>
            </button>

            <button
              onClick={() => setActiveTab('aicoach')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'aicoach'
                  ? 'bg-purple-600 text-white shadow-sm shadow-purple-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Sparkles className="w-4 h-4 text-purple-300" />
              <span>AI Deck Generator</span>
            </button>

            <button
              onClick={() => setActiveTab('stats')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'stats'
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Stats</span>
            </button>
          </nav>

          {/* User Profile & Actions */}
          <div className="flex items-center gap-3">
            {/* Daily Streak Indicator */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold">
              <Flame className="w-4 h-4 fill-amber-400 text-amber-500 animate-pulse" />
              <span>{user?.streak || 1} Day Streak</span>
            </div>

            {/* User Auth Section */}
            {user ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60">
                  {user.photoURL ? (
                    <img 
                      src={user.photoURL} 
                      alt={user.displayName || 'User'} 
                      className="w-6 h-6 rounded-full border border-slate-600" 
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center text-xs font-bold text-white">
                      {(user.displayName || user.email || 'U')[0].toUpperCase()}
                    </div>
                  )}
                  <span className="text-xs font-medium text-slate-200 max-w-[100px] truncate hidden lg:inline">
                    {user.displayName || user.email || 'Learner'}
                  </span>
                </div>
                <button
                  onClick={onLogout}
                  title="Sign out"
                  className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={onLoginGoogle}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white transition-colors shadow-sm"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sync Google</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation Tabs */}
        <div className="md:hidden flex items-center justify-between py-2 border-t border-slate-800 overflow-x-auto gap-1 scrollbar-none">
          <button
            onClick={() => setActiveTab('flashcards')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${
              activeTab === 'flashcards' ? 'bg-indigo-600 text-white' : 'text-slate-400'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Cards ({dueCount})</span>
          </button>

          <button
            onClick={() => setActiveTab('shadowing')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${
              activeTab === 'shadowing' ? 'bg-indigo-600 text-white' : 'text-slate-400'
            }`}
          >
            <Mic className="w-3.5 h-3.5" />
            <span>Shadowing</span>
          </button>

          <button
            onClick={() => setActiveTab('vocabulary')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${
              activeTab === 'vocabulary' ? 'bg-indigo-600 text-white' : 'text-slate-400'
            }`}
          >
            <ListOrdered className="w-3.5 h-3.5" />
            <span>Vocab</span>
          </button>

          <button
            onClick={() => setActiveTab('sheets')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${
              activeTab === 'sheets' ? 'bg-emerald-600 text-white' : 'text-slate-400'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Sheets</span>
          </button>

          <button
            onClick={() => setActiveTab('aicoach')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${
              activeTab === 'aicoach' ? 'bg-purple-600 text-white' : 'text-slate-400'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Gen</span>
          </button>

          <button
            onClick={() => setActiveTab('stats')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${
              activeTab === 'stats' ? 'bg-indigo-600 text-white' : 'text-slate-400'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Stats</span>
          </button>
        </div>
      </div>
    </header>
  );
};
