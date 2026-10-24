import { DEFAULT_SIGNATURE, type Profile, type ScoreEntry, type Signature } from "./data";

const PROFILE_KEY = "streetkings.profile.v1";
const SCORES_KEY = "streetkings.scores.v1";

export const DEFAULT_PROFILE: Profile = {
  name: "YOU",
  xp: 0,
  coins: 280,
  matches: 0,
  wins: 0,
  goals: 0,
  bestScore: 0,
  bestCombo: 0,
  teammates: ["kofi"],
  activeTeammate: "kofi",
  signature: DEFAULT_SIGNATURE,
  sound: true,
  trophies: [],
  createdAt: Date.now(),
};

export const SEED_SCORES: ScoreEntry[] = [
  {
    id: "ghost-1",
    name: "VOLT",
    score: 6420,
    goals: 7,
    divisionId: "world",
    divisionName: "World Stage",
    signatureName: "The Afterglow",
    date: 0,
    win: true,
    ghost: true,
  },
  {
    id: "ghost-2",
    name: "KOFI·10",
    score: 5180,
    goals: 6,
    divisionId: "continental",
    divisionName: "Continental",
    signatureName: "Silk Road",
    date: 0,
    win: true,
    ghost: true,
  },
  {
    id: "ghost-3",
    name: "NIA",
    score: 3890,
    goals: 5,
    divisionId: "city",
    divisionName: "City Cup",
    signatureName: "Volt Kiss",
    date: 0,
    win: true,
    ghost: true,
  },
  {
    id: "ghost-4",
    name: "ROOK",
    score: 2410,
    goals: 4,
    divisionId: "street",
    divisionName: "Street Trials",
    signatureName: "Curb Dance",
    date: 0,
    win: true,
    ghost: true,
  },
];

function isSignature(value: unknown): value is Signature {
  if (!value || typeof value !== "object") return false;
  const s = value as Record<string, unknown>;
  return typeof s.name === "string" && typeof s.color === "string" && typeof s.effect === "string";
}

export function loadProfile(): Profile {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return { ...DEFAULT_PROFILE };
    const parsed = JSON.parse(raw) as Partial<Profile>;
    if (!parsed || typeof parsed !== "object") return { ...DEFAULT_PROFILE };
    return {
      ...DEFAULT_PROFILE,
      ...parsed,
      signature: isSignature(parsed.signature) ? { ...DEFAULT_SIGNATURE, ...parsed.signature } : DEFAULT_SIGNATURE,
      teammates: Array.isArray(parsed.teammates) && parsed.teammates.length ? parsed.teammates : ["kofi"],
      trophies: Array.isArray(parsed.trophies) ? parsed.trophies : [],
      bestCombo: typeof parsed.bestCombo === "number" ? parsed.bestCombo : 0,
      createdAt: typeof parsed.createdAt === "number" ? parsed.createdAt : Date.now(),
    };
  } catch {
    return { ...DEFAULT_PROFILE };
  }
}

export function saveProfile(profile: Profile): void {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch {
    /* storage full or unavailable */
  }
}

export function loadScores(): ScoreEntry[] {
  try {
    const raw = localStorage.getItem(SCORES_KEY);
    if (!raw) return [...SEED_SCORES];
    const parsed = JSON.parse(raw) as ScoreEntry[];
    if (!Array.isArray(parsed) || !parsed.length) return [...SEED_SCORES];
    const userEntries = parsed.filter((p) => p && !p.ghost);
    return [...userEntries, ...SEED_SCORES].sort((a, b) => b.score - a.score).slice(0, 10);
  } catch {
    return [...SEED_SCORES];
  }
}

export function saveScores(scores: ScoreEntry[]): void {
  try {
    localStorage.setItem(SCORES_KEY, JSON.stringify(scores.filter((s) => !s.ghost)));
  } catch {
    /* ignore */
  }
}

export function insertScore(scores: ScoreEntry[], entry: ScoreEntry): ScoreEntry[] {
  return [...scores.filter((s) => s.id !== entry.id), entry].sort((a, b) => b.score - a.score).slice(0, 10);
}

export function makeScoreEntry(
  profileName: string,
  result: { score: number; goals: number; divisionId: string; divisionName: string; win: boolean },
  signatureName: string
): ScoreEntry {
  return {
    id: `run-${Date.now()}-${Math.round(Math.random() * 9999)}`,
    name: profileName.trim().slice(0, 12).toUpperCase() || "YOU",
    score: result.score,
    goals: result.goals,
    divisionId: result.divisionId,
    divisionName: result.divisionName,
    signatureName,
    date: Date.now(),
    win: result.win,
  };
}

export function resetProfile(): Profile {
  const fresh = { ...DEFAULT_PROFILE, createdAt: Date.now() };
  saveProfile(fresh);
  return fresh;
}
