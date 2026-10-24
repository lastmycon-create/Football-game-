import {
  CELEBRATIONS,
  DIVISIONS,
  TEAMMATES,
  activeTeammate,
  celebrationFor,
  divisionUnlocked,
  effectFor,
  formatNumber,
  levelForXp,
  nextFixture,
  overallFor,
  xpProgress,
  type Division,
  type Profile,
  type ScoreEntry,
} from "../lib/data";
import { Icon } from "./Icons";

interface HomeProps {
  profile: Profile;
  scores: ScoreEntry[];
  onPlay: (division?: Division) => void;
  onOpenStudio: () => void;
  onOpenSquad: () => void;
  onOpenTournaments: () => void;
}

export function Home({ profile, scores, onPlay, onOpenStudio, onOpenSquad, onOpenTournaments }: HomeProps) {
  const fixture = nextFixture(profile);
  const mate = activeTeammate(profile);
  const signature = profile.signature;
  const effect = effectFor(signature.effect);
  const celebration = celebrationFor(signature.celebration);
  const overall = overallFor(profile);
  const xp = xpProgress(profile.xp);
  const level = levelForXp(profile.xp);
  const owned = TEAMMATES.filter((t) => profile.teammates.includes(t.id));
  const userRank = scores.findIndex((s) => s.name === profile.name && !s.ghost) + 1;

  return (
    <main id="top" className="relative overflow-hidden">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-white/8 pb-10 pt-[88px] sm:pt-[108px]">
        <div className="pointer-events-none absolute inset-0">
          <div className="pitch-grid absolute inset-0 opacity-60 [mask-image:radial-gradient(80%_70%_at_50%_30%,black,transparent)]" />
          <div className="absolute -right-20 -top-24 size-[560px] rounded-full bg-volt/[0.08] blur-[120px]" />
          <div className="absolute -left-40 top-60 size-[420px] rounded-full bg-[#2f5d3a]/20 blur-[110px]" />
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-ink to-transparent" />
          <p
            aria-hidden="true"
            className="stroke-text absolute -right-8 top-[18%] hidden select-none whitespace-nowrap font-display text-[170px] leading-none opacity-60 xl:block"
          >
            BALLER
          </p>
        </div>

        <div className="relative mx-auto grid max-w-[1440px] items-center gap-10 px-4 sm:px-6 lg:grid-cols-[1.08fr_0.92fr] lg:gap-6 xl:px-10">
          <div className="animate-rise max-w-[700px]">
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1.5 rounded-full border border-volt/30 bg-volt/[0.08] px-2.5 py-1.5 text-[9px] font-extrabold uppercase tracking-[0.18em] text-volt">
                <span className="size-1.5 animate-pulse rounded-full bg-volt" /> Season 01 · The come-up
              </span>
              <span className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-[0.14em] text-muted">
                Local career mode
              </span>
            </div>

            <h1 className="mt-3 font-display text-[clamp(3.4rem,8.5vw,7.2rem)] leading-[0.84] tracking-[0.01em]">
              <span className="block">From the</span>
              <span className="relative block text-volt">
                Block
                <span className="absolute -right-2 top-2 hidden font-sans text-[10px] font-extrabold uppercase leading-tight tracking-[0.2em] text-volt/60 sm:block lg:-right-10">
                  No
                  <br />
                  shortcuts
                </span>
              </span>
              <span className="block">to the world.</span>
            </h1>

            <p className="mt-4 max-w-[45ch] text-[13px] leading-relaxed text-muted sm:text-sm">
              No academy. No agent. Just one ball, a concrete cage and a name nobody knows yet. Invent a signature move,
              stack your crew and take the world stage by storm.
            </p>

            <div className="mt-5 flex flex-col gap-2.5 sm:flex-row sm:items-center">
              <button
                onClick={() => onPlay()}
                className="group relative flex items-center justify-between gap-4 overflow-hidden rounded-xl bg-volt px-4 py-3 text-ink transition hover:bg-volt-dim active:scale-[0.99] sm:min-w-[268px]"
              >
                <span className="relative text-left">
                  <span className="block font-display text-[22px] leading-none tracking-wide">Play next match</span>
                  <span className="mt-1 block text-[9px] font-extrabold uppercase tracking-[0.13em] text-ink/60">
                    vs {fixture.rival} · {fixture.target} goals · {fixture.duration}s
                  </span>
                </span>
                <span className="relative grid size-9 shrink-0 place-items-center rounded-full bg-ink text-volt transition group-hover:rotate-[-12deg]">
                  <Icon name="arrow" size={17} />
                </span>
              </button>
              <button
                onClick={onOpenStudio}
                className="group flex items-center justify-between gap-3 rounded-xl border border-line bg-white/[0.035] px-4 py-3 text-cream transition hover:border-volt/40 hover:bg-white/[0.06] sm:min-w-[206px]"
              >
                <span className="text-left">
                  <span className="flex items-center gap-1.5 font-display text-[17px] leading-none tracking-wide">
                    <Icon name="spark" size={14} className="text-volt" /> Signature studio
                  </span>
                  <span className="mt-1 block text-[9px] font-bold uppercase tracking-[0.13em] text-muted">
                    Make the move yours
                  </span>
                </span>
                <Icon name="arrow-up-right" size={17} className="shrink-0 text-muted transition group-hover:text-volt" />
              </button>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[9px] font-bold uppercase tracking-[0.1em] text-muted/80">
              <span className="flex items-center gap-1.5">
                <Icon name="keyboard" size={13} className="text-volt/70" /> WASD + space
              </span>
              <span className="flex items-center gap-1.5">
                <Icon name="hand" size={13} className="text-volt/70" /> Touch ready
              </span>
              <span className="flex items-center gap-1.5">
                <Icon name="bolt" size={13} className="text-volt/70" /> Instant restart
              </span>
            </div>

            <div className="mt-6 grid max-w-[540px] grid-cols-3 divide-x divide-line border-y border-line/80 py-3">
              <div className="pr-3">
                <p className="text-[8px] font-extrabold uppercase tracking-[0.2em] text-muted">Overall</p>
                <p className="font-display text-[28px] leading-none text-cream">
                  {overall}
                  <span className="ml-1 text-[10px] text-volt">↑</span>
                </p>
              </div>
              <div className="px-3">
                <p className="text-[8px] font-extrabold uppercase tracking-[0.2em] text-muted">Level {level}</p>
                <p className="font-display text-[28px] leading-none text-cream">
                  {xp.current}
                  <span className="text-[11px] text-muted">/{xp.needed} XP</span>
                </p>
              </div>
              <div className="pl-3">
                <p className="text-[8px] font-extrabold uppercase tracking-[0.2em] text-muted">Trophies</p>
                <p className="font-display text-[28px] leading-none text-cream">
                  {profile.trophies.length}
                  <span className="text-[11px] text-muted">/{DIVISIONS.length}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Player card */}
          <div className="animate-rise relative mx-auto w-full max-w-[382px] lg:justify-self-end" style={{ animationDelay: "120ms" }}>
            <div className="absolute inset-x-3 bottom-0 top-4 rotate-3 rounded-[28px] border border-volt/25 bg-volt/[0.055]" />
            <div className="absolute inset-x-6 bottom-3 top-8 rotate-[-2deg] rounded-[28px] border border-white/10 bg-white/[0.02]" />
            <div className="stack-shadow relative overflow-hidden rounded-[26px] border border-white/15 bg-ink-3">
              <div className="relative aspect-[4/4.72] overflow-hidden">
                <img
                  src="/images/hero-player.jpg"
                  alt="Street footballer standing over a ball in a dark cage"
                  className="absolute inset-0 size-full scale-[1.03] object-cover object-[50%_16%]"
                  loading="eager"
                  decoding="async"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#080b08] via-[#080b08]/20 to-[#080b08]/45" />
                <div className="grain absolute inset-0" />
                <div className="absolute inset-x-0 top-0 flex items-start justify-between p-3.5">
                  <div>
                    <span className="rounded-full border border-volt/40 bg-black/45 px-2 py-1 text-[8px] font-extrabold uppercase tracking-[0.16em] text-volt backdrop-blur">
                      Unknown talent
                    </span>
                    <p className="mt-1.5 text-[8px] font-bold uppercase tracking-[0.18em] text-cream/60">
                      {fixture.short} · #{10}
                    </p>
                  </div>
                  <div className="rounded-xl border border-white/20 bg-black/55 px-2.5 py-1.5 text-center backdrop-blur">
                    <p className="text-[7px] font-extrabold uppercase tracking-[0.16em] text-muted">OVR</p>
                    <p className="font-display text-[26px] leading-none text-volt">{overall}</p>
                  </div>
                </div>
                <span
                  aria-hidden="true"
                  className="absolute right-3 top-[31%] font-display text-[92px] leading-none text-white/[0.07]"
                >
                  10
                </span>
                <div className="absolute inset-x-0 bottom-0 p-4 pt-14">
                  <div className="flex items-end justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[8px] font-extrabold uppercase tracking-[0.22em] text-muted">Owner of the block</p>
                      <h2 className="truncate font-display text-[34px] uppercase leading-none tracking-wide text-cream">
                        {profile.name || "YOU"}
                      </h2>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-[7px] font-extrabold uppercase tracking-[0.14em] text-muted">Rep</p>
                      <p className="font-display text-base text-gold">{profile.bestScore ? formatNumber(profile.bestScore) : "—"}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2 rounded-lg border border-white/12 bg-black/35 p-2 backdrop-blur-sm">
                    <span
                      className="grid size-8 shrink-0 place-items-center rounded-md border text-sm"
                      style={{ borderColor: `${signature.color}66`, background: `${signature.color}18` }}
                    >
                      {effect.icon}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[7px] font-extrabold uppercase tracking-[0.18em] text-muted">Signature move</p>
                      <p className="truncate font-display text-[13px] uppercase leading-tight" style={{ color: signature.color }}>
                        {signature.name}
                      </p>
                    </div>
                    <span className="shrink-0 text-base">{celebration.emoji}</span>
                  </div>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    {[
                      ["PAC", Math.min(99, 68 + level * 3)],
                      ["DRI", Math.min(99, 72 + Math.floor(profile.bestCombo / 2))],
                      ["SHO", Math.min(99, 66 + profile.goals * 2)],
                    ].map(([label, value]) => (
                      <div key={label} className="min-w-0">
                        <div className="flex w-full items-center justify-between gap-1 text-[7px] font-extrabold uppercase leading-none tracking-[0.06em] text-muted">
                          <span className="shrink-0">{label}</span>
                          <span className="shrink-0 text-cream">{value}</span>
                        </div>
                        <div className="mt-1 h-[3px] overflow-hidden rounded-full bg-white/15">
                          <div className="h-full rounded-full bg-volt" style={{ width: `${value}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between border-t border-white/10 bg-[#0a0e0a] px-3.5 py-2.5">
                <span className="flex items-center gap-1.5 text-[8px] font-extrabold uppercase tracking-[0.16em] text-muted">
                  <Icon name="shield" size={12} className="text-volt" /> {mate ? mate.name : "Lone wolf"}
                </span>
                <span className="text-[8px] font-extrabold uppercase tracking-[0.14em] text-volt/80">
                  {mate ? mate.boostLabel : "Build your crew"}
                </span>
              </div>
            </div>

            <div
              className="animate-float absolute -left-5 top-[22%] hidden w-[174px] rounded-xl border border-volt/30 bg-[#0a100b]/95 p-2.5 shadow-2xl backdrop-blur-md sm:block"
              style={{ "--float-rotate": "-3deg" } as React.CSSProperties}
            >
              <div className="flex items-center justify-between">
                <span className="text-[7px] font-extrabold uppercase tracking-[0.16em] text-volt">Signature</span>
                <span className="text-[7px] font-bold uppercase text-muted">Ready</span>
              </div>
              <p className="mt-0.5 truncate font-display text-[13px] uppercase" style={{ color: signature.color }}>
                {signature.name}
              </p>
              <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/10">
                <div className="h-full w-full rounded-full" style={{ background: signature.color }} />
              </div>
            </div>

            <div
              className="animate-float absolute -right-3 bottom-[21%] hidden items-center gap-2 rounded-xl border border-white/15 bg-[#0b0f0b]/95 p-2 pr-3 shadow-2xl backdrop-blur-md sm:flex"
              style={{ "--float-rotate": "2deg", animationDelay: "1.2s" } as React.CSSProperties}
            >
              <span className="grid size-8 place-items-center rounded-md bg-white/[0.06] text-lg">{celebration.emoji}</span>
              <span>
                <span className="block text-[7px] font-extrabold uppercase tracking-[0.14em] text-muted">Celebration</span>
                <span className="block max-w-[116px] truncate font-display text-[12px] uppercase">{signature.celebrationName}</span>
              </span>
            </div>

            <div className="absolute -bottom-4 left-4 hidden items-center gap-2 rounded-full border border-white/15 bg-[#0b0f0b]/95 py-1.5 pl-2 pr-3 shadow-xl backdrop-blur sm:flex">
              <span className="grid size-6 place-items-center rounded-full bg-coral/20 text-[10px] text-coral">+</span>
              <span className="text-[8px] font-extrabold uppercase tracking-[0.12em] text-cream">
                Goal <span className="text-volt">1,250</span> · Flair ×4
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Ticker */}
      <div className="relative overflow-hidden border-b border-black/20 bg-volt py-2 text-ink">
        <div className="animate-marquee flex w-max items-center">
          {[0, 1].map((copy) => (
            <div key={copy} className="flex shrink-0 items-center" aria-hidden={copy === 1}>
              {[
                "Create your signature",
                "Recruit the crew",
                "Own the world stage",
                "No academy required",
                "One ball · one name",
                "Built for the block",
              ].map((text) => (
                <span key={text} className="flex items-center whitespace-nowrap font-display text-[13px] uppercase tracking-[0.08em]">
                  <span className="px-4">{text}</span>
                  <Icon name="bolt" size={11} className="opacity-60" />
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 xl:px-10">
        {/* Career */}
        <section id="career" className="scroll-mt-24 py-12 sm:py-16">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="flex items-center gap-1.5 text-[9px] font-extrabold uppercase tracking-[0.24em] text-volt">
                <span className="size-1.5 rounded-full bg-volt" /> The road to the world stage
              </p>
              <h2 className="mt-1.5 font-display text-[clamp(2.2rem,5vw,4rem)] leading-[0.9]">
                Four cages. <span className="text-muted">One name.</span>
              </h2>
            </div>
            <div className="w-full max-w-[260px]">
              <div className="flex items-center justify-between text-[9px] font-extrabold uppercase tracking-[0.14em]">
                <span className="text-muted">Level {level}</span>
                <span className="text-volt">{xp.needed - xp.current} XP to next</span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-volt transition-all" style={{ width: `${xp.pct}%` }} />
              </div>
              <p className="mt-1 text-[8px] uppercase tracking-[0.14em] text-muted/70">
                {profile.matches} matches · {profile.goals} career goals
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
            {DIVISIONS.map((division, i) => {
              const unlocked = divisionUnlocked(division, profile);
              const won = profile.trophies.includes(division.id);
              const current = fixture.id === division.id;
              return (
                <article
                  key={division.id}
                  className={`group relative overflow-hidden rounded-2xl border p-4 transition ${
                    current
                      ? "border-volt/50 bg-[#121a11]"
                      : unlocked
                        ? "border-line bg-[#0d120d] hover:border-white/25"
                        : "border-line/60 bg-black/20"
                  }`}
                >
                  <div className="pointer-events-none absolute -right-10 -top-10 size-28 rounded-full opacity-0 blur-2xl transition group-hover:opacity-30" style={{ background: division.accent }} />
                  <div className="flex items-center justify-between">
                    <span
                      className="font-display text-[11px] uppercase tracking-[0.12em]"
                      style={{ color: unlocked ? division.accent : "#5d6659" }}
                    >
                      0{i + 1} / {division.short}
                    </span>
                    {won ? (
                      <Icon name="trophy" size={16} className="text-volt" />
                    ) : unlocked ? (
                      <span className="size-1.5 rounded-full bg-volt" />
                    ) : (
                      <Icon name="lock" size={13} className="text-muted/60" />
                    )}
                  </div>
                  <h3 className={`mt-2 font-display text-[23px] leading-none ${unlocked ? "text-cream" : "text-muted"}`}>
                    {division.name}
                  </h3>
                  <p className="mt-1 truncate text-[9px] uppercase tracking-[0.08em] text-muted">{division.location}</p>
                  <div className="mt-3 grid grid-cols-3 gap-1 border-y border-white/8 py-2">
                    {[
                      ["Goals", division.target],
                      ["Time", `${division.duration}s`],
                      ["Rivals", division.defenders + 1],
                    ].map(([label, value]) => (
                      <div key={label}>
                        <p className="text-[7px] font-extrabold uppercase tracking-[0.12em] text-muted/70">{label}</p>
                        <p className="font-display text-[15px] leading-tight">{value}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2.5 flex min-h-[30px] items-center justify-between gap-2">
                    {!unlocked ? (
                      <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-muted/60">Unlocks level {division.unlockLevel}</p>
                    ) : won ? (
                      <p className="flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-[0.1em] text-volt">
                        <Icon name="check" size={11} strokeWidth={2.6} /> {division.trophy}
                      </p>
                    ) : (
                      <p className="text-[9px] font-extrabold uppercase tracking-[0.1em] text-cream/80">{division.rival}</p>
                    )}
                    {unlocked && (
                      <button
                        onClick={() => onPlay(division)}
                        className={`grid size-8 shrink-0 place-items-center rounded-full transition ${
                          current ? "bg-volt text-ink hover:bg-volt-dim" : "border border-line text-cream hover:border-volt/50 hover:text-volt"
                        }`}
                        aria-label={`Play ${division.name}`}
                      >
                        <Icon name="play" size={12} />
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
          <div className="mt-3 flex justify-end">
            <button
              onClick={onOpenTournaments}
              className="group flex items-center gap-1.5 text-[9px] font-extrabold uppercase tracking-[0.16em] text-muted transition hover:text-volt"
            >
              All fixtures & trophies <Icon name="arrow-up-right" size={12} />
            </button>
          </div>
        </section>

        <div className="h-px bg-line/70" />

        {/* Build your legend */}
        <section className="py-12 sm:py-16">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="flex items-center gap-1.5 text-[9px] font-extrabold uppercase tracking-[0.24em] text-volt">
                <span className="size-1.5 rounded-full bg-volt" /> Build your legend
              </p>
              <h2 className="mt-1.5 font-display text-[clamp(2.2rem,5vw,4rem)] leading-[0.9]">
                More than <span className="text-muted">a game.</span>
              </h2>
            </div>
            <p className="max-w-[36ch] text-[11px] leading-relaxed text-muted">
              Your style, your crew, your climb. Everything you create is saved to this device and shows up the moment you
              step on the pitch.
            </p>
          </div>

          <div className="mt-6 grid gap-3 lg:grid-cols-12">
            {/* Studio */}
            <article className="relative overflow-hidden rounded-3xl border border-line bg-[#0c120c] p-5 sm:p-6 lg:col-span-7">
              <div className="pitch-grid absolute inset-0 opacity-50" />
              <div
                className="pointer-events-none absolute -right-24 -top-24 size-80 rounded-full opacity-25 blur-3xl"
                style={{ background: signature.color }}
              />
              <div className="relative flex h-full flex-col justify-between gap-6 sm:flex-row">
                <div className="max-w-[300px]">
                  <span className="flex w-fit items-center gap-1.5 rounded-full border border-volt/30 bg-volt/[0.08] px-2 py-1 text-[8px] font-extrabold uppercase tracking-[0.18em] text-volt">
                    <Icon name="spark" size={10} /> Signature studio
                  </span>
                  <h3 className="mt-3 font-display text-[clamp(1.9rem,3.4vw,2.7rem)] leading-[0.9]">
                    Invent the move they name their kids after.
                  </h3>
                  <p className="mt-2 text-[11px] leading-relaxed text-muted">
                    Pick a power, paint your aura, then design the celebration. It all plays out in-match, with your name
                    over the replay.
                  </p>
                  <button
                    onClick={onOpenStudio}
                    className="group mt-4 flex items-center gap-2 rounded-full bg-cream py-2 pl-4 pr-2 font-display text-sm tracking-wide text-ink transition hover:bg-volt"
                  >
                    Open the studio
                    <span className="grid size-6 place-items-center rounded-full bg-ink text-volt">
                      <Icon name="arrow" size={13} />
                    </span>
                  </button>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {["4 powers", "7 celebrations", "∞ custom names"].map((tag) => (
                      <span key={tag} className="rounded-full border border-line bg-black/20 px-2 py-1 text-[8px] font-bold uppercase tracking-[0.1em] text-muted">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex w-full max-w-[215px] shrink-0 items-center justify-center sm:w-auto">
                  <div
                    className="relative w-full -rotate-2 overflow-hidden rounded-2xl border bg-[#080e09]/90 p-3 shadow-2xl"
                    style={{ borderColor: `${signature.color}66` }}
                  >
                    <div className="flex items-start justify-between">
                      <span className="text-[7px] font-extrabold uppercase tracking-[0.18em] text-muted">One of one</span>
                      <span className="text-lg">{celebration.emoji}</span>
                    </div>
                    <p className="mt-5 font-display text-[24px] leading-[0.9] tracking-wide" style={{ color: signature.color }}>
                      {signature.name}
                    </p>
                    <p className="mt-1 text-[8px] font-bold uppercase tracking-[0.12em] text-cream/60">
                      {effect.name} · {signature.celebrationName}
                    </p>
                    <div className="relative mt-3 grid h-[96px] place-items-center rounded-lg border border-white/10 bg-[#0c1a0f]">
                      <div className="absolute inset-x-4 bottom-2 top-2 rounded border border-white/8" />
                      <span
                        className="relative z-10 grid size-11 place-items-center rounded-full border-[3px] border-[#080e09] font-display text-base text-ink"
                        style={{ background: signature.color, boxShadow: `0 0 24px ${signature.color}66` }}
                      >
                        10
                      </span>
                      <span className="absolute right-[26%] top-[38%] size-2.5 rounded-full border border-ink bg-cream" />
                      <span className="absolute right-[16%] top-[24%] text-xl">{effect.icon}</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[7px] font-extrabold uppercase tracking-[0.1em] text-muted">
                      <span>{effect.tag}</span>
                      <span className="text-volt">Ready in match</span>
                    </div>
                  </div>
                </div>
              </div>
            </article>

            {/* Next fixture */}
            <article className="relative overflow-hidden rounded-3xl border border-line bg-[#0b120c] p-5 sm:p-6 lg:col-span-5">
              <div className="pitch-grid absolute inset-0 opacity-30" />
              <div
                className="pointer-events-none absolute -left-20 -bottom-24 size-72 rounded-full opacity-15 blur-3xl"
                style={{ background: fixture.accent }}
              />
              <div className="relative flex h-full flex-col">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-extrabold uppercase tracking-[0.22em] text-muted">Next fixture</span>
                  <span className="flex items-center gap-1 rounded-full border border-volt/30 bg-volt/10 px-2 py-0.5 text-[8px] font-extrabold uppercase tracking-[0.12em] text-volt">
                    <span className="size-1 animate-pulse rounded-full bg-volt" /> Ready
                  </span>
                </div>
                <div className="mt-4 flex items-center justify-between gap-2">
                  <div className="text-center">
                    <span className="mx-auto grid size-11 place-items-center rounded-full border-2 border-volt bg-volt/10 font-display text-base text-volt">
                      10
                    </span>
                    <p className="mt-1 max-w-[70px] truncate text-[8px] font-extrabold uppercase tracking-[0.08em] text-cream">
                      {profile.name || "YOU"}
                    </p>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="font-display text-[11px] text-muted">VS</span>
                    <span className="mt-0.5 rounded-full border border-line px-2 py-0.5 text-[7px] font-extrabold uppercase tracking-[0.14em] text-muted">
                      {divisionUnlocked(fixture, profile) ? fixture.short : "LOCKED"}
                    </span>
                  </div>
                  <div className="text-center">
                    <span className="mx-auto grid size-11 place-items-center rounded-full border-2 border-coral/60 bg-coral/10 text-coral">
                      <Icon name="shield" size={19} />
                    </span>
                    <p className="mt-1 max-w-[74px] truncate text-[8px] font-extrabold uppercase tracking-[0.08em] text-cream">
                      {fixture.rival}
                    </p>
                  </div>
                </div>
                <h3 className="mt-4 font-display text-[27px] leading-none">{fixture.name}</h3>
                <p className="mt-1 text-[9px] uppercase tracking-[0.1em] text-muted">{fixture.location}</p>
                <div className="mt-3 grid grid-cols-3 gap-1.5">
                  {[
                    ["Target", `${fixture.target} goals`, "target"],
                    ["Clock", `${fixture.duration} sec`, "clock"],
                    ["Reward", `${fixture.reward} cr`, "coin"],
                  ].map(([label, value, icon]) => (
                    <div key={label} className="rounded-lg border border-white/8 bg-black/25 px-2 py-1.5">
                      <p className="flex items-center gap-1 text-[7px] font-extrabold uppercase tracking-[0.1em] text-muted">
                        <Icon name={icon as "target" | "clock" | "coin"} size={9} /> {label}
                      </p>
                      <p className="mt-0.5 font-display text-[13px]">{value}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-auto pt-4">
                  <button
                    onClick={() => onPlay(fixture)}
                    className="group flex w-full items-center justify-between rounded-xl bg-volt px-3.5 py-2.5 text-ink transition hover:bg-volt-dim"
                  >
                    <span className="text-left">
                      <span className="block font-display text-lg leading-none tracking-wide">Enter the cage</span>
                      <span className="text-[8px] font-extrabold uppercase tracking-[0.12em] text-ink/55">Beat {fixture.rival}</span>
                    </span>
                    <span className="grid size-7 place-items-center rounded-full bg-ink text-volt transition group-hover:translate-x-0.5">
                      <Icon name="arrow" size={14} />
                    </span>
                  </button>
                </div>
              </div>
            </article>

            {/* Squad */}
            <article className="relative overflow-hidden rounded-3xl border border-line bg-[#0d120d] p-5 sm:p-6 lg:col-span-5">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-extrabold uppercase tracking-[0.22em] text-muted">The crew</span>
                <span className="text-[9px] font-extrabold uppercase tracking-[0.12em] text-volt">
                  {owned.length}/{TEAMMATES.length} signed
                </span>
              </div>
              <h3 className="mt-2 font-display text-[27px] leading-none">Nobody makes it alone.</h3>
              <div className="mt-4 flex items-center gap-2">
                {TEAMMATES.slice(0, 5).map((t, i) => {
                  const isOwned = profile.teammates.includes(t.id);
                  return (
                    <div
                      key={t.id}
                      className={`relative grid size-10 shrink-0 place-items-center rounded-full border-2 font-display text-[12px] transition sm:size-11 ${
                        isOwned ? "" : "opacity-45 grayscale"
                      }`}
                      style={{
                        background: isOwned ? `${t.color}20` : "#161b15",
                        borderColor: profile.activeTeammate === t.id ? "#d8ff3e" : "#2a3027",
                        color: isOwned ? t.color : "#899282",
                        marginLeft: i === 0 ? 0 : -6,
                      }}
                      title={`${t.name} · ${t.boostLabel}`}
                    >
                      {isOwned ? t.initials : <Icon name="lock" size={12} />}
                    </div>
                  );
                })}
                <span className="ml-1 text-[9px] font-extrabold uppercase tracking-[0.1em] text-muted">+{Math.max(0, TEAMMATES.length - 5)} more</span>
              </div>
              <div className="mt-4 rounded-xl border border-white/10 bg-black/25 p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[8px] font-extrabold uppercase tracking-[0.16em] text-muted">Active boost</span>
                    <span className="rounded-full bg-volt/15 px-1.5 py-0.5 text-[8px] font-extrabold uppercase tracking-[0.08em] text-volt">
                      {mate ? mate.boostLabel : "None"}
                    </span>
                  </div>
                  <span className="text-[9px] font-bold text-cream">{mate?.name ?? "Recruit a teammate"}</span>
                </div>
                <p className="mt-1.5 text-[10px] leading-relaxed text-muted">
                  {mate?.boostDesc ?? "Sign your first baller to unlock a permanent match boost."}
                </p>
              </div>
              <div className="mt-3 flex items-center justify-between gap-3">
                <button
                  onClick={onOpenSquad}
                  className="group flex items-center gap-2 rounded-full border border-line bg-white/[0.03] py-2 pl-3.5 pr-2 text-[10px] font-extrabold uppercase tracking-[0.12em] text-cream transition hover:border-volt/40"
                >
                  Manage squad
                  <span className="grid size-6 place-items-center rounded-full bg-white/8 text-volt transition group-hover:bg-volt group-hover:text-ink">
                    <Icon name="arrow" size={12} />
                  </span>
                </button>
                <span className="flex items-center gap-1 text-[9px] font-bold text-muted">
                  <Icon name="coin" size={11} className="text-gold" /> {formatNumber(profile.coins)} available
                </span>
              </div>
            </article>

            {/* Leaderboard */}
            <article
              id="leaderboard"
              className="relative scroll-mt-24 overflow-hidden rounded-3xl border border-line bg-[#0d120d] p-5 sm:p-6 lg:col-span-7"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <span className="text-[9px] font-extrabold uppercase tracking-[0.22em] text-muted">Local leaderboard</span>
                  <h3 className="mt-1 font-display text-[27px] leading-none">The kings of this block.</h3>
                </div>
                <div className="flex items-center gap-2">
                  <div className="rounded-lg border border-line bg-black/20 px-2.5 py-1 text-right">
                    <p className="text-[7px] font-extrabold uppercase tracking-[0.12em] text-muted">Your best</p>
                    <p className="font-display text-base leading-tight text-volt">{profile.bestScore ? formatNumber(profile.bestScore) : "—"}</p>
                  </div>
                  <div className="rounded-lg border border-line bg-black/20 px-2.5 py-1 text-right">
                    <p className="text-[7px] font-extrabold uppercase tracking-[0.12em] text-muted">Your rank</p>
                    <p className="font-display text-base leading-tight">{userRank ? `#${userRank}` : "—"}</p>
                  </div>
                </div>
              </div>
              <div className="mt-3 overflow-hidden rounded-xl border border-line/80">
                <div className="grid grid-cols-[28px_1fr_auto] items-center gap-2 border-b border-line/80 bg-white/[0.03] px-3 py-1.5 text-[7px] font-extrabold uppercase tracking-[0.16em] text-muted sm:grid-cols-[28px_1fr_1fr_auto]">
                  <span>#</span>
                  <span>Baller</span>
                  <span className="hidden sm:block">Stage</span>
                  <span className="text-right">Score</span>
                </div>
                {scores.slice(0, 5).map((entry, i) => {
                  const isYou = entry.name === profile.name && !entry.ghost;
                  return (
                    <div
                      key={entry.id}
                      className={`grid grid-cols-[28px_1fr_auto] items-center gap-2 border-b border-white/5 px-3 py-2 text-[11px] last:border-b-0 sm:grid-cols-[28px_1fr_1fr_auto] ${
                        isYou ? "bg-volt/[0.07]" : ""
                      }`}
                    >
                      <span className={`font-display text-[13px] ${i === 0 ? "text-gold" : i < 3 ? "text-cream" : "text-muted"}`}>{i + 1}</span>
                      <span className="flex min-w-0 items-center gap-1.5">
                        <span
                          className={`grid size-5 shrink-0 place-items-center rounded-full text-[7px] font-extrabold ${
                            isYou ? "bg-volt text-ink" : "bg-white/10 text-cream/70"
                          }`}
                        >
                          {entry.name.slice(0, 2)}
                        </span>
                        <span className="truncate font-extrabold uppercase tracking-[0.06em] text-cream">{entry.name}</span>
                        {entry.ghost && <span className="shrink-0 rounded bg-white/8 px-1 text-[6px] font-bold uppercase tracking-wide text-muted">Rival</span>}
                        {isYou && <span className="shrink-0 rounded bg-volt/20 px-1 text-[6px] font-bold uppercase tracking-wide text-volt">You</span>}
                      </span>
                      <span className="hidden truncate text-[9px] uppercase tracking-[0.06em] text-muted sm:block">{entry.divisionName}</span>
                      <span className="text-right font-display text-[14px]">{formatNumber(entry.score)}</span>
                    </div>
                  );
                })}
              </div>
              <p className="mt-2 flex items-center justify-between gap-2 text-[8px] uppercase tracking-[0.12em] text-muted/60">
                <span>Saved locally on this device</span>
                <span>{profile.bestScore > 0 ? `${profile.matches} runs played` : "Your first run is waiting"}</span>
              </p>
            </article>
          </div>
        </section>

        {/* Final CTA */}
        <section className="relative overflow-hidden rounded-3xl bg-volt px-5 py-8 text-ink sm:px-8 sm:py-10">
          <div className="pointer-events-none absolute inset-0">
            <div className="dot-grid absolute inset-0 opacity-40" />
            <span aria-hidden="true" className="absolute -bottom-20 -right-6 font-display text-[240px] leading-none text-ink/8 md:-right-2 md:text-[300px]">
              10
            </span>
          </div>
          <div className="relative flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <p className="text-[9px] font-extrabold uppercase tracking-[0.24em] text-ink/55">The cage is open</p>
              <h2 className="mt-1.5 max-w-[18ch] font-display text-[clamp(2.4rem,6vw,4.6rem)] leading-[0.86]">
                The block is waiting for your name.
              </h2>
              <p className="mt-2 max-w-[42ch] text-[11px] font-semibold leading-relaxed text-ink/65">
                {profile.matches === 0
                  ? "Your first fixture takes 60 seconds. Score four and the whole street knows."
                  : `${profile.goals} goals so far. ${profile.trophies.length ? "The climb continues." : "The first trophy is still out there."}`}
              </p>
            </div>
            <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:flex-row">
              <button
                onClick={() => onPlay()}
                className="group flex items-center justify-between gap-4 rounded-xl bg-ink px-5 py-3.5 font-display text-xl tracking-wide text-volt transition hover:bg-[#11160f] active:scale-[0.99] sm:min-w-[210px]"
              >
                Play now
                <span className="grid size-7 place-items-center rounded-full bg-volt text-ink transition group-hover:rotate-[-12deg]">
                  <Icon name="arrow" size={14} />
                </span>
              </button>
              <button
                onClick={onOpenStudio}
                className="rounded-xl border border-ink/25 px-4 py-3.5 text-[10px] font-extrabold uppercase tracking-[0.14em] text-ink transition hover:bg-ink/10"
              >
                Create signature
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="relative mt-10 overflow-hidden border-t border-line bg-[#080b08]">
        <div className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 sm:py-10 xl:px-10">
          <div className="flex flex-col justify-between gap-8 md:flex-row">
            <div className="max-w-[300px]">
              <span className="flex items-center gap-2">
                <span className="grid size-8 place-items-center rounded-lg bg-volt text-ink">
                  <Icon name="bolt" size={18} />
                </span>
                <span className="font-display text-xl tracking-[0.06em]">STREETKINGS</span>
              </span>
              <p className="mt-3 text-[11px] leading-relaxed text-muted">
                A browser football career for the ones without a stadium. Invent a move. Sign your crew. Take the world
                stage.
              </p>
              <div className="mt-3 flex gap-1.5">
                {CELEBRATIONS.slice(0, 5).map((item) => (
                  <span key={item.id} className="grid size-6 place-items-center rounded-md border border-line bg-white/[0.03] text-[11px]">
                    {item.emoji}
                  </span>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
              <div>
                <p className="text-[9px] font-extrabold uppercase tracking-[0.18em] text-volt">The game</p>
                <div className="mt-2.5 flex flex-col items-start gap-1.5 text-[11px] text-muted">
                  <button onClick={() => onPlay()} className="transition hover:text-cream">Quick match</button>
                  <button onClick={onOpenTournaments} className="transition hover:text-cream">Tournaments</button>
                  <a href="#leaderboard" className="transition hover:text-cream">Leaderboard</a>
                </div>
              </div>
              <div>
                <p className="text-[9px] font-extrabold uppercase tracking-[0.18em] text-volt">Your club</p>
                <div className="mt-2.5 flex flex-col items-start gap-1.5 text-[11px] text-muted">
                  <button onClick={onOpenStudio} className="transition hover:text-cream">Signature studio</button>
                  <button onClick={onOpenSquad} className="transition hover:text-cream">Squad</button>
                  <a href="#career" className="transition hover:text-cream">Career path</a>
                </div>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <p className="text-[9px] font-extrabold uppercase tracking-[0.18em] text-volt">The fine print</p>
                <p className="mt-2.5 text-[10px] leading-relaxed text-muted">
                  Runs at 60fps on modern browsers. Career and high scores are saved locally. No account, no downloads.
                </p>
              </div>
            </div>
          </div>
          <div className="mt-8 flex flex-col items-start justify-between gap-2 border-t border-line/60 pt-4 text-[8px] font-bold uppercase tracking-[0.14em] text-muted/50 sm:flex-row sm:items-center">
            <p>© {new Date().getFullYear()} STREETKINGS · built for the block</p>
            <p>Keyboard + touch · Sound designed in browser</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
