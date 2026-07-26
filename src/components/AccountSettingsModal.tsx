import React, { useState } from 'react';
import { 
  X, 
  User as UserIcon, 
  CloudUpload, 
  CloudDownload, 
  Database, 
  LogOut, 
  LogIn, 
  CheckCircle2, 
  Flame, 
  Target, 
  Sparkles,
  ShieldCheck,
  UserCheck,
  Lock,
  BookOpen,
  FileSpreadsheet,
  Sun,
  Moon,
  Monitor
} from 'lucide-react';
import { User } from 'firebase/auth';
import { loginWithGoogle, logoutUser, pushAllWordsToFirestore, fetchAllWordsFromFirestore } from '../lib/firebase';
import { VocabularyWord, UserProfile } from '../types';

interface AccountSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  words: VocabularyWord[];
  onWordsUpdated: (newWords: VocabularyWord[]) => void;
  profile: UserProfile;
  onProfileUpdated: (profile: UserProfile) => void;
  onSignOut?: () => void;
  theme?: 'system' | 'dark' | 'light';
  onThemeChange?: (newTheme: 'system' | 'dark' | 'light') => void;
}

export const AccountSettingsModal: React.FC<AccountSettingsModalProps> = ({
  isOpen,
  onClose,
  user,
  words,
  onWordsUpdated,
  profile,
  onProfileUpdated,
  onSignOut,
  theme = 'system',
  onThemeChange
}) => {
  const [isPushing, setIsPushing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [dailyGoalInput, setDailyGoalInput] = useState<number>(profile.dailyGoal || 10);

  const [adminPasscode, setAdminPasscode] = useState('');
  const [showAdminPassInput, setShowAdminPassInput] = useState(false);

  if (!isOpen) return null;

  const currentRole = profile.role || 'learner';

  const handleAdminVerify = () => {
    if (adminPasscode.trim() === 'admin123' || adminPasscode.trim() === 'voxflow2026') {
      onProfileUpdated({ ...profile, role: 'admin' });
      setSyncStatus('Admin access granted via passcode.');
      setShowAdminPassInput(false);
      setAdminPasscode('');
    } else {
      setSyncStatus('Invalid passcode. Admin access denied.');
    }
  };

  const handleLogin = async () => {
    try {
      await loginWithGoogle();
      setSyncStatus('Logged in with Google successfully!');
    } catch (e: any) {
      console.error('Google Sign-In failed:', e);
      setSyncStatus(`Sign-In error: ${e.message}`);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      setSyncStatus('Logged out.');
      if (onSignOut) {
        onSignOut();
      }
      onClose();
    } catch (e: any) {
      console.error('Logout error:', e);
    }
  };

  const handlePushToFirestore = async () => {
    if (words.length === 0) {
      setSyncStatus('No words to push.');
      return;
    }
    setIsPushing(true);
    setSyncStatus('Pushing curriculum words to Cloud Storage for all learners...');

    try {
      await pushAllWordsToFirestore(words, 'global_curriculum');
      if (user) {
        await pushAllWordsToFirestore(words, user.uid);
      }
      setSyncStatus(`Successfully published ${words.length} curriculum words to Cloud Storage! Learners can now sync these lessons.`);
    } catch (e: any) {
      setSyncStatus(`Push failed: ${e.message || 'Error uploading to Firestore'}`);
    } finally {
      setIsPushing(false);
    }
  };

  const handlePullFromFirestore = async () => {
    setIsPulling(true);
    setSyncStatus('Fetching latest curriculum pushed by Admin...');

    try {
      let cloudWords = await fetchAllWordsFromFirestore('global_curriculum');
      if (!cloudWords || cloudWords.length === 0) {
        const uid = user ? user.uid : 'guest_user';
        cloudWords = await fetchAllWordsFromFirestore(uid);
      }

      if (cloudWords && cloudWords.length > 0) {
        const wordMap = new Map<string, VocabularyWord>();
        words.forEach(w => wordMap.set(w.id, w));
        cloudWords.forEach(w => wordMap.set(w.id, w));

        const merged = Array.from(wordMap.values());
        onWordsUpdated(merged);
        setSyncStatus(`Successfully loaded ${cloudWords.length} curriculum words from Cloud Storage!`);
      } else {
        setSyncStatus('No cloud curriculum found in Firestore storage.');
      }
    } catch (e: any) {
      setSyncStatus(`Pull failed: ${e.message}`);
    } finally {
      setIsPulling(false);
    }
  };

  const handleSaveGoal = () => {
    const updated = { ...profile, dailyGoal: dailyGoalInput };
    onProfileUpdated(updated);
    setSyncStatus('Daily goal target saved!');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-600/20 border border-purple-500/30 text-purple-400">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-white">Account & Role Settings</h3>
              <p className="text-xs text-slate-400">Manage account permissions, Google Sheets sync & cloud storage</p>
            </div>
          </div>

          <button onClick={onClose} className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Account Info */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="User" className="w-10 h-10 rounded-full border border-indigo-500" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-indigo-600/30 border border-indigo-500/50 flex items-center justify-center text-indigo-300 font-bold">
                {user?.displayName ? user.displayName[0] : 'U'}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <p className="font-bold text-white text-sm">{user?.displayName || 'Learner Account'}</p>
                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                  currentRole === 'admin' 
                    ? 'bg-purple-950 text-purple-300 border-purple-700' 
                    : 'bg-emerald-950 text-emerald-300 border-emerald-700'
                }`}>
                  {currentRole.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-slate-400">{user?.email || 'Signed in locally'}</p>
            </div>
          </div>

          {user ? (
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-1.5 transition-all"
            >
              <LogOut className="w-3.5 h-3.5" /> Sign Out
            </button>
          ) : (
            <button
              onClick={handleLogin}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md shadow-indigo-600/20"
            >
              <LogIn className="w-3.5 h-3.5" /> Google Login
            </button>
          )}
        </div>

        {/* Learner Profile Information */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-emerald-400" /> Account Status
            </h4>
            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
              currentRole === 'admin' 
                ? 'bg-purple-950 text-purple-300 border-purple-700' 
                : 'bg-emerald-950 text-emerald-300 border-emerald-700'
            }`}>
              {currentRole === 'admin' ? 'ADMIN (Full Management)' : 'LEARNER (Lessons & Practice)'}
            </span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            {currentRole === 'admin' 
              ? 'You have administrative access to import Google Sheets, upload CSV vocabulary, and push lessons directly to Firestore.' 
              : 'You are signed in as a Learner. Your lessons, flashcards, and practice activities are auto-synced directly from the Admin curriculum.'}
          </p>

          {currentRole !== 'admin' && (
            <div className="pt-2">
              {!showAdminPassInput ? (
                <button
                  onClick={() => setShowAdminPassInput(true)}
                  className="text-[11px] font-semibold text-slate-500 hover:text-slate-300 underline transition-colors"
                >
                  Admin Access Passcode
                </button>
              ) : (
                <div className="flex gap-2 pt-1">
                  <input
                    type="password"
                    placeholder="Enter Admin Passcode"
                    value={adminPasscode}
                    onChange={(e) => setAdminPasscode(e.target.value)}
                    className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-purple-500 flex-1"
                  />
                  <button
                    onClick={handleAdminVerify}
                    className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold"
                  >
                    Verify
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Display Theme Selector */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Display Theme
          </h4>
          <div className="grid grid-cols-3 gap-2 pt-1">
            <button
              type="button"
              onClick={() => onThemeChange?.('system')}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all ${
                theme === 'system'
                  ? 'bg-purple-600 border-purple-400 text-white shadow-md'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Monitor className="w-4 h-4" />
              <span>System</span>
            </button>

            <button
              type="button"
              onClick={() => onThemeChange?.('dark')}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all ${
                theme === 'dark'
                  ? 'bg-purple-600 border-purple-400 text-white shadow-md'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Moon className="w-4 h-4" />
              <span>Dark</span>
            </button>

            <button
              type="button"
              onClick={() => onThemeChange?.('light')}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all ${
                theme === 'light'
                  ? 'bg-purple-600 border-purple-400 text-white shadow-md'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Sun className="w-4 h-4" />
              <span>Light</span>
            </button>
          </div>
        </div>

        {/* Sync & Cloud Section Based on Role */}
        <div className="space-y-3 pt-2 border-t border-slate-800">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Cloud Storage & Sync</h4>
            <span className="text-[10px] font-semibold text-slate-500">
              {currentRole === 'admin' ? 'Admin Privileges Active' : 'Learner Read-Only Mode'}
            </span>
          </div>

          {currentRole === 'admin' ? (
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handlePushToFirestore}
                disabled={isPushing}
                className="p-3.5 rounded-xl bg-purple-950/50 hover:bg-purple-900/60 border border-purple-500/30 text-purple-200 text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition-all group"
              >
                <CloudUpload className="w-5 h-5 text-purple-400 group-hover:scale-110 transition-transform" />
                <span>{isPushing ? 'Pushing...' : 'Push Curriculum to Learners'}</span>
              </button>

              <button
                onClick={handlePullFromFirestore}
                disabled={isPulling}
                className="p-3.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition-all group"
              >
                <CloudDownload className="w-5 h-5 text-indigo-400 group-hover:scale-110 transition-transform" />
                <span>{isPulling ? 'Pulling...' : 'Pull Cloud Storage Words'}</span>
              </button>
            </div>
          ) : (
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-start gap-2 text-xs text-slate-300">
                <Lock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-amber-300">Sheet Sync & Push Restricted to Admin</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Learners automatically study curriculum imported and published by the Admin.
                  </p>
                </div>
              </div>

              <button
                onClick={handlePullFromFirestore}
                disabled={isPulling}
                className="w-full py-2 px-3 rounded-lg bg-indigo-600/20 hover:bg-indigo-600 border border-indigo-500/30 text-indigo-300 hover:text-white text-xs font-bold flex items-center justify-center gap-2 transition-all"
              >
                <CloudDownload className="w-4 h-4" />
                <span>{isPulling ? 'Syncing...' : 'Sync Latest Admin Curriculum'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Daily Goal Config */}
        <div className="space-y-2 pt-2 border-t border-slate-800">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Target className="w-4 h-4 text-amber-400" /> Daily Review Target Words
            </label>
            <span className="text-xs text-amber-400 font-bold">{dailyGoalInput} words/day</span>
          </div>
          <div className="flex gap-2">
            <input
              type="number"
              min="5"
              max="100"
              value={dailyGoalInput}
              onChange={(e) => setDailyGoalInput(parseInt(e.target.value) || 10)}
              className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-bold text-sm"
            />
            <button
              onClick={handleSaveGoal}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700"
            >
              Save Target
            </button>
          </div>
        </div>

        {/* Status notification */}
        {syncStatus && (
          <div className="p-3 rounded-xl bg-slate-950 border border-indigo-500/30 text-xs text-indigo-300 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{syncStatus}</span>
          </div>
        )}
      </div>
    </div>
  );
};
