export type MasteryStatus = 'new' | 'learning' | 'review' | 'mastered';

export interface VocabularyWord {
  id: string;
  userId?: string;
  word: string;
  definition: string;
  partOfSpeech: string;
  cefrLevel?: string; // A1, A2, B1, B2, C1, C2
  exampleSentence: string;
  example?: string; // fallback alias for exampleSentence
  synonym?: string;
  antonym?: string;
  category: string;
  difficulty?: string; // Easy, Medium, Hard
  laoTranslation?: string;
  thaiTranslation?: string;
  translation?: string; // general translation fallback
  phonetic?: string;
  tags?: string[];
  source?: 'google_sheets' | 'manual' | 'ai' | 'sample';
  sheetRowIndex?: number;
  isStarred?: boolean;
  createdAt: string;
}

export interface SRSItem {
  id: string;
  wordId: string;
  userId?: string;
  interval: number; // in days
  repetition: number;
  easeFactor: number; // default 2.5
  dueDate: string; // ISO date string
  lastReviewed?: string; // ISO date string
  status: MasteryStatus;
  lapses: number;
}

export type ReviewRating = 0 | 1 | 2 | 3 | 4 | 5; 
// 0: Complete blackout, 1: Wrong, 2: Hard remembered, 3: Good, 4: Easy, 5: Perfect

export interface ShadowingPracticeRecord {
  id: string;
  wordId?: string;
  userId?: string;
  targetText: string;
  userTranscript?: string;
  pronunciationScore: number; // 0 - 100
  fluencyScore: number;       // 0 - 100
  accuracyScore: number;      // 0 - 100
  aiFeedback: string;
  mispronouncedWords?: string[];
  suggestions?: string[];
  recordedAt: string;
  audioBlobUrl?: string;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  googleSheetId?: string;
  dailyGoal: number; // target review words per day
  streak: number;
  lastActiveDate?: string;
  role: 'admin' | 'learner';
}

export interface SheetColumnMapping {
  wordCol: string;
  phoneticCol?: string;
  partOfSpeechCol?: string;
  definitionCol: string;
  exampleCol?: string;
  translationCol?: string;
  categoryCol?: string;
}

export interface GoogleSheetConfig {
  spreadsheetId: string;
  spreadsheetUrl: string;
  sheetName: string;
  autoSync: boolean;
  columnMapping: SheetColumnMapping;
  lastSyncedAt?: string;
}
