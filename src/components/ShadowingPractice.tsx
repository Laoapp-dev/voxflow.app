import React, { useState, useRef, useEffect } from 'react';
import { 
  Mic, 
  Square, 
  Play, 
  Pause, 
  RotateCcw, 
  Volume2, 
  Sparkles, 
  Award, 
  AlertCircle, 
  CheckCircle2, 
  ListMusic, 
  Info,
  ArrowRight,
  Gauge
} from 'lucide-react';
import { VocabularyWord, ShadowingPracticeRecord } from '../types';
import { speakText, stopSpeech } from '../lib/tts';
import { getSupportedAudioMimeType } from '../lib/audioRecorder';

interface ShadowingPracticeProps {
  selectedWord?: VocabularyWord | null;
  allWords: VocabularyWord[];
  onSaveRecord: (record: ShadowingPracticeRecord) => void;
}

export const ShadowingPractice: React.FC<ShadowingPracticeProps> = ({
  selectedWord,
  allWords,
  onSaveRecord,
}) => {
  const [activeWord, setActiveWord] = useState<VocabularyWord | null>(
    selectedWord || allWords[0] || null
  );
  const [targetSentence, setTargetSentence] = useState<string>(
    activeWord ? (activeWord.exampleSentence || activeWord.example || '') : 'Practice speaking naturally with rhythm and clear connected sounds.'
  );

  const [speedRate, setSpeedRate] = useState<number>(0.85);
  const [isPlayingTarget, setIsPlayingTarget] = useState(false);

  // Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [userAudioBlob, setUserAudioBlob] = useState<Blob | null>(null);
  const [userAudioUrl, setUserAudioUrl] = useState<string | null>(null);
  const [isPlayingUserAudio, setIsPlayingUserAudio] = useState(false);

  // AI Feedback State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<{
    pronunciationScore: number;
    fluencyScore: number;
    accuracyScore: number;
    userTranscript?: string;
    mispronouncedWords?: string[];
    aiFeedback: string;
    suggestions?: string[];
  } | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<number | null>(null);
  const userAudioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // Sync active word selection
  useEffect(() => {
    if (selectedWord) {
      setActiveWord(selectedWord);
      setTargetSentence(selectedWord.exampleSentence || selectedWord.example || '');
      setAiAnalysis(null);
      setUserAudioUrl(null);
    }
  }, [selectedWord]);

  const handleWordSelect = (word: VocabularyWord) => {
    setActiveWord(word);
    setTargetSentence(word.exampleSentence || word.example || '');
    setAiAnalysis(null);
    setUserAudioUrl(null);
    stopSpeech();
  };

  const playTargetAudio = () => {
    if (isPlayingTarget) {
      stopSpeech();
      setIsPlayingTarget(false);
      return;
    }
    setIsPlayingTarget(true);
    speakText(targetSentence, speedRate, undefined, () => setIsPlayingTarget(false));
  };

  // Clean up user audio player when URL changes
  useEffect(() => {
    if (userAudioPlayerRef.current) {
      userAudioPlayerRef.current.pause();
      userAudioPlayerRef.current = null;
    }
    setIsPlayingUserAudio(false);
  }, [userAudioUrl]);

  const startRecording = async () => {
    try {
      if (userAudioUrl) {
        URL.revokeObjectURL(userAudioUrl);
      }
      setUserAudioBlob(null);
      setUserAudioUrl(null);
      setAiAnalysis(null);
      audioChunksRef.current = [];

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
        const audioBlob = new Blob(audioChunksRef.current, { type: finalType });
        const url = URL.createObjectURL(audioBlob);
        setUserAudioBlob(audioBlob);
        setUserAudioUrl(url);

        // Stop media tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start(100);
      setIsRecording(true);
      setRecordingSeconds(0);

      // Start timer
      timerIntervalRef.current = window.setInterval(() => {
        setRecordingSeconds(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Microphone access error:', err);
      alert('Microphone access is required for shadowing practice. Please allow microphone permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      if (mediaRecorderRef.current.state !== 'inactive') {
        try {
          mediaRecorderRef.current.requestData();
        } catch (e) {
          // ignore
        }
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    }
  };

  const toggleUserAudioPlay = () => {
    if (!userAudioUrl) return;

    if (!userAudioPlayerRef.current) {
      const audio = new Audio(userAudioUrl);
      audio.onended = () => setIsPlayingUserAudio(false);
      audio.onerror = (e) => {
        console.error('Playback error:', e);
        setIsPlayingUserAudio(false);
      };
      userAudioPlayerRef.current = audio;
    }

    if (isPlayingUserAudio) {
      userAudioPlayerRef.current.pause();
      setIsPlayingUserAudio(false);
    } else {
      userAudioPlayerRef.current.play().then(() => {
        setIsPlayingUserAudio(true);
      }).catch((err) => {
        console.error('Audio play error:', err);
        setIsPlayingUserAudio(false);
      });
    }
  };

  const analyzeSpeakingRecording = async () => {
    if (!userAudioBlob) return;
    setIsAnalyzing(true);

    try {
      const formData = new FormData();
      formData.append('audio', userAudioBlob, 'shadowing_recording.webm');
      formData.append('targetText', targetSentence);

      const res = await fetch('/api/gemini/analyze-speaking', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (data.success && data.analysis) {
        setAiAnalysis(data.analysis);

        // Save to record
        const newRecord: ShadowingPracticeRecord = {
          id: `shadow_${Date.now()}`,
          wordId: activeWord?.id,
          targetText: targetSentence,
          userTranscript: data.analysis.userTranscript,
          pronunciationScore: data.analysis.pronunciationScore,
          fluencyScore: data.analysis.fluencyScore,
          accuracyScore: data.analysis.accuracyScore,
          aiFeedback: data.analysis.aiFeedback,
          mispronouncedWords: data.analysis.mispronouncedWords,
          suggestions: data.analysis.suggestions,
          recordedAt: new Date().toISOString(),
          audioBlobUrl: userAudioUrl || undefined,
        };
        onSaveRecord(newRecord);
      } else {
        alert(data.error || 'Failed to analyze recording.');
      }
    } catch (err) {
      console.error('Failed to submit audio for analysis:', err);
      alert('Error connecting to Gemini voice analysis service.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-900/40 via-purple-900/30 to-slate-900 border border-indigo-500/30 p-6 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-xl bg-indigo-600/30 border border-indigo-500/40 text-indigo-300">
            <Mic className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Shadowing Practice Studio</h2>
            <p className="text-xs text-slate-300">Listen to model speech, record your rhythm, and get instant Gemini AI feedback.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Word Selector */}
        <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col h-[480px]">
          <div className="flex items-center justify-between mb-3 text-xs font-semibold text-slate-400">
            <span className="flex items-center gap-1.5">
              <ListMusic className="w-4 h-4 text-indigo-400" /> Target Words ({allWords.length})
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
            {allWords.map((word) => (
              <button
                key={word.id}
                onClick={() => handleWordSelect(word)}
                className={`w-full text-left p-3 rounded-xl border transition-all flex flex-col gap-1 ${
                  activeWord?.id === word.id
                    ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-md'
                    : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm">{word.word}</span>
                  <span className="text-[10px] text-indigo-400 font-mono">{word.phonetic}</span>
                </div>
                <p className="text-xs text-slate-400 line-clamp-1">{word.example}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Right Column: Practice Canvas & Recorder */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Target Sentence Box */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold uppercase tracking-wider text-slate-500">Target Sentence</span>
              <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                <Gauge className="w-3.5 h-3.5 text-indigo-400" />
                <span className="text-[11px] text-slate-300">Pacing:</span>
                {[0.75, 0.85, 1.0].map(speed => (
                  <button
                    key={speed}
                    onClick={() => setSpeedRate(speed)}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      speedRate === speed ? 'bg-indigo-600 text-white' : 'text-slate-400'
                    }`}
                  >
                    {speed}x
                  </button>
                ))}
              </div>
            </div>

            <p className="text-xl sm:text-2xl font-medium text-slate-100 leading-snug bg-slate-950 p-4 rounded-xl border border-slate-800">
              "{targetSentence}"
            </p>

            <div className="flex items-center gap-3">
              <button
                onClick={playTargetAudio}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/30"
              >
                {isPlayingTarget ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                <span>{isPlayingTarget ? 'Stop Audio' : 'Listen Model Speech'}</span>
              </button>
            </div>
          </div>

          {/* Recording & Comparison Console */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-200">Your Shadowing Recording</h3>
              {isRecording && (
                <div className="flex items-center gap-2 text-xs font-mono text-rose-400 font-bold bg-rose-950/40 px-3 py-1 rounded-full border border-rose-500/30">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                  Recording: {String(Math.floor(recordingSeconds / 60)).padStart(2, '0')}:{String(recordingSeconds % 60).padStart(2, '0')}
                </div>
              )}
            </div>

            {/* Mic Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 py-4 border-y border-slate-800/80">
              {!isRecording ? (
                <button
                  onClick={startRecording}
                  className="flex items-center gap-2 px-6 py-3 rounded-full bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm transition-all shadow-lg shadow-rose-600/30 animate-pulse"
                >
                  <Mic className="w-5 h-5" />
                  <span>Start Recording</span>
                </button>
              ) : (
                <button
                  onClick={stopRecording}
                  className="flex items-center gap-2 px-6 py-3 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold text-sm transition-all border border-slate-700"
                >
                  <Square className="w-5 h-5 text-rose-400" />
                  <span>Stop Recording</span>
                </button>
              )}

              {userAudioUrl && !isRecording && (
                <div className="flex items-center gap-3">
                  <button
                    onClick={toggleUserAudioPlay}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-all border border-slate-700"
                  >
                    {isPlayingUserAudio ? <Pause className="w-4 h-4 text-indigo-400" /> : <Play className="w-4 h-4 text-emerald-400" />}
                    <span>{isPlayingUserAudio ? 'Pause Recording' : 'Listen Recording'}</span>
                  </button>

                  <button
                    onClick={analyzeSpeakingRecording}
                    disabled={isAnalyzing}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-all shadow-lg shadow-purple-600/30"
                  >
                    <Sparkles className="w-4 h-4 text-purple-200" />
                    <span>{isAnalyzing ? 'Analyzing Speech...' : 'Analyze with Gemini AI'}</span>
                  </button>
                </div>
              )}
            </div>

            {/* AI Speech Analysis Report Card */}
            {aiAnalysis && (
              <div className="bg-slate-950 border border-indigo-500/30 p-5 rounded-2xl space-y-4 animate-fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
                    <Award className="w-5 h-5" />
                    <span>Gemini Speech Analysis Report</span>
                  </div>
                </div>

                {/* Metric Scores */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 text-center">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Pronunciation</span>
                    <span className="text-2xl font-extrabold text-indigo-400">{aiAnalysis.pronunciationScore}%</span>
                  </div>
                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 text-center">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Fluency & Rhythm</span>
                    <span className="text-2xl font-extrabold text-purple-400">{aiAnalysis.fluencyScore}%</span>
                  </div>
                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 text-center">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Accuracy</span>
                    <span className="text-2xl font-extrabold text-emerald-400">{aiAnalysis.accuracyScore}%</span>
                  </div>
                </div>

                {/* AI Coaching Summary */}
                <div className="text-xs text-slate-300 bg-indigo-950/30 border border-indigo-500/20 p-3.5 rounded-xl space-y-1">
                  <span className="font-bold text-indigo-300">Coach Feedback: </span>
                  <p className="leading-relaxed">{aiAnalysis.aiFeedback}</p>
                </div>

                {/* Suggestions */}
                {aiAnalysis.suggestions && aiAnalysis.suggestions.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Actionable Tips</span>
                    <ul className="space-y-1">
                      {aiAnalysis.suggestions.map((tip, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-xs text-slate-300">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
