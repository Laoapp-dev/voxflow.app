import React, { useState, useEffect } from 'react';
import { Trophy, RefreshCw, Sparkles, CheckCircle2, Clock, Zap } from 'lucide-react';
import confetti from 'canvas-confetti';
import { VocabularyWord } from '../types';

interface MatchingGameProps {
  words: VocabularyWord[];
  onFinish?: (score: number) => void;
}

interface CardItem {
  id: string; // unique card id
  wordId: string;
  type: 'word' | 'definition' | 'translation';
  text: string;
  isMatched: boolean;
}

export const MatchingGame: React.FC<MatchingGameProps> = ({ words, onFinish }) => {
  const [cards, setCards] = useState<CardItem[]>([]);
  const [selectedCards, setSelectedCards] = useState<CardItem[]>([]);
  const [matchesCount, setMatchesCount] = useState(0);
  const [moves, setMoves] = useState(0);
  const [timer, setTimer] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [mode, setMode] = useState<'def' | 'trans'>('def');

  // Initialize cards
  useEffect(() => {
    initializeGame();
  }, [words, mode]);

  // Timer
  useEffect(() => {
    if (isGameOver || cards.length === 0) return;
    const interval = setInterval(() => {
      setTimer(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isGameOver, cards]);

  const initializeGame = () => {
    if (words.length < 2) return;
    
    // Pick up to 6 random words for a round
    const shuffledWords = [...words].sort(() => 0.5 - Math.random()).slice(0, 6);
    
    const cardList: CardItem[] = [];

    shuffledWords.forEach((w) => {
      // Card 1: The Word
      cardList.push({
        id: `word_${w.id}`,
        wordId: w.id,
        type: 'word',
        text: w.word,
        isMatched: false,
      });

      // Card 2: Definition or Lao/Thai translation
      let targetText = w.definition;
      if (mode === 'trans') {
        targetText = w.laoTranslation || w.thaiTranslation || w.translation || w.definition;
      }

      cardList.push({
        id: `def_${w.id}`,
        wordId: w.id,
        type: mode === 'trans' ? 'translation' : 'definition',
        text: targetText,
        isMatched: false,
      });
    });

    // Shuffle cards
    setCards(cardList.sort(() => 0.5 - Math.random()));
    setSelectedCards([]);
    setMatchesCount(0);
    setMoves(0);
    setTimer(0);
    setIsGameOver(false);
  };

  const handleCardClick = (card: CardItem) => {
    if (card.isMatched || selectedCards.some(c => c.id === card.id) || selectedCards.length >= 2) {
      return;
    }

    const newSelected = [...selectedCards, card];
    setSelectedCards(newSelected);

    if (newSelected.length === 2) {
      setMoves(prev => prev + 1);
      const [first, second] = newSelected;

      if (first.wordId === second.wordId && first.type !== second.type) {
        // MATCH!
        setCards(prev => prev.map(c => c.wordId === first.wordId ? { ...c, isMatched: true } : c));
        setSelectedCards([]);
        setMatchesCount(prev => {
          const updated = prev + 1;
          const targetTotal = cards.length / 2;
          if (updated === targetTotal) {
            // Victory!
            setIsGameOver(true);
            confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
            if (onFinish) onFinish(updated);
          }
          return updated;
        });
      } else {
        // MISMATCH - clear selection after delay
        setTimeout(() => {
          setSelectedCards([]);
        }, 800);
      }
    }
  };

  if (words.length < 2) {
    return (
      <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-2xl max-w-lg mx-auto my-8">
        <Zap className="w-12 h-12 text-amber-400 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-white mb-2">Need More Vocabulary Words</h3>
        <p className="text-slate-400 text-sm">Please import or generate at least 2 words to play the Matching Game.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Game Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <span>Vocabulary Matching Game</span>
          </h2>
          <p className="text-xs text-slate-400">Match English terms with their corresponding definitions or translations</p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setMode('def')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                mode === 'def' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Definitions
            </button>
            <button
              onClick={() => setMode('trans')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                mode === 'trans' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Translations
            </button>
          </div>

          <button
            onClick={initializeGame}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all border border-slate-700"
            title="Restart Game"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
          <span className="text-[10px] text-slate-400 font-bold uppercase block">Timer</span>
          <span className="text-lg font-bold text-slate-100 flex items-center justify-center gap-1">
            <Clock className="w-4 h-4 text-indigo-400" />
            {timer}s
          </span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
          <span className="text-[10px] text-slate-400 font-bold uppercase block">Matches</span>
          <span className="text-lg font-bold text-emerald-400">
            {matchesCount} / {cards.length / 2}
          </span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
          <span className="text-[10px] text-slate-400 font-bold uppercase block">Moves</span>
          <span className="text-lg font-bold text-amber-400">{moves}</span>
        </div>
      </div>

      {/* Game Grid */}
      {!isGameOver ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {cards.map((card) => {
            const isSelected = selectedCards.some(c => c.id === card.id);
            const isWordType = card.type === 'word';

            return (
              <button
                key={card.id}
                onClick={() => handleCardClick(card)}
                disabled={card.isMatched}
                className={`min-h-[100px] p-4 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between shadow-md active:scale-98 ${
                  card.isMatched
                    ? 'bg-emerald-950/20 border-emerald-500/30 opacity-40 cursor-default'
                    : isSelected
                    ? 'bg-indigo-600/30 border-indigo-400 shadow-indigo-500/20 scale-102 ring-2 ring-indigo-500/50'
                    : isWordType
                    ? 'bg-slate-900 hover:bg-slate-850 border-slate-800 hover:border-slate-700'
                    : 'bg-slate-950/80 hover:bg-slate-900 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-2">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                    isWordType ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                  }`}>
                    {isWordType ? 'Word' : mode === 'trans' ? 'Translation' : 'Definition'}
                  </span>
                  {card.isMatched && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                </div>

                <p className={`font-semibold line-clamp-3 ${isWordType ? 'text-lg text-white font-extrabold' : 'text-sm text-slate-200'}`}>
                  {card.text}
                </p>
              </button>
            );
          })}
        </div>
      ) : (
        /* Victory Screen */
        <div className="bg-slate-900 border border-indigo-500/30 p-8 rounded-2xl text-center space-y-4 shadow-2xl animate-fade-in">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
            <Sparkles className="w-8 h-8" />
          </div>
          <h3 className="text-2xl font-extrabold text-white">Congratulations! Game Completed!</h3>
          <p className="text-slate-300 text-sm max-w-md mx-auto">
            You matched all {matchesCount} pairs in <span className="text-indigo-400 font-bold">{timer} seconds</span> with only <span className="text-amber-400 font-bold">{moves} moves</span>.
          </p>

          <button
            onClick={initializeGame}
            className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 transition-all"
          >
            Play Again
          </button>
        </div>
      )}
    </div>
  );
};
