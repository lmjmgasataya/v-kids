// Fuzzy duplicate detection for kid registrations. Pure functions over rows
// already loaded from the DB — the kids table is small enough (hundreds to a
// few thousand rows) that a pairwise comparison in memory is fine.

export interface DuplicateCandidate {
  id: number;
  firstName: string;
  lastName: string;
  nickname: string | null;
  age: number;
  gender: string;
  guardianId: number;
  guardianFirstName: string;
  guardianLastName: string;
  guardianContactNumber: string;
}

export interface DuplicatePair {
  aId: number;
  bId: number;
  score: number;
  reasons: string[];
}

export type DuplicateConfidence = "High" | "Medium" | "Low";

export interface DuplicateGroup<T extends DuplicateCandidate> {
  members: T[];
  pairs: DuplicatePair[];
  score: number;
  confidence: DuplicateConfidence;
}

const MIN_SCORE = 60;

/** Lowercase, strip accents (ñ → n, é → e) and anything that isn't a letter or space. */
function normalize(value: string | null | undefined): string {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Normalized with spaces removed, so "Mary Ann" = "Maryann" and "Dela Cruz" = "Delacruz". */
function compact(value: string | null | undefined): string {
  return normalize(value).replace(/ /g, "");
}

function tokens(value: string | null | undefined): string[] {
  return normalize(value).split(" ").filter(Boolean);
}

/**
 * A rough sound-alike key tuned for common spelling variants in local names:
 * Kristine/Christine, Jhon/John, Ysabel/Isabel, Althea/Altea, Jazmine/Jasmine.
 */
function phonetic(value: string | null | undefined): string {
  let s = compact(value);
  if (!s) return "";
  s = s
    .replace(/ph/g, "f")
    .replace(/ch/g, "k")
    .replace(/ck/g, "k")
    .replace(/c(?=[eiy])/g, "s")
    .replace(/c/g, "k")
    .replace(/q/g, "k")
    .replace(/x/g, "ks")
    .replace(/z/g, "s")
    .replace(/v/g, "b")
    .replace(/y/g, "i")
    .replace(/(?<=.)h/g, "") // silent h after another letter: jhon, althea, thea
    .replace(/(.)\1+/g, "$1"); // doubled letters: anne → ane, jazzmine → jasmine
  // Keep the first letter, drop the remaining vowels.
  return s[0] + s.slice(1).replace(/[aeiou]/g, "");
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const curr = [i];
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
    }
    prev = curr;
  }
  return prev[b.length];
}

/** Small typo — one letter off for short names, up to two for longer ones. */
function isTypo(a: string, b: string): boolean {
  if (!a || !b || a === b) return false;
  const maxLen = Math.max(a.length, b.length);
  const allowed = maxLen <= 4 ? 1 : 2;
  if (Math.abs(a.length - b.length) > allowed) return false;
  return levenshtein(a, b) <= allowed;
}

/** Normalizes 09XXXXXXXXX / 639XXXXXXXXX / +639XXXXXXXXX to the same form. */
function normalizePhone(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.startsWith("63")) return "0" + digits.slice(2);
  return digits;
}

interface Match {
  score: number;
  reason: string;
}

function compareFirstNames(a: DuplicateCandidate, b: DuplicateCandidate): Match | null {
  const af = compact(a.firstName);
  const bf = compact(b.firstName);
  const an = compact(a.nickname);
  const bn = compact(b.nickname);

  if (af && af === bf) return { score: 40, reason: "Same first name" };

  // One registration used the kid's nickname as the first name.
  if ((an && (an === bf || isTypo(an, bf))) || (bn && (bn === af || isTypo(bn, af)))) {
    return { score: 32, reason: "Nickname used as first name" };
  }

  if (isTypo(af, bf)) return { score: 30, reason: "First name spelled slightly differently" };
  if (phonetic(a.firstName) === phonetic(b.firstName)) {
    return { score: 30, reason: "First names sound alike" };
  }

  // Compound first names where only one part was used: "Juan Miguel" vs "Miguel".
  const at = tokens(a.firstName);
  const bt = tokens(b.firstName);
  if ((at.length > 1 || bt.length > 1) && at.some((t) => t.length >= 3 && bt.includes(t))) {
    return { score: 24, reason: "Shares part of a compound first name" };
  }

  // Short forms: "Matt" / "Matthew", "Sam" / "Samantha".
  const [short, long] = af.length <= bf.length ? [af, bf] : [bf, af];
  if (short.length >= 3 && long.startsWith(short)) {
    return { score: 22, reason: "First name looks like a short form of the other" };
  }

  if (an && an === bn) return { score: 22, reason: "Same nickname" };

  return null;
}

function compareLastNames(a: DuplicateCandidate, b: DuplicateCandidate): Match | null {
  const al = compact(a.lastName);
  const bl = compact(b.lastName);

  if (al && al === bl) return { score: 40, reason: "Same last name" };
  if (isTypo(al, bl)) return { score: 30, reason: "Last name spelled slightly differently" };
  if (phonetic(a.lastName) === phonetic(b.lastName)) return { score: 30, reason: "Last names sound alike" };

  // Double-barrelled surnames where one form dropped a part: "Santos Reyes" vs "Reyes".
  const at = tokens(a.lastName);
  const bt = tokens(b.lastName);
  if ((at.length > 1 || bt.length > 1) && at.some((t) => t.length >= 3 && bt.includes(t))) {
    return { score: 26, reason: "Shares part of the last name" };
  }

  return null;
}

export function compareKids(a: DuplicateCandidate, b: DuplicateCandidate): DuplicatePair | null {
  const reasons: string[] = [];
  let score = 0;

  const sameContact =
    normalizePhone(a.guardianContactNumber) !== "" &&
    normalizePhone(a.guardianContactNumber) === normalizePhone(b.guardianContactNumber);
  const sameGuardianName =
    compact(a.guardianFirstName) === compact(b.guardianFirstName) &&
    compact(a.guardianLastName) === compact(b.guardianLastName);

  // First and last name entered in the wrong boxes.
  const swapped =
    compact(a.firstName) === compact(b.lastName) &&
    compact(a.lastName) === compact(b.firstName) &&
    compact(a.firstName) !== compact(a.lastName);

  if (swapped) {
    score += 70;
    reasons.push("First and last name swapped");
  } else {
    const first = compareFirstNames(a, b);
    if (!first) return null;

    let last = compareLastNames(a, b);
    // Different surname but the same guardian phone — e.g. one form used the
    // mother's surname. Only counts with a strong first-name match.
    if (!last && sameContact && first.score >= 30) {
      last = { score: 15, reason: "Different last name, but same guardian number" };
    }
    if (!last) return null;

    score += first.score + last.score;
    reasons.push(first.reason, last.reason);
  }

  if (a.guardianId === b.guardianId) {
    score += 10;
    reasons.push("Same guardian record");
  } else if (sameGuardianName) {
    score += 10;
    reasons.push("Same guardian name");
  }
  if (sameContact && !reasons.some((r) => r.includes("guardian number"))) {
    score += 15;
    reasons.push("Same guardian number");
  }

  const ageDiff = Math.abs(a.age - b.age);
  if (ageDiff === 0) {
    score += 10;
    reasons.push("Same age");
  } else if (ageDiff === 1) {
    score += 5;
    reasons.push("Ages 1 year apart");
  } else if (ageDiff >= 3) {
    score -= 25;
  }

  if (a.gender !== b.gender) score -= 20;

  if (score < MIN_SCORE) return null;
  return { aId: a.id, bId: b.id, score, reasons };
}

function confidenceFor(score: number): DuplicateConfidence {
  if (score >= 90) return "High";
  if (score >= 75) return "Medium";
  return "Low";
}

/**
 * Compares every pair of kids, then merges matching pairs into groups (so a kid
 * registered three times shows up once, as a group of three). Sorted most
 * likely first.
 */
export function findDuplicateGroups<T extends DuplicateCandidate>(rows: T[]): DuplicateGroup<T>[] {
  const pairs: DuplicatePair[] = [];
  for (let i = 0; i < rows.length; i++) {
    for (let j = i + 1; j < rows.length; j++) {
      const pair = compareKids(rows[i], rows[j]);
      if (pair) pairs.push(pair);
    }
  }

  // Union-find over matching pairs.
  const parent = new Map<number, number>();
  const find = (id: number): number => {
    let root = id;
    while (parent.has(root) && parent.get(root) !== root) root = parent.get(root)!;
    parent.set(id, root);
    return root;
  };
  for (const p of pairs) {
    const ra = find(p.aId);
    const rb = find(p.bId);
    if (ra !== rb) parent.set(ra, rb);
  }

  const byId = new Map(rows.map((r) => [r.id, r]));
  const groups = new Map<number, { ids: Set<number>; pairs: DuplicatePair[] }>();
  for (const p of pairs) {
    const root = find(p.aId);
    const group = groups.get(root) ?? { ids: new Set(), pairs: [] };
    group.ids.add(p.aId).add(p.bId);
    group.pairs.push(p);
    groups.set(root, group);
  }

  return [...groups.values()]
    .map(({ ids, pairs }) => {
      const score = Math.max(...pairs.map((p) => p.score));
      return {
        members: [...ids].map((id) => byId.get(id)!).sort((x, y) => x.id - y.id),
        pairs: pairs.sort((x, y) => y.score - x.score),
        score,
        confidence: confidenceFor(score),
      };
    })
    .sort((x, y) => y.score - x.score);
}
