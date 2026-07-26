import React, { useState, useEffect } from 'react';
import { 
  VocabularyWord, 
  SRSItem, 
  ReviewRating, 
  ShadowingPracticeRecord, 
  UserProfile 
} from './types';
import { INITIAL_VOCABULARY } from './lib/sampleData';
import { createInitialSRSItem, calculateNextSRS, isDueToday } from './lib/srs';
import { 
  auth, 
  loginWithGoogle, 
  loginGuest, 
  logoutUser, 
  saveWordToFirestore, 
  deleteWordFromFirestore, 
  saveSRSDataToFirestore, 
  saveShadowingRecordToFirestore,
  pushAllWordsToFirestore,
  fetchUserProfileFromFirestore,
  db
} from './lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, onSnapshot, query, where } from 'firebase/firestore';

// Components
import { Sidebar } from './components/Sidebar';
import { FlashcardViewer } from './components/FlashcardViewer';
import { ShadowingPractice } from './components/ShadowingPractice';
import { VocabularyTable } from './components/VocabularyTable';
import { GoogleSheetsSyncModal } from './components/GoogleSheetsSyncModal';
import { AICoachModal } from './components/AICoachModal';
import { StatsDashboard } from './components/StatsDashboard';
import { MatchingGame } from './components/MatchingGame';
import { QuizPractice } from './components/QuizPractice';
import { SpellingPractice } from './components/SpellingPractice';
import { CategoryLessons } from './components/CategoryLessons';
import { AccountSettingsModal } from './components/AccountSettingsModal';
import { LevelSpeakingChallenge } from './components/LevelSpeakingChallenge';
import { SpeakingTopicsHub } from './components/SpeakingTopicsHub';
import { PWAInstallPrompt } from './components/PWAInstallPrompt';
import { AdminPanel } from './components/AdminPanel';
import { SignInPage } from './components/SignInPage';

import { Menu, Flame, Table, Database, BookOpen, Layers, Zap, Award, Gamepad2, Edit3, Bot, ShieldCheck, LogOut, Sun, Moon, Monitor, Star, Mic } from 'lucide-react';

const LOCAL_STORAGE_KEY_WORDS = 'voxflow_vocabulary_words_v2';
const LOCAL_STORAGE_KEY_SRS = 'voxflow_srs_data_v2';
const LOCAL_STORAGE_KEY_UNLOCKED_LEVELS = 'voxflow_unlocked_levels_v2';
const ADMIN_EMAIL = 'berndvh015@gmail.com';

export default function App() {
  const [activeView, setActiveView] = useState<string>('flashcards');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSheetsModalOpen, setIsSheetsModalOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [theme, setTheme] = useState<'system' | 'dark' | 'light'>(() => {
    return (localStorage.getItem('voxflow_theme') as 'system' | 'dark' | 'light') || 'system';
  });

  // Theme Mode Auto Switcher
  useEffect(() => {
    localStorage.setItem('voxflow_theme', theme);
    let activeTheme = theme;
    if (theme === 'system') {
      activeTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    if (activeTheme === 'light') {
      document.body.classList.add('light-mode');
    } else {
      document.body.classList.remove('light-mode');
    }
  }, [theme]);

  // Load words from localStorage or fallback to sampleData
  const [words, setWords] = useState<VocabularyWord[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY_WORDS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Failed to parse localStorage words:', e);
    }
    return INITIAL_VOCABULARY;
  });

  // SRS Map
  const [srsMap, setSrsMap] = useState<Record<string, SRSItem>>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY_SRS);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to parse localStorage SRS:', e);
    }
    return {};
  });

  const [selectedCategoryWords, setSelectedCategoryWords] = useState<VocabularyWord[] | null>(null);
  const [selectedShadowingWord, setSelectedShadowingWord] = useState<VocabularyWord | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<User | any>(null);
  const [userProfile, setUserProfile] = useState<UserProfile>({
    uid: '',
    email: null,
    displayName: null,
    photoURL: null,
    dailyGoal: 10,
    streak: 3,
    role: 'learner',
  });

  // CEFR Unlocked Levels State (A1 -> C2)
  const [unlockedLevels, setUnlockedLevels] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY_UNLOCKED_LEVELS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Failed to parse unlocked levels:', e);
    }
    return ['A1', 'A2'];
  });

  // Save unlocked levels
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_UNLOCKED_LEVELS, JSON.stringify(unlockedLevels));
    } catch (e) {
      console.error('Failed to save unlocked levels:', e);
    }
  }, [unlockedLevels]);

  // Admin Email Auto Role Enforcement
  useEffect(() => {
    const currentEmail = firebaseUser?.email || userProfile.email;
    if (currentEmail && currentEmail.toLowerCase().trim() === ADMIN_EMAIL.toLowerCase()) {
      if (userProfile.role !== 'admin') {
        setUserProfile(prev => ({
          ...prev,
          role: 'admin',
          email: currentEmail,
        }));
      }
    }
  }, [firebaseUser?.email, userProfile.email, userProfile.role]);

  // Save words permanently to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_WORDS, JSON.stringify(words));
    } catch (e) {
      console.error('Failed to save words to localStorage:', e);
    }
  }, [words]);

  // Save SRS map to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_SRS, JSON.stringify(srsMap));
    } catch (e) {
      console.error('Failed to save SRS to localStorage:', e);
    }
  }, [srsMap]);

  // Initialize missing SRS items for words
  useEffect(() => {
    setSrsMap(prev => {
      const nextMap = { ...prev };
      let changed = false;
      words.forEach(w => {
        if (!nextMap[w.id]) {
          nextMap[w.id] = createInitialSRSItem(w.id, firebaseUser?.uid);
          changed = true;
        }
      });
      return changed ? nextMap : prev;
    });
  }, [words, firebaseUser?.uid]);

  // Firebase Auth State & Real-time Firestore Listener
  useEffect(() => {
    // 1. Listen for global published words from Firestore (auto-sync for all learners)
    const wordsCol = collection(db, 'words');
    const unsubWords = onSnapshot(wordsCol, async (snapshot) => {
      if (!snapshot.empty) {
        const firestoreWords: VocabularyWord[] = [];
        snapshot.forEach(docSnap => {
          firestoreWords.push(docSnap.data() as VocabularyWord);
        });

        setWords(prev => {
          const map = new Map<string, VocabularyWord>();
          // Existing local words
          prev.forEach(w => map.set(w.id, w));
          // Cloud Firestore words override/sync
          firestoreWords.forEach(w => map.set(w.id, w));
          return Array.from(map.values());
        });
      } else {
        // Auto seed curriculum to Firestore if empty
        try {
          await pushAllWordsToFirestore(INITIAL_VOCABULARY, 'admin_published');
        } catch (err) {
          console.error('Auto seed error:', err);
        }
      }
    });

    // 2. Listen to Auth State
    const unsubscribeAuth = onAuthStateChanged(auth, async (usr: User | null) => {
      if (usr) {
        setFirebaseUser(usr);
        const firestoreProfile = await fetchUserProfileFromFirestore(usr.uid);
        setUserProfile(prev => ({
          ...prev,
          uid: usr.uid,
          email: usr.email || firestoreProfile?.email || prev.email,
          displayName: firestoreProfile?.displayName || usr.displayName || usr.email?.split('@')[0] || 'Learner',
          photoURL: usr.photoURL || firestoreProfile?.photoURL || null,
          dailyGoal: firestoreProfile?.dailyGoal || prev.dailyGoal || 10,
          streak: firestoreProfile?.streak || prev.streak || 1,
          role: firestoreProfile?.role || prev.role || 'learner',
        }));
      }
    });

    return () => {
      unsubWords();
      unsubscribeAuth();
    };
  }, []);

  // Handlers
  const handleSignedIn = async (usr: any, role: 'admin' | 'learner') => {
    setFirebaseUser(usr);
    let firestoreProfile: UserProfile | null = null;
    if (usr?.uid) {
      firestoreProfile = await fetchUserProfileFromFirestore(usr.uid);
    }

    setUserProfile({
      uid: usr.uid || 'user_' + Date.now(),
      email: usr.email || firestoreProfile?.email || 'learner@voxflow.app',
      displayName: firestoreProfile?.displayName || usr.displayName || usr.email?.split('@')[0] || (role === 'admin' ? 'Administrator' : 'Learner'),
      photoURL: usr.photoURL || firestoreProfile?.photoURL || null,
      dailyGoal: firestoreProfile?.dailyGoal || 10,
      streak: firestoreProfile?.streak || 1,
      role: role,
    });
    if (role === 'admin') {
      setActiveView('admin-panel');
    } else {
      setActiveView('flashcards');
    }
  };

  const handleSignOut = async () => {
    try {
      await logoutUser();
    } catch (e) {
      console.error('Logout error:', e);
    }
    setFirebaseUser(null);
    setUserProfile({
      uid: '',
      email: null,
      displayName: null,
      photoURL: null,
      dailyGoal: 10,
      streak: 3,
      role: 'learner',
    });
  };

  // Handlers
  const handleReviewRating = (wordId: string, rating: ReviewRating) => {
    setSrsMap(prev => {
      const current = prev[wordId] || createInitialSRSItem(wordId, firebaseUser?.uid);
      const updated = calculateNextSRS(current, rating);

      if (firebaseUser) {
        saveSRSDataToFirestore(updated, firebaseUser.uid);
      }

      return {
        ...prev,
        [wordId]: updated,
      };
    });
  };

  const handleAddWords = (newWordsList: VocabularyWord[] | Omit<VocabularyWord, 'id' | 'createdAt'>[]) => {
    const formatted: VocabularyWord[] = newWordsList.map(w => {
      if ('id' in w && 'createdAt' in w) {
        return w as VocabularyWord;
      }
      return {
        ...w,
        id: `word_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        createdAt: new Date().toISOString(),
      } as VocabularyWord;
    });

    setWords(prev => {
      const map = new Map<string, VocabularyWord>();
      prev.forEach(item => map.set(item.id, item));
      formatted.forEach(item => map.set(item.id, item));
      return Array.from(map.values());
    });

    if (firebaseUser) {
      formatted.forEach(word => saveWordToFirestore(word, firebaseUser.uid));
    }
  };

  const handleDeleteWord = (wordId: string) => {
    setWords(prev => prev.filter(w => w.id !== wordId));
    setSrsMap(prev => {
      const copy = { ...prev };
      delete copy[wordId];
      return copy;
    });

    if (firebaseUser) {
      deleteWordFromFirestore(wordId);
    }
  };

  const handleOpenShadowing = (word: VocabularyWord) => {
    setSelectedShadowingWord(word);
    setActiveView('shadowing');
  };

  const handleToggleStarWord = (wordId: string) => {
    setWords(prev =>
      prev.map(w => {
        if (w.id === wordId) {
          const updatedWord = { ...w, isStarred: !w.isStarred };
          if (firebaseUser) {
            saveWordToFirestore(updatedWord, firebaseUser.uid);
          }
          return updatedWord;
        }
        return w;
      })
    );
  };

  const handleSelectCategoryDeck = (categoryWords: VocabularyWord[], mode?: 'flashcard' | 'quiz' | 'matching' | 'spelling') => {
    setSelectedCategoryWords(categoryWords);
    if (mode === 'quiz') setActiveView('quiz');
    else if (mode === 'matching') setActiveView('matching');
    else if (mode === 'spelling') setActiveView('spelling');
    else setActiveView('flashcards');
  };

  // Active word deck for practice modes
  const activeDeck = selectedCategoryWords || words;

  // Due SRS calculation
  const dueWords = activeDeck.filter(w => {
    const srs = srsMap[w.id];
    if (!srs) return true;
    return isDueToday(srs.dueDate);
  });

  // Lock Application behind SignInPage until user/learner signs in via Gmail/Firebase
  if (!firebaseUser && !userProfile.email) {
    return <SignInPage onSignedIn={handleSignedIn} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex font-sans antialiased">
      {/* Sidebar Navigation */}
      <Sidebar
        activeView={activeView}
        setActiveView={(view) => {
          setActiveView(view);
          if (view !== 'flashcards' && view !== 'quiz' && view !== 'matching' && view !== 'spelling') {
            setSelectedCategoryWords(null);
          }
        }}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        user={firebaseUser}
        onOpenSyncModal={() => setIsSheetsModalOpen(true)}
        onOpenAccountModal={() => setIsAccountModalOpen(true)}
        userRole={userProfile.role || 'learner'}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Mobile Smartphone PWA Install Banner */}
        <PWAInstallPrompt />

        {/* Top Header Toolbar */}
        <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white lg:hidden border border-slate-700"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div>
              <h2 className="text-sm font-extrabold text-white capitalize flex items-center gap-2">
                {activeView === 'admin-panel' && <><ShieldCheck className="w-4 h-4 text-purple-400" /> Admin Management Panel</>}
                {activeView === 'speaking_library' && <><Mic className="w-4 h-4 text-indigo-400" /> Speaking Practice Library (A1–C2)</>}
                {activeView === 'flashcards' && <><BookOpen className="w-4 h-4 text-indigo-400" /> 3D Flashcards</>}
                {activeView === 'favorites' && <><Star className="w-4 h-4 text-amber-400" /> Starred Favorites Deck</>}
                {activeView === 'level_challenge' && <><Award className="w-4 h-4 text-indigo-400" /> Speaking Challenge (A1–C2)</>}
                {activeView === 'categories' && <><Layers className="w-4 h-4 text-indigo-400" /> Categories & Lessons</>}
                {activeView === 'shadowing' && <><Zap className="w-4 h-4 text-indigo-400" /> Shadowing Practice</>}
                {activeView === 'quiz' && <><Award className="w-4 h-4 text-indigo-400" /> Vocabulary Quiz</>}
                {activeView === 'matching' && <><Gamepad2 className="w-4 h-4 text-indigo-400" /> Matching Game</>}
                {activeView === 'spelling' && <><Edit3 className="w-4 h-4 text-indigo-400" /> Spelling Challenge</>}
                {activeView === 'dashboard' && <><BookOpen className="w-4 h-4 text-indigo-400" /> Dashboard & Goals</>}
                {activeView === 'table' && <><Table className="w-4 h-4 text-indigo-400" /> Vocabulary Table</>}
                {activeView === 'ai-coach' && <><Bot className="w-4 h-4 text-purple-400" /> AI Coach & Feedback</>}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {userProfile.role === 'admin' ? (
              <>
                <button
                  onClick={() => setActiveView('admin-panel')}
                  className="px-3 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600 border border-purple-500/30 text-purple-300 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                  <span className="hidden sm:inline">Admin Panel</span>
                </button>

                {/* Quick Sheets Sync Button (Admin Only) */}
                <button
                  onClick={() => setIsSheetsModalOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600 border border-emerald-500/30 text-emerald-300 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
                >
                  <Table className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Sheets Sync</span>
                </button>

                {/* Account & Storage Sync (Admin) */}
                <button
                  onClick={() => setIsAccountModalOpen(true)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all flex items-center gap-1.5"
                  title="Account Settings & Role Panel"
                >
                  <Database className="w-4 h-4 text-purple-400" />
                  <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-purple-300 hidden sm:inline">
                    Admin
                  </span>
                </button>
              </>
            ) : (
              /* Learner Header Controls */
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveView('level_challenge')}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600 border border-indigo-500/30 text-indigo-300 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
                >
                  <Award className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="hidden sm:inline">Speaking Challenge</span>
                </button>

                <button
                  onClick={() => setIsAccountModalOpen(true)}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all flex items-center gap-1.5"
                  title="Learner Account"
                >
                  <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-emerald-400">
                    Learner
                  </span>
                </button>
              </div>
            )}

            {/* Quick Theme Toggle Button */}
            <button
              onClick={() => {
                if (theme === 'system') setTheme('dark');
                else if (theme === 'dark') setTheme('light');
                else setTheme('system');
              }}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all flex items-center gap-1"
              title={`Display Theme: ${theme.toUpperCase()} (Click to cycle System / Dark / Light)`}
            >
              {theme === 'light' && <Sun className="w-4 h-4 text-amber-400" />}
              {theme === 'dark' && <Moon className="w-4 h-4 text-indigo-400" />}
              {theme === 'system' && <Monitor className="w-4 h-4 text-emerald-400" />}
            </button>

            {/* Quick Sign Out Button */}
            <button
              onClick={handleSignOut}
              className="p-2 rounded-xl bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-300 border border-slate-700 transition-all flex items-center gap-1"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* View Switcher Container */}
        <main className="flex-1 p-3 sm:p-6 overflow-y-auto">
          {activeView === 'admin-panel' && (
            <AdminPanel
              words={words}
              onWordsUpdated={(updated) => setWords(updated)}
              adminEmail={firebaseUser?.email}
            />
          )}

          {activeView === 'dashboard' && (
            <StatsDashboard
              words={words}
              srsMap={srsMap}
              user={userProfile}
            />
          )}

          {activeView === 'speaking_library' && (
            <SpeakingTopicsHub
              onOpenShadowing={handleOpenShadowing}
              userRole={userProfile.role || 'learner'}
            />
          )}

          {activeView === 'favorites' && (
            words.filter(w => w.isStarred).length > 0 ? (
              <FlashcardViewer
                words={words.filter(w => w.isStarred)}
                srsMap={srsMap}
                onReviewRating={handleReviewRating}
                onOpenShadowing={handleOpenShadowing}
                onToggleStarWord={handleToggleStarWord}
              />
            ) : (
              <div className="flex flex-col items-center justify-center p-12 bg-slate-900 border border-slate-800 rounded-3xl text-center max-w-xl mx-auto my-8 shadow-2xl space-y-4">
                <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Star className="w-8 h-8 fill-amber-400/20 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-white mb-1">No Starred Favorites Yet</h3>
                  <p className="text-slate-400 text-xs leading-relaxed max-w-md">
                    Star any vocabulary card while studying or browsing flashcards to collect them here for quick review!
                  </p>
                </div>
                <button
                  onClick={() => setActiveView('flashcards')}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all shadow-lg shadow-indigo-600/30"
                >
                  Go to 3D Flashcards
                </button>
              </div>
            )
          )}

          {activeView === 'level_challenge' && (
            <LevelSpeakingChallenge
              words={words}
              unlockedLevels={unlockedLevels}
              onLevelPassed={(passedLevel, nextLevel) => {
                if (nextLevel && nextLevel !== 'MAX' && !unlockedLevels.includes(nextLevel)) {
                  setUnlockedLevels(prev => [...prev, nextLevel]);
                }
              }}
              userRole={userProfile.role || 'learner'}
              onOpenShadowing={handleOpenShadowing}
            />
          )}

          {activeView === 'categories' && (
            <CategoryLessons
              words={words}
              onSelectCategoryDeck={handleSelectCategoryDeck}
              unlockedLevels={unlockedLevels}
              onStartLevelChallenge={(lvl) => setActiveView('level_challenge')}
              userRole={userProfile.role || 'learner'}
            />
          )}

          {activeView === 'flashcards' && (
            <FlashcardViewer
              words={dueWords.length > 0 ? dueWords : activeDeck}
              srsMap={srsMap}
              onReviewRating={handleReviewRating}
              onOpenShadowing={handleOpenShadowing}
              onToggleStarWord={handleToggleStarWord}
            />
          )}

          {activeView === 'shadowing' && (
            <ShadowingPractice
              selectedWord={selectedShadowingWord}
              allWords={words}
              onSaveRecord={(record) => {
                if (firebaseUser) saveShadowingRecordToFirestore(record, firebaseUser.uid);
              }}
            />
          )}

          {activeView === 'quiz' && (
            <QuizPractice words={activeDeck} />
          )}

          {activeView === 'matching' && (
            <MatchingGame words={activeDeck} />
          )}

          {activeView === 'spelling' && (
            <SpellingPractice words={activeDeck} />
          )}

          {activeView === 'table' && (
            <VocabularyTable
              words={words}
              srsMap={srsMap}
              onAddWord={(newWord) => handleAddWords([newWord])}
              onDeleteWord={handleDeleteWord}
              onOpenShadowing={handleOpenShadowing}
              onOpenSheetsSync={() => setIsSheetsModalOpen(true)}
              onToggleStarWord={handleToggleStarWord}
              userRole={userProfile.role || 'learner'}
            />
          )}

          {activeView === 'ai-coach' && (
            <AICoachModal
              onAddGeneratedWords={(generated) => {
                handleAddWords(generated);
                setActiveView('flashcards');
              }}
            />
          )}
        </main>
      </div>

      {/* Google Sheets Sync Modal */}
      {isSheetsModalOpen && (
        <GoogleSheetsSyncModal
          onSyncWords={(syncedWords) => {
            handleAddWords(syncedWords);
            setIsSheetsModalOpen(false);
            setActiveView('table');
          }}
        />
      )}

      {/* Account & Storage Settings Modal */}
      <AccountSettingsModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        user={firebaseUser}
        words={words}
        onWordsUpdated={(updated) => setWords(updated)}
        profile={userProfile}
        onProfileUpdated={(updated) => setUserProfile(updated)}
        onSignOut={handleSignOut}
        theme={theme}
        onThemeChange={(newTheme) => setTheme(newTheme)}
      />
    </div>
  );
}
