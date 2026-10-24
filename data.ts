export type SkillEffectId = "dash" | "freeze" | "rocket" | "magnet";
export type CelebrationId = "moonwalk" | "robot" | "kneeslide" | "backflip" | "shush" | "goat" | "heart";

export interface Signature {
  name: string;
  effect: SkillEffectId;
  color: string;
  celebration: CelebrationId;
  celebrationName: string;
}

export interface SkillEffect {
  id: SkillEffectId;
  name: string;
  short: string;
  description: string;
  icon: string;
  tag: string;
}

export interface Celebration {
  id: CelebrationId;
  name: string;
  emoji: string;
  description: string;
}

export interface Division {
  id: string;
  name: string;
  short: string;
  location: string;
  rival: string;
  target: number;
  duration: number;
  defenders: number;
  reward: number;
  xp: number;
  unlockLevel: number;
  tagline: string;
  accent: string;
  trophy: string;
}

export interface Teammate {
  id: string;
  name: string;
  role: string;
  initials: string;
  color: string;
  cost: number;
  unlockLevel: number;
  boostLabel: string;
  boostDesc: string;
  statLabel: string;
  stat: number;
}

export interface Profile {
  name: string;
  xp: number;
  coins: number;
  matches: number;
  wins: number;
  goals: number;
  bestScore: number;
  bestCombo: number;
  teammates: string[];
  activeTeammate: string | null;
  signature: Signature;
  sound: boolean;
  trophies: string[];
  createdAt: number;
}

export interface ScoreEntry {
  id: string;
  name: string;
  score: number;
  goals: number;
  divisionId: string;
  divisionName: string;
  signatureName: string;
  date: number;
  win: boolean;
  ghost?: boolean;
}

export interface GameResult {
  score: number;
  goals: number;
  target: number;
  won: boolean;
  divisionId: string;
  divisionName: string;
  bestCombo: number;
  timeLeft: number;
  signatureUses: number;
  flawless: boolean;
}

export const SIGNATURE_COLORS = ["#d8ff3e", "#ff6b4a", "#7dd3fc", "#ffce4f", "#f472b6", "#c4b5fd"] as const;

export const SKILL_EFFECTS: SkillEffect[] = [
  {
    id: "dash",
    name: "Phase Dash",
    short: "Wormhole step",
    description: "Blink through the back line and leave a trail of trouble.",
    icon: "⚡",
    tag: "SPEED",
  },
  {
    id: "freeze",
    name: "Ice Veins",
    short: "Freeze frame",
    description: "Turn the defenders into statues for a few glorious seconds.",
    icon: "❄️",
    tag: "CONTROL",
  },
  {
    id: "rocket",
    name: "Rocket Heel",
    short: "Unsaveable",
    description: "Charge your next strike. No keeper on earth is stopping it.",
    icon: "🚀",
    tag: "POWER",
  },
  {
    id: "magnet",
    name: "Flair Magnet",
    short: "Orb vacuum",
    description: "Snap every flair orb on the pitch straight into your boots.",
    icon: "🧲",
    tag: "STYLE",
  },
];

export const CELEBRATIONS: Celebration[] = [
  { id: "moonwalk", name: "Moonwalk", emoji: "🕺", description: "Smooth, cold, iconic." },
  { id: "robot", name: "Robot", emoji: "🤖", description: "Glitch the whole stadium." },
  { id: "kneeslide", name: "Knee Slide", emoji: "🦵", description: "Leave a mark on the pitch." },
  { id: "backflip", name: "Backflip", emoji: "🤸", description: "Hang time, then chaos." },
  { id: "shush", name: "Silencer", emoji: "🤫", description: "For the doubters in row one." },
  { id: "goat", name: "The GOAT", emoji: "🐐", description: "No explanation needed." },
  { id: "heart", name: "Heart Hands", emoji: "🫶", description: "All love for the block." },
];

export const TEAMMATES: Teammate[] = [
  {
    id: "kofi",
    name: "Kofi Blaze",
    role: "Winger",
    initials: "KB",
    color: "#d8ff3e",
    cost: 0,
    unlockLevel: 1,
    boostLabel: "+14% pace",
    boostDesc: "A livewire on the flank. Your movement is quicker with Kofi in the squad.",
    statLabel: "PAC",
    stat: 88,
  },
  {
    id: "rafa",
    name: "Rafa Silk",
    role: "Playmaker",
    initials: "RS",
    color: "#7dd3fc",
    cost: 220,
    unlockLevel: 2,
    boostLabel: "-22% shot cooldown",
    boostDesc: "Rafa sees passes before they exist. You get the ball back in play faster.",
    statLabel: "PAS",
    stat: 86,
  },
  {
    id: "nia",
    name: "Nia Volt",
    role: "Trickster",
    initials: "NV",
    color: "#f472b6",
    cost: 280,
    unlockLevel: 2,
    boostLabel: "+40% signature charge",
    boostDesc: "Every flair orb charges your signature move almost twice as fast.",
    statLabel: "DRI",
    stat: 91,
  },
  {
    id: "dembo",
    name: "Dembo Wall",
    role: "Anchor",
    initials: "DW",
    color: "#ffce4f",
    cost: 340,
    unlockLevel: 3,
    boostLabel: "+10 seconds",
    boostDesc: "The calmest head on the block. Your match clock starts with extra time.",
    statLabel: "DEF",
    stat: 84,
  },
  {
    id: "tico",
    name: "Tico Spin",
    role: "Magician",
    initials: "TS",
    color: "#c4b5fd",
    cost: 420,
    unlockLevel: 4,
    boostLabel: "Keeper nerves",
    boostDesc: "Tico's presence rattles the keeper. Their reactions are noticeably slower.",
    statLabel: "SHO",
    stat: 87,
  },
  {
    id: "juno",
    name: "Juno Frost",
    role: "Captain",
    initials: "JF",
    color: "#ff6b4a",
    cost: 500,
    unlockLevel: 5,
    boostLabel: "+20% combo window",
    boostDesc: "Juno keeps the whole team composed. Your style combo lasts much longer.",
    statLabel: "LDR",
    stat: 94,
  },
];

export const DIVISIONS: Division[] = [
  {
    id: "street",
    name: "Street Trials",
    short: "TRIALS",
    location: "Cage 09 · East Block",
    rival: "Block Boys",
    target: 4,
    duration: 60,
    defenders: 2,
    reward: 140,
    xp: 160,
    unlockLevel: 1,
    tagline: "Lights out. Reps only.",
    accent: "#d8ff3e",
    trophy: "The District Crown",
  },
  {
    id: "city",
    name: "City Cup",
    short: "CITY",
    location: "Riverside Arena",
    rival: "Metro Rovers",
    target: 5,
    duration: 65,
    defenders: 3,
    reward: 240,
    xp: 260,
    unlockLevel: 2,
    tagline: "The city starts watching.",
    accent: "#7dd3fc",
    trophy: "The Metro Plate",
  },
  {
    id: "continental",
    name: "Continental",
    short: "EUROPA",
    location: "Palace of Noise",
    rival: "Atlas SC",
    target: 6,
    duration: 70,
    defenders: 4,
    reward: 420,
    xp: 420,
    unlockLevel: 4,
    tagline: "Legends line the tunnel.",
    accent: "#ffce4f",
    trophy: "The Continental Sun",
  },
  {
    id: "world",
    name: "World Stage",
    short: "WORLD",
    location: "The Colossus",
    rival: "Global Eleven",
    target: 7,
    duration: 75,
    defenders: 5,
    reward: 700,
    xp: 680,
    unlockLevel: 6,
    tagline: "One street. Every eye.",
    accent: "#ff6b4a",
    trophy: "The Golden Globe",
  },
];

export const DEFAULT_SIGNATURE: Signature = {
  name: "The Wormhole",
  effect: "dash",
  color: "#d8ff3e",
  celebration: "moonwalk",
  celebrationName: "The Lime Slide",
};

export const GAME_TIPS = [
  "Move with WASD or arrow keys",
  "Space fires a shot at the open corner",
  "Shift unleashes your signature move",
  "Collect volt orbs to build style and charge",
  "P or Esc pauses the match",
];

export function levelForXp(xp: number): number {
  return Math.max(1, Math.floor(xp / 250) + 1);
}

export function xpProgress(xp: number): { level: number; current: number; needed: number; pct: number } {
  const level = levelForXp(xp);
  const current = xp % 250;
  return { level, current, needed: 250, pct: Math.round((current / 250) * 100) };
}

export function divisionUnlocked(division: Division, profile: Profile): boolean {
  return levelForXp(profile.xp) >= division.unlockLevel;
}

export function activeTeammate(profile: Profile): Teammate | undefined {
  return TEAMMATES.find((t) => t.id === profile.activeTeammate);
}

export function nextFixture(profile: Profile): Division {
  const unlocked = DIVISIONS.filter((d) => divisionUnlocked(d, profile));
  return unlocked.find((d) => !profile.trophies.includes(d.id)) ?? unlocked[unlocked.length - 1] ?? DIVISIONS[0];
}

export function effectFor(id: SkillEffectId): SkillEffect {
  return SKILL_EFFECTS.find((e) => e.id === id) ?? SKILL_EFFECTS[0];
}

export function celebrationFor(id: CelebrationId): Celebration {
  return CELEBRATIONS.find((c) => c.id === id) ?? CELEBRATIONS[0];
}

export function overallFor(profile: Profile): number {
  const level = levelForXp(profile.xp);
  const wins = Math.min(profile.wins, 20);
  return Math.min(99, 64 + Math.min(level * 2, 18) + Math.floor(wins / 2));
}

export function formatNumber(n: number): string {
  return Math.round(n).toLocaleString("en-US");
}

export function coinsEarned(result: GameResult): number {
  const division = DIVISIONS.find((d) => d.id === result.divisionId) ?? DIVISIONS[0];
  const base = result.won ? division.reward : Math.round(division.reward * 0.35);
  const performance = Math.round(result.score / 80);
  return base + performance;
}

export function xpEarned(result: GameResult): number {
  const division = DIVISIONS.find((d) => d.id === result.divisionId) ?? DIVISIONS[0];
  const base = result.won ? division.xp : Math.round(division.xp * 0.3);
  return base + result.goals * 18 + Math.round(result.score / 220);
}
