// Utility for fuzzy answer matching using Levenshtein distance
// Accepts if similarity is above threshold or substring match

function normalize(str: string): string {
    return str.toLowerCase().replace(/[^a-z0-9 ]/gi, '').trim();
}

function levenshtein(a: string, b: string): number {
    const an = a.length;
    const bn = b.length;
    if (an === 0) return bn;
    if (bn === 0) return an;
    const matrix = Array.from({ length: an + 1 }, () => Array(bn + 1).fill(0));
    for (let i = 0; i <= an; i++) matrix[i][0] = i;
    for (let j = 0; j <= bn; j++) matrix[0][j] = j;
    for (let i = 1; i <= an; i++) {
        for (let j = 1; j <= bn; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            matrix[i][j] = Math.min(
                matrix[i - 1][j] + 1,
                matrix[i][j - 1] + 1,
                matrix[i - 1][j - 1] + cost
            );
        }
    }
    return matrix[an][bn];
}

export function isFuzzyAnswerCorrect(submitted: string, variations: string[], threshold = 0.75): boolean {
    const normSubmitted = normalize(submitted);
    for (const v of variations) {
        const normV = normalize(v);
        if (!normV) continue;
        if (normV.includes(normSubmitted) || normSubmitted.includes(normV)) return true;
        const maxLen = Math.max(normV.length, normSubmitted.length);
        if (maxLen === 0) continue;
        const dist = levenshtein(normV, normSubmitted);
        const similarity = 1 - dist / maxLen;
        if (similarity >= threshold) return true;
    }
    return false;
}
