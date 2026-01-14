# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Silabeador-ts is a TypeScript library for Spanish syllabification and prosodic stress detection. It's an ESM-only package with no runtime dependencies.

## Commands

```bash
pnpm run build     # Compile TypeScript (outputs to dist/)
pnpm run test      # Run tests with Vitest
pnpm run test:ui   # Run tests with Vitest UI
```

To run a single test file or test by name:
```bash
npx vitest run tests/silabeador.test.ts
npx vitest run -t "test name pattern"
```

## Architecture

### Core Algorithm (`src/silabeador.ts`)

The `Syllabification` class implements the main algorithm:

1. **split()** - Identifies syllabic nuclei by finding vowels. Unstressed close vowels form diphthongs/triphthongs with adjacent vowels; stressed ones become standalone nuclei. Consonant clusters are grouped for parsing.

2. **join()** - Divides consonant clusters based on Spanish phonotactic rules and attaches them to neighboring nuclei as codas or onsets.

3. **stressedSyllable()** - Detects prosodic stress following Real Academia rules:
   - Proparoxytones: always marked with acute accent on antepenultimate
   - Paroxytones: marked if ending in n/s/vowel
   - Oxytones: marked if ending in n/s/vowel
   - Falls back to Latin rules for recognizable Latin inflections

4. **makeExceptions()** - Applies hiatus rules from `exceptions-data.ts` for verbs in -uar/-uir, adjectives in -uoso, etc.

### Public API (`src/index.ts`)

- `syllabify(word, options)` - Returns array of syllables
- `tonica(word, options)` - Returns stressed syllable index (negative from end)
- `Syllabification` class - Object with `syllables` and `stress` properties

### Configuration Options

All functions accept `SyllabificationOptions`:
- `exceptions` (0|1|2) - Exception handling level (default: 1)
- `ipa` (boolean) - IPA transcription rules
- `h` (boolean) - Treat 'h' as consonant in V-C-h-V clusters
- `epen` (boolean) - Apply epenthesis for s+consonant words
- `tl` (boolean) - Treat 'tl' as indivisible onset (Mexican Spanish)

### Exception Rules (`src/exceptions-data.ts`)

Contains 126 regex patterns for syllabification exceptions. Patterns use backreferences and handle special cases like -uir verbs, -uar verbs, -iar verbs, and diphthong exceptions. Edit `src/exceptions.lst` to modify rules.

## TypeScript Configuration

- Target: ES2020, Module: ESNext
- Strict mode with all strict checks enabled
- Output includes source maps and declaration maps
