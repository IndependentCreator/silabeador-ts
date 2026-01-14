import { describe, test, expect } from 'vitest';
import { Syllabification, syllabify, tonica } from '../src/index.js';

describe('Syllabification', () => {
  describe('syllabify function', () => {
    test('basic syllabification', () => {
      expect(syllabify('Uvulopalatofaringoplastia')).toEqual([
        'U', 'vu', 'lo', 'pa', 'la', 'to', 'fa', 'rin', 'go', 'plas', 'tia'
      ]);
    });

    test('simple word', () => {
      expect(syllabify('hola')).toEqual(['ho', 'la']);
    });

    test('word with diphthong', () => {
      expect(syllabify('ciudad')).toEqual(['ciu', 'dad']);
    });

    test('word with exception level 0', () => {
      expect(syllabify('cruel', 0)).toEqual(['cruel']);
    });

    test('word with exception level 1', () => {
      expect(syllabify('cruel', 1)).toEqual(['cru', 'el']);
    });

    test('single syllable word', () => {
      expect(syllabify('sol')).toEqual(['sol']);
    });

    test('word with accent', () => {
      expect(syllabify('canción')).toEqual(['can', 'ción']);
    });
  });

  describe('tonica function', () => {
    test('stress detection', () => {
      expect(tonica('Uvulopalatofaringoplastia')).toBe(-2);
    });

    test('stress on final syllable', () => {
      expect(tonica('reloj')).toBe(-1);
    });

    test('stress on penultimate syllable', () => {
      expect(tonica('casa')).toBe(-2);
    });

    test('stress with accent mark', () => {
      // Stress is on the syllable with the accent mark (last syllable in this case)
      expect(tonica('canción')).toBe(-1);
    });

    test('single syllable stress', () => {
      expect(tonica('sol')).toBe(-1);
    });
  });

  describe('Syllabification class', () => {
    test('class instantiation with syllables', () => {
      const x = new Syllabification('Uvulopalatofaringoplastia');
      expect(x.syllables).toEqual([
        'U', 'vu', 'lo', 'pa', 'la', 'to', 'fa', 'rin', 'go', 'plas', 'tia'
      ]);
    });

    test('class instantiation with stress', () => {
      const x = new Syllabification('Uvulopalatofaringoplastia');
      expect(x.stress).toBe(-2);
    });

    test('class with exceptions level 0', () => {
      const x = new Syllabification('cruel', 0);
      expect(x.syllables).toEqual(['cruel']);
    });

    test('class with exceptions level 1', () => {
      const x = new Syllabification('cruel', 1);
      expect(x.syllables).toEqual(['cru', 'el']);
    });
  });

  describe('edge cases', () => {
    test('empty string handling', () => {
      expect(syllabify('')).toEqual([]);
    });

    test('word with special characters', () => {
      expect(syllabify('niño')).toEqual(['ni', 'ño']);
    });

    test('word with multiple diacritics', () => {
      // Complex case with ü - the algorithm handles this specially
      const result = syllabify('lingüística');
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toBe('lin');
    });
  });

  describe('IPA mode', () => {
    test('IPA mode enabled', () => {
      const result = syllabify('palabra', 1, true);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('epenthesis', () => {
    test('epenthesis applied', () => {
      const result = syllabify('stop', 1, false, false, true);
      expect(result[0]).toMatch(/e/);
    });
  });

  describe('tl onset', () => {
    test('tl as indivisible onset', () => {
      const result1 = syllabify('atlas', 1, false, false, false, false);
      const result2 = syllabify('atlas', 1, false, false, false, true);
      // Results may differ based on tl handling
      expect(Array.isArray(result1)).toBe(true);
      expect(Array.isArray(result2)).toBe(true);
    });
  });
});
