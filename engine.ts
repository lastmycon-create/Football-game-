import { playSound, setSoundEnabled } from "../lib/audio";
import {
  celebrationFor,
  effectFor,
  type Division,
  type GameResult,
  type Signature,
  type Teammate,
} from "../lib/data";

export type GameStatus = "countdown" | "playing" | "paused" | "over";

export type Tone = "goal" | "skill" | "save" | "tackle" | "info";

export interface Announcement {
  id: number;
  label: string;
  detail: string;
  tone: Tone;
}

export interface CelebrationView {
  emoji: string;
  name: string;
  color: string;
}

export interface HudState {
  status: GameStatus;
  timeLeft: number;
  score: number;
  goals: number;
  target: number;
  combo: number;
  multiplier: number;
  skill: number;
  skillReady: boolean;
  announcement: Announcement | null;
  celebration: CelebrationView | null;
  signatureUses: number;
  possession: boolean;
  rocketArmed: boolean;
  opponent: string;
}

export interface EngineConfig {
  division: Division;
  signature: Signature;
  teammate?: Teammate;
  sound: boolean;
}

export interface EngineCallbacks {
  onHud: (hud: HudState) => void;
  onEnd: (result: GameResult) => void;
}

const BASE_VH = 620;
const GOAL_LINE = 124;
let VW = 800;
let VH = BASE_VH;
let CX = 400;
let GOAL = { left: 286, right: 514 };
let FIELD = { left: 18, right: 782, top: 18, bottom: 602 };
let BOUNDS = { left: 38, right: 762, top: 108, bottom: 584 };
let SPEED_SCALE = 1;

/**
 * The pitch is a responsive world, not a fixed bitmap. Landscape screens widen the
 * cage; portrait screens stretch it toward the horizon so the play area always
 * fills the viewport instead of letterboxing.
 */
function updateWorld(width: number, height: number): void {
  const aspect = Math.max(0.32, Math.min(3.4, width / Math.max(1, height)));
  if (aspect >= 1.15) {
    VH = BASE_VH;
    VW = VH * aspect;
  } else {
    VW = 600;
    VH = VW / aspect;
  }
  VW = clamp(VW, 600, 1800);
  VH = clamp(VH, BASE_VH, 1800);
  CX = VW / 2;
  const goalHalf = clamp(VW * 0.1425, 84, 172);
  GOAL = { left: CX - goalHalf, right: CX + goalHalf };
  FIELD = { left: 16, right: VW - 16, top: 16, bottom: VH - 16 };
  BOUNDS = { left: 40, right: VW - 40, top: GOAL_LINE + 56, bottom: VH - 38 };
  SPEED_SCALE = clamp(VH / BASE_VH, 1, 1.72);
}

interface Vec {
  x: number;
  y: number;
}

interface Player extends Vec {
  vx: number;
  vy: number;
  r: number;
  facingX: number;
  facingY: number;
  runPhase: number;
}

interface Defender extends Vec {
  r: number;
  homeX: number;
  homeY: number;
  speed: number;
  state: "chase" | "windup" | "lunge" | "stun";
  timer: number;
  cooldown: number;
  direction: number;
  attempted: boolean;
  wobble: number;
}

interface Keeper extends Vec {
  r: number;
  reaction: number;
  dive: number;
}

interface Ball extends Vec {
  vx: number;
  vy: number;
  r: number;
  mode: "dribble" | "shot" | "loose";
  unstoppable: boolean;
  pickupCooldown: number;
  slowTimer: number;
}

interface Orb extends Vec {
  r: number;
  alive: boolean;
  phase: number;
  gold: boolean;
}

interface Particle extends Vec {
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  shape: "spark" | "confetti" | "ring" | "text";
  rot: number;
  vr: number;
  gravity: number;
  char?: string;
}

interface Popup extends Vec {
  text: string;
  color: string;
  life: number;
  maxLife: number;
  size: number;
}

export class StreetKingsEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private config: EngineConfig;
  private callbacks: EngineCallbacks;
  private dpr = 1;
  private viewW = 800;
  private viewH = 600;
  private observer: ResizeObserver | null = null;
  private raf = 0;
  private last = 0;
  private lastHud = 0;
  private destroyed = false;
  private ended = false;

  private status: GameStatus = "countdown";
  private pausedFrom: GameStatus = "playing";
  private countdown = 1.4;
  private timeLeft = 60;
  private score = 0;
  private goals = 0;
  private combo = 0;
  private comboTimer = 0;
  private skill = 100;
  private shake = 0;
  private flash = 0;
  private celebrate = 0;
  private freeze = 0;
  private invincible = 0;
  private shotCooldown = 0;
  private rocketArmed = false;
  private signatureUses = 0;
  private tackles = 0;
  private bestCombo = 0;
  private shotCooldownMax = 0.36;
  private announce: Announcement | null = null;
  private announceTimer = 0;
  private announceId = 0;
  private orbTimer = 0;
  private lastShotTarget = CX;

  private player: Player;
  private ball: Ball;
  private keeper: Keeper;
  private defenders: Defender[] = [];
  private orbs: Orb[] = [];
  private particles: Particle[] = [];
  private popups: Popup[] = [];
  private input: Vec = { x: 0, y: 0 };

  constructor(canvas: HTMLCanvasElement, config: EngineConfig, callbacks: EngineCallbacks) {
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D unavailable");
    this.canvas = canvas;
    this.ctx = ctx;
    this.config = config;
    this.callbacks = callbacks;
    this.player = this.makePlayer();
    this.ball = this.makeBall();
    this.keeper = { x: CX, y: GOAL_LINE + 15, r: 18, reaction: 0, dive: 0 };
    setSoundEnabled(config.sound);
    this.measure();
    this.observer = new ResizeObserver(() => this.measure());
    this.observer.observe(canvas);
    this.resetMatch();
    this.last = performance.now();
    this.loop = this.loop.bind(this);
    this.raf = requestAnimationFrame(this.loop);
  }

  private makePlayer(): Player {
    const speedBoost = this.config.teammate?.id === "kofi" ? 1.14 : 1;
    return {
      x: CX,
      y: VH - 104,
      vx: 0,
      vy: 0,
      r: 20,
      facingX: 0,
      facingY: -1,
      runPhase: 0,
    };
    void speedBoost;
  }

  private makeBall(): Ball {
    return {
      x: CX,
      y: VH - 140,
      vx: 0,
      vy: 0,
      r: 9,
      mode: "dribble",
      unstoppable: false,
      pickupCooldown: 0,
      slowTimer: 0,
    };
  }

  private get playerSpeed(): number {
    const boost = this.config.teammate?.id === "kofi" ? 1.14 : 1;
    return 218 * boost * SPEED_SCALE;
  }

  private get keeperSpeed(): number {
    const nerves = this.config.teammate?.id === "tico" ? 0.74 : 1;
    return nerves * SPEED_SCALE;
  }

  private get comboWindow(): number {
    return this.config.teammate?.id === "juno" ? 7.2 : 5.4;
  }

  private get multiplier(): number {
    return Math.min(5, 1 + Math.floor(this.combo / 3));
  }

  measure(): void {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.max(1, rect.width);
    const height = Math.max(1, rect.height);
    this.viewW = width;
    this.viewH = height;
    this.dpr = dpr;
    this.canvas.width = Math.round(width * dpr);
    this.canvas.height = Math.round(height * dpr);
    updateWorld(width, height);
    this.player.x = clamp(this.player.x, BOUNDS.left, BOUNDS.right);
    this.player.y = clamp(this.player.y, BOUNDS.top, BOUNDS.bottom);
    this.ball.x = clamp(this.ball.x, BOUNDS.left, BOUNDS.right);
    this.ball.y = clamp(this.ball.y, BOUNDS.top, BOUNDS.bottom);
    this.keeper.x = clamp(this.keeper.x, GOAL.left + 26, GOAL.right - 26);
  }

  private resetMatch(): void {
    this.status = "countdown";
    this.countdown = 1.35;
    this.timeLeft = this.config.division.duration + (this.config.teammate?.id === "dembo" ? 10 : 0);
    this.score = 0;
    this.goals = 0;
    this.combo = 0;
    this.comboTimer = 0;
    this.skill = 100;
    this.shake = 0;
    this.flash = 0;
    this.celebrate = 0;
    this.freeze = 0;
    this.invincible = 0;
    this.shotCooldown = 0;
    this.rocketArmed = false;
    this.signatureUses = 0;
    this.tackles = 0;
    this.bestCombo = 0;
    this.orbTimer = 0.6;
    this.ended = false;
    this.announce = null;
    this.announceTimer = 0;
    this.input = { x: 0, y: 0 };
    this.particles = [];
    this.popups = [];
    this.orbs = [];
    this.player = this.makePlayer();
    this.ball = this.makeBall();
    this.keeper = { x: CX, y: GOAL_LINE + 15, r: 18, reaction: 0, dive: 0 };
    this.defenders = this.spawnDefenders(this.config.division.defenders);
    this.spawnOrb(true);
    this.spawnOrb(true);
    this.invincible = 2.6;
    this.setAnnounce("MATCHDAY", `${this.config.division.location} · beat ${this.config.division.rival}`, "info");
    this.fireHud(true);
  }

  private spawnDefenders(count: number): Defender[] {
    const baseSpeed = (110 + (this.config.division.unlockLevel - 1) * 13 + this.goals * 4) * SPEED_SCALE;
    const list: Defender[] = [];
    const lane = Math.min(BOUNDS.right - BOUNDS.left - 120, VW * 0.62) / Math.max(1, count);
    for (let i = 0; i < count; i++) {
      const x = CX + (i - (count - 1) / 2) * Math.min(lane, 190) + (Math.random() - 0.5) * 40;
      const y = GOAL_LINE + 96 + Math.random() * Math.min(150, VH * 0.16);
      list.push({
        x,
        y,
        homeX: x,
        homeY: y,
        r: 18,
        speed: baseSpeed + Math.random() * 12 * SPEED_SCALE,
        state: "chase",
        timer: 0,
        cooldown: Math.random() * 1.2,
        direction: Math.random() * Math.PI * 2,
        attempted: false,
        wobble: Math.random() * Math.PI * 2,
      });
    }
    return list;
  }

  restart(): void {
    this.resetMatch();
    this.last = performance.now();
  }

  pause(): void {
    if (this.status === "playing" || this.status === "countdown") {
      this.pausedFrom = this.status;
      this.status = "paused";
      this.fireHud(true);
    }
  }

  resume(): void {
    if (this.status === "paused") {
      this.status = this.pausedFrom;
      this.last = performance.now();
      this.fireHud(true);
    }
  }

  togglePause(): void {
    if (this.status === "paused") this.resume();
    else this.pause();
  }

  setMove(x: number, y: number): void {
    const mag = Math.hypot(x, y);
    if (mag < 0.12) {
      this.input.x = 0;
      this.input.y = 0;
      return;
    }
    this.input.x = x / Math.max(1, mag);
    this.input.y = y / Math.max(1, mag);
  }

  shoot(): void {
    if (this.status !== "playing" || this.celebrate > 0 || this.shotCooldown > 0) return;
    if (this.ball.mode !== "dribble") return;
    this.shotCooldown = this.shotCooldownMax;
    const target = this.getAimTarget(true);
    const dx = target - this.ball.x;
    const dy = GOAL_LINE - this.ball.y;
    const dist = Math.hypot(dx, dy) || 1;
    const speed = 1080 * SPEED_SCALE;
    this.ball.mode = "shot";
    this.ball.vx = (dx / dist) * speed;
    this.ball.vy = (dy / dist) * speed;
    this.ball.unstoppable = this.rocketArmed;
    this.lastShotTarget = target;
    this.keeper.reaction = 0.14;
    this.keeper.dive = 1;
    this.shake = Math.max(this.shake, this.rocketArmed ? 9 : 3.5);
    this.spawnRing(this.ball.x, this.ball.y, this.rocketArmed ? "#ff6b4a" : "#d8ff3e", this.rocketArmed ? 54 : 34);
    if (this.rocketArmed) {
      this.setAnnounce("ROCKET RELEASED", "No keeper is stopping that", "goal");
      this.rocketArmed = false;
    }
    playSound("kick");
    this.fireHud(true);
  }

  useSkill(): void {
    if (this.status !== "playing" || this.celebrate > 0) return;
    if (this.skill < 100) {
      this.setAnnounce("NOT CHARGED", "Collect volt orbs to fill your signature", "info");
      this.fireHud(true);
      return;
    }
    this.skill = 0;
    this.signatureUses += 1;
    this.skillCooldownFlash();
    const effect = effectFor(this.config.signature.effect);
    const color = this.config.signature.color;
    if (effect.id === "dash") {
      this.player.vx += this.player.facingX * 720;
      this.player.vy += this.player.facingY * 720;
      this.invincible = 1;
      for (let i = 0; i < 26; i++) {
        this.spawnParticle(
          this.player.x + rand(-14, 14),
          this.player.y + rand(-14, 14),
          -this.player.facingX * rand(40, 160) + rand(-50, 50),
          -this.player.facingY * rand(40, 160) + rand(-50, 50),
          color,
          "spark",
          rand(3, 8),
          rand(0.3, 0.7)
        );
      }
      this.setAnnounce(this.config.signature.name.toUpperCase(), "Phase step · defenders ghosted", "skill");
    } else if (effect.id === "freeze") {
      this.freeze = 3.5;
      for (let i = 0; i < 40; i++) {
        this.spawnParticle(
          rand(BOUNDS.left, BOUNDS.right),
          rand(BOUNDS.top, BOUNDS.bottom),
          0,
          0,
          "#7dd3fc",
          "spark",
          rand(2, 5),
          rand(0.5, 1.4)
        );
      }
      this.setAnnounce(this.config.signature.name.toUpperCase(), "Ice veins · back line frozen", "skill");
    } else if (effect.id === "rocket") {
      this.rocketArmed = true;
      this.shotCooldownMax = 0.22;
      for (let i = 0; i < 24; i++) {
        this.spawnParticle(
          this.player.x + rand(-20, 20),
          this.player.y + rand(-20, 20),
          rand(-110, 110),
          rand(-180, -30),
          i % 2 ? color : "#ff6b4a",
          "spark",
          rand(3, 7),
          rand(0.4, 0.9)
        );
      }
      this.setAnnounce(this.config.signature.name.toUpperCase(), "Rocket armed · shoot to detonate", "skill");
    } else {
      const collected = this.orbs.filter((o) => o.alive);
      collected.forEach((orb) => this.collectOrb(orb, true));
      this.skill = 32;
      this.setAnnounce(this.config.signature.name.toUpperCase(), "Flair magnet · everything is yours", "skill");
    }
    this.combo += 1;
    this.comboTimer = this.comboWindow;
    this.shake = Math.max(this.shake, 8);
    this.flash = Math.max(this.flash, 0.22);
    playSound("skill");
    this.haptic([12, 26, 12]);
    this.fireHud(true);
  }

  private skillCooldownFlash(): void {
    this.spawnRing(this.player.x, this.player.y, this.config.signature.color, 76);
  }

  private getAimTarget(withPressure: boolean): number {
    const center = (GOAL.left + GOAL.right) / 2;
    const leftCorner = GOAL.left + 26;
    const rightCorner = GOAL.right - 26;
    let target = this.keeper.x < center ? rightCorner : leftCorner;
    if (withPressure && !this.rocketArmed) {
      let closest = Infinity;
      for (const d of this.defenders) {
        closest = Math.min(closest, Math.hypot(d.x - this.player.x, d.y - this.player.y));
      }
      if (closest < 78) {
        target += rand(-46, 46);
      }
    }
    return Math.max(GOAL.left + 14, Math.min(GOAL.right - 14, target));
  }

  private setAnnounce(label: string, detail: string, tone: Tone): void {
    this.announceId += 1;
    this.announce = { id: this.announceId, label, detail, tone };
    this.announceTimer = 2.1;
  }

  private fireHud(force = false): void {
    const now = performance.now();
    if (!force && now - this.lastHud < 90) return;
    this.lastHud = now;
    const celebration = celebrationFor(this.config.signature.celebration);
    this.callbacks.onHud({
      status: this.status,
      timeLeft: Math.max(0, Math.ceil(this.timeLeft)),
      score: this.score,
      goals: this.goals,
      target: this.config.division.target,
      combo: this.combo,
      multiplier: this.multiplier,
      skill: Math.round(this.skill),
      skillReady: this.skill >= 100,
      announcement: this.announce,
      celebration:
        this.celebrate > 0
          ? { emoji: celebration.emoji, name: this.config.signature.celebrationName, color: this.config.signature.color }
          : null,
      signatureUses: this.signatureUses,
      possession: this.ball.mode === "dribble",
      rocketArmed: this.rocketArmed,
      opponent: this.config.division.rival,
    });
  }

  private loop(t: number): void {
    if (this.destroyed) return;
    const dt = Math.min(0.05, Math.max(0.001, (t - this.last) / 1000));
    this.last = t;
    if (this.status !== "paused") this.update(dt);
    this.draw();
    if (this.status !== "paused" && this.status !== "over") this.fireHud();
    this.raf = requestAnimationFrame(this.loop);
  }

  private update(dt: number): void {
    this.shake = Math.max(0, this.shake - dt * 34);
    this.flash = Math.max(0, this.flash - dt * 2.6);
    this.updateEffects(dt);

    if (this.status === "over") return;
    if (this.status === "countdown") {
      this.countdown -= dt;
      if (Math.abs(this.countdown - 0.68) < dt / 2) playSound("whistle");
      if (this.countdown <= 0) {
        this.status = "playing";
        this.setAnnounce("BALL ROLLING", "Get to the box · bag your first goal", "info");
        this.fireHud(true);
      }
      return;
    }

    if (this.announceTimer > 0) {
      this.announceTimer -= dt;
      if (this.announceTimer <= 0) {
        this.announce = null;
        this.fireHud(true);
      }
    }

    if (this.celebrate > 0) {
      this.celebrate -= dt;
      if (this.celebrate <= 0) {
        if (this.goals >= this.config.division.target) {
          this.finishMatch(true);
        } else {
          this.resetAfterGoal();
        }
      }
      return;
    }

    this.timeLeft -= dt;
    if (this.timeLeft <= 0) {
      this.finishMatch(false);
      return;
    }

    this.invincible = Math.max(0, this.invincible - dt);
    this.freeze = Math.max(0, this.freeze - dt);
    this.shotCooldown = Math.max(0, this.shotCooldown - dt);

    this.updatePlayer(dt);
    this.updateDefenders(dt);
    this.updateKeeper(dt);
    this.updateBall(dt);
    this.updateOrbs(dt);

    this.comboTimer -= dt;
    if (this.comboTimer <= 0 && this.combo > 0) {
      this.combo = 0;
      this.fireHud(true);
    }
    if (this.ball.mode === "dribble" && this.input.x + this.input.y !== 0) {
      this.skill = Math.min(100, this.skill + dt * 3.1);
    }
    this.fireHud();
  }

  private updateEffects(dt: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += p.gravity * dt;
      p.vx *= 1 - dt * 1.8;
      p.rot += p.vr * dt;
    }
    for (let i = this.popups.length - 1; i >= 0; i--) {
      const p = this.popups[i];
      p.life -= dt;
      p.y -= dt * 34;
      if (p.life <= 0) this.popups.splice(i, 1);
    }
  }

  private updatePlayer(dt: number): void {
    const p = this.player;
    p.x += (this.input.x * this.playerSpeed + p.vx) * dt;
    p.y += (this.input.y * this.playerSpeed + p.vy) * dt;
    p.vx *= Math.exp(-6.5 * dt);
    p.vy *= Math.exp(-6.5 * dt);
    if (Math.hypot(this.input.x, this.input.y) > 0.1) {
      p.facingX = this.input.x;
      p.facingY = this.input.y;
      p.runPhase += dt * 13;
    }
    p.x = clamp(p.x, BOUNDS.left, BOUNDS.right);
    p.y = clamp(p.y, BOUNDS.top, BOUNDS.bottom);

    for (const d of this.defenders) {
      const dx = p.x - d.x;
      const dy = p.y - d.y;
      const dist = Math.hypot(dx, dy);
      const min = p.r + d.r;
      if (dist < min && dist > 0.001) {
        const push = (min - dist) * 0.45;
        p.x += (dx / dist) * push;
        p.y += (dy / dist) * push;
      }
    }
  }

  private updateDefenders(dt: number): void {
    const frozen = this.freeze > 0 ? 0.18 : 1;
    for (let i = 0; i < this.defenders.length; i++) {
      const d = this.defenders[i];
      d.wobble += dt * 2.2;
      if (d.cooldown > 0) d.cooldown -= dt;
      if (d.state === "stun") {
        d.timer -= dt;
        if (d.timer <= 0) {
          d.state = "chase";
          d.cooldown = 1;
        }
        continue;
      }
      const target = this.ball.mode === "dribble" ? this.player : this.ball;
      const dx = target.x - d.x;
      const dy = target.y - d.y;
      const dist = Math.hypot(dx, dy) || 1;
      const nx = dx / dist;
      const ny = dy / dist;

      if (d.state === "windup") {
        d.timer -= dt;
        if (d.timer <= 0) {
          d.state = "lunge";
          d.timer = 0.32;
          d.attempted = true;
          const lungeSpeed = (370 + this.goals * 12) * SPEED_SCALE;
          d.x += nx * lungeSpeed * 0.012;
          d.y += ny * lungeSpeed * 0.012;
          d.homeX = d.x;
          d.homeY = d.y;
        }
        continue;
      }

      if (d.state === "lunge") {
        d.timer -= dt;
        const lungeSpeed = (360 + this.goals * 12) * SPEED_SCALE;
        d.x += nx * lungeSpeed * frozen * dt;
        d.y += ny * lungeSpeed * frozen * dt;
        d.direction = Math.atan2(ny, nx);
        if (this.invincible <= 0 && this.celebrate <= 0) {
          const playerDist = Math.hypot(d.x - this.player.x, d.y - this.player.y);
          const ballDist = Math.hypot(d.x - this.ball.x, d.y - this.ball.y);
          if ((this.ball.mode === "dribble" && playerDist < d.r + this.player.r + 4) || ballDist < d.r + this.ball.r + 4) {
            this.tackle(d);
          }
        }
        if (d.timer <= 0) {
          d.state = "chase";
          d.cooldown = 1.45;
          if (d.attempted) {
            d.attempted = false;
            if (this.invincible <= 0 && this.ball.mode === "dribble") {
              this.combo += 1;
              this.bestCombo = Math.max(this.bestCombo, this.combo);
              this.comboTimer = this.comboWindow;
              this.score += 25 * this.multiplier;
              this.popup(d.x, d.y - 24, "DODGED +" + 25 * this.multiplier, this.config.signature.color, 16);
              this.skill = Math.min(100, this.skill + 7);
            }
          }
        }
        continue;
      }

      // Chase, with a loose orbit so defenders don't stack in a single line.
      const orbit = Math.sin(d.wobble + i) * 0.36;
      const desiredX = target.x - nx * 42 + -ny * orbit * 34;
      const desiredY = target.y - ny * 42 + nx * orbit * 34;
      const angle = Math.atan2(desiredY - d.y, desiredX - d.x);
      d.direction = angle;
      const grace = this.invincible > 0 ? 0.55 : 1;
      const speed = d.speed * frozen * grace;
      d.x += Math.cos(angle) * speed * dt;
      d.y += Math.sin(angle) * speed * dt;
      for (let j = 0; j < this.defenders.length; j++) {
        if (j === i) continue;
        const other = this.defenders[j];
        const ox = d.x - other.x;
        const oy = d.y - other.y;
        const od = Math.hypot(ox, oy);
        if (od < d.r * 2 && od > 0.01) {
          d.x += (ox / od) * (d.r * 2 - od) * 0.35;
          d.y += (oy / od) * (d.r * 2 - od) * 0.35;
        }
      }
      if (dist < 106 && d.cooldown <= 0 && this.ball.mode === "dribble" && this.invincible <= 0) {
        d.state = "windup";
        d.timer = 0.28;
        d.attempted = false;
      }
      d.x = clamp(d.x, BOUNDS.left - 10, BOUNDS.right + 10);
      d.y = clamp(d.y, BOUNDS.top - 6, BOUNDS.bottom);
    }
  }

  private tackle(defender: Defender): void {
    this.tackles += 1;
    this.invincible = 1.25;
    this.combo = 0;
    this.comboTimer = 0;
    this.score = Math.max(0, this.score - 10);
    this.ball.mode = "loose";
    this.ball.x = this.player.x + rand(-10, 10);
    this.ball.y = this.player.y - 12;
    this.ball.vx = rand(-90, 90);
    this.ball.vy = rand(110, 170);
    this.ball.pickupCooldown = 0.42;
    this.ball.slowTimer = 0.8;
    this.player.vx = rand(-160, 160);
    this.player.vy = 170;
    defender.state = "stun";
    defender.timer = 0.9;
    this.shake = Math.max(this.shake, 13);
    this.flash = Math.max(this.flash, 0.16);
    this.setAnnounce("TACKLED", "Combo wiped · chase the loose ball", "tackle");
    this.spawnRing(this.ball.x, this.ball.y, "#ff6b4a", 54);
    for (let i = 0; i < 14; i++) {
      this.spawnParticle(
        this.ball.x,
        this.ball.y,
        rand(-150, 150),
        rand(-160, 70),
        i % 3 ? "#ff6b4a" : "#f3f1e6",
        "spark",
        rand(2, 5),
        rand(0.25, 0.6)
      );
    }
    playSound("tackle");
    this.haptic(45);
    this.fireHud(true);
  }

  private updateKeeper(dt: number): void {
    const k = this.keeper;
    const center = (GOAL.left + GOAL.right) / 2;
    let targetX = center + (this.player.x - center) * 0.62;
    let speed = 98 * this.keeperSpeed;
    if (this.ball.mode === "shot") {
      targetX = this.ball.x + this.ball.vx * 0.12;
      speed = 172 * this.keeperSpeed;
      if (k.reaction > 0) {
        k.reaction -= dt;
        speed *= 0.18;
      }
    } else if (this.ball.mode === "loose") {
      targetX = this.ball.x;
      speed = 78;
    }
    const move = clamp(targetX - k.x, -speed * dt, speed * dt);
    k.x = clamp(k.x + move, GOAL.left + 26, GOAL.right - 26);
    k.y = GOAL_LINE + 15 + Math.sin(performance.now() / 340) * 1.8;
    k.dive = Math.max(0, k.dive - dt * 2);
  }

  private updateBall(dt: number): void {
    const b = this.ball;
    if (b.mode === "dribble") {
      const px = this.player.facingX;
      const py = this.player.facingY;
      const targetX = this.player.x + px * 25;
      const targetY = this.player.y + py * 25;
      b.x = lerp(b.x, targetX, Math.min(1, dt * 16));
      b.y = lerp(b.y, targetY, Math.min(1, dt * 16));
      b.vx = 0;
      b.vy = 0;
      return;
    }
    if (b.mode === "shot") {
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      if (Math.random() < 0.55) {
        this.spawnParticle(b.x, b.y + 4, rand(-15, 15), rand(10, 40), b.unstoppable ? "#ff6b4a" : "#f3f1e6", "spark", rand(1.5, 3.5), 0.24);
      }
      if (!b.unstoppable) {
        for (const d of this.defenders) {
          if (Math.hypot(d.x - b.x, d.y - b.y) < d.r + b.r + 2 && b.y > BOUNDS.top - 12) {
            b.mode = "loose";
            b.vx = rand(-180, 180);
            b.vy = rand(130, 230);
            b.pickupCooldown = 0.25;
            b.slowTimer = 1;
            this.shake = Math.max(this.shake, 6);
            this.setAnnounce("BLOCKED", "Find a cleaner lane through the block", "tackle");
            this.spawnRing(b.x, b.y, "#ff6b4a", 30);
            playSound("tackle");
            this.fireHud(true);
            return;
          }
        }
      }
      const nearKeeper =
        !b.unstoppable &&
        Math.abs(b.x - this.keeper.x) < this.keeper.r + b.r + 4 &&
        b.y < this.keeper.y + 24 &&
        b.y > GOAL_LINE - 12;
      if (nearKeeper) {
        b.mode = "loose";
        b.vy = Math.abs(b.vy) * 0.5 + 80;
        b.vx = (b.x - this.keeper.x) * 3 + rand(-40, 40);
        b.pickupCooldown = 0.3;
        b.slowTimer = 1.2;
        this.combo = Math.max(0, this.combo - 1);
        this.shake = Math.max(this.shake, 5);
        this.keeper.dive = 1;
        this.setAnnounce("SAVED", "Keeper got a hand to it · stay alive", "save");
        this.spawnRing(b.x, b.y, "#ffce4f", 32);
        playSound("save");
        this.fireHud(true);
        return;
      }
      if (b.y <= GOAL_LINE) {
        if (b.x > GOAL.left + 8 && b.x < GOAL.right - 8) {
          this.scoreGoal();
        } else {
          b.y = GOAL_LINE + 2;
          b.vy = Math.abs(b.vy) * 0.35;
          b.vx *= 0.4;
          b.mode = "loose";
          this.setAnnounce("OFF TARGET", "Keep your cool and go again", "save");
          this.spawnRing(b.x, b.y, "#f3f1e6", 26);
          playSound("save");
          this.fireHud(true);
        }
      }
      return;
    }

    // Loose ball physics
    b.pickupCooldown = Math.max(0, b.pickupCooldown - dt);
    b.slowTimer = Math.max(0, b.slowTimer - dt);
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.vx *= 1 - dt * 2.4;
    b.vy *= 1 - dt * 1.9;
    if (b.x < BOUNDS.left) {
      b.x = BOUNDS.left;
      b.vx = Math.abs(b.vx) * 0.6;
    }
    if (b.x > BOUNDS.right) {
      b.x = BOUNDS.right;
      b.vx = -Math.abs(b.vx) * 0.6;
    }
    if (b.y < GOAL_LINE + 6) {
      b.y = GOAL_LINE + 6;
      b.vy = Math.abs(b.vy) * 0.5;
    }
    if (b.y > BOUNDS.bottom) {
      b.y = BOUNDS.bottom;
      b.vy = -Math.abs(b.vy) * 0.55;
    }
    if (this.ball.slowTimer <= 0) {
      b.vx *= 1 - dt * 1.1;
      b.vy *= 1 - dt * 1.1;
    }
    if (b.pickupCooldown <= 0 && Math.hypot(b.x - this.player.x, b.y - this.player.y) < this.player.r + b.r + 13) {
      b.mode = "dribble";
      this.spawnRing(b.x, b.y, "#d8ff3e", 24);
      playSound("ui");
      this.fireHud(true);
    }
    if (b.slowTimer <= 0) {
      for (const d of this.defenders) {
        if (Math.hypot(d.x - b.x, d.y - b.y) < d.r + b.r + 4) {
          b.vx = rand(-150, 150);
          b.vy = 130;
          b.slowTimer = 0.7;
          this.spawnRing(b.x, b.y, "#ff6b4a", 22);
          break;
        }
      }
    }
  }

  private updateOrbs(dt: number): void {
    this.orbTimer -= dt;
    const active = this.orbs.filter((o) => o.alive).length;
    if (this.orbTimer <= 0 && active < 3) {
      this.spawnOrb(false);
      this.orbTimer = rand(1.1, 1.9);
    }
    for (const orb of this.orbs) {
      if (!orb.alive) continue;
      orb.phase += dt * 2.8;
      if (Math.hypot(orb.x - this.player.x, orb.y - this.player.y) < this.player.r + orb.r + 10) {
        this.collectOrb(orb, false);
      }
    }
  }

  private spawnOrb(initial: boolean): void {
    let x = 0;
    let y = 0;
    let tries = 0;
    do {
      x = rand(BOUNDS.left + 30, BOUNDS.right - 30);
      y = initial ? rand(VH * 0.62, VH * 0.8) : rand(BOUNDS.top + 40, BOUNDS.bottom - 40);
      tries += 1;
    } while (tries < 12 && Math.hypot(x - this.player.x, y - this.player.y) < 100);
    const gold = !initial && Math.random() < 0.16;
    this.orbs.push({ x, y, r: gold ? 15 : 13, alive: true, phase: Math.random() * 6, gold });
  }

  private collectOrb(orb: Orb, fromSkill: boolean): void {
    if (!orb.alive) return;
    orb.alive = false;
    this.combo += 1;
    this.bestCombo = Math.max(this.bestCombo, this.combo);
    this.comboTimer = this.comboWindow;
    const charge = (this.config.teammate?.id === "nia" ? 26 : 15) * (orb.gold ? 2 : 1);
    this.skill = Math.min(100, this.skill + charge);
    const value = (orb.gold ? 160 : 55) * this.multiplier;
    this.score += value;
    this.popup(orb.x, orb.y - 18, `+${value} FLAIR`, orb.gold ? "#ffce4f" : "#d8ff3e", orb.gold ? 21 : 17);
    for (let i = 0; i < (orb.gold ? 22 : 12); i++) {
      this.spawnParticle(
        orb.x,
        orb.y,
        rand(-130, 130),
        rand(-130, 130),
        orb.gold ? "#ffce4f" : this.config.signature.color,
        "spark",
        rand(2, 5),
        rand(0.3, 0.7)
      );
    }
    this.spawnRing(orb.x, orb.y, orb.gold ? "#ffce4f" : this.config.signature.color, orb.gold ? 44 : 32);
    if (!fromSkill) playSound("orb");
    this.fireHud(true);
  }

  private scoreGoal(): void {
    this.goals += 1;
    this.combo += 2;
    this.bestCombo = Math.max(this.bestCombo, this.combo);
    this.comboTimer = this.comboWindow;
    const distance = Math.max(0, 600 - this.player.y);
    const cornerBonus = Math.abs(this.lastShotTarget - (GOAL.left + GOAL.right) / 2) > 70 ? 60 : 0;
    const points = Math.round(260 + distance * 0.42 + cornerBonus + 22 * this.combo) * this.multiplier;
    this.score += points;
    this.skill = Math.min(100, this.skill + 14);
    this.celebrate = 2.35;
    this.shake = 18;
    this.flash = 0.6;
    this.ball.mode = "loose";
    this.ball.vx = 0;
    this.ball.vy = 0;
    this.ball.y = GOAL_LINE - 4;
    const color = this.config.signature.color;
    for (let i = 0; i < 86; i++) {
      const palette = [color, "#f3f1e6", "#ffce4f", "#ff6b4a", "#7dd3fc"];
      this.spawnParticle(
        rand(GOAL.left - 70, GOAL.right + 70),
        rand(20, 130),
        rand(-220, 220),
        rand(-40, 220),
        palette[i % palette.length],
        i % 3 === 0 ? "spark" : "confetti",
        rand(4, 11),
        rand(1.2, 2.5),
        rand(0, 6.28),
        rand(-8, 8),
        420
      );
    }
    this.popup(CX, GOAL_LINE + 168, `+${points.toLocaleString()}`, "#d8ff3e", 44);
    playSound("goal");
    this.haptic([18, 40, 26]);
    this.fireHud(true);
  }

  private resetAfterGoal(): void {
    this.player = this.makePlayer();
    this.ball = this.makeBall();
    this.keeper = { x: CX, y: GOAL_LINE + 15, r: 18, reaction: 0, dive: 0 };
    this.invincible = 2.1;
    this.shotCooldown = 0;
    this.shotCooldownMax = this.config.teammate?.id === "rafa" ? 0.28 : 0.36;
    this.rocketArmed = false;
    this.defenders = this.spawnDefenders(Math.min(this.config.division.defenders + this.goals, this.config.division.defenders + 3));
    this.setAnnounce(
      "KICK OFF",
      this.goals >= this.config.division.target - 1 ? "One more goal wins it" : `Goal ${this.goals} of ${this.config.division.target}`,
      "info"
    );
    this.fireHud(true);
  }

  private finishMatch(won: boolean): void {
    if (this.ended) return;
    this.ended = true;
    this.status = "over";
    if (won) {
      this.score += Math.round(this.timeLeft) * 14;
      playSound("win");
    } else {
      playSound("lose");
    }
    this.shake = 14;
    this.flash = 0.28;
    this.fireHud(true);
    this.callbacks.onEnd({
      score: this.score,
      goals: this.goals,
      target: this.config.division.target,
      won,
      divisionId: this.config.division.id,
      divisionName: this.config.division.name,
      bestCombo: this.bestCombo,
      timeLeft: Math.max(0, Math.round(this.timeLeft)),
      signatureUses: this.signatureUses,
      flawless: this.tackles === 0,
    });
  }

  private haptic(pattern: number | number[]): void {
    try {
      if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") navigator.vibrate(pattern);
    } catch {
      /* haptics are a bonus, never a crash */
    }
  }

  private popup(x: number, y: number, text: string, color: string, size = 18): void {
    this.popups.push({ x, y, text, color, life: 1.1, maxLife: 1.1, size });
  }

  private spawnRing(x: number, y: number, color: string, size: number): void {
    this.particles.push({
      x,
      y,
      vx: 0,
      vy: 0,
      life: 0.42,
      maxLife: 0.42,
      size,
      color,
      shape: "ring",
      rot: 0,
      vr: 0,
      gravity: 0,
    });
  }

  private spawnParticle(
    x: number,
    y: number,
    vx: number,
    vy: number,
    color: string,
    shape: Particle["shape"],
    size: number,
    life: number,
    rot = 0,
    vr = 0,
    gravity = 0
  ): void {
    if (this.particles.length > 280) return;
    this.particles.push({ x, y, vx, vy, color, shape, size, life, maxLife: life, rot, vr, gravity });
  }

  // ------------------------------- DRAWING -------------------------------

  private draw(): void {
    const ctx = this.ctx;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    const ambience = ctx.createRadialGradient(
      this.viewW / 2,
      this.viewH / 2,
      10,
      this.viewW / 2,
      this.viewH / 2,
      Math.max(this.viewW, this.viewH) * 0.72
    );
    ambience.addColorStop(0, "#101a11");
    ambience.addColorStop(0.5, "#0a110b");
    ambience.addColorStop(1, "#050805");
    ctx.fillStyle = ambience;
    ctx.fillRect(0, 0, this.viewW, this.viewH);
    const scale = Math.min(this.viewW / VW, this.viewH / VH);
    const ox = (this.viewW - VW * scale) / 2;
    const oy = (this.viewH - VH * scale) / 2;
    ctx.save();
    ctx.globalAlpha = 0.16;
    ctx.strokeStyle = "#d8ff3e";
    ctx.lineWidth = 1;
    for (let x = ox + 28; x < ox + VW * scale; x += 46) {
      ctx.beginPath();
      ctx.moveTo(x, Math.max(0, oy - 40));
      ctx.lineTo(x, Math.min(this.viewH, oy + VH * scale + 40));
      ctx.stroke();
    }
    ctx.restore();
    ctx.save();
    ctx.translate(ox, oy);
    ctx.scale(scale, scale);
    if (this.shake > 0.2) {
      ctx.translate(rand(-this.shake, this.shake) * 0.55, rand(-this.shake, this.shake) * 0.55);
    }
    this.drawPitch(ctx);
    this.drawAim(ctx);
    this.drawOrbs(ctx);
    this.drawDefenders(ctx);
    this.drawKeeper(ctx);
    this.drawPlayer(ctx);
    this.drawBall(ctx);
    this.drawParticles(ctx);
    this.drawPopups(ctx);
    this.drawOverlays(ctx);
    ctx.restore();
  }

  private drawPitch(ctx: CanvasRenderingContext2D): void {
    const time = performance.now() / 1000;
    const midY = GOAL_LINE + (VH - GOAL_LINE) * 0.46;
    const bg = ctx.createRadialGradient(CX, VH * 0.34, 60, CX, VH * 0.52, Math.max(VW, VH) * 0.7);
    bg.addColorStop(0, "#1a3520");
    bg.addColorStop(0.55, "#122617");
    bg.addColorStop(1, "#09130c");
    ctx.fillStyle = "#070a07";
    ctx.fillRect(0, 0, VW, VH);
    ctx.beginPath();
    ctx.roundRect(6, 6, VW - 12, VH - 12, 22);
    ctx.fillStyle = bg;
    ctx.fill();
    ctx.save();
    ctx.clip();

    // Mow stripes
    for (let i = 0; i < 10; i++) {
      ctx.fillStyle = i % 2 ? "rgba(216,255,62,0.028)" : "rgba(255,255,255,0.012)";
      ctx.fillRect(FIELD.left, FIELD.top + i * ((VH - 32) / 10), FIELD.right - FIELD.left, (VH - 32) / 10);
    }

    // Crowd / top stand
    const stand = ctx.createLinearGradient(0, 18, 0, GOAL_LINE + 8);
    stand.addColorStop(0, "#050805");
    stand.addColorStop(1, "rgba(6,9,6,0)");
    ctx.fillStyle = stand;
    ctx.fillRect(16, 16, VW - 32, GOAL_LINE - 8);
    for (let i = 0; i < 64; i++) {
      const x = 28 + ((i * 97) % Math.max(1, VW - 56));
      const y = 24 + ((i * 53) % Math.max(50, GOAL_LINE - 44));
      const flicker = 0.2 + 0.5 * Math.abs(Math.sin(time * 0.9 + i * 1.7));
      ctx.fillStyle = i % 7 === 0 ? `rgba(216,255,62,${flicker * 0.6})` : `rgba(243,241,230,${flicker * 0.24})`;
      ctx.beginPath();
      ctx.arc(x, y, i % 5 === 0 ? 1.9 : 1.2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Markings
    const circleR = clamp(VW * 0.082, 46, 82);
    ctx.strokeStyle = "rgba(216,255,62,0.24)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(FIELD.left, FIELD.top, FIELD.right - FIELD.left, FIELD.bottom - FIELD.top, 16);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(FIELD.left, midY);
    ctx.lineTo(FIELD.right, midY);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(CX, midY, circleR, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = "rgba(216,255,62,0.5)";
    ctx.beginPath();
    ctx.arc(CX, midY, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Penalty boxes, scaled with the cage
    const boxW = Math.min(VW * 0.5, 440);
    const boxD = Math.min(VH * 0.24, 158);
    const sixW = boxW * 0.38;
    const sixD = boxD * 0.4;
    ctx.strokeStyle = "rgba(216,255,62,0.18)";
    ctx.strokeRect(CX - boxW / 2, GOAL_LINE, boxW, boxD);
    ctx.strokeRect(CX - sixW / 2, GOAL_LINE, sixW, sixD);
    ctx.beginPath();
    ctx.arc(CX, GOAL_LINE + boxD, circleR * 0.75, 0.2, Math.PI - 0.2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(CX, GOAL_LINE + boxD, circleR * 0.34, Math.PI + 0.3, -0.3);
    ctx.stroke();
    ctx.strokeStyle = "rgba(243,241,230,0.1)";
    ctx.strokeRect(FIELD.left, VH - 176, FIELD.right - FIELD.left, 144);

    // Corner arcs
    ctx.strokeStyle = "rgba(216,255,62,0.2)";
    [
      [FIELD.left + 20, FIELD.bottom - 20, Math.PI, Math.PI * 1.5],
      [FIELD.right - 20, FIELD.bottom - 20, Math.PI * 1.5, Math.PI * 2],
      [FIELD.left + 20, FIELD.top + 20, 0, Math.PI * 0.5],
      [FIELD.right - 20, FIELD.top + 20, Math.PI * 0.5, Math.PI],
    ].forEach(([x, y, a, b]) => {
      ctx.beginPath();
      ctx.arc(x, y, 18, a, b);
      ctx.stroke();
    });

    // Center wordmark
    ctx.save();
    ctx.globalAlpha = 0.055;
    ctx.fillStyle = "#d8ff3e";
    ctx.font = `400 ${clamp(VW * 0.072, 48, 92)}px Anton, 'Arial Narrow', sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText("STREETKINGS", CX, midY + circleR + 48);
    ctx.restore();

    // Signature color wash near the goal
    const aura = ctx.createRadialGradient(CX, GOAL_LINE, 10, CX, GOAL_LINE, Math.min(VW * 0.36, 320));
    aura.addColorStop(0, hexToRgba(this.config.signature.color, 0.14));
    aura.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = aura;
    ctx.fillRect(16, 16, VW - 32, Math.min(340, VH * 0.46));

    ctx.restore();

    // Perimeter glow
    ctx.strokeStyle = "rgba(216,255,62,0.28)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(8, 8, VW - 16, VH - 16, 24);
    ctx.stroke();

    // Goal net
    ctx.save();
    ctx.fillStyle = "rgba(6,10,7,0.82)";
    ctx.fillRect(GOAL.left, 44, GOAL.right - GOAL.left, GOAL_LINE - 42);
    ctx.strokeStyle = "rgba(243,241,230,0.2)";
    ctx.lineWidth = 1;
    for (let x = GOAL.left; x <= GOAL.right; x += 16) {
      ctx.beginPath();
      ctx.moveTo(x, 45);
      ctx.lineTo(x, GOAL_LINE);
      ctx.stroke();
    }
    for (let y = 48; y < GOAL_LINE; y += 12) {
      ctx.beginPath();
      ctx.moveTo(GOAL.left, y);
      ctx.lineTo(GOAL.right, y);
      ctx.stroke();
    }
    ctx.strokeStyle = "#f3f1e6";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(GOAL.left, GOAL_LINE);
    ctx.lineTo(GOAL.left, 44);
    ctx.lineTo(GOAL.right, 44);
    ctx.lineTo(GOAL.right, GOAL_LINE);
    ctx.stroke();
    ctx.strokeStyle = hexToRgba(this.config.signature.color, 0.55);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(GOAL.left - 2, GOAL_LINE);
    ctx.lineTo(GOAL.right + 2, GOAL_LINE);
    ctx.stroke();
    ctx.restore();

    if (this.freeze > 0) {
      ctx.fillStyle = `rgba(125,211,252,${Math.min(0.12, this.freeze * 0.05)})`;
      ctx.fillRect(8, 8, VW - 16, VH - 16);
    }

    if (this.flash > 0) {
      ctx.fillStyle = `rgba(243,241,230,${this.flash * 0.28})`;
      ctx.fillRect(0, 0, VW, VH);
    }
  }

  private drawAim(ctx: CanvasRenderingContext2D): void {
    if (this.ball.mode !== "dribble" || this.status !== "playing" || this.celebrate > 0) return;
    const target = this.getAimTarget(false);
    const color = this.rocketArmed ? "#ff6b4a" : this.config.signature.color;
    ctx.save();
    ctx.setLineDash([6, 9]);
    ctx.lineDashOffset = -performance.now() / 55;
    ctx.strokeStyle = hexToRgba(color, 0.34);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(this.ball.x, this.ball.y - 8);
    ctx.lineTo(target, GOAL_LINE);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    const s = 13;
    ctx.beginPath();
    ctx.moveTo(target - s, GOAL_LINE - 20);
    ctx.lineTo(target - s, GOAL_LINE - 32);
    ctx.lineTo(target - s + 8, GOAL_LINE - 32);
    ctx.moveTo(target + s, GOAL_LINE - 20);
    ctx.lineTo(target + s, GOAL_LINE - 32);
    ctx.lineTo(target + s - 8, GOAL_LINE - 32);
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.font = "800 10px Manrope, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(this.rocketArmed ? "LOCKED" : "OPEN", target, GOAL_LINE - 38);
    ctx.restore();
  }

  private drawPlayer(ctx: CanvasRenderingContext2D): void {
    const p = this.player;
    const time = performance.now() / 1000;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.fillStyle = "rgba(0,0,0,0.42)";
    ctx.beginPath();
    ctx.ellipse(2, 9, 19, 9, 0, 0, Math.PI * 2);
    ctx.fill();

    if (this.skill >= 100) {
      ctx.strokeStyle = hexToRgba(this.config.signature.color, 0.42 + Math.sin(time * 4) * 0.14);
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 7]);
      ctx.lineDashOffset = -time * 22;
      ctx.beginPath();
      ctx.arc(0, 0, 28 + Math.sin(time * 3) * 1.5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    if (this.invincible > 0) {
      ctx.strokeStyle = "rgba(243,241,230,0.55)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 24, 0, Math.PI * 2);
      ctx.stroke();
    }
    const angle = Math.atan2(p.facingY, p.facingX);
    ctx.rotate(angle);
    const step = (Math.sin(p.runPhase) * 4.4);
    ctx.fillStyle = "#0a0c09";
    ctx.beginPath();
    ctx.ellipse(9, -8 + step, 5.5, 3.8, 0.2, 0, Math.PI * 2);
    ctx.ellipse(9, 8 - step, 5.5, 3.8, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = this.config.signature.color;
    ctx.strokeStyle = "#0a0c09";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, p.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#0a0c09";
    ctx.font = "800 14px Manrope, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.rotate(-angle);
    ctx.fillText("10", 0, 1);
    ctx.fillStyle = "#0a0c09";
    ctx.beginPath();
    ctx.moveTo(p.facingX * 23, p.facingY * 23);
    ctx.lineTo(-p.facingY * 5 + p.facingX * 17, p.facingX * 5 + p.facingY * 17);
    ctx.lineTo(p.facingY * 5 + p.facingX * 17, -p.facingX * 5 + p.facingY * 17);
    ctx.fill();
    ctx.restore();

    if (this.celebrate > 0) {
      const emoji = celebrationFor(this.config.signature.celebration).emoji;
      ctx.save();
      ctx.font = "40px sans-serif";
      ctx.textAlign = "center";
      ctx.translate(p.x, p.y - 70 - Math.sin(time * 6) * 8);
      ctx.rotate(Math.sin(time * 3) * 0.16);
      ctx.fillText(emoji, 0, 0);
      ctx.restore();
    }
    if (this.rocketArmed) {
      ctx.save();
      ctx.fillStyle = "#ff6b4a";
      ctx.font = "800 10px Manrope, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("ROCKET ARMED", p.x, p.y - 38);
      ctx.restore();
    }
  }

  private drawDefenders(ctx: CanvasRenderingContext2D): void {
    const time = performance.now() / 1000;
    for (const d of this.defenders) {
      ctx.save();
      ctx.translate(d.x, d.y);
      ctx.fillStyle = "rgba(0,0,0,0.38)";
      ctx.beginPath();
      ctx.ellipse(1, 8, 18, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      if (d.state === "windup") {
        const pulse = 1 - d.timer / 0.28;
        ctx.strokeStyle = `rgba(255,107,74,${0.75 - pulse * 0.4})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, 22 + pulse * 18, 0, Math.PI * 2);
        ctx.stroke();
      }
      if (d.state === "stun") {
        ctx.fillStyle = "#ffce4f";
        ctx.font = "12px sans-serif";
        ctx.textAlign = "center";
        for (let s = 0; s < 3; s++) {
          ctx.fillText("✦", Math.cos(time * 4 + s * 2) * 16, -24 + Math.sin(time * 5 + s) * 4);
        }
      }
      const frozen = this.freeze > 0;
      ctx.fillStyle = frozen ? "#6f9bb0" : "#ff6b4a";
      ctx.strokeStyle = "#12100e";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, d.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#2a0f09";
      ctx.beginPath();
      ctx.arc(Math.cos(d.direction) * 8, Math.sin(d.direction) * 8, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fff5ec";
      ctx.font = "800 10px Manrope, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(d.state === "windup" ? "!" : "4", 0, 0);
      ctx.restore();
    }
  }

  private drawKeeper(ctx: CanvasRenderingContext2D): void {
    const k = this.keeper;
    ctx.save();
    ctx.translate(k.x, k.y);
    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.beginPath();
    ctx.ellipse(2, 10, 20, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    const reach = k.reaction > 0 ? -8 : 0;
    ctx.fillStyle = "#ffce4f";
    ctx.strokeStyle = "#181407";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(-21 - Math.abs(reach), -10, 42 + Math.abs(reach) * 2, 22, 9);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#181407";
    ctx.font = "800 10px Manrope, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("GK", 0, 1);
    ctx.fillStyle = "#ffce4f";
    ctx.beginPath();
    ctx.arc(-25, -5, 4, 0, Math.PI * 2);
    ctx.arc(25, -5, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  private drawBall(ctx: CanvasRenderingContext2D): void {
    const b = this.ball;
    if (this.celebrate > 0) return;
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.beginPath();
    ctx.ellipse(2, 6, 9, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#f7f6ee";
    ctx.strokeStyle = "rgba(10,12,9,0.75)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, b.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#20251c";
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(Math.cos(a) * 4.4, Math.sin(a) * 4.4, 1.7, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.beginPath();
    ctx.arc(0, 0, 2.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  private drawOrbs(ctx: CanvasRenderingContext2D): void {
    const time = performance.now() / 1000;
    for (const orb of this.orbs) {
      if (!orb.alive) continue;
      const bob = Math.sin(orb.phase) * 4;
      ctx.save();
      ctx.translate(orb.x, orb.y + bob);
      const color = orb.gold ? "#ffce4f" : this.config.signature.color;
      const glow = ctx.createRadialGradient(0, 0, 1, 0, 0, 30);
      glow.addColorStop(0, hexToRgba(color, 0.4));
      glow.addColorStop(1, hexToRgba(color, 0));
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(0, 0, 30, 0, Math.PI * 2);
      ctx.fill();
      ctx.rotate(time * 1.6 + orb.phase);
      ctx.fillStyle = color;
      ctx.strokeStyle = "#0c120c";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, -orb.r);
      ctx.lineTo(orb.r, 0);
      ctx.lineTo(0, orb.r);
      ctx.lineTo(-orb.r, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.rotate(-(time * 1.6 + orb.phase));
      ctx.fillStyle = "#0c120c";
      ctx.font = "800 12px Manrope, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("+", 0, 0);
      ctx.restore();
    }
  }

  private drawParticles(ctx: CanvasRenderingContext2D): void {
    for (const p of this.particles) {
      const alpha = Math.max(0, Math.min(1, p.life / p.maxLife));
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      if (p.shape === "ring") {
        ctx.strokeStyle = p.color;
        ctx.globalAlpha = alpha * 0.8;
        ctx.lineWidth = 2.5;
        const grow = 1 + (1 - alpha) * 1.2;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * grow, 0, Math.PI * 2);
        ctx.stroke();
      } else if (p.shape === "confetti") {
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      } else if (p.shape === "text") {
        ctx.font = `800 ${p.size}px Manrope, sans-serif`;
        ctx.textAlign = "center";
        ctx.fillText(p.char ?? "✦", p.x, p.y);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (0.4 + alpha * 0.6), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  private drawPopups(ctx: CanvasRenderingContext2D): void {
    for (const p of this.popups) {
      const alpha = Math.max(0, Math.min(1, p.life / p.maxLife));
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.font = `800 ${p.size}px Anton, 'Arial Narrow', sans-serif`;
      ctx.textAlign = "center";
      ctx.strokeStyle = "rgba(6,9,6,0.7)";
      ctx.lineWidth = 4;
      ctx.strokeText(p.text, p.x, p.y);
      ctx.fillText(p.text, p.x, p.y);
      ctx.restore();
    }
  }

  private drawOverlays(ctx: CanvasRenderingContext2D): void {
    const time = performance.now() / 1000;
    if (this.status === "countdown") {
      ctx.save();
      ctx.fillStyle = "rgba(5,8,5,0.42)";
      ctx.fillRect(0, 0, VW, VH);
      ctx.textAlign = "center";
      ctx.fillStyle = "#f3f1e6";
      ctx.font = "400 30px Anton, 'Arial Narrow', sans-serif";
      ctx.fillText("THE CAGE IS LIVE", CX, Math.max(190, VH * 0.36));
      ctx.fillStyle = "#d8ff3e";
      const scale = 1 + Math.abs(Math.sin(time * 4)) * 0.04;
      ctx.translate(CX, Math.max(280, VH * 0.5));
      ctx.scale(scale, scale);
      ctx.font = "400 110px Anton, 'Arial Narrow', sans-serif";
      ctx.fillText(this.countdown > 0.7 ? "READY" : "GO", 0, 30);
      ctx.fillStyle = "#9aa393";
      ctx.font = "700 13px Manrope, sans-serif";
      ctx.fillText("WASD / ARROWS TO MOVE  ·  SPACE TO SHOOT", 0, 64);
      ctx.restore();
    }
    if (this.celebrate > 0) {
      const progress = 1 - this.celebrate / 2.35;
      ctx.save();
      ctx.fillStyle = `rgba(5,8,5,${Math.min(0.54, progress * 1.4)})`;
      ctx.fillRect(0, 0, VW, VH);
      ctx.textAlign = "center";
      ctx.translate(CX, Math.max(240, VH * 0.42));
      const pop = Math.min(1, progress * 5);
      ctx.scale(0.8 + pop * 0.2, 0.8 + pop * 0.2);
      ctx.fillStyle = this.config.signature.color;
      ctx.font = "400 108px Anton, 'Arial Narrow', sans-serif";
      ctx.fillText("GOAL!", 0, 0);
      ctx.fillStyle = "#f3f1e6";
      ctx.font = "800 18px Manrope, sans-serif";
      ctx.fillText(`${this.config.signature.celebrationName.toUpperCase()}`, 0, 38);
      ctx.fillStyle = "#9aa393";
      ctx.font = "700 12px Manrope, sans-serif";
      ctx.fillText(`GOAL ${this.goals} / ${this.config.division.target}`, 0, 64);
      ctx.restore();
    }
  }

  destroy(): void {
    this.destroyed = true;
    cancelAnimationFrame(this.raf);
    this.observer?.disconnect();
    this.observer = null;
  }
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace("#", "");
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `rgba(${r || 216}, ${g || 255}, ${b || 62}, ${alpha})`;
}
