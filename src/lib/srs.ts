import { ReviewRating, SRSItem, MasteryStatus } from '../types';

export function createInitialSRSItem(wordId: string, userId?: string): SRSItem {
  return {
    id: `srs_${wordId}_${Date.now()}`,
    wordId,
    userId,
    interval: 0,
    repetition: 0,
    easeFactor: 2.5,
    dueDate: new Date().toISOString(),
    status: 'new',
    lapses: 0,
  };
}

/**
 * SuperMemo SM-2 Algorithm implementation
 * @param item Current SRS state
 * @param rating User evaluation (0: Again, 3: Hard, 4: Good, 5: Easy)
 */
export function calculateNextSRS(item: SRSItem, rating: ReviewRating): SRSItem {
  let { interval, repetition, easeFactor, lapses } = item;

  // Calculate new Ease Factor (EF)
  // EF' = EF + (0.1 - (5 - rating) * (0.08 + (5 - rating) * 0.02))
  const newEaseFactor = Math.max(
    1.3,
    easeFactor + (0.1 - (5 - rating) * (0.08 + (5 - rating) * 0.02))
  );

  let newInterval: number;
  let newRepetition: number;
  let newLapses = lapses;

  if (rating < 3) {
    // Failed review (Again)
    newRepetition = 0;
    newInterval = 1; // Repeat tomorrow or later today
    newLapses += 1;
  } else {
    // Successful review
    if (repetition === 0) {
      newInterval = 1;
    } else if (repetition === 1) {
      newInterval = 6;
    } else {
      newInterval = Math.round(interval * newEaseFactor);
    }

    // Boost interval if Easy (rating = 5)
    if (rating === 5) {
      newInterval = Math.round(newInterval * 1.2);
    }

    newRepetition = repetition + 1;
  }

  // Calculate due date
  const now = new Date();
  const nextDueDate = new Date(now.getTime() + newInterval * 24 * 60 * 60 * 1000);

  // Determine status
  let status: MasteryStatus = 'learning';
  if (newInterval >= 21) {
    status = 'mastered';
  } else if (newInterval >= 6) {
    status = 'review';
  } else if (newRepetition > 0) {
    status = 'learning';
  } else {
    status = 'new';
  }

  return {
    ...item,
    interval: newInterval,
    repetition: newRepetition,
    easeFactor: parseFloat(newEaseFactor.toFixed(2)),
    dueDate: nextDueDate.toISOString(),
    lastReviewed: now.toISOString(),
    status,
    lapses: newLapses,
  };
}

export function isDueToday(dueDateIso: string): boolean {
  const due = new Date(dueDateIso);
  const now = new Date();
  return due <= now;
}
