// Audio recording helper with cross-browser MIME type support, timeslice chunking, and speech recognition helpers

export const getSupportedAudioMimeType = (): string => {
  if (typeof window === 'undefined' || typeof MediaRecorder === 'undefined') return '';
  const types = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/aac',
    'audio/ogg',
    'audio/wav',
  ];
  for (const type of types) {
    if (MediaRecorder.isTypeSupported(type)) return type;
  }
  return '';
};

export const evaluateWordPronunciation = (spoken: string, target: string): number => {
  const cleanSpoken = spoken.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim();
  const cleanTarget = target.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim();

  if (!cleanSpoken) return 0;
  if (cleanSpoken === cleanTarget) return 100;
  if (cleanSpoken.includes(cleanTarget) || cleanTarget.includes(cleanSpoken)) return 85;

  const spokenWords = cleanSpoken.split(/\s+/);
  const targetWords = cleanTarget.split(/\s+/);
  const matches = spokenWords.filter(w => targetWords.includes(w)).length;
  const score = Math.round((matches / Math.max(targetWords.length, 1)) * 100);
  return score < 40 && cleanSpoken.length >= 2 ? 60 : score;
};
