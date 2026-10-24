import { useEffect, useState } from "react";
import { formatNumber, levelForXp, type Profile } from "../lib/data";
import { Icon, Logo } from "./Icons";

interface NavProps {
  profile: Profile;
  sound: boolean;
  onToggleSound: () => void;
  onPlay: () => void;
  onOpenStudio: () => void;
  onOpenSquad: () => void;
  onOpenTournaments: () => void;
}

const NAV_ITEMS = [
  { label: "Career", target: "career" },
  { label: "Studio", action: "studio" as const },
  { label: "Squad", action: "squad" as const },
  { label: "Tournaments", action: "tournaments" as const },
  { label: "Leaderboard", target: "leaderboard" },
];

export function Nav({ profile, sound, onToggleSound, onPlay, onOpenStudio, onOpenSquad, onOpenTournaments }: NavProps) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const level = levelForXp(profile.xp);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 18);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const go = (item: (typeof NAV_ITEMS)[number]) => {
    setOpen(false);
    if (item.target) {
      document.getElementById(item.target)?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    if (item.action === "studio") onOpenStudio();
    if (item.action === "squad") onOpenSquad();
    if (item.action === "tournaments") onOpenTournaments();
  };

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 border-b transition-colors duration-300 ${
        scrolled ? "border-white/10 bg-ink/90 backdrop-blur-xl" : "border-transparent bg-ink/40 backdrop-blur-md"
      }`}
    >
      <div className="mx-auto flex h-[64px] max-w-[1440px] items-center justify-between gap-3 px-4 sm:h-[70px] sm:px-6 xl:px-10">
        <a href="#top" className="shrink-0" aria-label="Streetkings home">
          <Logo />
        </a>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Main navigation">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.label}
              onClick={() => go(item)}
              className="relative rounded-full px-3 py-2 text-[11px] font-bold uppercase tracking-[0.1em] text-muted transition hover:bg-white/5 hover:text-cream"
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={onToggleSound}
            className="hidden size-9 place-items-center rounded-full border border-line bg-white/[0.03] text-muted transition hover:border-cream/30 hover:text-cream sm:grid"
            aria-label={sound ? "Mute sound" : "Enable sound"}
            title={sound ? "Sound on" : "Sound off"}
          >
            <Icon name={sound ? "sound" : "mute"} size={16} />
          </button>
          <span className="hidden items-center gap-1.5 rounded-full border border-gold/20 bg-gold/[0.07] px-2.5 py-1.5 text-[11px] font-extrabold text-gold sm:flex">
            <Icon name="coin" size={13} />
            {formatNumber(profile.coins)}
          </span>
          <a
            href="#career"
            className="hidden items-center gap-2 rounded-full border border-line bg-white/[0.03] py-1 pl-1 pr-3 md:flex"
            aria-label="View career"
          >
            <span className="grid size-7 place-items-center rounded-full bg-volt/15 font-display text-[11px] text-volt">
              {level}
            </span>
            <span className="text-[10px] font-extrabold uppercase tracking-[0.08em] text-cream">{profile.name}</span>
          </a>
          <button
            onClick={onPlay}
            className="group ml-0.5 flex items-center gap-1.5 rounded-full bg-volt px-3 py-2 font-display text-[13px] tracking-wide text-ink transition hover:bg-volt-dim active:scale-[0.98] sm:px-4 sm:text-[15px]"
          >
            Kick off
            <Icon name="arrow" size={14} className="transition group-hover:translate-x-0.5" />
          </button>
          <button
            onClick={() => setOpen((v) => !v)}
            className="grid size-9 place-items-center rounded-full border border-line text-cream lg:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
          >
            <Icon name={open ? "close" : "menu"} size={18} />
          </button>
        </div>
      </div>

      {open && (
        <div className="animate-fade border-t border-white/10 bg-[#0b0f0b] px-4 pb-4 pt-2 lg:hidden">
          <div className="grid grid-cols-2 gap-1.5">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.label}
                onClick={() => go(item)}
                className="flex items-center justify-between rounded-xl border border-line/70 bg-white/[0.02] px-3 py-3 text-left text-[11px] font-extrabold uppercase tracking-[0.1em] text-cream transition hover:border-volt/40"
              >
                {item.label}
                <Icon name="arrow-up-right" size={13} className="text-muted" />
              </button>
            ))}
            <button
              onClick={() => {
                setOpen(false);
                onPlay();
              }}
              className="col-span-2 flex items-center justify-center gap-2 rounded-xl bg-volt px-3 py-3 font-display text-base tracking-wide text-ink"
            >
              <Icon name="play" size={15} /> Play next fixture
            </button>
            <button
              onClick={onToggleSound}
              className="col-span-2 flex items-center justify-center gap-2 rounded-xl border border-line px-3 py-2.5 text-[10px] font-extrabold uppercase tracking-[0.12em] text-muted"
            >
              <Icon name={sound ? "sound" : "mute"} size={14} /> Sound {sound ? "on" : "off"}
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
