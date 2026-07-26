/**
 * Web Speech API Text-To-Speech helper with English voice selection
 */

export interface TTSVoiceOption {
  voice: SpeechSynthesisVoice;
  lang: string;
  label: string;
}

export function getEnglishVoices(): SpeechSynthesisVoice[] {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return [];
  }
  const voices = window.speechSynthesis.getVoices();
  return voices.filter(v => v.lang.startsWith('en'));
}

export function speakText(
  text: string,
  rate: number = 1.0,
  voiceIndex?: number,
  onEnd?: () => void
): SpeechSynthesisUtterance | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    console.warn('Speech synthesis not supported in this browser.');
    return null;
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = rate;
  utterance.pitch = 1.0;
  utterance.lang = 'en-US';

  const voices = getEnglishVoices();
  if (voices.length > 0) {
    if (voiceIndex !== undefined && voices[voiceIndex]) {
      utterance.voice = voices[voiceIndex];
    } else {
      // Prefer high quality English voices if available
      const preferred = voices.find(v => v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha') || v.name.includes('Daniel') || v.lang === 'en-US');
      if (preferred) utterance.voice = preferred;
    }
  }

  if (onEnd) {
    utterance.onend = onEnd;
    utterance.onerror = onEnd;
  }

  window.speechSynthesis.speak(utterance);
  return utterance;
}

export function stopSpeech(): void {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}
