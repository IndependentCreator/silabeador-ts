import type { ExceptionLevel } from './types.js';
import { EXCEPTIONS_LIST } from './exceptions-data.js';

/**
 * Class to handle syllabification and stress marking of words.
 */
export class Syllabification {
  private vowels: string;
  private close: string;
  private ipa: boolean;
  private h: boolean;
  private tl: boolean;
  private hiatus: boolean = false;
  private word: string | string[];

  /**
   * List of syllables in the word
   */
  public readonly syllables: string[];

  /**
   * Index of stressed syllable (negative indexing from end)
   */
  public readonly stress: number;

  /**
   * Initialize the Syllabification class.
   *
   * @param word - The word to be syllabified
   * @param exceptions - Level of exceptions handling (0: none, 1: basic, 2: extended)
   * @param ipa - Boolean indicating whether to use IPA rules
   * @param h - Boolean indicating whether to consider 'h' as a consonant
   * @param epen - Boolean indicating whether to apply epenthesis
   * @param tl - Boolean indicating whether to include 'tl' as an indivisible onset
   */
  constructor(
    word: string,
    exceptions: ExceptionLevel = 1,
    ipa: boolean = false,
    h: boolean = false,
    epen: boolean = false,
    tl: boolean = false
  ) {
    this.ipa = ipa;
    this.h = h;
    this.tl = tl;

    this.vowels = 'aeiouáéíóúäëïöüàèìòùAEIOUÁÉÍÓÚÄËÏÓÜÀÈÌÒÙ';
    this.close = 'iuIU';

    if (epen) {
      word = this.epenthesis(word);
    }

    if (this.ipa) {
      this.vowels += 'jw';
      this.close += 'jw';
    }

    if (exceptions > 0) {
      this.hiatus = exceptions > 1;
      this.word = this.makeExceptions(word);
      this.word = this.latin(this.word);
    } else {
      this.word = word;
    }

    this.syllables = this.syllabify(this.word);
    this.stress = this.stressedSyllable(this.syllables);
  }

  /**
   * Handle specific word exceptions during syllabification.
   *
   * @param word - The word to apply exceptions to
   * @returns The modified word with exceptions applied
   */
  private makeExceptions(word: string): string {
    const caparros: Record<string, string> = { fie: 'fi_e', sua: 'su_a', rui: 'ru_i' };

    if (this.hiatus && Object.keys(caparros).some(x => word.startsWith(x))) {
      const prefix = word.slice(0, 3);
      if (prefix in caparros) {
        word = word.replace(prefix, caparros[prefix]);
      }
    }

    // Load exceptions list from inlined data
    const lines = EXCEPTIONS_LIST;
    const exceptionsList = lines
      .split('\n')
      .filter(line => line.trim() && !line.startsWith('#'))
      .map(line => line.trim().split(/\s+/));

    for (const exception of exceptionsList) {
      // Convert Python backreferences (\1, \2) to JavaScript ($1, $2)
      const replacement = exception[1].replace(/\\(\d+)/g, '$$$1');
      // Convert \b word boundaries to Unicode-aware boundaries
      // JavaScript's \b doesn't recognize Unicode letters (áéíóú, etc.)
      // Use lookbehind/lookahead with Unicode letter class instead
      let pattern = exception[0]
        .replace(/\\b(?=.)/g, '(?<![\\p{L}\\p{N}])')  // \b at start of pattern
        .replace(/(?<=.)\\b/g, '(?![\\p{L}\\p{N}])'); // \b at end of pattern
      word = word.replace(new RegExp(pattern, 'gu'), replacement);
    }

    return word;
  }

  /**
   * Apply epenthesis to the word.
   *
   * @param word - The word to apply epenthesis to
   * @returns The modified word with epenthesis applied
   */
  private epenthesis(word: string): string {
    const liquidae = ['sch', 'sc', 'st', 'sp', 'sf', 'sb', 'sm', 'sn'];

    if (liquidae.some(onset => word.startsWith(onset))) {
      for (const onset of liquidae) {
        if (word.startsWith(onset)) {
          if ('aeiouáéíóúrl'.includes(word[onset.length])) {
            word = `es_${onset.slice(1)}${word.slice(onset.length)}`;
          } else {
            word = `e${onset}_${word.slice(onset.length)}`;
          }
          break;
        }
      }
    }

    return word;
  }

  /**
   * Apply Latin-specific syllabification and accentuation rules.
   *
   * @param word - The word to apply Latin rules to
   * @returns The modified word with Latin rules applied
   */
  private latin(word: string | string[]): string | string[] {
    const flexiones = ['um', 'em', 'at', 'ant', 'it', 'unt', 'am'];
    const dictionarium: Record<string, string> = { a: 'á', e: 'é', i: 'í', o: 'ó', u: 'ú' };
    const diphthongi: Record<string, string> = { ae: 'æ', oe: 'œ' };

    if (typeof word === 'string') {
      const lowerWord = word.toLowerCase();
      if (
        flexiones.some(x => lowerWord.endsWith(x)) &&
        !['á', 'é', 'í', 'ó', 'ú'].some(x => lowerWord.includes(x))
      ) {
        word = lowerWord;

        for (const flexio of flexiones) {
          if (word.endsWith(flexio)) {
            word = word.replace(new RegExp(`${flexio}\\b`), `_${flexio}`);
            break;
          }
        }

        for (const [clavis, pretium] of Object.entries(diphthongi)) {
          word = word.replace(clavis, pretium);
        }

        const syllables = this.syllabify(word);

        if (syllables.length > 1) {
          // Apply stress to the appropriate syllable
          if (
            syllables.length === 2 ||
            (syllables.length > 1 &&
              (Object.values(diphthongi).some(dipht => syllables.at(-2)!.includes(dipht)) ||
                Object.keys(dictionarium).filter(x => syllables.at(-2)!.includes(x)).length > 1 ||
                !Object.keys(dictionarium).some(x => syllables.at(-2)!.endsWith(x))))
          ) {
            for (const [clavis, pretium] of Object.entries(dictionarium)) {
              if (syllables.at(-2)!.includes(clavis)) {
                syllables[syllables.length - 2] = syllables[syllables.length - 2].replace(clavis, pretium);
                break;
              }
            }
          } else if (
            Object.values(diphthongi).some(dipht => syllables.at(-3)!.includes(dipht)) ||
            Object.keys(dictionarium).filter(x => syllables.at(-3)!.includes(x)).length > 1 ||
            !Object.keys(dictionarium).some(x => syllables.at(-3)!.endsWith(x))
          ) {
            for (const [clavis, pretium] of Object.entries(dictionarium)) {
              if (syllables.at(-3)!.includes(clavis)) {
                syllables[syllables.length - 3] = syllables[syllables.length - 3].replace(clavis, pretium);
                break;
              }
            }
          } else {
            for (const i of Object.keys(dictionarium)) {
              syllables[syllables.length - 2] = syllables[syllables.length - 2].replace(i, dictionarium[i]);
              break;
            }
          }
        }

        word = syllables;
      }
    }

    return word;
  }

  /**
   * Split a word into its constituent syllables.
   *
   * @param word - The word to syllabify
   * @returns A list of syllables
   */
  private syllabify(word: string | string[]): string[] {
    if (typeof word === 'string') {
      const foreignLig: Record<string, string> = {
        'à': 'a', 'è': 'e', 'ì': 'i', 'ò': 'o', 'ù': 'u',
        'ã': 'a', 'ẽ': 'e', 'ĩ': 'i', 'õ': 'o', 'ũ': 'u',
        'ﬁ': 'fi', 'ﬂ': 'fl'
      };

      // Remove non-word characters but keep Unicode letters, diacritics, and underscore (used for exceptions)
      word = word.replace(/[^\p{L}\p{N}_]/gu, '');
      word = Array.from(word)
        .map(letter => foreignLig[letter] ?? letter)
        .join('');

      let syllables = this.split(word);
      syllables = this.join(syllables);

      return syllables.map(x => x.trim());
    }

    return word;
  }

  /**
   * Recursively split a word into a list of syllables.
   *
   * @param word - The word to split
   * @param syllables - The list of syllables built so far
   * @returns A list of syllables
   */
  private split(word: string, syllables: string[] = []): string[] {
    const diphthongPattern = new RegExp(
      `(?:[qg][wuü](?:[eé](?:h*[${this.close}])?|i(?:h*[aeoáéó])?|í)|` +
      `[${this.close}](?:h*[aáoóeéi])(?:h*[${this.close}])?|` +
      `[aáoóeéií](?:h*[${this.close}]))$`
    );
    const diphthongMatch = word.match(diphthongPattern);
    const digraph = ['ll', 'ch', 'rr'];

    if (diphthongMatch) {
      const diphthong = diphthongMatch[0].replace(/[gq]/g, '');
      return this.split(word.slice(0, -diphthong.length), [diphthong, ...syllables]);
    } else if (digraph.some(d => word.endsWith(d))) {
      return this.split(word.slice(0, -2), [word.slice(-2), ...syllables]);
    } else if (word) {
      return this.split(word.slice(0, -1), [word.slice(-1), ...syllables]);
    }

    return syllables;
  }

  /**
   * Join syllables according to specific phonological rules.
   *
   * @param syllables - The list of syllables to join
   * @returns A list of syllables after applying joining rules
   */
  private join(syllables: string[]): string[] {
    let indivisibleOnset = [
      'pl', 'bl', 'fl', 'cl', 'kl', 'gl', 'll',
      'pr', 'br', 'fr', 'cr', 'kr', 'gr', 'rr',
      'dr', 'tr', 'ch', 'dh', 'rh', 'th',
      'βl', 'ɣl',
      'βɾ', 'pɾ', 'fɾ', 'kɾ', 'gɾ', 'ɣɾ', 'dɾ', 'ðɾ',
      'tɾ', 'bɾ', 'tʃ', 'gw', 'ɣw'
    ];

    if (this.tl) {
      indivisibleOnset = [...indivisibleOnset, 'tl'];
    }

    const indivisibleCoda = [
      'ns', 'bs', 'nz', 'βs', 'bz', 'βz', 'nd', 'rt',
      'st', 'ff', 'ls', 'lz', 'zz', 'll', 'nt', 'rs', 'ɾs',
      'ch', 'nk', 'nc', 'lk', 'sh', 'nt', 'sch', 'mp', 'rd'
    ];

    const word: string[] = [];
    let onset = '';
    let media = 0;

    for (const letter of syllables) {
      if (letter === '_') {
        if (word.length > 0) {
          word[word.length - 1] += onset;
          onset = '';
        }
      } else if (Array.from(letter).every(x => !this.vowels.includes(x.toLowerCase()))) {
        if (onset.endsWith('y')) {
          if (onset === 'y' && word.length > 0 && 'AOEÁÓÉaoeáóé'.includes(word.at(-1)!.at(-1)!)) {
            word[word.length - 1] += onset;
          } else {
            word.push(onset);
          }
          onset = letter;
        } else {
          onset += letter;
          if (word.length > 0) {
            media = Math.floor(onset.length / 2);
          }
          if (this.h && onset.endsWith('h')) {
            media = 0;
          }
        }
      } else if (onset.length <= 1 || word.length === 0) {
        word.push(onset + letter);
        onset = '';
      } else if (indivisibleOnset.some(x => onset.endsWith(x))) {
        if (word.length > 0) {
          word[word.length - 1] += onset.slice(0, -2);
          word.push(onset.slice(-2) + letter);
        } else {
          word.push(onset + letter);
        }
        onset = '';
      } else if (indivisibleCoda.some(x => onset.startsWith(x)) && onset.length > 2) {
        word[word.length - 1] += onset.slice(0, 2);
        word.push(onset.slice(2) + letter);
        onset = '';
      } else if (
        ('dðfkt'.includes(onset.at(-1)!) &&
          'bβcθkdðfgɣkmɱɲñpqstvwxχzjw'.includes(onset.at(-2)!)) ||
        ('gɣ'.includes(onset.at(-1)!) && 'cθtkjw'.includes(onset.at(-2)!)) ||
        ('lmɱ'.includes(onset.at(-1)!) && 'mɱl'.includes(onset.at(-2)!)) ||
        ('cθ'.includes(onset.at(-1)!) && 'kc'.includes(onset.at(-2)!))
      ) {
        word[word.length - 1] += onset.slice(0, -1);
        word.push(onset.slice(-1) + letter);
        onset = '';
      } else {
        word[word.length - 1] += onset.slice(0, media);
        word.push(onset.slice(media) + letter);
        onset = '';
      }
    }

    if (onset) {
      if (word.length < 1) {
        word.push(onset);
      } else if (onset.endsWith('y') && onset.length === 1) {
        word[word.length - 1] += onset;
      } else if (onset.endsWith('y')) {
        word[word.length - 1] += onset.slice(0, -2);
        word.push(onset.slice(-2));
      } else {
        word[word.length - 1] += onset;
      }
    }

    return word;
  }

  /**
   * Determine the stressed syllable index in the list of syllables.
   *
   * @param syllables - The list of syllables
   * @returns The index of the stressed syllable (negative indexing)
   */
  private stressedSyllable(syllables: string[]): number {
    if (syllables.length === 0) {
      return -1;
    } else if (syllables.length === 1) {
      return -1;
    } else if (syllables.join('').split('').some(k => 'áéíóúÁÉÍÓÚ'.includes(k))) {
      for (let i = 0; i < syllables.length; i++) {
        if (syllables[i].split('').some(k => 'áéíóúÁÉÍÓÚ'.includes(k))) {
          return i - syllables.length;
        }
      }
    } else if (
      'yY'.includes(syllables.at(-1)!.at(-1)!) &&
      'aeiouAEIOU'.includes(syllables.at(-1)!.at(-2)!)
    ) {
      return -1;
    } else if ('aeiouAEIOUy'.includes(syllables.at(-1)!.at(-1)!)) {
      return -2;
    } else if (
      'nsNS'.includes(syllables.at(-1)!.at(-1)!) &&
      'aeiouAEIOU'.includes(syllables.at(-1)!.at(-2)!)
    ) {
      return -2;
    } else {
      return -1;
    }

    return -1;
  }
}

/**
 * Public function to syllabify a word.
 *
 * @param word - The word to syllabify
 * @param exceptions - Level of exceptions handling (0: none, 1: basic, 2: extended)
 * @param ipa - Boolean indicating whether to use IPA rules
 * @param h - Boolean indicating whether to consider 'h' as a consonant
 * @param epen - Boolean indicating whether to apply epenthesis
 * @param tl - Boolean indicating whether to include 'tl' as an indivisible onset
 * @returns A list of syllables
 *
 * @example
 * ```typescript
 * syllabify('Uvulopalatofaringoplastia')
 * // Returns: ['U', 'vu', 'lo', 'pa', 'la', 'to', 'fa', 'rin', 'go', 'plas', 'tia']
 * ```
 */
export function syllabify(
  word: string,
  exceptions: ExceptionLevel = 1,
  ipa: boolean = false,
  h: boolean = false,
  epen: boolean = false,
  tl: boolean = false
): string[] {
  return new Syllabification(word, exceptions, ipa, h, epen, tl).syllables;
}

/**
 * Public function to get the index of the stressed syllable.
 *
 * @param word - The word to analyze for stress
 * @param exceptions - Level of exceptions handling (0: none, 1: basic, 2: extended)
 * @param ipa - Boolean indicating whether to use IPA rules
 * @param h - Boolean indicating whether to consider 'h' as a consonant
 * @param epen - Boolean indicating whether to apply epenthesis
 * @param tl - Boolean indicating whether to include 'tl' as an indivisible onset
 * @returns The index of the stressed syllable (negative indexing)
 *
 * @example
 * ```typescript
 * tonica('Uvulopalatofaringoplastia')
 * // Returns: -2 (penultimate syllable)
 * ```
 */
export function tonica(
  word: string,
  exceptions: ExceptionLevel = 1,
  ipa: boolean = false,
  h: boolean = false,
  epen: boolean = false,
  tl: boolean = false
): number {
  return new Syllabification(word, exceptions, ipa, h, epen, tl).stress;
}
