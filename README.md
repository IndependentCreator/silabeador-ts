# Silabeador

This is a TypeScript port of the [Python silabeador library](https://github.com/fsanzl/silabeador).
 
*silabeador* is a TypeScript library of methods and functions for syllabic division and prosodic stress detecting for Spanish.

## Installation

```bash
pnpm install silabeador
```

## Usage

The library provides functions and methods that can be called independently:

```typescript
import { syllabify, tonica, Syllabification } from 'silabeador';
```

The syllabic division function accepts a string as a single argument and returns a list of syllables.

```typescript
syllabify('Uvulopalatofaringoplastia')
// Returns: ['U', 'vu', 'lo', 'pa', 'la', 'to', 'fa', 'rin', 'go', 'plas', 'tia']
```

The function to recover the stressed syllable's index takes a string as a single argument and returns the stressed syllable's index.

```typescript
tonica('Uvulopalatofaringoplastia')
// Returns: -2
```

An object with those values can also be created:

```typescript
const x = new Syllabification('Uvulopalatofaringoplastia');
console.log(x.syllables);
// ['U', 'vu', 'lo', 'pa', 'la', 'to', 'fa', 'rin', 'go', 'plas', 'tia']
console.log(x.stress);
// -2
```

### Parameters

All functions and the `Syllabification` class accept the following parameters:

- `word` (required): The word to be syllabified
- `exceptions` (default: `1`): Level of exceptions handling
  - `0`: No exceptions
  - `1`: Basic exceptions
  - `2`: Extended exceptions with hiatus rules
- `ipa` (default: `false`): Use IPA transcription rules
- `h` (default: `false`): Treat 'h' as consonant in V-C-h-V clusters
- `epen` (default: `false`): Apply epenthesis to words starting with s+consonant
- `tl` (default: `false`): Treat 'tl' as indivisible onset (Mexican Spanish)

Example with parameters:

```typescript
syllabify('cruel', 1)
// Returns: ['cru', 'el']

syllabify('cruel', 0)
// Returns: ['cruel']
```

## Description

### Syllabification

The syllabic division follows the principles described by Quilis (2013, 47-49; 2019, 182-192).

Firstly, syllabic nuclei are detected looking for the vowels. Unstressed close vowels join the adjacent vowels in coda or onset to form a diphthong or a triphthong, whilst stressed ones are considered standalone syllabic nuclei. Contiguous consonants are grouped to be parsed apart.

Secondly, consonant clusters are divided considering whether their components are separable and joined to the neighbour nuclei in coda or onset accordingly.

The `Syllabification` class accepts the following arguments: *word*, *exceptions*, *ipa*, *h*, *epen*, and *tl*. Only the first one is compulsory, as the method requires a word to parse. The default value of *exceptions* is `1` and determines whether the exceptions file should be used. The others' default value is `false`. If an IPA transcription is used, *ipa* should be `true` to achieve optimal results. The flag *h* marks the behaviour when parsing a cluster *V-C-\<h\>-V*. The default division would be *VC \<h\>V* (*en-hies-to*). If *h* is `true`, the division would be *V C\<h\>V* (*e-nhies-to*).

### Prosodic stress

Prosodic stress detection follows the Spanish rules described by the Real Academia ("tilde"). Proparoxytone words are always orthographically signalled with an acute accent on the nucleic vowel of the antepenultimate syllable. Paroxytones are not marked unless the word ends with *n*, *s* or vowel, in which case they have an acute accent on the nucleic vowel of the penultimate syllable. Oxytone words are only marked if they end in *n*, *s* or vowel with an acute accent on the nucleic vowel of the last syllable. If there is a word without orthographic accent and a recognisable Latin inflection that not appears in Spanish, the prosodic stress is determined according to the latin rules if the quantity of the penultimate syllable can be guessed from the orthography. Otherwise, it tries to guess with the orthographic information available.

### Exceptions to the diphthong rules

Some words such as most verbs in *-uir* and all verbs in *-uar*, as well as adjectives in *-uoso* and nouns such as *guión* or *cliente* do not form a diphthong (Quilis, 2019, 185-186). So they are pronounced */in-fa-tu-ar/*, */a-tri-bu-ir/*, */un-tu-o-so/* or */gui-on/*. Optionally, the processing of these nouns can be disabled to avoid the hiatus.

```typescript
syllabify('cruel', 1)
// Returns: ['cru', 'el']

syllabify('cruel', 0)
// Returns: ['cruel']
```

Alternatively, the file *exceptions.lst* can be edited to include or remove words. A morpheme can be used instead of full words (i.e., *acuos* would fit *acuoso*, *acuosa*, *acuosos* and *acuosas*). For convenience, lines can be commented.

## Known problems

Adverbs in *-mente* have primary and secondary stress. Therefore, they must be divided, and each of their parts parsed independently.

## Development

```bash
# Install dependencies
pnpm install

# Build the project
pnpm run build

# Run tests
pnpm run test

# Run tests with UI
pnpm run test:ui
```

## Credits

Authors of scientific papers including results generated using *silabeador* are encouraged to cite the following paper.

```bibtex
@article{SanzLazaroF_RHD2023,
    author    = {Sanz-Lázaro, Fernando},
    title     = {Del fonema al verso: una caja de herramientas digitales de escansión teatral},
    volume    = {8},
    date  = {2023},
    journal   = {Revista de Humanidades Digitales},
    pages = {74-89},
    doi = {https://doi.org/10.5944/rhd.vol.8.2023.37830}
}
```

## References

Quilis, Antonio, *Tratado de fonología y fonétia españolas*. 1993. Madrid, Gredos, 2019.

---, *Métrica española*. 1984. Barcelona, Ariel, 1996.

"tilde". *Diccionario panhispánico de dudas*, 2005. https://www.rae.es/dpd/tilde
