import React, { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, 
  RefreshCw, 
  Upload, 
  CloudUpload, 
  Database, 
  Trash2, 
  Plus, 
  CheckCircle2, 
  AlertCircle, 
  Table, 
  Copy, 
  Check, 
  Layers, 
  Sparkles,
  ShieldCheck,
  Search
} from 'lucide-react';
import { VocabularyWord } from '../types';
import { extractSpreadsheetId, parseCSVToWords, generateSampleSheetCSV } from '../lib/sheets';
import { pushAllWordsToFirestore, fetchAllWordsFromFirestore, deleteWordFromFirestore, saveWordToFirestore } from '../lib/firebase';

interface AdminPanelProps {
  words: VocabularyWord[];
  onWordsUpdated: (newWords: VocabularyWord[]) => void;
  adminEmail?: string | null;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  words,
  onWordsUpdated,
  adminEmail
}) => {
  const [sheetUrlInput, setSheetUrlInput] = useState('');
  const [isFetchingSheet, setIsFetchingSheet] = useState(false);
  const [isPushingCloud, setIsPushingCloud] = useState(false);
  const [isPullingCloud, setIsPullingCloud] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [previewWords, setPreviewWords] = useState<VocabularyWord[]>([]);
  const [copiedTemplate, setCopiedTemplate] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [cloudWords, setCloudWords] = useState<VocabularyWord[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newWordData, setNewWordData] = useState({
    word: '',
    definition: '',
    cefrLevel: 'A1',
    category: 'General Vocabulary',
    laoTranslation: '',
    exampleSentence: ''
  });

  // Load existing words from Firestore cloud on mount
  useEffect(() => {
    loadCloudWords();
  }, []);

  const loadCloudWords = async () => {
    setIsPullingCloud(true);
    try {
      const fetched = await fetchAllWordsFromFirestore();
      setCloudWords(fetched);
    } catch (e) {
      console.error('Failed to fetch cloud words:', e);
    } finally {
      setIsPullingCloud(false);
    }
  };

  const handleAddWordToWebApp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWordData.word.trim() || !newWordData.definition.trim()) {
      setStatusMessage({ type: 'error', text: 'Word and Definition are required fields.' });
      return;
    }

    const createdWord: VocabularyWord = {
      id: 'manual_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      word: newWordData.word.trim(),
      definition: newWordData.definition.trim(),
      partOfSpeech: 'noun',
      cefrLevel: newWordData.cefrLevel,
      category: newWordData.category || 'General Vocabulary',
      laoTranslation: newWordData.laoTranslation.trim() || undefined,
      exampleSentence: newWordData.exampleSentence.trim() || `Example sentence for ${newWordData.word}.`,
      source: 'manual',
      createdAt: new Date().toISOString()
    };

    const updated = [createdWord, ...words];
    onWordsUpdated(updated);

    setNewWordData({
      word: '',
      definition: '',
      cefrLevel: 'A1',
      category: 'General Vocabulary',
      laoTranslation: '',
      exampleSentence: ''
    });
    setShowAddForm(false);
    setStatusMessage({
      type: 'success',
      text: `Added "${createdWord.word}" to Web App! Click "Push Direct to Firestore Cloud" to sync with all learners.`
    });
  };

  // Reset/Delete only manual local imports (Preserving Firestore Cloud Words)
  const handleResetManualImports = () => {
    const cloudIds = new Set(cloudWords.map(w => w.id));
    // Keep words that are in cloud or part of initial seed, remove manual/google_sheets imports
    const remainingWords = words.filter(w => {
      // If it's in cloud database, keep it protected
      if (cloudIds.has(w.id)) return true;
      // If it's a manual/sheet import, remove
      if (w.source === 'manual' || w.source === 'google_sheets') return false;
      return true;
    });

    onWordsUpdated(remainingWords);
    setStatusMessage({
      type: 'success',
      text: 'Successfully reset manually imported words! Firestore Cloud-synced words remain intact.'
    });
  };

  const handleDeleteLocalManualWord = (wordId: string) => {
    const updated = words.filter(w => w.id !== wordId);
    onWordsUpdated(updated);
    setStatusMessage({ type: 'success', text: 'Removed local imported word from Web App.' });
  };

  const handleFetchSpreadsheet = async () => {
    setStatusMessage(null);
    const spreadsheetId = extractSpreadsheetId(sheetUrlInput);
    if (!spreadsheetId) {
      setStatusMessage({ type: 'error', text: 'Invalid Google Sheet URL or ID. Make sure it is a valid Google Docs link.' });
      return;
    }

    setIsFetchingSheet(true);
    try {
      const res = await fetch('/api/sheets/fetch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spreadsheetId }),
      });

      const data = await res.json();
      if (data.success && data.csvText) {
        const parsed = parseCSVToWords(data.csvText);
        if (parsed.length === 0) {
          setStatusMessage({ type: 'error', text: 'No valid vocabulary rows found in Sheet. Ensure column headers are present (Word, Definition, Example).' });
        } else {
          setPreviewWords(parsed);
          setStatusMessage({ type: 'success', text: `Successfully parsed ${parsed.length} vocabulary words from Google Sheet!` });
        }
      } else {
        setStatusMessage({ type: 'error', text: data.error || 'Failed to fetch Google Sheet data.' });
      }
    } catch (err: any) {
      console.error('Error fetching sheet:', err);
      setStatusMessage({ type: 'error', text: 'Network error connecting to Google Sheets service.' });
    } finally {
      setIsFetchingSheet(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const csvText = event.target?.result as string;
      if (csvText) {
        const parsed = parseCSVToWords(csvText);
        if (parsed.length > 0) {
          setPreviewWords(parsed);
          setStatusMessage({ type: 'success', text: `Successfully loaded ${parsed.length} words from CSV file!` });
        } else {
          setStatusMessage({ type: 'error', text: 'Could not parse vocabulary rows from CSV file.' });
        }
      }
    };
    reader.readAsText(file);
  };

  const handlePushAllToFirestore = async (targetWords: VocabularyWord[]) => {
    if (targetWords.length === 0) {
      setStatusMessage({ type: 'error', text: 'No words selected to push.' });
      return;
    }

    setIsPushingCloud(true);
    setStatusMessage({ type: 'info', text: `Preparing to publish ${targetWords.length} words to Firestore Cloud...` });

    try {
      // Direct push to Firestore words collection with batch progress updates
      await pushAllWordsToFirestore(targetWords, 'admin_published', (current, total) => {
        setStatusMessage({
          type: 'info',
          text: `Syncing with Firestore Cloud: ${current} / ${total} words written safely...`
        });
      });
      
      // Update local app state
      const combinedMap = new Map<string, VocabularyWord>();
      words.forEach(w => combinedMap.set(w.id, w));
      targetWords.forEach(w => combinedMap.set(w.id, w));
      const newMerged = Array.from(combinedMap.values());

      onWordsUpdated(newMerged);
      await loadCloudWords();

      setStatusMessage({ 
        type: 'success', 
        text: `🚀 Directly published ${targetWords.length} vocabulary words to Firestore Cloud! All learners will auto-sync in real-time.` 
      });
      setPreviewWords([]);
    } catch (e: any) {
      console.error('Firestore push error:', e);
      setStatusMessage({ type: 'error', text: `Failed to push to Firestore: ${e.message || 'Firestore write error'}` });
    } finally {
      setIsPushingCloud(false);
    }
  };

  const handleDeleteCloudWord = async (wordId: string) => {
    try {
      await deleteWordFromFirestore(wordId);
      const updatedLocal = words.filter(w => w.id !== wordId);
      onWordsUpdated(updatedLocal);
      setCloudWords(prev => prev.filter(w => w.id !== wordId));
      setStatusMessage({ type: 'success', text: 'Word deleted from Firestore Cloud.' });
    } catch (e: any) {
      setStatusMessage({ type: 'error', text: 'Failed to delete word from cloud.' });
    }
  };

  const copyTemplateCSV = () => {
    const csv = generateSampleSheetCSV();
    navigator.clipboard.writeText(csv);
    setCopiedTemplate(true);
    setTimeout(() => setCopiedTemplate(false), 2000);
  };

  const filteredCloudWords = cloudWords.filter(w => 
    w.word.toLowerCase().includes(searchTerm.toLowerCase()) ||
    w.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6 animate-fade-in">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 border border-purple-500/30 p-6 rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-purple-600/30 border border-purple-400/40 text-purple-300 shadow-lg">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-white">VoxFlow Admin Management Panel</h2>
              <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-bold">
                ADMIN ONLY
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              Import vocabulary from Google Sheets or CSV, and publish directly to Firebase Firestore for instant auto-sync to all learners.
            </p>
          </div>
        </div>

        <button
          onClick={copyTemplateCSV}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-all shrink-0"
        >
          {copiedTemplate ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-indigo-400" />}
          <span>{copiedTemplate ? 'Copied Template CSV' : 'Copy Sheet CSV Format'}</span>
        </button>
      </div>

      {/* Notifications */}
      {statusMessage && (
        <div className={`p-4 rounded-xl border text-xs font-semibold flex items-center justify-between gap-3 shadow-md animate-fade-in ${
          statusMessage.type === 'success' 
            ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200' 
            : statusMessage.type === 'error'
            ? 'bg-rose-950/60 border-rose-500/40 text-rose-200'
            : 'bg-indigo-950/60 border-indigo-500/40 text-indigo-200'
        }`}>
          <div className="flex items-center gap-2.5">
            {statusMessage.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
            {statusMessage.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />}
            {statusMessage.type === 'info' && <RefreshCw className="w-5 h-5 text-indigo-400 animate-spin shrink-0" />}
            <span>{statusMessage.text}</span>
          </div>
          <button onClick={() => setStatusMessage(null)} className="text-xs font-bold opacity-60 hover:opacity-100">
            Dismiss
          </button>
        </div>
      )}

      {/* Quick Add Single Word & Manual Imports Reset */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-white">Continuous Web App Vocabulary Builder</h3>
              <p className="text-[11px] text-slate-400">Add words manually to Web App before pushing all to Firestore Cloud</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{showAddForm ? 'Close Form' : 'Add Single Word'}</span>
            </button>

            <button
              onClick={handleResetManualImports}
              className="px-3 py-1.5 rounded-xl bg-rose-950/60 hover:bg-rose-900 text-rose-300 hover:text-white font-bold text-xs border border-rose-500/30 flex items-center gap-1.5 transition-all"
              title="Reset all local manually added or imported words (Firestore Cloud words are preserved)"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Reset Manual Imports</span>
            </button>
          </div>
        </div>

        {showAddForm && (
          <form onSubmit={handleAddWordToWebApp} className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 animate-fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Word *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Resilient"
                  value={newWordData.word}
                  onChange={e => setNewWordData({ ...newWordData, word: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">CEFR Level</label>
                <select
                  value={newWordData.cefrLevel}
                  onChange={e => setNewWordData({ ...newWordData, cefrLevel: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white"
                >
                  {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map(lvl => (
                    <option key={lvl} value={lvl}>{lvl}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Category</label>
                <input
                  type="text"
                  placeholder="General Vocabulary"
                  value={newWordData.category}
                  onChange={e => setNewWordData({ ...newWordData, category: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Definition *</label>
                <input
                  type="text"
                  required
                  placeholder="Able to withstand or recover quickly from difficult conditions."
                  value={newWordData.definition}
                  onChange={e => setNewWordData({ ...newWordData, definition: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Lao / Thai Translation</label>
                <input
                  type="text"
                  placeholder="ຄວາມສາມາດປັບຕົວ"
                  value={newWordData.laoTranslation}
                  onChange={e => setNewWordData({ ...newWordData, laoTranslation: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Example Sentence</label>
              <input
                type="text"
                placeholder="The community was resilient in the face of hardship."
                value={newWordData.exampleSentence}
                onChange={e => setNewWordData({ ...newWordData, exampleSentence: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md transition-all"
            >
              Save Word to Web App Collection
            </button>
          </form>
        )}
      </div>

      {/* Step 1: Import Google Sheets & CSV */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Google Sheets Link Fetch */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4 shadow-lg">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-white">Import via Google Sheets Link</h3>
              <p className="text-[11px] text-slate-400">Paste public Google Spreadsheet link to parse rows</p>
            </div>
          </div>

          <div className="space-y-2">
            <input
              type="text"
              placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs..."
              value={sheetUrlInput}
              onChange={(e) => setSheetUrlInput(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
            <button
              onClick={handleFetchSpreadsheet}
              disabled={isFetchingSheet || !sheetUrlInput}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all"
            >
              <RefreshCw className={`w-4 h-4 ${isFetchingSheet ? 'animate-spin' : ''}`} />
              <span>{isFetchingSheet ? 'Parsing Google Sheet...' : 'Fetch & Preview Sheet'}</span>
            </button>
          </div>
        </div>

        {/* CSV File Upload */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4 shadow-lg">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-white">Import via CSV File Upload</h3>
              <p className="text-[11px] text-slate-400">Upload .csv file exported from Excel or Sheets</p>
            </div>
          </div>

          <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-800 hover:border-indigo-500/50 rounded-xl bg-slate-950/80 cursor-pointer transition-colors group">
            <Upload className="w-6 h-6 text-slate-500 group-hover:text-indigo-400 transition-colors mb-1" />
            <span className="text-xs font-semibold text-slate-300">Click to upload CSV vocabulary list</span>
            <input 
              type="file" 
              accept=".csv" 
              onChange={handleFileUpload} 
              className="hidden" 
            />
          </label>
        </div>
      </div>

      {/* Preview & Direct Push Section */}
      {previewWords.length > 0 && (
        <div className="bg-slate-900 border border-purple-500/40 p-6 rounded-2xl space-y-4 shadow-2xl animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <Table className="w-5 h-5 text-purple-400" />
                <span>Parsed Vocabulary Preview ({previewWords.length} Words)</span>
              </h3>
              <p className="text-xs text-slate-400">Review before pushing directly to Firebase Firestore for all learners</p>
            </div>

            <button
              onClick={() => handlePushAllToFirestore(previewWords)}
              disabled={isPushingCloud}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs flex items-center gap-2 shadow-lg shadow-purple-600/30 transition-all shrink-0"
            >
              <CloudUpload className="w-4 h-4" />
              <span>{isPushingCloud ? 'Publishing to Cloud...' : '🚀 Push Direct to Firestore Cloud'}</span>
            </button>
          </div>

          <div className="max-h-64 overflow-y-auto border border-slate-800 rounded-xl bg-slate-950">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] tracking-wider sticky top-0">
                <tr>
                  <th className="p-3">Word</th>
                  <th className="p-3">CEFR</th>
                  <th className="p-3">Definition</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Lao / Thai Translation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {previewWords.map((w, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/50">
                    <td className="p-3 font-bold text-white">{w.word}</td>
                    <td className="p-3 font-bold text-indigo-400">{w.cefrLevel || 'A1'}</td>
                    <td className="p-3 text-slate-300 max-w-xs truncate">{w.definition}</td>
                    <td className="p-3 text-emerald-400">{w.category || 'General'}</td>
                    <td className="p-3 text-slate-400">{w.laoTranslation || w.thaiTranslation || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Cloud Database Current Published Vocabulary */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <span>Firebase Firestore Cloud Database</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 text-xs border border-emerald-500/30 font-bold">
                  {cloudWords.length} Words Live
                </span>
              </h3>
              <p className="text-xs text-slate-400">Current words stored in Cloud Firestore and auto-synced to all learners</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadCloudWords}
              disabled={isPullingCloud}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isPullingCloud ? 'animate-spin' : ''}`} />
              <span>Refresh Cloud</span>
            </button>

            {words.length > 0 && (
              <button
                onClick={() => handlePushAllToFirestore(words)}
                disabled={isPushingCloud}
                className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md"
              >
                <CloudUpload className="w-3.5 h-3.5" />
                <span>Re-Publish App Words</span>
              </button>
            )}
          </div>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search Firestore cloud words by term or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Cloud Table */}
        <div className="max-h-80 overflow-y-auto border border-slate-800 rounded-xl bg-slate-950">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] tracking-wider sticky top-0">
              <tr>
                <th className="p-3">Word</th>
                <th className="p-3">CEFR</th>
                <th className="p-3">Category</th>
                <th className="p-3">Definition</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredCloudWords.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-slate-500 text-xs">
                    {cloudWords.length === 0 
                      ? 'No published words in Firestore yet. Click "Push Direct to Firestore Cloud" above!'
                      : 'No words match your search term.'}
                  </td>
                </tr>
              ) : (
                filteredCloudWords.map((w) => (
                  <tr key={w.id} className="hover:bg-slate-800/50">
                    <td className="p-3 font-bold text-white">{w.word}</td>
                    <td className="p-3 font-bold text-indigo-400">{w.cefrLevel || 'A1'}</td>
                    <td className="p-3 text-emerald-400">{w.category}</td>
                    <td className="p-3 text-slate-300 max-w-xs truncate">{w.definition}</td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleDeleteCloudWord(w.id)}
                        className="p-1.5 rounded-lg bg-rose-950/40 text-rose-400 hover:bg-rose-900 hover:text-white transition-all"
                        title="Delete from Firestore Cloud"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
