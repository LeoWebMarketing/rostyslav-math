export function normalizeAnswer(answer: string): string {
  if (typeof answer !== 'string') return '';
  
  let normalized = answer
    // Trim whitespace
    .trim()
    // Collapse multiple spaces
    .replace(/\s+/g, ' ')
    // Case insensitive
    .toLowerCase()
    // Unify apostrophes (' ' ʼ → ')
    .replace(/[ʼ’‘]/g, "'")
    // Remove trailing punctuation .,!?;:…
    .replace(/[.,!?;:…]+$/, '')
    .trim()
    // Unify quotes
    .replace(/[“”„«»]/g, '"')
    // Unify dashes
    .replace(/[–—]/g, '-')
    // NFC normalize (combining diacritics)
    .normalize('NFC');
  
  return normalized;
}

export function checkAnswer(
  userAnswer: string,
  expectedAnswer: string | string[],
  typoTolerance?: number
): boolean {
  const normalized = normalizeAnswer(userAnswer);
  const expected = Array.isArray(expectedAnswer) ? expectedAnswer : [expectedAnswer];
  const expectedNormalized = expected.map(normalizeAnswer);

  // Exact match
  if (expectedNormalized.includes(normalized)) {
    return true;
  }

  // Typo tolerance (levenshtein distance)
  if (typoTolerance && typoTolerance > 0) {
    return expectedNormalized.some(exp => 
      levenshteinDistance(normalized, exp) <= typoTolerance
    );
  }

  return false;
}

function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
}
