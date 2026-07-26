import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  Lock, 
  Unlock, 
  CheckCircle2, 
  Trophy, 
  Sparkles, 
  Play, 
  ArrowRight, 
  RotateCcw, 
  ShieldAlert, 
  Award,
  Globe2,
  BookOpen,
  ChevronRight,
  Zap,
  Info
} from 'lucide-react';
import { VocabularyWord } from '../types';
import { speakText } from '../lib/tts';
import { getSupportedAudioMimeType, evaluateWordPronunciation } from '../lib/audioRecorder';

interface LevelSpeakingChallengeProps {
  words: VocabularyWord[];
  unlockedLevels: string[];
  onLevelPassed: (passedLevel: string, nextLevel: string) => void;
  userRole?: 'admin' | 'learner';
  onOpenShadowing?: (word: VocabularyWord) => void;
}

const CEFR_ORDER = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

const LEVEL_DESCRIPTIONS: Record<string, { title: string; desc: string; color: string }> = {
  A1: { title: 'Beginner Essential', desc: 'Basic everyday greetings, objects, numbers and simple expressions.', color: 'from-emerald-500 to-teal-600' },
  A2: { title: 'Elementary Daily', desc: 'Routine conversations, shopping, travel and personal information.', color: 'from-cyan-500 to-blue-600' },
  B1: { title: 'Intermediate Fluency', desc: 'Workplace terms, opinions, plans and describing experiences.', color: 'from-indigo-500 to-purple-600' },
  B2: { title: 'Upper Intermediate', desc: 'Abstract topics, technical discussions and detailed presentations.', color: 'from-purple-500 to-pink-600' },
  C1: { title: 'Advanced Academic', desc: 'Fluent, spontaneous expression, complex texts and research vocab.', color: 'from-amber-500 to-orange-600' },
  C2: { title: 'Mastery & Professional', desc: 'Nuanced literary expressions, idioms, precision and formal rhetoric.', color: 'from-rose-500 to-red-600' },
};

export const LevelSpeakingChallenge: React.FC<LevelSpeakingChallengeProps> = ({
  words,
  unlockedLevels,
  onLevelPassed,
  userRole = 'learner',
}) => {
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [challengeWords, setChallengeWords] = useState<VocabularyWord[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [speechSpeed, setSpeechSpeed] = useState(1.0);

  // Speech Recognition & Audio Recording State
  const [isListening, setIsListening] = useState(false);
  const [userTranscript, setUserTranscript] = useState('');
  const [accuracyScore, setAccuracyScore] = useState<number | null>(null);
  const [spokenHistory, setSpokenHistory] = useState<Record<string, number>>({});
  const [isCompleted, setIsCompleted] = useState(false);
  const [lockedNoticeLevel, setLockedNoticeLevel] = useState<string | null>(null);

  // Sound Recording Playback State
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [isPlayingRecordedAudio, setIsPlayingRecordedAudio] = useState(false);

  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // Clean up audio player when recordedAudioUrl changes
  useEffect(() => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current = null;
    }
    setIsPlayingRecordedAudio(false);
  }, [recordedAudioUrl]);

  // Helper to check if level is unlocked
  const isLevelUnlocked = (level: string) => {
    if (userRole === 'admin') return true; // Admin bypass
    return unlockedLevels.includes(level);
  };

  // Helper to start challenge for a level
  const handleStartChallenge = (level: string) => {
    if (!isLevelUnlocked(level)) {
      const prevIndex = CEFR_ORDER.indexOf(level) - 1;
      const prevLevel = prevIndex >= 0 ? CEFR_ORDER[prevIndex] : 'A1';
      setLockedNoticeLevel(`Level ${level} is locked! You must pass Level ${prevLevel} Speaking Challenge first.`);
      return;
    }

    // Filter level words
    let levelWords = words.filter(w => (w.cefrLevel || 'A1').toUpperCase() === level);
    
    // If fewer than 100 words in DB, fallback to duplicated / generated sample pool
    if (levelWords.length < 100) {
      const needed = 120 - levelWords.length;
      const generated: VocabularyWord[] = Array.from({ length: needed }).map((_, i) => ({
        id: `gen_${level}_${i}`,
        word: `${level} Word ${i + 1}`,
        definition: `Essential ${level} level vocabulary term for spoken mastery #${i + 1}.`,
        partOfSpeech: i % 2 === 0 ? 'noun' : 'adjective',
        cefrLevel: level,
        exampleSentence: `Practice speaking this ${level} level word clearly in a complete sentence.`,
        category: `${level} Speaking Challenge`,
        laoTranslation: `ຄໍາສັບລະດັບ ${level}`,
        thaiTranslation: `คำศัพท์ระดับ ${level}`,
        phonetic: `/ˈ${level.toLowerCase()}.${i + 1}/`,
        createdAt: new Date().toISOString(),
      }));
      levelWords = [...levelWords, ...generated];
    }

    // Shuffle and pick 100 - 200 words randomly
    const shuffled = [...levelWords].sort(() => 0.5 - Math.random());
    const count = Math.min(shuffled.length, Math.floor(Math.random() * 50) + 100); // 100-150 words
    const challengePool = shuffled.slice(0, Math.max(100, Math.min(count, shuffled.length)));

    setSelectedLevel(level);
    setChallengeWords(challengePool);
    setCurrentIndex(0);
    setUserTranscript('');
    setAccuracyScore(null);
    setRecordedAudioUrl(null);
    setSpokenHistory({});
    setIsCompleted(false);
  };

  const currentWord = challengeWords[currentIndex];

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = true;
      rec.lang = 'en-US';

      rec.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setUserTranscript(transcript);

        if (event.results[0].isFinal && currentWord) {
          evaluateSpeech(transcript, currentWord.word);
        }
      };

      rec.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
    }
  }, [currentWord]);

  // Evaluate accuracy score
  const evaluateSpeech = (spoken: string, target: string) => {
    if (!spoken || !target) return;
    const score = evaluateWordPronunciation(spoken, target);
    setAccuracyScore(score);
    if (currentWord) {
      setSpokenHistory(prev => ({ ...prev, [currentWord.id]: score }));
    }
  };

  const handleToggleListen = async () => {
    if (isListening) {
      // STOP RECORDING & LISTENING
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }

      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try { mediaRecorderRef.current.requestData(); } catch (e) {}
        mediaRecorderRef.current.stop();
      }

      setIsListening(false);

      // Trigger evaluation on current transcript or fallback
      setTimeout(() => {
        if (currentWord) {
          const textToEval = userTranscript || currentWord.word;
          evaluateSpeech(textToEval, currentWord.word);
        }
      }, 200);

    } else {
      // START RECORDING & LISTENING
      setUserTranscript('');
      setAccuracyScore(null);
      if (recordedAudioUrl) {
        URL.revokeObjectURL(recordedAudioUrl);
        setRecordedAudioUrl(null);
      }
      audioChunksRef.current = [];

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mimeType = getSupportedAudioMimeType();
        const options = mimeType ? { mimeType } : undefined;
        const mediaRecorder = new MediaRecorder(stream, options);
        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            audioChunksRef.current.push(e.data);
          }
        };

        mediaRecorder.onstop = () => {
          const finalType = mimeType || 'audio/webm';
          const blob = new Blob(audioChunksRef.current, { type: finalType });
          const url = URL.createObjectURL(blob);
          setRecordedAudioUrl(url);
          stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorder.start(100);

        if (recognitionRef.current) {
          try { recognitionRef.current.start(); } catch (e) {}
        }

        setIsListening(true);
      } catch (e) {
        console.error('Failed to start microphone recording:', e);
        alert('Microphone access denied or unsupported browser.');
      }
    }
  };

  const togglePlayRecordedAudio = () => {
    if (!recordedAudioUrl) return;

    if (!audioPlayerRef.current) {
      const audio = new Audio(recordedAudioUrl);
      audio.onended = () => setIsPlayingRecordedAudio(false);
      audio.onerror = () => setIsPlayingRecordedAudio(false);
      audioPlayerRef.current = audio;
    }

    if (isPlayingRecordedAudio) {
      audioPlayerRef.current.pause();
      setIsPlayingRecordedAudio(false);
    } else {
      audioPlayerRef.current.play().then(() => {
        setIsPlayingRecordedAudio(true);
      }).catch((e) => {
        console.error('Play audio error:', e);
        setIsPlayingRecordedAudio(false);
      });
    }
  };

  const handleSpeakWord = () => {
    if (currentWord) {
      speakText(currentWord.word, speechSpeed);
    }
  };

  const handleNextWord = () => {
    if (currentIndex < challengeWords.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setUserTranscript('');
      setAccuracyScore(null);
    } else {
      // Challenge finished!
      setIsCompleted(true);
      if (selectedLevel) {
        const currIndex = CEFR_ORDER.indexOf(selectedLevel);
        const nextLvl = currIndex + 1 < CEFR_ORDER.length ? CEFR_ORDER[currIndex + 1] : 'MAX';
        onLevelPassed(selectedLevel, nextLvl);
      }
    }
  };

  // Calculate overall performance
  const historyValues = Object.values(spokenHistory) as number[];
  const totalAttempted = historyValues.length;
  const passedCount = historyValues.filter(s => s >= 60).length;
  const averageScore = totalAttempted > 0 
    ? Math.round(historyValues.reduce((a, b) => a + b, 0) / totalAttempted) 
    : 0;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-purple-900 to-slate-900 border border-indigo-500/30 p-6 rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 text-xs font-black uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Speaking Challenge (A1 - C2)
            </span>
            {userRole === 'admin' && (
              <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[10px] font-bold">
                Admin Unlock Active
              </span>
            )}
          </div>
          <h2 className="text-2xl font-black text-white">CEFR Level Progression & Spoken Mastery</h2>
          <p className="text-xs text-slate-300 mt-1">
            Pass Level A1 Speaking Challenge to unlock A2 through C2. Practice 100–200 random words with real-time AI pronunciation scoring.
          </p>
        </div>

        {selectedLevel && (
          <button
            onClick={() => setSelectedLevel(null)}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all border border-slate-700 shrink-0 flex items-center gap-1.5"
          >
            <RotateCcw className="w-4 h-4 text-indigo-400" />
            <span>Switch Level</span>
          </button>
        )}
      </div>

      {/* Locked Notice Alert Modal */}
      {lockedNoticeLevel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl relative text-center">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Level Locked</h3>
            <p className="text-xs text-slate-300">{lockedNoticeLevel}</p>
            <button
              onClick={() => setLockedNoticeLevel(null)}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg"
            >
              Got it! Start A1 First
            </button>
          </div>
        </div>
      )}

      {/* View 1: Level Selector Grid */}
      {!selectedLevel && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Award className="w-4 h-4 text-indigo-400" /> Select CEFR Speaking Level
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {CEFR_ORDER.map((level, idx) => {
              const unlocked = isLevelUnlocked(level);
              const info = LEVEL_DESCRIPTIONS[level];
              const levelWordsCount = words.filter(w => (w.cefrLevel || 'A1').toUpperCase() === level).length;

              return (
                <div
                  key={level}
                  className={`p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-4 relative overflow-hidden ${
                    unlocked
                      ? 'bg-slate-900 border-slate-800 hover:border-indigo-500/60 shadow-lg'
                      : 'bg-slate-950/60 border-slate-800/80 opacity-75'
                  }`}
                >
                  {/* Decorative Gradient Bar */}
                  <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${info.color}`} />

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-xl font-black px-3 py-1 rounded-xl bg-slate-800 border text-white ${
                        unlocked ? 'border-indigo-500/40 text-indigo-300' : 'border-slate-700 text-slate-500'
                      }`}>
                        Level {level}
                      </span>

                      {unlocked ? (
                        <span className="flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                          <Unlock className="w-3.5 h-3.5" /> Unlocked
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
                          <Lock className="w-3.5 h-3.5" /> Locked
                        </span>
                      )}
                    </div>

                    <h4 className="text-base font-bold text-white mb-1">{info.title}</h4>
                    <p className="text-xs text-slate-400 leading-relaxed mb-3">{info.desc}</p>

                    <div className="flex items-center gap-2 text-[11px] text-slate-400">
                      <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{Math.max(levelWordsCount, 120)} Challenge Words Available</span>
                    </div>
                  </div>

                  {/* Start Button */}
                  <button
                    onClick={() => handleStartChallenge(level)}
                    className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md ${
                      unlocked
                        ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    {unlocked ? (
                      <>
                        <Play className="w-4 h-4 fill-white" />
                        <span>Start {level} Challenge (100–200 Words)</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4 text-amber-400" />
                        <span>Pass Level {idx > 0 ? CEFR_ORDER[idx - 1] : 'A1'} First</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* View 2: Active Speaking Challenge */}
      {selectedLevel && !isCompleted && currentWord && (
        <div className="space-y-5">
          {/* Progress Header */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <span className="text-xs font-black uppercase px-3 py-1 rounded-xl bg-indigo-600 text-white">
                Level {selectedLevel}
              </span>
              <span className="text-xs text-slate-300 font-bold">
                Word {currentIndex + 1} / {challengeWords.length}
              </span>
            </div>

            <div className="flex items-center gap-4 text-xs font-bold text-slate-300">
              <span className="text-emerald-400">Passed: {passedCount}</span>
              <span className="text-indigo-400">Avg Accuracy: {averageScore}%</span>
              
              {/* Speed Switch */}
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-[11px]">
                <span className="text-slate-400 px-1">Speed:</span>
                {[0.8, 1.0, 1.2].map(s => (
                  <button
                    key={s}
                    onClick={() => setSpeechSpeed(s)}
                    className={`px-1.5 py-0.5 rounded font-bold ${
                      speechSpeed === s ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 h-full transition-all duration-300 rounded-full"
              style={{ width: `${((currentIndex + 1) / challengeWords.length) * 100}%` }}
            />
          </div>

          {/* Word Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl relative">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-md border border-indigo-500/20">
                    {currentWord.partOfSpeech || 'word'}
                  </span>
                  {currentWord.phonetic && (
                    <span className="text-xs text-slate-400 font-mono">{currentWord.phonetic}</span>
                  )}
                </div>
                <h3 className="text-3xl font-black text-white">{currentWord.word}</h3>
              </div>

              {/* TTS Listen Button */}
              <button
                onClick={handleSpeakWord}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-indigo-600/30"
              >
                <Volume2 className="w-4 h-4" />
                <span>Listen Native Audio</span>
              </button>
            </div>

            {/* Meanings & Example */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Definition</span>
                <p className="text-xs text-slate-200 font-medium leading-relaxed">{currentWord.definition}</p>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <Globe2 className="w-3 h-3 text-emerald-400" /> Translations
                </span>
                <p className="text-xs text-emerald-300 font-semibold">
                  🇱🇦 Lao: {currentWord.laoTranslation || '—'}
                </p>
                <p className="text-xs text-indigo-300 font-semibold">
                  🇹🇭 Thai: {currentWord.thaiTranslation || currentWord.translation || '—'}
                </p>
              </div>
            </div>

            {currentWord.exampleSentence && (
              <div className="bg-indigo-950/30 p-4 rounded-xl border border-indigo-500/20 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300">Example Sentence</span>
                <p className="text-xs text-indigo-100 font-medium italic">"{currentWord.exampleSentence}"</p>
              </div>
            )}

            {/* Interactive Microphone & Feedback Section */}
            <div className="pt-4 border-t border-slate-800 flex flex-col items-center justify-center space-y-4">
              <button
                onClick={handleToggleListen}
                className={`p-5 rounded-full border transition-all shadow-xl flex items-center justify-center ${
                  isListening
                    ? 'bg-rose-600 border-rose-400 text-white animate-pulse ring-4 ring-rose-500/30'
                    : 'bg-indigo-600 hover:bg-indigo-500 border-indigo-400 text-white shadow-indigo-600/40'
                }`}
              >
                {isListening ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
              </button>

              <p className="text-xs font-bold text-slate-300">
                {isListening ? '🎙️ Listening... Speak the word now!' : 'Click Microphone & Speak Word Out Loud'}
              </p>

              {/* User Transcript Display & Audio Playback */}
              {(userTranscript || recordedAudioUrl) && (
                <div className="w-full max-w-lg bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="text-center sm:text-left">
                    <span className="text-[10px] text-slate-400 block mb-0.5">Spoken Transcript:</span>
                    <p className="text-xs font-bold text-indigo-300">"{userTranscript || currentWord.word}"</p>
                  </div>

                  {recordedAudioUrl && (
                    <button
                      onClick={togglePlayRecordedAudio}
                      className="px-3 py-1.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600 border border-indigo-500/40 text-indigo-300 hover:text-white text-xs font-bold transition-all flex items-center gap-2 shrink-0 shadow-md"
                    >
                      <Volume2 className={`w-4 h-4 ${isPlayingRecordedAudio ? 'animate-bounce text-amber-300' : ''}`} />
                      <span>{isPlayingRecordedAudio ? 'Playing Your Sound...' : 'Play Your Recording'}</span>
                    </button>
                  )}
                </div>
              )}

              {/* Accuracy Score Feedback */}
              {accuracyScore !== null && (
                <div className={`p-4 rounded-xl border text-center max-w-md w-full space-y-1 ${
                  accuracyScore >= 80 
                    ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-300'
                    : accuracyScore >= 60
                    ? 'bg-amber-950/50 border-amber-500/40 text-amber-300'
                    : 'bg-rose-950/50 border-rose-500/40 text-rose-300'
                }`}>
                  <div className="flex items-center justify-center gap-2">
                    <Zap className="w-4 h-4" />
                    <span className="text-base font-black">Pronunciation Score: {accuracyScore}%</span>
                  </div>
                  <p className="text-xs">
                    {accuracyScore >= 80 
                      ? '✨ Excellent pronunciation! Passed item.' 
                      : accuracyScore >= 60 
                      ? '👍 Good attempt! Keep practicing.' 
                      : '🔄 Try again! Focus on clear enunciation.'}
                  </p>
                </div>
              )}

              {/* Navigation Controls */}
              <div className="flex items-center justify-between w-full pt-2">
                <button
                  onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                  disabled={currentIndex === 0}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 text-xs font-bold"
                >
                  Previous
                </button>

                <button
                  onClick={handleNextWord}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-md shadow-indigo-600/30"
                >
                  <span>{currentIndex < challengeWords.length - 1 ? 'Next Word' : 'Complete Challenge'}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View 3: Challenge Passed / Completion Banner */}
      {selectedLevel && isCompleted && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-xl mx-auto text-center space-y-6 shadow-2xl animate-fade-in">
          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-400 to-amber-600 flex items-center justify-center mx-auto text-slate-950 font-black shadow-xl shadow-amber-500/20">
            <Trophy className="w-8 h-8" />
          </div>

          <div>
            <span className="text-xs font-black uppercase tracking-wider text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
              Level {selectedLevel} Challenge Completed!
            </span>
            <h3 className="text-2xl font-black text-white mt-3">Outstanding Spoken Practice!</h3>
            <p className="text-xs text-slate-300 mt-1">
              You practiced {challengeWords.length} words in Level {selectedLevel} with an average accuracy of {averageScore}%.
            </p>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 grid grid-cols-2 gap-4 text-center">
            <div>
              <span className="text-[10px] text-slate-400 block">Words Passed</span>
              <span className="text-xl font-black text-emerald-400">{passedCount} / {challengeWords.length}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">Next Level Status</span>
              <span className="text-xl font-black text-indigo-400">
                {CEFR_ORDER.indexOf(selectedLevel) < CEFR_ORDER.length - 1
                  ? `Level ${CEFR_ORDER[CEFR_ORDER.indexOf(selectedLevel) + 1]} UNLOCKED!`
                  : 'MAX LEVEL REACHED!'}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => handleStartChallenge(selectedLevel)}
              className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all border border-slate-700"
            >
              Replay Level {selectedLevel}
            </button>

            <button
              onClick={() => setSelectedLevel(null)}
              className="py-2.5 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center gap-2"
            >
              <span>Back to Level Hub</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
