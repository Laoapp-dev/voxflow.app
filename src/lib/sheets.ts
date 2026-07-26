import { VocabularyWord } from '../types';

/**
 * Extracts Google Spreadsheet ID from URL or raw ID string
 */
export function extractSpreadsheetId(input: string): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  
  if (/^[a-zA-Z0-9-_]{20,60}$/.test(trimmed)) {
    return trimmed;
  }

  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    return match[1];
  }

  return null;
}

/**
 * Parse CSV text matching exact or flexible headers for:
 * word, definition, partOfSpeech, cefrLevel, exampleSentence, synonym, antonym, category, difficulty, laoTranslation, thaiTranslation
 */
export function parseCSVToWords(csvText: string): VocabularyWord[] {
  const lines = csvText.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length < 2) return [];

  // Parse header
  const headers = parseCSVLine(lines[0]).map(h => h.trim().toLowerCase());
  
  const getIndex = (keys: string[]) => headers.findIndex(h => keys.some(k => h === k || h.includes(k)));

  const wordIdx = getIndex(['word', 'term', 'vocabulary']);
  const defIdx = getIndex(['definition', 'def', 'meaning']);
  const posIdx = getIndex(['partofspeech', 'pos', 'part of speech']);
  const cefrIdx = getIndex(['cefrlevel', 'cefr', 'level']);
  const exampleIdx = getIndex(['examplesentence', 'example', 'sentence', 'context']);
  const synIdx = getIndex(['synonym', 'synonyms']);
  const antIdx = getIndex(['antonym', 'antonyms']);
  const categoryIdx = getIndex(['category', 'topic', 'deck']);
  const diffIdx = getIndex(['difficulty', 'diff']);
  const laoIdx = getIndex(['laotranslation', 'lao', 'laos']);
  const thaiIdx = getIndex(['thaitranslation', 'thai']);
  const phoneticIdx = getIndex(['phonetic', 'ipa', 'pronunciation']);

  const parsedWords: VocabularyWord[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i]);
    const wordVal = wordIdx !== -1 && cols[wordIdx] ? cols[wordIdx].trim() : (cols[0] ? cols[0].trim() : '');
    const defVal = defIdx !== -1 && cols[defIdx] ? cols[defIdx].trim() : (cols[1] ? cols[1].trim() : '');

    if (!wordVal || !defVal) continue;

    const exampleVal = exampleIdx !== -1 && cols[exampleIdx] ? cols[exampleIdx].trim() : `Example with ${wordVal}`;
    const laoVal = laoIdx !== -1 && cols[laoIdx] ? cols[laoIdx].trim() : '';
    const thaiVal = thaiIdx !== -1 && cols[thaiIdx] ? cols[thaiIdx].trim() : '';

    parsedWords.push({
      id: `sheet_word_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 4)}`,
      word: wordVal,
      definition: defVal,
      partOfSpeech: posIdx !== -1 && cols[posIdx] ? cols[posIdx].trim() : 'noun',
      cefrLevel: cefrIdx !== -1 && cols[cefrIdx] ? cols[cefrIdx].trim().toUpperCase() : 'B2',
      exampleSentence: exampleVal,
      example: exampleVal,
      synonym: synIdx !== -1 && cols[synIdx] ? cols[synIdx].trim() : '',
      antonym: antIdx !== -1 && cols[antIdx] ? cols[antIdx].trim() : '',
      category: categoryIdx !== -1 && cols[categoryIdx] ? cols[categoryIdx].trim() : 'General',
      difficulty: diffIdx !== -1 && cols[diffIdx] ? cols[diffIdx].trim() : 'Medium',
      laoTranslation: laoVal,
      thaiTranslation: thaiVal,
      translation: thaiVal || laoVal || '',
      phonetic: phoneticIdx !== -1 && cols[phoneticIdx] ? cols[phoneticIdx].trim() : '',
      tags: ['GoogleSheets'],
      source: 'google_sheets',
      sheetRowIndex: i + 1,
      createdAt: new Date().toISOString(),
    });
  }

  return parsedWords;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"' || char === "'") {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

export function generateSampleSheetCSV(): string {
  return `word,definition,partOfSpeech,cefrLevel,exampleSentence,synonym,antonym,category,difficulty,laoTranslation,thaiTranslation
Eloquence,"Fluent or persuasive speaking or writing",noun,C1,"Her eloquence captivated the audience during the keynote speech.","Fluency, Expressiveness","Inarticulateness",Advanced Vocabulary,Hard,"ຄວາມເວົ້າອ່ອນຫວານ, ຄວາມຄ່ອງແຄ້ວ","ความคารมคมคาย, การพูดจาไพเราะ"
Meticulous,"Showing great attention to detail and precision",adjective,C1,"He took meticulous notes during the entire technical lecture.","Thorough, Precise","Careful, Sloppy",Academic,Hard,"ລະອຽດຖີ່ຖ້ວນ","พิถีพิถัน, ละเอียดถี่ถ้วน"
Resilience,"The capacity to recover quickly from difficulties",noun,B2,"Mental resilience allows professionals to overcome setbacks.","Toughness, Adaptability","Fragility",Daily Expressions,Medium,"ຄວາມສາມາດຟື້ນຕົວ","ความยืดหยุ่น"
Ambiguous,"Unclear or open to multiple interpretations",adjective,B2,"The contract contained ambiguous terms.","Unclear, Vague","Explicit, Clear",Academic,Medium,"ກ່ຳກວມ, ບໍ່ຈະແຈ້ງ","กำกวม, ไม่ชัดเจน"`;
}
