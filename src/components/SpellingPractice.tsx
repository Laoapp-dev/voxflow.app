import React, { useState, useEffect } from 'react';
import { Volume2, CheckCircle2, XCircle, HelpCircle, ChevronRight, RotateCcw, Lightbulb } from 'lucide-react';
import confetti from 'canvas-confetti';
import { VocabularyWord } from '../types';
import { speakText } from '../lib/tts';

interface SpellingPracticeProps {
  words: VocabularyWord[];
  onFinish?: (score: number) => void;
}

export const SpellingPractice: React.FC<SpellingPracticeProps> = ({ words, onFinish }) => {
  const [sessionWords, setSessionWords] = useState<VocabularyWord[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [inputVal, setInputVal] = useState('');
  const [isChecked, setIsChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [hintLetters, setHintLetters] = useState<string>('');
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    initializePractice();
  }, [words]);

  const initializePractice = () => {
    if (words.length === 0) return;
    const shuffled = [...words].sort(() => 0.5 - Math.random()).slice(0, 10);
    setSessionWords(shuffled);
    setCurrentIndex(0);
    setInputVal('');
    setIsChecked(false);
    setIsCorrect(false);
    setHintLetters('');
    setScore(0);
    setIsFinished(false);

    // Auto speak first word after brief delay
    if (shuffled.length > 0) {
      setTimeout(() => speakText(shuffled[0].word), 400);
    }
  };

  const currentWord = sessionWords[currentIndex];

  const handleCheck = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!currentWord || isChecked) return;

    const cleanInput = inputVal.trim().toLowerCase();
    const target = currentWord.word.trim().toLowerCase();

    const correct = cleanInput === target;
    setIsCorrect(correct);
    setIsChecked(true);

    if (correct) {
      setScore(prev => prev + 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < sessionWords.length - 1) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      setInputVal('');
      setIsChecked(false);
      setIsCorrect(false);
      setHintLetters('');
      setTimeout(() => speakText(sessionWords[nextIdx].word), 300);
    } else {
      setIsFinished(true);
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      if (onFinish) onFinish(score);
    }
  };

  const handleShowHint = () => {
    if (!currentWord) return;
    const len = currentWord.word.length;
    const firstTwo = currentWord.word.slice(0, Math.min(2, len));
    setHintLetters(`${firstTwo}... (${len} letters)`);
  };

  if (words.length === 0) {
    return (
      <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-2xl max-w-lg mx-auto my-8">
        <HelpCircle className="w-12 h-12 text-indigo-400 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-white mb-2">No Words for Spelling Practice</h3>
        <p className="text-slate-400 text-sm">Please import or create words first.</p>
      </div>
    );
  }

  if (sessionWords.length === 0 || !currentWord) return null;

  return (
    <div className="max-w-xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between bg-slate-900 border border-slate-800 p-4 rounded-2xl">
        <div>
          <h2 className="text-xl font-extrabold text-white">Spelling & Audio Challenge</h2>
          <p className="text-xs text-slate-400">Listen and type the target vocabulary word</p>
        </div>

        <button
          onClick={initializePractice}
          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all border border-slate-700 text-xs font-semibold flex items-center gap-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Restart</span>
        </button>
      </div>

      {!isFinished ? (
        <div className="bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-2xl space-y-6 shadow-xl">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Word {currentIndex + 1} of {sessionWords.length}</span>
            <span className="font-bold text-emerald-400">Score: {score}</span>
          </div>

          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-indigo-500 h-full transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / sessionWords.length) * 100}%` }}
            />
          </div>

          {/* Audio Play Button */}
          <div className="text-center py-6 bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4">
            <button
              onClick={() => speakText(currentWord.word)}
              className="p-5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white shadow-xl shadow-indigo-600/30 transition-all hover:scale-105 active:scale-95 inline-flex items-center justify-center"
              title="Click to Listen"
            >
              <Volume2 className="w-8 h-8" />
            </button>
            <p className="text-xs text-slate-400 font-medium">Click button to re-listen to the word</p>

            {/* Definition / Translation Clue */}
            <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-1 text-left">
              <span className="text-indigo-400 font-bold uppercase text-[10px] block">CLUE:</span>
              <p><strong className="text-white">Definition:</strong> {currentWord.definition}</p>
              {(currentWord.laoTranslation || currentWord.thaiTranslation) && (
                <p className="text-slate-400">
                  <strong>Translation:</strong> {currentWord.laoTranslation || currentWord.thaiTranslation}
                </p>
              )}
            </div>

            {hintLetters && (
              <p className="text-xs font-mono text-amber-400 bg-amber-950/40 border border-amber-500/30 p-2 rounded-lg inline-block">
                Hint: {hintLetters}
              </p>
            )}
          </div>

          {/* Form input */}
          <form onSubmit={handleCheck} className="space-y-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                disabled={isChecked}
                placeholder="Type the exact word..."
                className="flex-1 px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white font-semibold placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-lg"
                autoFocus
              />

              {!isChecked ? (
                <button
                  type="submit"
                  disabled={!inputVal.trim()}
                  className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-sm shadow-md transition-all shrink-0"
                >
                  Submit
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-md transition-all shrink-0 flex items-center gap-1.5"
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>

            {!isChecked && !hintLetters && (
              <button
                type="button"
                onClick={handleShowHint}
                className="text-xs text-slate-400 hover:text-amber-400 flex items-center gap-1 mx-auto transition-colors"
              >
                <Lightbulb className="w-3.5 h-3.5" /> Show Letter Hint
              </button>
            )}
          </form>

          {/* Result Feedback */}
          {isChecked && (
            <div className={`p-4 rounded-xl border flex items-center gap-3 animate-fade-in ${
              isCorrect ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-300' : 'bg-rose-950/50 border-rose-500/40 text-rose-300'
            }`}>
              {isCorrect ? (
                <>
                  <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                  <div>
                    <p className="font-bold">Correct Spelling!</p>
                    <p className="text-xs text-emerald-400/80">Great job capturing the phonetic sound.</p>
                  </div>
                </>
              ) : (
                <>
                  <XCircle className="w-6 h-6 text-rose-400 shrink-0" />
                  <div>
                    <p className="font-bold">Incorrect</p>
                    <p className="text-xs text-rose-300">
                      Target word: <span className="font-extrabold underline text-white">{currentWord.word}</span>
                    </p>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl text-center space-y-4 shadow-2xl">
          <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto" />
          <h3 className="text-2xl font-extrabold text-white">Spelling Challenge Complete!</h3>
          <p className="text-slate-300 text-sm">
            Your accuracy score: <span className="text-emerald-400 font-extrabold text-lg">{score}</span> / {sessionWords.length}
          </p>
          <button
            onClick={initializePractice}
            className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 transition-all"
          >
            Play Again
          </button>
        </div>
      )}
    </div>
  );
};
