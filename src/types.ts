/**
 * Level of exception handling for syllabification
 * - 0: No exceptions
 * - 1: Basic exceptions
 * - 2: Extended exceptions with hiatus rules
 */
export type ExceptionLevel = 0 | 1 | 2;

/**
 * Options for syllabification configuration
 */
export interface SyllabificationOptions {
  /**
   * Level of exception handling (default: 1)
   */
  exceptions?: ExceptionLevel;

  /**
   * Use IPA transcription rules (adds 'j', 'w' as vowels/close vowels) (default: false)
   */
  ipa?: boolean;

  /**
   * Treat 'h' as consonant in V-C-h-V clusters (default: false)
   */
  h?: boolean;

  /**
   * Apply epenthesis to words starting with s+consonant (default: false)
   */
  epen?: boolean;

  /**
   * Treat 'tl' as indivisible onset (Mexican Spanish) (default: false)
   */
  tl?: boolean;
}
