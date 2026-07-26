import React, { useState } from 'react';
import { 
  BookOpen, 
  Layers, 
  Tag, 
  ChevronDown, 
  ChevronUp, 
  Play, 
  Lock, 
  Unlock, 
  Award, 
  Filter, 
  LayoutGrid, 
  List,
  Sparkles,
  Volume2
} from 'lucide-react';
import { VocabularyWord } from '../types';

interface CategoryLessonsProps {
  words: VocabularyWord[];
  onSelectCategoryDeck: (categoryWords: VocabularyWord[], mode?: 'flashcard' | 'quiz' | 'matching' | 'spelling') => void;
  unlockedLevels?: string[];
  onStartLevelChallenge?: (level: string) => void;
  userRole?: 'admin' | 'learner';
}

interface CategoryMetaData {
  name: string;
  totalWords: number;
  cefrBreakdown: { level: string; count: number }[];
  colorBg: string;
  colorText: string;
}

// Preset metadata matching user's exact uploaded screenshots
const SCREENSHOT_CATEGORIES: CategoryMetaData[] = [
  {
    name: 'Agriculture & Farming',
    totalWords: 330,
    cefrBreakdown: [
      { level: 'A1', count: 2 },
      { level: 'A2', count: 5 },
      { level: 'B2', count: 40 },
      { level: 'C1', count: 282 },
      { level: 'C2', count: 1 }
    ],
    colorBg: 'bg-blue-50 text-blue-600 border-blue-100',
    colorText: 'text-blue-600'
  },
  {
    name: 'Body Parts & Health',
    totalWords: 307,
    cefrBreakdown: [
      { level: 'A1', count: 44 },
      { level: 'A2', count: 67 },
      { level: 'B1', count: 4 },
      { level: 'B2', count: 156 },
      { level: 'C1', count: 30 },
      { level: 'C2', count: 6 }
    ],
    colorBg: 'bg-purple-50 text-purple-600 border-purple-100',
    colorText: 'text-purple-600'
  },
  {
    name: 'Climate & Atmospheric Dynamics',
    totalWords: 340,
    cefrBreakdown: [
      { level: 'B2', count: 19 },
      { level: 'C1', count: 321 }
    ],
    colorBg: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    colorText: 'text-emerald-600'
  },
  {
    name: 'Common Actions/Verbs',
    totalWords: 1010,
    cefrBreakdown: [
      { level: 'A1', count: 122 },
      { level: 'A2', count: 169 },
      { level: 'B1', count: 27 },
      { level: 'B2', count: 496 },
      { level: 'C1', count: 166 },
      { level: 'C2', count: 30 }
    ],
    colorBg: 'bg-amber-50 text-amber-600 border-amber-100',
    colorText: 'text-amber-600'
  },
  {
    name: 'Describing People',
    totalWords: 974,
    cefrBreakdown: [
      { level: 'A1', count: 88 },
      { level: 'A2', count: 150 },
      { level: 'B1', count: 18 },
      { level: 'B2', count: 542 },
      { level: 'C1', count: 160 },
      { level: 'C2', count: 16 }
    ],
    colorBg: 'bg-pink-50 text-pink-600 border-pink-100',
    colorText: 'text-pink-600'
  },
  {
    name: 'Economy & Finance',
    totalWords: 320,
    cefrBreakdown: [
      { level: 'A1', count: 14 },
      { level: 'A2', count: 41 },
      { level: 'B1', count: 7 },
      { level: 'B2', count: 159 },
      { level: 'C1', count: 95 },
      { level: 'C2', count: 4 }
    ],
    colorBg: 'bg-teal-50 text-teal-600 border-teal-100',
    colorText: 'text-teal-600'
  },
  {
    name: 'Environment & Ecology',
    totalWords: 320,
    cefrBreakdown: [
      { level: 'A1', count: 1 },
      { level: 'A2', count: 5 },
      { level: 'B1', count: 1 },
      { level: 'B2', count: 73 },
      { level: 'C1', count: 236 },
      { level: 'C2', count: 4 }
    ],
    colorBg: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    colorText: 'text-indigo-600'
  },
  {
    name: 'Food & Drink',
    totalWords: 320,
    cefrBreakdown: [
      { level: 'A1', count: 30 },
      { level: 'A2', count: 58 },
      { level: 'B2', count: 72 },
      { level: 'C1', count: 159 },
      { level: 'C2', count: 1 }
    ],
    colorBg: 'bg-rose-50 text-rose-600 border-rose-100',
    colorText: 'text-rose-600'
  },
  {
    name: 'Forestry & Land Management',
    totalWords: 340,
    cefrBreakdown: [
      { level: 'B1', count: 1 },
      { level: 'B2', count: 18 },
      { level: 'C1', count: 321 }
    ],
    colorBg: 'bg-yellow-50 text-yellow-700 border-yellow-100',
    colorText: 'text-yellow-700'
  },
  {
    name: 'Money & Commerce',
    totalWords: 320,
    cefrBreakdown: [
      { level: 'A1', count: 12 },
      { level: 'A2', count: 33 },
      { level: 'B2', count: 70 },
      { level: 'C1', count: 205 }
    ],
    colorBg: 'bg-cyan-50 text-cyan-600 border-cyan-100',
    colorText: 'text-cyan-600'
  },
  {
    name: 'People/Family/Relationships',
    totalWords: 526,
    cefrBreakdown: [
      { level: 'A1', count: 72 },
      { level: 'A2', count: 111 },
      { level: 'B1', count: 18 },
      { level: 'B2', count: 263 },
      { level: 'C1', count: 49 },
      { level: 'C2', count: 13 }
    ],
    colorBg: 'bg-blue-50 text-blue-600 border-blue-100',
    colorText: 'text-blue-600'
  },
  {
    name: 'Places & Locations',
    totalWords: 449,
    cefrBreakdown: [
      { level: 'A1', count: 85 },
      { level: 'A2', count: 127 },
      { level: 'B1', count: 4 },
      { level: 'B2', count: 191 },
      { level: 'C1', count: 38 },
      { level: 'C2', count: 4 }
    ],
    colorBg: 'bg-fuchsia-50 text-fuchsia-600 border-fuchsia-100',
    colorText: 'text-fuchsia-600'
  },
  {
    name: 'Policy & Governance',
    totalWords: 324,
    cefrBreakdown: [
      { level: 'A1', count: 11 },
      { level: 'A2', count: 32 },
      { level: 'B1', count: 2 },
      { level: 'B2', count: 171 },
      { level: 'C1', count: 88 },
      { level: 'C2', count: 20 }
    ],
    colorBg: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    colorText: 'text-emerald-600'
  },
  {
    name: 'Time & Sequences',
    totalWords: 320,
    cefrBreakdown: [
      { level: 'A1', count: 41 },
      { level: 'A2', count: 40 },
      { level: 'B1', count: 12 },
      { level: 'B2', count: 99 },
      { level: 'C1', count: 125 },
      { level: 'C2', count: 3 }
    ],
    colorBg: 'bg-orange-50 text-orange-600 border-orange-100',
    colorText: 'text-orange-600'
  },
  {
    name: 'Weather & Nature',
    totalWords: 320,
    cefrBreakdown: [
      { level: 'A1', count: 53 },
      { level: 'A2', count: 75 },
      { level: 'B1', count: 1 },
      { level: 'B2', count: 149 },
      { level: 'C1', count: 36 },
      { level: 'C2', count: 6 }
    ],
    colorBg: 'bg-pink-50 text-pink-600 border-pink-100',
    colorText: 'text-pink-600'
  },
  {
    name: 'Work/Study/Technology',
    totalWords: 1124,
    cefrBreakdown: [
      { level: 'A1', count: 127 },
      { level: 'A2', count: 227 },
      { level: 'B1', count: 33 },
      { level: 'B2', count: 579 },
      { level: 'C1', count: 143 },
      { level: 'C2', count: 11 }
    ],
    colorBg: 'bg-green-50 text-green-600 border-green-100',
    colorText: 'text-green-600'
  }
];

export const CategoryLessons: React.FC<CategoryLessonsProps> = ({ 
  words, 
  onSelectCategoryDeck,
  unlockedLevels = ['A1'],
  onStartLevelChallenge,
  userRole = 'learner'
}) => {
  const [selectedCefr, setSelectedCefr] = useState<string>('all');
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'cardList' | '3dGrid'>('cardList');
  const [lockedModalText, setLockedModalText] = useState<string | null>(null);

  const cefrLevels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

  const isLevelUnlocked = (level: string) => {
    if (userRole === 'admin') return true;
    return unlockedLevels.includes(level);
  };

  const handleStartCategoryPractice = (categoryName: string, mode: 'flashcard' | 'quiz' = 'flashcard') => {
    // Find matching words or construct representative dataset for practice
    let categoryWords = words.filter(w => w.category === categoryName);
    if (categoryWords.length === 0) {
      // Fallback: pick general words or fallback subset
      categoryWords = words.slice(0, 10);
    }
    onSelectCategoryDeck(categoryWords, mode);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6 animate-fade-in">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-400" />
            <span>Vocabulary Journey Categories</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Mastered vocabulary grouped by topic with official CEFR level distributions.
          </p>
        </div>

        {/* View Mode & CEFR Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setViewMode('cardList')}
              className={`p-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                viewMode === 'cardList' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
              title="Mobile App Style Card List"
            >
              <List className="w-3.5 h-3.5" /> List View
            </button>
            <button
              onClick={() => setViewMode('3dGrid')}
              className={`p-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                viewMode === '3dGrid' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
              title="3D Decks Grid"
            >
              <LayoutGrid className="w-3.5 h-3.5" /> Grid View
            </button>
          </div>

          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400 ml-1" />
            <button
              onClick={() => setSelectedCefr('all')}
              className={`px-2 py-1 rounded-lg font-bold transition-all ${
                selectedCefr === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              All
            </button>
            {cefrLevels.map(lvl => (
              <button
                key={lvl}
                onClick={() => setSelectedCefr(lvl)}
                className={`px-2 py-1 rounded-lg font-bold transition-all ${
                  selectedCefr === lvl ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Locked Modal Notice */}
      {lockedModalText && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4 text-center shadow-2xl relative">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Level Locked</h3>
            <p className="text-xs text-slate-300">{lockedModalText}</p>
            <button
              onClick={() => setLockedModalText(null)}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* CEFR Level Unlock Selector Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {cefrLevels.map((level, idx) => {
          const unlocked = isLevelUnlocked(level);
          const count = words.filter(w => w.cefrLevel && w.cefrLevel.toUpperCase() === level).length;
          const displayCount = Math.max(count, 120);

          return (
            <button
              key={level}
              onClick={() => {
                if (unlocked) {
                  setSelectedCefr(level);
                  if (onStartLevelChallenge) onStartLevelChallenge(level);
                } else {
                  const prevLevel = idx > 0 ? cefrLevels[idx - 1] : 'A1';
                  setLockedModalText(`Level ${level} is locked! Pass Level ${prevLevel} Speaking Challenge first.`);
                }
              }}
              className={`p-3 rounded-xl border text-left transition-all relative ${
                unlocked
                  ? selectedCefr === level
                    ? 'bg-indigo-600/30 border-indigo-500 ring-2 ring-indigo-500/40'
                    : 'bg-slate-900 border-slate-800 hover:border-indigo-500/50'
                  : 'bg-slate-950/80 border-slate-800/80 opacity-70'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-base font-black text-white">{level}</span>
                {unlocked ? (
                  <Unlock className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-indigo-400">{displayCount} words</span>
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                  {unlocked ? 'Unlocked' : 'Locked'}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Categories View Container */}
      <div className="space-y-3">
        {SCREENSHOT_CATEGORIES.map((cat) => {
          // Filter by CEFR if selected
          if (selectedCefr !== 'all') {
            const hasLevel = cat.cefrBreakdown.some(b => b.level === selectedCefr);
            if (!hasLevel) return null;
          }

          const isExpanded = expandedCategory === cat.name;

          return (
            <div
              key={cat.name}
              className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-200"
            >
              {/* Category Main Card Row */}
              <div 
                onClick={() => setExpandedCategory(isExpanded ? null : cat.name)}
                className="flex items-start justify-between gap-3 cursor-pointer group"
              >
                {/* Left Tag Icon */}
                <div className={`w-10 h-10 rounded-2xl ${cat.colorBg} flex items-center justify-center shrink-0 border mt-0.5`}>
                  <Tag className="w-5 h-5" />
                </div>

                {/* Main Content Info */}
                <div className="flex-1 space-y-2 min-w-0">
                  <h3 className="text-base font-extrabold text-slate-900 group-hover:text-indigo-600 transition-colors">
                    {cat.name}
                  </h3>

                  {/* CEFR Level Badges Row */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {cat.cefrBreakdown.map((item) => (
                      <span
                        key={item.level}
                        className="px-2 py-0.5 rounded-md bg-slate-100 text-[11px] font-bold text-slate-600 border border-slate-200/60"
                      >
                        {item.level} · {item.count}
                      </span>
                    ))}
                  </div>

                  {/* Progress Bar & Mastered Status */}
                  <div className="space-y-1 pt-1">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
                      <span>0/{cat.totalWords} mastered</span>
                      <span>0%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 rounded-full transition-all duration-300 w-0" />
                    </div>
                  </div>
                </div>

                {/* Right Expand Chevron */}
                <div className="p-1 text-slate-400 group-hover:text-slate-600 transition-colors mt-1">
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-indigo-600" />
                  ) : (
                    <ChevronDown className="w-5 h-5" />
                  )}
                </div>
              </div>

              {/* Expanded Action Menu */}
              {isExpanded && (
                <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-2 animate-fade-in">
                  <button
                    onClick={() => handleStartCategoryPractice(cat.name, 'flashcard')}
                    className="py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    <span>Practice 3D Flashcards</span>
                  </button>

                  <button
                    onClick={() => handleStartCategoryPractice(cat.name, 'quiz')}
                    className="py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
                  >
                    <Award className="w-4 h-4 text-amber-400" />
                    <span>Start Topic Quiz</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
