import React, { useState } from 'react';
import { 
  Sparkles, 
  Layers, 
  Check, 
  GraduationCap, 
  Briefcase, 
  Globe, 
  Cpu
} from 'lucide-react';
import { VocabularyWord } from '../types';
import { generateFallbackVocabulary } from '../lib/fallbackVocab';

interface AICoachModalProps {
  onAddGeneratedWords: (words: VocabularyWord[]) => void;
}

export const AICoachModal: React.FC<AICoachModalProps> = ({ onAddGeneratedWords }) => {
  const [topic, setTopic] = useState('');
  const [level, setLevel] = useState('B2-C1 Intermediate-Advanced');
  const [count, setCount] = useState(5);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedWords, setGeneratedWords] = useState<VocabularyWord[]>([]);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const presets = [
    { name: 'IELTS Academic Vocab', topic: 'IELTS Academic Reading & Speaking', icon: GraduationCap },
    { name: 'Business Communication', topic: 'Business Negotiations & Meetings', icon: Briefcase },
    { name: 'Tech & AI Terminology', topic: 'Software Engineering & Artificial Intelligence', icon: Cpu },
    { name: 'Casual Idioms & Slang', topic: 'Natural English Colloquial Expressive Idioms', icon: Globe },
  ];

  const handleGenerate = async (targetTopic?: string) => {
    const activeTopic = targetTopic || topic || 'General Advanced Vocabulary';
    setIsGenerating(true);
    setSuccessMsg(null);

    let rawWords: any[] = [];

    try {
      const res = await fetch('/api/gemini/generate-vocabulary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: activeTopic,
          level,
          count,
        }),
      });

      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        if (data.success && Array.isArray(data.words) && data.words.length > 0) {
          rawWords = data.words;
        }
      }
    } catch (err) {
      console.warn('Backend API request error, generating client-side deck:', err);
    }

    // Fallback if API returned empty, non-json (e.g. static host rewrite), or failed
    if (!rawWords || rawWords.length === 0) {
      rawWords = generateFallbackVocabulary(activeTopic, level, count);
    }

    const formatted: VocabularyWord[] = rawWords.map((w: any, idx: number) => ({
      id: `ai_gen_${Date.now()}_${idx}`,
      word: w.word,
      phonetic: w.phonetic || '',
      partOfSpeech: w.partOfSpeech || 'noun',
      definition: w.definition,
      exampleSentence: w.example || w.exampleSentence || '',
      example: w.example || w.exampleSentence || '',
      translation: w.translation || '',
      laoTranslation: w.laoTranslation || '',
      thaiTranslation: w.thaiTranslation || '',
      category: activeTopic,
      tags: ['AI Generated', level],
      source: 'ai',
      createdAt: new Date().toISOString(),
    }));

    setGeneratedWords(formatted);
    setIsGenerating(false);
  };

  const handleImportGenerated = () => {
    if (generatedWords.length > 0) {
      onAddGeneratedWords(generatedWords);
      setSuccessMsg(`Added ${generatedWords.length} words to your flashcard collection!`);
      setGeneratedWords([]);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      
      {/* Title Header */}
      <div className="bg-gradient-to-r from-purple-950/60 via-slate-900 to-indigo-950/60 border border-purple-500/30 p-6 rounded-2xl shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-300">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Gemini AI Vocabulary Generator</h2>
            <p className="text-xs text-slate-300">Generate custom personalized flashcard packs for any domain or exam target.</p>
          </div>
        </div>
      </div>

      {/* Preset Packs Quick Launch */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Popular AI Topic Packs</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {presets.map((preset) => {
            const Icon = preset.icon;
            return (
              <button
                key={preset.name}
                onClick={() => {
                  setTopic(preset.topic);
                  handleGenerate(preset.topic);
                }}
                disabled={isGenerating}
                className="flex items-center gap-3 p-3.5 bg-slate-900 hover:bg-slate-800/80 border border-slate-800 hover:border-purple-500/40 rounded-xl text-left transition-all group"
              >
                <div className="p-2 rounded-lg bg-slate-950 text-purple-400 group-hover:scale-110 transition-transform">
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-xs text-slate-200 block">{preset.name}</span>
                  <span className="text-[10px] text-slate-400">Instant AI Pack</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom Deck Generator Form */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4 shadow-xl">
        <h3 className="text-sm font-bold text-white">Create Custom Vocabulary Pack</h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <label className="block text-xs text-slate-400 mb-1">Target Topic / Field</label>
            <input
              type="text"
              placeholder="e.g. Medical English, Environmental Science, Aviation, Culinary..."
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Proficiency Level</label>
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-purple-500"
            >
              <option value="A2-B1 Elementary">A2-B1 Elementary</option>
              <option value="B2-C1 Intermediate-Advanced">B2-C1 Intermediate</option>
              <option value="C1-C2 Master Advanced">C1-C2 Master Advanced</option>
            </select>
          </div>
        </div>

        <button
          onClick={() => handleGenerate()}
          disabled={isGenerating}
          className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold text-xs transition-all shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2"
        >
          <Sparkles className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
          <span>{isGenerating ? 'Generating Custom Vocabulary...' : 'Generate AI Flashcard Pack'}</span>
        </button>

        {successMsg && (
          <p className="text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 p-3 rounded-xl font-medium">
            {successMsg}
          </p>
        )}
      </div>

      {/* Generated Cards Result Preview */}
      {generatedWords.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-400" />
              <span>Generated Pack ({generatedWords.length} Words)</span>
            </h3>

            <button
              onClick={handleImportGenerated}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-all shadow-lg shadow-purple-600/30"
            >
              <Check className="w-4 h-4" />
              <span>Add All to My Deck</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {generatedWords.map((word) => (
              <div key={word.id} className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-base text-white">{word.word}</span>
                  <span className="text-[10px] font-mono text-purple-400">{word.phonetic}</span>
                </div>
                <p className="text-xs text-slate-300">{word.definition}</p>
                <p className="text-[11px] italic text-slate-400 bg-slate-900 p-2 rounded-lg border border-slate-800/60">
                  "{word.example}"
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
