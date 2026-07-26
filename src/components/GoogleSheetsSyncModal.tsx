import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  RefreshCw, 
  Upload, 
  Download, 
  Link, 
  Check, 
  AlertCircle, 
  ExternalLink,
  Table,
  CheckCircle2,
  Copy,
  CloudUpload,
  X
} from 'lucide-react';
import { VocabularyWord } from '../types';
import { extractSpreadsheetId, parseCSVToWords, generateSampleSheetCSV } from '../lib/sheets';
import { pushAllWordsToFirestore } from '../lib/firebase';

interface GoogleSheetsSyncModalProps {
  onSyncWords: (newWords: VocabularyWord[]) => void;
  onClose?: () => void;
}

export const GoogleSheetsSyncModal: React.FC<GoogleSheetsSyncModalProps> = ({
  onSyncWords,
  onClose,
}) => {
  const [sheetUrlInput, setSheetUrlInput] = useState('');
  const [isFetching, setIsFetching] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [previewWords, setPreviewWords] = useState<VocabularyWord[]>([]);
  const [copiedTemplate, setCopiedTemplate] = useState(false);

  const handleFetchSpreadsheet = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    const spreadsheetId = extractSpreadsheetId(sheetUrlInput);
    if (!spreadsheetId) {
      setErrorMessage('Invalid Google Sheet URL or ID. Please check your link.');
      return;
    }

    setIsFetching(true);

    try {
      const res = await fetch('/api/sheets/fetch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spreadsheetId }),
      });

      const data = await res.json();
      if (data.success && data.csvText) {
        const words = parseCSVToWords(data.csvText);
        if (words.length === 0) {
          setErrorMessage('No valid vocabulary words found in the Google Sheet. Please check the column headers (Word, Definition, Example).');
        } else {
          setPreviewWords(words);
          setSuccessMessage(`Successfully fetched ${words.length} words from Google Sheets!`);
        }
      } else {
        setErrorMessage(data.error || 'Failed to fetch spreadsheet data.');
      }
    } catch (err: any) {
      console.error('Error syncing Google Sheet:', err);
      setErrorMessage('Error connecting to server. Please try again.');
    } finally {
      setIsFetching(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const csvText = event.target?.result as string;
      if (csvText) {
        const words = parseCSVToWords(csvText);
        if (words.length > 0) {
          setPreviewWords(words);
          setSuccessMessage(`Loaded ${words.length} words from CSV file!`);
          setErrorMessage(null);
        } else {
          setErrorMessage('Could not parse vocabulary rows from CSV file.');
        }
      }
    };
    reader.readAsText(file);
  };

  const [isPushingCloud, setIsPushingCloud] = useState(false);

  const handleConfirmSync = () => {
    if (previewWords.length > 0) {
      onSyncWords(previewWords);
      setSuccessMessage(`Imported ${previewWords.length} words into Web App vocabulary!`);
      setPreviewWords([]);
    }
  };

  const handlePushDirectToCloud = async () => {
    if (previewWords.length === 0) return;
    setIsPushingCloud(true);
    setSuccessMessage(null);
    setErrorMessage(null);
    try {
      await pushAllWordsToFirestore(previewWords, 'global_curriculum', (current, total) => {
        setSuccessMessage(`Syncing batch ${current}/${total} words to Firestore Cloud...`);
      });
      onSyncWords(previewWords);
      setSuccessMessage(`🚀 Successfully pushed ${previewWords.length} words to Firestore Cloud! All learners auto-sync instantly.`);
      setPreviewWords([]);
    } catch (e: any) {
      setErrorMessage(`Failed to push to Cloud: ${e.message}`);
    } finally {
      setIsPushingCloud(false);
    }
  };

  const copyTemplateCSV = () => {
    const csv = generateSampleSheetCSV();
    navigator.clipboard.writeText(csv);
    setCopiedTemplate(true);
    setTimeout(() => setCopiedTemplate(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      
      {/* Title Header */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Google Sheets Synchronization</h2>
            <p className="text-xs text-slate-400">Seamlessly sync flashcard vocabulary from your custom Google Spreadsheet or CSV.</p>
          </div>
        </div>

        <button
          onClick={copyTemplateCSV}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors shrink-0"
        >
          {copiedTemplate ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-indigo-400" />}
          <span>{copiedTemplate ? 'Copied Template CSV' : 'Copy Sample Template'}</span>
        </button>
      </div>

      {/* Sheet Input Section */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
        <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
          <Link className="w-4 h-4 text-emerald-400" />
          <span>Option 1: Import via Google Sheet URL or ID</span>
        </h3>

        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            placeholder="Paste Google Spreadsheet URL (e.g. https://docs.google.com/spreadsheets/d/1BxiMVs...)"
            value={sheetUrlInput}
            onChange={(e) => setSheetUrlInput(e.target.value)}
            className="flex-1 px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
          <button
            onClick={handleFetchSpreadsheet}
            disabled={isFetching || !sheetUrlInput}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs transition-all shadow-lg shadow-emerald-600/30"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
            <span>{isFetching ? 'Syncing...' : 'Fetch Sheet Words'}</span>
          </button>
        </div>

        <p className="text-[11px] text-slate-500">
          Tip: Ensure your Google Sheet is shared as "Anyone with the link can view", or use columns: <span className="text-slate-300 font-mono">Word, Phonetic, PartOfSpeech, Definition, ExampleSentence, Translation, Category</span>.
        </p>

        {/* File Upload Option */}
        <div className="pt-4 border-t border-slate-800/80">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2 mb-3">
            <Upload className="w-4 h-4 text-indigo-400" />
            <span>Option 2: Upload CSV File</span>
          </h3>

          <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-800 hover:border-indigo-500/50 rounded-xl bg-slate-950/60 cursor-pointer transition-colors group">
            <Upload className="w-6 h-6 text-slate-500 group-hover:text-indigo-400 transition-colors mb-2" />
            <span className="text-xs font-semibold text-slate-300">Click to select or drop CSV file here</span>
            <span className="text-[10px] text-slate-500 mt-1">Accepts .csv files exported from Excel or Google Sheets</span>
            <input 
              type="file" 
              accept=".csv" 
              onChange={handleFileUpload} 
              className="hidden" 
            />
          </label>
        </div>

        {/* Error / Success Notifications */}
        {errorMessage && (
          <div className="p-3.5 bg-rose-950/40 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3.5 bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}
      </div>

      {/* Preview Imported Words Table */}
      {previewWords.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Table className="w-4 h-4 text-indigo-400" />
                <span>Import Preview ({previewWords.length} Words Parsed)</span>
              </h3>
              <p className="text-xs text-slate-400">Save lessons locally to your app or push directly to Cloud Firestore</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleConfirmSync}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition-all"
              >
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Save to Web App</span>
              </button>

              <button
                onClick={handlePushDirectToCloud}
                disabled={isPushingCloud}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold text-xs transition-all shadow-lg shadow-purple-600/30"
              >
                <CloudUpload className="w-4 h-4" />
                <span>{isPushingCloud ? 'Pushing...' : 'Push to Firestore Cloud'}</span>
              </button>
            </div>
          </div>

          <div className="max-h-60 overflow-y-auto border border-slate-800 rounded-xl">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-2.5">Word</th>
                  <th className="p-2.5">Definition</th>
                  <th className="p-2.5">Example</th>
                  <th className="p-2.5">Category</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {previewWords.slice(0, 10).map((w, i) => (
                  <tr key={i} className="hover:bg-slate-800/50">
                    <td className="p-2.5 font-bold text-white">{w.word}</td>
                    <td className="p-2.5 text-slate-300">{w.definition}</td>
                    <td className="p-2.5 text-slate-400 italic max-w-xs truncate">{w.example}</td>
                    <td className="p-2.5 text-indigo-400">{w.category}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
