import React, { useState } from 'react';
import { 
  Search, 
  Plus, 
  Trash2, 
  Volume2, 
  FileSpreadsheet,
  Zap,
  Globe2,
  Star,
  ShieldCheck,
  Lock
} from 'lucide-react';
import { VocabularyWord, SRSItem } from '../types';
import { speakText } from '../lib/tts';

interface VocabularyTableProps {
  words: VocabularyWord[];
  srsMap: Record<string, SRSItem>;
  onAddWord: (word: Omit<VocabularyWord, 'id' | 'createdAt'>) => void;
  onDeleteWord: (wordId: string) => void;
  onOpenShadowing: (word: VocabularyWord) => void;
  onOpenSheetsSync: () => void;
  onToggleStarWord?: (wordId: string) => void;
  userRole?: 'admin' | 'learner';
}

export const VocabularyTable: React.FC<VocabularyTableProps> = ({
  words,
  srsMap,
  onAddWord,
  onDeleteWord,
  onOpenShadowing,
  onOpenSheetsSync,
  onToggleStarWord,
  userRole = 'learner',
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newWord, setNewWord] = useState({
    word: '',
    phonetic: '',
    partOfSpeech: 'noun',
    cefrLevel: 'B2',
    definition: '',
    exampleSentence: '',
    synonym: '',
    antonym: '',
    category: 'General',
    difficulty: 'Medium',
    laoTranslation: '',
    thaiTranslation: '',
  });

  const categories = Array.from(new Set(words.map(w => w.category || 'General')));

  const filteredWords = words.filter(word => {
    const ex = word.exampleSentence || word.example || '';
    const matchesSearch = 
      word.word.toLowerCase().includes(searchTerm.toLowerCase()) ||
      word.definition.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ex.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (word.laoTranslation && word.laoTranslation.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (word.thaiTranslation && word.thaiTranslation.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || word.category === selectedCategory;
    const srsStatus = srsMap[word.id]?.status || 'new';
    
    let matchesStatus = true;
    if (selectedStatus === 'starred') {
      matchesStatus = !!word.isStarred;
    } else if (selectedStatus !== 'all') {
      matchesStatus = srsStatus === selectedStatus;
    }

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWord.word || !newWord.definition) return;

    onAddWord({
      ...newWord,
      example: newWord.exampleSentence,
      translation: newWord.thaiTranslation || newWord.laoTranslation || '',
      tags: ['Manual'],
      source: 'manual',
    });

    setNewWord({
      word: '',
      phonetic: '',
      partOfSpeech: 'noun',
      cefrLevel: 'B2',
      definition: '',
      exampleSentence: '',
      synonym: '',
      antonym: '',
      category: 'General',
      difficulty: 'Medium',
      laoTranslation: '',
      thaiTranslation: '',
    });
    setIsAddModalOpen(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <span>Vocabulary Library</span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              {words.length} Words
            </span>
            {userRole === 'admin' ? (
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/30 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Admin Mode
              </span>
            ) : (
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                Learner Mode
              </span>
            )}
          </h2>
          <p className="text-xs text-slate-400">
            {userRole === 'admin' 
              ? 'Admin Dashboard: Import words, manage curriculum, and push to cloud storage.' 
              : 'Learner Library: Practice vocabulary, listen to audio, and save/star favorite words.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {userRole === 'admin' ? (
            <>
              <button
                onClick={onOpenSheetsSync}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600/20 border border-emerald-500/30 hover:bg-emerald-600 text-emerald-300 hover:text-white text-xs font-bold transition-all shadow-md"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Sync Google Sheets</span>
              </button>

              <button
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/30"
              >
                <Plus className="w-4 h-4" />
                <span>Add Word</span>
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl">
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>Sheet Sync & Management: <strong className="text-amber-300">Admin Only</strong></span>
            </div>
          )}
        </div>
      </div>

      {/* Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-900 border border-slate-800 p-3.5 rounded-2xl">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search word, translation, definition..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
        >
          <option value="all">All Categories</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
        >
          <option value="all">All Learning Statuses</option>
          <option value="starred">Starred / Saved Words</option>
          <option value="new">New</option>
          <option value="learning">Learning</option>
          <option value="review">Review</option>
          <option value="mastered">Mastered</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider text-[10px] font-semibold border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Word / CEFR</th>
                <th className="px-4 py-3">Definition</th>
                <th className="px-4 py-3">Lao / Thai Translation</th>
                <th className="px-4 py-3 hidden md:table-cell">Example Sentence</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredWords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                    No vocabulary words match your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredWords.map((word) => {
                  const exampleText = word.exampleSentence || word.example || '';

                  return (
                    <tr key={word.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3 font-medium text-white">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => speakText(word.word)}
                            className="p-1.5 rounded hover:bg-slate-800 text-indigo-400 shrink-0"
                            title="Speak"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                          </button>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-sm text-slate-100">{word.word}</span>
                              <span className="text-[10px] font-bold px-1.5 py-0.2 bg-indigo-950 text-indigo-300 border border-indigo-800 rounded">
                                {word.cefrLevel || 'B2'}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono block">
                              {word.partOfSpeech} {word.phonetic && `• ${word.phonetic}`}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3 max-w-xs">
                        <p className="text-slate-200 line-clamp-2">{word.definition}</p>
                      </td>

                      <td className="px-4 py-3">
                        <div className="space-y-0.5 text-[11px]">
                          {word.laoTranslation && (
                            <p className="text-emerald-400"><strong className="text-[9px] uppercase text-slate-500">LAO:</strong> {word.laoTranslation}</p>
                          )}
                          {word.thaiTranslation && (
                            <p className="text-sky-400"><strong className="text-[9px] uppercase text-slate-500">THAI:</strong> {word.thaiTranslation}</p>
                          )}
                          {!word.laoTranslation && !word.thaiTranslation && (
                            <p className="text-slate-400">{word.translation || '-'}</p>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3 hidden md:table-cell text-slate-400 italic max-w-xs truncate">
                        "{exampleText}"
                      </td>

                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-950 text-slate-300 border border-slate-800">
                          {word.category || 'General'}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Star/Save button */}
                          <button
                            onClick={() => onToggleStarWord && onToggleStarWord(word.id)}
                            className={`p-1.5 rounded-lg border transition-all ${
                              word.isStarred
                                ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                                : 'bg-slate-800 border-slate-700 text-slate-500 hover:text-amber-400'
                            }`}
                            title={word.isStarred ? 'Unstar Word' : 'Save & Star Word'}
                          >
                            <Star className={`w-3.5 h-3.5 ${word.isStarred ? 'fill-amber-400 text-amber-400' : ''}`} />
                          </button>

                          <button
                            onClick={() => onOpenShadowing(word)}
                            className="p-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white transition-colors"
                            title="Practice Shadowing"
                          >
                            <Zap className="w-3.5 h-3.5" />
                          </button>

                          {userRole === 'admin' && (
                            <button
                              onClick={() => onDeleteWord(word.id)}
                              className="p-1.5 rounded-lg hover:bg-rose-950 text-slate-500 hover:text-rose-400 transition-colors"
                              title="Delete Word (Admin)"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Word Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-white">Add Custom Vocabulary Word</h3>
            <form onSubmit={handleAddSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">Word</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Eloquence"
                    value={newWord.word}
                    onChange={(e) => setNewWord({ ...newWord, word: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">CEFR Level</label>
                  <select
                    value={newWord.cefrLevel}
                    onChange={(e) => setNewWord({ ...newWord, cefrLevel: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="A1">A1 Beginner</option>
                    <option value="A2">A2 Elementary</option>
                    <option value="B1">B1 Intermediate</option>
                    <option value="B2">B2 Upper Intermediate</option>
                    <option value="C1">C1 Advanced</option>
                    <option value="C2">C2 Proficient</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">Part of Speech</label>
                  <input
                    type="text"
                    placeholder="noun / verb / adjective..."
                    value={newWord.partOfSpeech}
                    onChange={(e) => setNewWord({ ...newWord, partOfSpeech: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Category</label>
                  <input
                    type="text"
                    placeholder="Category name"
                    value={newWord.category}
                    onChange={(e) => setNewWord({ ...newWord, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Definition</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Clear English definition..."
                  value={newWord.definition}
                  onChange={(e) => setNewWord({ ...newWord, definition: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Example Sentence</label>
                <input
                  type="text"
                  placeholder="Her eloquence captivated the audience..."
                  value={newWord.exampleSentence}
                  onChange={(e) => setNewWord({ ...newWord, exampleSentence: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">Lao Translation</label>
                  <input
                    type="text"
                    placeholder="ຄວາມເວົ້າອ່ອນຫວານ..."
                    value={newWord.laoTranslation}
                    onChange={(e) => setNewWord({ ...newWord, laoTranslation: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Thai Translation</label>
                  <input
                    type="text"
                    placeholder="ความคารมคมคาย..."
                    value={newWord.thaiTranslation}
                    onChange={(e) => setNewWord({ ...newWord, thaiTranslation: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold"
                >
                  Save Word
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
