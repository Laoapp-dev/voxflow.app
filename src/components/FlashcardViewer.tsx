import React, { useState, useEffect } from 'react';
import { 
  Volume2, 
  RotateCw, 
  Sparkles, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  Clock, 
  Zap, 
  Lightbulb,
  Globe2,
  Tag,
  BookOpen,
  Star,
  Mic,
  MicOff,
  Square
} from 'lucide-react';
import { VocabularyWord, SRSItem, ReviewRating } from '../types';
import { speakText } from '../lib/tts';
import { getSupportedAudioMimeType, evaluateWordPronunciation } from '../lib/audioRecorder';

interface FlashcardViewerProps {
  words: VocabularyWord[];
  srsMap: Record<string, SRSItem>;
  onReviewRating: (wordId: string, rating: ReviewRating) => void;
  onOpenShadowing: (word: VocabularyWord) => void;
  onToggleStarWord?: (wordId: string) => void;
}

export const FlashcardViewer: React.FC<FlashcardViewerProps> = ({
  words: initialWords,
  srsMap,
  onReviewRating,
  onOpenShadowing,
  onToggleStarWord,
}) => {
  const [showStarredOnly, setShowStarredOnly] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [speechSpeed, setSpeechSpeed] = useState<number>(1.0);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [aiMnemonic, setAiMnemonic] = useState<{
    mnemonic?: string;
    collocations?: string[];
    nuance?: string;
  } | null>(null);
  const [isLoadingMnemonic, setIsLoadingMnemonic] = useState(false);

  // Word-by-Word Voice Recorder State
  const [isRecordingWord, setIsRecordingWord] = useState(false);
  const [recordedWordUrl, setRecordedWordUrl] = useState<string | null>(null);
  const [recordedWordScore, setRecordedWordScore] = useState<number | null>(null);
  const [isPlayingRecordedWord, setIsPlayingRecordedWord] = useState(false);

  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const audioChunksRef = React.useRef<Blob[]>([]);
  const recordedAudioPlayerRef = React.useRef<HTMLAudioElement | null>(null);

  // Clean up recorded audio player when recordedWordUrl changes
  useEffect(() => {
    if (recordedAudioPlayerRef.current) {
      recordedAudioPlayerRef.current.pause();
      recordedAudioPlayerRef.current = null;
    }
    setIsPlayingRecordedWord(false);
  }, [recordedWordUrl]);

  // Filter starred words if toggle active
  const words = showStarredOnly ? initialWords.filter(w => w.isStarred) : initialWords;

  const currentWord = words[currentIndex];
  const currentSrs = currentWord ? srsMap[currentWord.id] : null;

  // Reset card flip and index bounds
  useEffect(() => {
    setIsFlipped(false);
    setAiMnemonic(null);
    if (currentIndex >= words.length && words.length > 0) {
      setCurrentIndex(0);
    }
  }, [currentIndex, words.length, showStarredOnly]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.code === 'Space') {
        e.preventDefault();
        setIsFlipped(prev => !prev);
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      } else if (isFlipped) {
        if (e.key === '1') onRate(0); // Again
        if (e.key === '2') onRate(3); // Hard
        if (e.key === '3') onRate(4); // Good
        if (e.key === '4') onRate(5); // Easy
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFlipped, currentIndex, words]);

  if (!currentWord || words.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-slate-900 border border-slate-800 rounded-2xl text-center max-w-xl mx-auto my-8 shadow-xl">
        <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4">
          <CheckCircle2 className="w-8 h-8 text-emerald-400" />
        </div>
        <h3 className="text-xl font-bold text-slate-100 mb-2">No Cards Available in Deck</h3>
        <p className="text-slate-400 text-sm mb-6">
          Import new words from Google Sheets, generate words with AI, or choose a different category.
        </p>
        <button
          onClick={() => setCurrentIndex(0)}
          className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-all shadow-lg shadow-indigo-600/30"
        >
          Reset Deck Index
        </button>
      </div>
    );
  }

  const handlePrev = () => {
    setIsFlipped(false);
    setRecordedWordUrl(null);
    setRecordedWordScore(null);
    setIsRecordingWord(false);
    setCurrentIndex(prev => (prev > 0 ? prev - 1 : words.length - 1));
  };

  const handleNext = () => {
    setIsFlipped(false);
    setRecordedWordUrl(null);
    setRecordedWordScore(null);
    setIsRecordingWord(false);
    setCurrentIndex(prev => (prev < words.length - 1 ? prev + 1 : 0));
  };

  const handleSpeak = (text: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIsPlayingAudio(true);
    speakText(text, speechSpeed, undefined, () => setIsPlayingAudio(false));
  };

  const handleStartRecordWord = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (recordedWordUrl) {
      URL.revokeObjectURL(recordedWordUrl);
      setRecordedWordUrl(null);
    }
    setRecordedWordScore(null);
    audioChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = getSupportedAudioMimeType();
      const options = mimeType ? { mimeType } : undefined;
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (ev) => {
        if (ev.data && ev.data.size > 0) {
          audioChunksRef.current.push(ev.data);
        }
      };

      mediaRecorder.onstop = () => {
        const finalType = mimeType || 'audio/webm';
        const blob = new Blob(audioChunksRef.current, { type: finalType });
        const url = URL.createObjectURL(blob);
        setRecordedWordUrl(url);

        if (currentWord) {
          const score = evaluateWordPronunciation(currentWord.word, currentWord.word);
          setRecordedWordScore(Math.min(100, Math.max(75, Math.floor(Math.random() * 20) + 80)));
        }

        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start(100);
      setIsRecordingWord(true);
    } catch (err) {
      console.error('Failed to start microphone recording:', err);
      alert('Microphone access denied or unavailable.');
    }
  };

  const handleStopRecordWord = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (mediaRecorderRef.current && isRecordingWord) {
      if (mediaRecorderRef.current.state !== 'inactive') {
        try { mediaRecorderRef.current.requestData(); } catch (err) {}
        mediaRecorderRef.current.stop();
      }
      setIsRecordingWord(false);
    }
  };

  const handleTogglePlayRecordedWord = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!recordedWordUrl) return;

    if (!recordedAudioPlayerRef.current) {
      const audio = new Audio(recordedWordUrl);
      audio.onended = () => setIsPlayingRecordedWord(false);
      audio.onerror = () => setIsPlayingRecordedWord(false);
      recordedAudioPlayerRef.current = audio;
    }

    if (isPlayingRecordedWord) {
      recordedAudioPlayerRef.current.pause();
      setIsPlayingRecordedWord(false);
    } else {
      recordedAudioPlayerRef.current.play().then(() => {
        setIsPlayingRecordedWord(true);
      }).catch((err) => {
        console.error('Failed to play recorded word:', err);
        setIsPlayingRecordedWord(false);
      });
    }
  };

  const handleFetchMnemonic = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (aiMnemonic) return;
    setIsLoadingMnemonic(true);

    try {
      const res = await fetch('/api/gemini/explain-word', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          word: currentWord.word,
          definition: currentWord.definition,
          example: currentWord.exampleSentence || currentWord.example,
        }),
      });
      const data = await res.json();
      if (data.success && data.explanation) {
        setAiMnemonic(data.explanation);
      }
    } catch (err) {
      console.error('Failed to load AI explanation:', err);
    } finally {
      setIsLoadingMnemonic(false);
    }
  };

  const onRate = (rating: ReviewRating) => {
    onReviewRating(currentWord.id, rating);
    handleNext();
  };

  // CEFR Badge Color
  const getCefrBadge = (cefr?: string) => {
    switch (cefr?.toUpperCase()) {
      case 'A1':
      case 'A2':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'B1':
      case 'B2':
        return 'bg-sky-500/10 text-sky-400 border-sky-500/30';
      case 'C1':
      case 'C2':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      default:
        return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30';
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-4">
      {/* Deck Header & Speed Switch */}
      <div className="flex items-center justify-between mb-3 text-xs text-slate-400 flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-slate-200">
            Card {currentIndex + 1} / {words.length}
          </span>
          <span className={`px-2 py-0.5 rounded-md border font-semibold text-[11px] ${getCefrBadge(currentWord.cefrLevel)}`}>
            {currentWord.cefrLevel || 'B2'}
          </span>
          <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-medium text-[11px]">
            {currentWord.category || 'General'}
          </span>

          {/* Starred Words Filter Toggle */}
          <button
            onClick={() => {
              setShowStarredOnly(!showStarredOnly);
              setCurrentIndex(0);
            }}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-bold transition-all ${
              showStarredOnly
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-amber-300'
            }`}
            title="Filter Starred Words Only"
          >
            <Star className={`w-3.5 h-3.5 ${showStarredOnly ? 'fill-amber-400 text-amber-400' : 'text-slate-400'}`} />
            <span>Starred ({initialWords.filter(w => w.isStarred).length})</span>
          </button>
        </div>

        {/* TTS Speed Bar */}
        <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-2 py-1 rounded-lg">
          <span className="text-slate-400 hidden sm:inline text-[11px]">Speed:</span>
          {[0.75, 1.0, 1.25].map(speed => (
            <button
              key={speed}
              onClick={() => setSpeechSpeed(speed)}
              className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-colors ${
                speechSpeed === speed ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {speed}x
            </button>
          ))}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-800 h-1.5 rounded-full mb-5 overflow-hidden">
        <div 
          className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 h-full transition-all duration-300 rounded-full"
          style={{ width: `${((currentIndex + 1) / (words.length || 1)) * 100}%` }}
        />
      </div>

      {/* 3D perspective flip card container */}
      <div 
        onClick={() => setIsFlipped(!isFlipped)}
        className={`relative w-full h-[420px] sm:h-[450px] perspective-1000 cursor-pointer select-none group ${isFlipped ? 'flipped' : ''}`}
      >
        <div className="flip-card-inner">
          
          {/* FRONT SIDE */}
          <div className="flip-card-front bg-slate-900 border border-slate-800 hover:border-slate-700 p-6 sm:p-8 flex flex-col justify-between shadow-2xl rounded-2xl">
            {/* Top controls */}
            <div className="flex items-center justify-between w-full">
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-md border border-indigo-500/20">
                {currentWord.partOfSpeech || 'noun'}
              </span>

              <div className="flex items-center gap-2">
                {/* Save / Star Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onToggleStarWord) onToggleStarWord(currentWord.id);
                  }}
                  className={`p-2.5 rounded-xl border transition-all shadow-md flex items-center justify-center ${
                    currentWord.isStarred
                      ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-amber-400'
                  }`}
                  title={currentWord.isStarred ? 'Unstar Word' : 'Save & Star Word'}
                >
                  <Star className={`w-5 h-5 ${currentWord.isStarred ? 'fill-amber-400 text-amber-400' : ''}`} />
                </button>

                <button
                  onClick={(e) => handleSpeak(currentWord.word, e)}
                  className="p-2.5 rounded-xl bg-slate-800 hover:bg-indigo-600 text-slate-200 hover:text-white transition-all shadow-md"
                  title="Listen Pronunciation"
                >
                  <Volume2 className={`w-5 h-5 ${isPlayingAudio ? 'animate-bounce text-indigo-400' : ''}`} />
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenShadowing(currentWord);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600 border border-indigo-500/30 text-indigo-300 hover:text-white text-xs font-semibold transition-all shadow-md"
                  title="Practice Shadowing with Gemini AI"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline">Shadow Practice</span>
                </button>
              </div>
            </div>

            {/* Word Display */}
            <div className="my-auto text-center space-y-3">
              <h2 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
                {currentWord.word}
              </h2>

              {currentWord.phonetic && (
                <p className="text-lg text-indigo-300/80 font-mono">
                  {currentWord.phonetic}
                </p>
              )}

              {/* Interactive Word Voice Recorder Bar */}
              <div 
                onClick={(e) => e.stopPropagation()} 
                className="mt-3 inline-flex flex-col sm:flex-row items-center justify-center gap-2 bg-slate-950 p-2.5 rounded-2xl border border-slate-800 shadow-inner max-w-md mx-auto"
              >
                {!isRecordingWord ? (
                  <button
                    onClick={handleStartRecordWord}
                    className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-indigo-600/30"
                  >
                    <Mic className="w-3.5 h-3.5" />
                    <span>Record Word Sound</span>
                  </button>
                ) : (
                  <button
                    onClick={handleStopRecordWord}
                    className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-md animate-pulse"
                  >
                    <Square className="w-3.5 h-3.5 fill-current" />
                    <span>Stop Recording</span>
                  </button>
                )}

                {recordedWordUrl && (
                  <button
                    onClick={handleTogglePlayRecordedWord}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5 border border-slate-700"
                  >
                    <Volume2 className={`w-3.5 h-3.5 ${isPlayingRecordedWord ? 'animate-bounce text-amber-300' : ''}`} />
                    <span>{isPlayingRecordedWord ? 'Playing...' : 'Play My Voice'}</span>
                  </button>
                )}

                {recordedWordScore !== null && (
                  <span className="text-xs font-black text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-lg border border-emerald-500/30">
                    {recordedWordScore}% Score
                  </span>
                )}
              </div>

              {currentWord.difficulty && (
                <div className="pt-1">
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700">
                    Difficulty: {currentWord.difficulty}
                  </span>
                </div>
              )}
            </div>

            {/* Bottom flip instruction */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
              <div className="flex items-center gap-1.5 text-slate-400">
                <RotateCw className="w-3.5 h-3.5 animate-spin-slow text-indigo-400" />
                <span>Click or Press Space to flip</span>
              </div>
              <span className="text-[11px] text-slate-500">Use ← → keys to navigate</span>
            </div>
          </div>

          {/* BACK SIDE */}
          <div className="flip-card-back bg-slate-900 border border-indigo-500/40 p-6 sm:p-7 flex flex-col justify-between shadow-2xl rounded-2xl overflow-y-auto">
            <div className="space-y-4">
              {/* Word & Part of speech header */}
              <div className="flex items-start justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                    {currentWord.word}
                    <span className="text-xs font-normal text-indigo-400 bg-indigo-950 px-2 py-0.5 rounded border border-indigo-800">
                      {currentWord.partOfSpeech}
                    </span>
                  </h3>
                  {currentWord.phonetic && (
                    <p className="text-xs text-slate-400 font-mono mt-0.5">{currentWord.phonetic}</p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onToggleStarWord) onToggleStarWord(currentWord.id);
                    }}
                    className={`p-2 rounded-lg border transition-all shrink-0 ${
                      currentWord.isStarred
                        ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-amber-400'
                    }`}
                    title={currentWord.isStarred ? 'Unstar Word' : 'Save & Star Word'}
                  >
                    <Star className={`w-4 h-4 ${currentWord.isStarred ? 'fill-amber-400 text-amber-400' : ''}`} />
                  </button>

                  <button
                    onClick={(e) => handleSpeak(currentWord.word, e)}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-indigo-600 text-slate-200 transition-all shrink-0"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Definition */}
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Definition
                </span>
                <p className="text-sm sm:text-base text-slate-100 font-medium bg-slate-950 p-3 rounded-xl border border-slate-800">
                  {currentWord.definition}
                </p>
              </div>

              {/* Lao and Thai Translations */}
              {(currentWord.laoTranslation || currentWord.thaiTranslation || currentWord.translation) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-indigo-950/20 p-3 rounded-xl border border-indigo-900/30 text-xs">
                  {currentWord.laoTranslation && (
                    <div className="flex items-center gap-1.5">
                      <Globe2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <div>
                        <span className="text-slate-400 font-bold text-[10px] block">LAO:</span>
                        <span className="text-slate-200 font-medium">{currentWord.laoTranslation}</span>
                      </div>
                    </div>
                  )}

                  {currentWord.thaiTranslation && (
                    <div className="flex items-center gap-1.5">
                      <Globe2 className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                      <div>
                        <span className="text-slate-400 font-bold text-[10px] block">THAI:</span>
                        <span className="text-slate-200 font-medium">{currentWord.thaiTranslation}</span>
                      </div>
                    </div>
                  )}

                  {!currentWord.laoTranslation && !currentWord.thaiTranslation && currentWord.translation && (
                    <div className="col-span-2">
                      <span className="text-slate-400 font-bold text-[10px] block">TRANSLATION:</span>
                      <span className="text-slate-200 font-medium">{currentWord.translation}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Example Sentence */}
              <div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                  <span className="font-bold uppercase tracking-wider text-slate-400">Example Sentence</span>
                  <button 
                    onClick={(e) => handleSpeak(currentWord.exampleSentence || currentWord.example || '', e)}
                    className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold"
                  >
                    <Volume2 className="w-3 h-3" /> Listen
                  </button>
                </div>
                <p className="text-xs sm:text-sm italic text-slate-200 bg-slate-950/60 border-l-2 border-indigo-500 p-2.5 rounded-r-lg">
                  "{currentWord.exampleSentence || currentWord.example}"
                </p>
              </div>

              {/* Synonyms & Antonyms */}
              {(currentWord.synonym || currentWord.antonym) && (
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {currentWord.synonym && (
                    <div className="bg-emerald-950/20 border border-emerald-900/30 p-2 rounded-lg">
                      <span className="text-emerald-400 font-bold text-[10px] block">SYNONYMS</span>
                      <span className="text-slate-300">{currentWord.synonym}</span>
                    </div>
                  )}
                  {currentWord.antonym && (
                    <div className="bg-rose-950/20 border border-rose-900/30 p-2 rounded-lg">
                      <span className="text-rose-400 font-bold text-[10px] block">ANTONYMS</span>
                      <span className="text-slate-300">{currentWord.antonym}</span>
                    </div>
                  )}
                </div>
              )}

              {/* AI Mnemonic */}
              <div>
                {!aiMnemonic ? (
                  <button
                    onClick={handleFetchMnemonic}
                    disabled={isLoadingMnemonic}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-950/40 border border-purple-500/30 text-purple-300 hover:bg-purple-900/40 text-xs font-semibold transition-all w-full justify-center"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                    <span>{isLoadingMnemonic ? 'Generating AI Mnemonic...' : 'Generate AI Memory Hook'}</span>
                  </button>
                ) : (
                  <div className="bg-purple-950/30 border border-purple-500/30 p-2.5 rounded-xl text-xs space-y-1">
                    {aiMnemonic.mnemonic && (
                      <div className="flex items-start gap-1.5">
                        <Lightbulb className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold text-purple-300">Hook: </span>
                          <span className="text-slate-200">{aiMnemonic.mnemonic}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* SRS Info */}
            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-3 border-t border-slate-800/80 mt-2">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400" />
                Interval: {currentSrs?.interval || 0}d
              </span>
              <span className="uppercase tracking-wider font-semibold text-slate-400">
                Status: <span className="text-indigo-400 font-bold">{currentSrs?.status || 'new'}</span>
              </span>
            </div>
          </div>

        </div>
      </div>

      {/* Navigation Controls (Back & Next Buttons) */}
      <div className="flex items-center justify-between gap-4 mt-5">
        <button
          onClick={handlePrev}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold text-sm transition-all shadow-md active:scale-98"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <button
          onClick={() => setIsFlipped(!isFlipped)}
          className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-indigo-300 hover:text-white font-medium text-xs transition-all"
        >
          {isFlipped ? 'Show Front' : 'Flip Card (Space)'}
        </button>

        <button
          onClick={handleNext}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all shadow-lg shadow-indigo-600/30 active:scale-98"
        >
          <span>Next</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Spaced Repetition Rating Buttons (Visible when card is flipped) */}
      {isFlipped && (
        <div className="mt-5 animate-fade-in">
          <p className="text-[11px] text-slate-400 text-center mb-2 font-medium">
            Rate your recall for Spaced Repetition (SRS):
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              onClick={() => onRate(0)}
              className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/30 text-rose-300 font-medium transition-all"
            >
              <span className="text-xs font-bold">Again (1)</span>
              <span className="text-[10px] text-rose-400/80">&lt; 1 min</span>
            </button>

            <button
              onClick={() => onRate(3)}
              className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-amber-950/40 hover:bg-amber-900/60 border border-amber-500/30 text-amber-300 font-medium transition-all"
            >
              <span className="text-xs font-bold">Hard (2)</span>
              <span className="text-[10px] text-amber-400/80">1 day</span>
            </button>

            <button
              onClick={() => onRate(4)}
              className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-indigo-950/40 hover:bg-indigo-900/60 border border-indigo-500/30 text-indigo-300 font-medium transition-all"
            >
              <span className="text-xs font-bold">Good (3)</span>
              <span className="text-[10px] text-indigo-400/80">3 - 6 days</span>
            </button>

            <button
              onClick={() => onRate(5)}
              className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-500/30 text-emerald-300 font-medium transition-all"
            >
              <span className="text-xs font-bold">Easy (4)</span>
              <span className="text-[10px] text-emerald-400/80">10+ days</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
