import { VocabularyWord } from '../types';
import vocabularyFullData from '../data/vocabulary_full.json';

// Full vocabulary library (10,700+ words) imported from the provided vocabulary.json,
// normalized to the app's VocabularyWord schema with generated ids and createdAt.
export const INITIAL_VOCABULARY: VocabularyWord[] = vocabularyFullData as unknown as VocabularyWord[];

export const VOCABULARY_WORD_COUNT = INITIAL_VOCABULARY.length;
