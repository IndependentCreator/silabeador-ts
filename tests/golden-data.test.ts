import { describe, test, expect } from 'vitest';
import { readFileSync } from 'fs';
import { syllabify, tonica } from '../src/index.js';

interface WordEntry {
  word: string;
  syllables: string[];
  stress_index: number;
  syllabified: string;
}

interface SentenceEntry {
  line_number: number;
  sentence: string;
  words: WordEntry[];
}

interface GoldenData {
  metadata: {
    corpus_file: string;
    parameters: {
      exceptions: 0 | 1 | 2;
      ipa: boolean;
      h: boolean;
      epen: boolean;
      tl: boolean;
    };
    total_sentences: number;
    total_words: number;
  };
  data: SentenceEntry[];
}

const goldenData: GoldenData = JSON.parse(
  readFileSync(new URL('../golden_data.json', import.meta.url), 'utf-8')
);

const { parameters } = goldenData.metadata;

describe('Golden Data Tests', () => {
  describe('syllabification', () => {
    for (const sentence of goldenData.data) {
      for (const wordEntry of sentence.words) {
        test(`"${wordEntry.word}" → ${wordEntry.syllabified}`, () => {
          const result = syllabify(
            wordEntry.word,
            parameters.exceptions,
            parameters.ipa,
            parameters.h,
            parameters.epen,
            parameters.tl
          );
          expect(result).toEqual(wordEntry.syllables);
        });
      }
    }
  });

  describe('stress detection', () => {
    for (const sentence of goldenData.data) {
      for (const wordEntry of sentence.words) {
        test(`"${wordEntry.word}" stress at ${wordEntry.stress_index}`, () => {
          const result = tonica(
            wordEntry.word,
            parameters.exceptions,
            parameters.ipa,
            parameters.h,
            parameters.epen,
            parameters.tl
          );
          expect(result).toBe(wordEntry.stress_index);
        });
      }
    }
  });
});
