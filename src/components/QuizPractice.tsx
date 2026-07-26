import React, { useState, useEffect } from 'react';
import { HelpCircle, CheckCircle2, XCircle, ChevronRight, RotateCcw, Volume2, Award } from 'lucide-react';
import confetti from 'canvas-confetti';
import { VocabularyWord } from '../types';
import { speakText } from '../lib/tts';

interface QuizPracticeProps {
  words: VocabularyWord[];
  onFinish?: (score: number, total: number) => void;
}

interface QuizQuestion {
  word: VocabularyWord;
  options: string[];
  correctAnswer: string;
  type: 'definition' | 'translation' | 'synonym';
}

export const QuizPractice: React.FC<QuizPracticeProps> = ({ words, onFinish }) => {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [isQuizFinished, setIsQuizFinished] = useState(false);

  useEffect(() => {
    generateQuiz();
  }, [words]);

  const generateQuiz = () => {
    if (words.length < 4) return;

    const shuffled = [...words].sort(() => 0.5 - Math.random());
    const generatedQuestions: QuizQuestion[] = [];

    shuffled.slice(0, 10).forEach(currentWord => {
      // Pick question type randomly
      const questionTypes: ('definition' | 'translation' | 'synonym')[] = ['definition'];
      if (currentWord.laoTranslation || currentWord.thaiTranslation || currentWord.translation) {
        questionTypes.push('translation');
      }
      if (currentWord.synonym) {
        questionTypes.push('synonym');
      }

      const qType = questionTypes[Math.floor(Math.random() * questionTypes.length)];
      let correctAnswer = '';

      if (qType === 'definition') {
        correctAnswer = currentWord.definition;
      } else if (qType === 'translation') {
        correctAnswer = currentWord.laoTranslation || currentWord.thaiTranslation || currentWord.translation || currentWord.definition;
      } else {
        correctAnswer = currentWord.synonym || currentWord.definition;
      }

      // Distractors (3 wrong options)
      const distractors = words
        .filter(w => w.id !== currentWord.id)
        .map(w => {
          if (qType === 'definition') return w.definition;
          if (qType === 'translation') return w.laoTranslation || w.thaiTranslation || w.translation || w.definition;
          return w.synonym || w.definition;
        })
        .filter(Boolean)
        .sort(() => 0.5 - Math.random())
        .slice(0, 3);

      const options = [correctAnswer, ...distractors].sort(() => 0.5 - Math.random());

      generatedQuestions.push({
        word: currentWord,
        options,
        correctAnswer,
        type: qType,
      });
    });

    setQuestions(generatedQuestions);
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setScore(0);
    setIsQuizFinished(false);
  };

  const handleSelectOption = (option: string) => {
    if (isAnswered) return;
    setSelectedOption(option);
    setIsAnswered(true);

    const currentQ = questions[currentIndex];
    if (option === currentQ.correctAnswer) {
      setScore(prev => prev + 1);
    }
  };

  const handleNextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      setIsQuizFinished(true);
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      if (onFinish) onFinish(score, questions.length);
    }
  };

  if (words.length < 4) {
    return (
      <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-2xl max-w-lg mx-auto my-8">
        <HelpCircle className="w-12 h-12 text-indigo-400 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-white mb-2">Need at least 4 Vocabulary Words</h3>
        <p className="text-slate-400 text-sm">Please import or generate at least 4 words to construct quiz choices.</p>
      </div>
    );
  }

  if (questions.length === 0) return null;

  const currentQ = questions[currentIndex];

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between bg-slate-900 border border-slate-800 p-4 rounded-2xl">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Award className="w-5 h-5 text-indigo-400" />
            <span>Vocabulary Quiz</span>
          </h2>
          <p className="text-xs text-slate-400">Test your recall accuracy</p>
        </div>

        <button
          onClick={generateQuiz}
          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all border border-slate-700 text-xs font-semibold flex items-center gap-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Restart</span>
        </button>
      </div>

      {!isQuizFinished ? (
        <div className="bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-2xl space-y-6 shadow-xl">
          {/* Question Progress */}
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Question {currentIndex + 1} of {questions.length}</span>
            <span className="font-bold text-indigo-400">Score: {score}</span>
          </div>

          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-indigo-500 h-full transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
            />
          </div>

          {/* Question Prompt */}
          <div className="space-y-2 text-center py-4 bg-slate-950 p-6 rounded-2xl border border-slate-800">
            <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded border border-indigo-500/20 inline-block mb-1">
              Select correct {currentQ.type} for:
            </span>

            <div className="flex items-center justify-center gap-3">
              <h3 className="text-3xl font-extrabold text-white">{currentQ.word.word}</h3>
              <button
                onClick={() => speakText(currentQ.word.word)}
                className="p-2 rounded-lg bg-slate-800 hover:bg-indigo-600 text-slate-200 transition-all"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400">Part of Speech: <span className="text-slate-200">{currentQ.word.partOfSpeech}</span></p>
          </div>

          {/* Choices */}
          <div className="space-y-3">
            {currentQ.options.map((option, idx) => {
              const isSelected = selectedOption === option;
              const isCorrect = option === currentQ.correctAnswer;

              let btnStyle = 'bg-slate-950 hover:bg-slate-850 border-slate-800 text-slate-200';
              if (isAnswered) {
                if (isCorrect) {
                  btnStyle = 'bg-emerald-950/60 border-emerald-500 text-emerald-200 font-bold';
                } else if (isSelected) {
                  btnStyle = 'bg-rose-950/60 border-rose-500 text-rose-200';
                } else {
                  btnStyle = 'bg-slate-950/40 border-slate-800/40 text-slate-500 opacity-50';
                }
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleSelectOption(option)}
                  disabled={isAnswered}
                  className={`w-full p-4 rounded-xl border text-left text-sm transition-all duration-200 flex items-start justify-between gap-3 ${btnStyle}`}
                >
                  <span className="leading-relaxed">{option}</span>
                  {isAnswered && isCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />}
                  {isAnswered && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />}
                </button>
              );
            })}
          </div>

          {/* Next button */}
          {isAnswered && (
            <div className="pt-2 animate-fade-in">
              <button
                onClick={handleNextQuestion}
                className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2"
              >
                <span>{currentIndex < questions.length - 1 ? 'Next Question' : 'View Results'}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Quiz Summary */
        <div className="bg-slate-900 border border-indigo-500/30 p-8 rounded-2xl text-center space-y-4 shadow-2xl">
          <Award className="w-16 h-16 text-indigo-400 mx-auto" />
          <h3 className="text-2xl font-extrabold text-white">Quiz Completed!</h3>
          <p className="text-slate-300 text-sm">
            You scored <span className="text-emerald-400 font-extrabold text-lg">{score}</span> out of <span className="text-white font-bold">{questions.length}</span> ({Math.round((score / questions.length) * 100)}%)
          </p>

          <button
            onClick={generateQuiz}
            className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 transition-all"
          >
            Try Another Quiz
          </button>
        </div>
      )}
    </div>
  );
};
