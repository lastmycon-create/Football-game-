import type { SVGProps } from "react";

export type IconName =
  | "play"
  | "arrow"
  | "bolt"
  | "plus"
  | "lock"
  | "trophy"
  | "users"
  | "star"
  | "sound"
  | "mute"
  | "close"
  | "pause"
  | "refresh"
  | "home"
  | "chevron"
  | "coin"
  | "shield"
  | "ball"
  | "spark"
  | "clock"
  | "target"
  | "check"
  | "keyboard"
  | "hand"
  | "crown"
  | "menu"
  | "arrow-up-right";

const PATHS: Record<IconName, React.ReactNode> = {
  play: <path d="M8 5.5v13l11-6.5-11-6.5Z" fill="currentColor" stroke="none" />,
  arrow: <path d="M4 12h15m-6-6 6 6-6 6" />,
  "arrow-up-right": <path d="M7 17 17 7M8 7h9v9" />,
  bolt: <path d="m13 2-9 12h6l-1 8 9-12h-6l1-8Z" />,
  plus: <path d="M12 5v14M5 12h14" />,
  lock: (
    <>
      <rect x="5" y="10" width="14" height="11" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </>
  ),
  trophy: (
    <>
      <path d="M7 4h10v5a5 5 0 0 1-10 0V4Z" />
      <path d="M7 6H4v1a4 4 0 0 0 4 4M17 6h3v1a4 4 0 0 1-4 4" />
      <path d="M12 14v4M8 21h8M9 18h6" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3 20v-1.5A5.5 5.5 0 0 1 8.5 13h1A5.5 5.5 0 0 1 15 18.5V20" />
      <path d="M16 5.2A3.2 3.2 0 0 1 16 11M18 13.2a5 5 0 0 1 3 4.6V20" />
    </>
  ),
  star: (
    <path d="m12 3 2.7 5.8 6.3.8-4.6 4.4 1.2 6.2-5.6-3-5.6 3 1.2-6.2L3 9.6l6.3-.8L12 3Z" />
  ),
  sound: (
    <>
      <path d="M4 10v4h4l5 4V6L8 10H4Z" />
      <path d="M17 9a4 4 0 0 1 0 6M19.5 6.5a8 8 0 0 1 0 11" />
    </>
  ),
  mute: (
    <>
      <path d="M4 10v4h4l5 4V6L8 10H4Z" />
      <path d="m16 10 5 5m0-5-5 5" />
    </>
  ),
  close: <path d="m6 6 12 12M18 6 6 18" />,
  pause: (
    <>
      <rect x="7" y="5" width="3.5" height="14" rx="1" fill="currentColor" stroke="none" />
      <rect x="13.5" y="5" width="3.5" height="14" rx="1" fill="currentColor" stroke="none" />
    </>
  ),
  refresh: (
    <>
      <path d="M20 11a8 8 0 1 0-2.3 6.3" />
      <path d="M20 4v7h-7" />
    </>
  ),
  home: <path d="m3 11 9-8 9 8v9a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1v-9Z" />,
  chevron: <path d="m6 9 6 6 6-6" />,
  coin: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M14.5 9.2c-.7-.7-1.6-1-2.7-1-1.4 0-2.4.7-2.4 1.9 0 2.8 5.2 1.4 5.2 4.1 0 1.2-1 1.9-2.6 1.9-1.2 0-2.2-.4-2.9-1.2M12 6.3v11.4" />
    </>
  ),
  shield: <path d="M12 3 20 6v5c0 5-3.4 8.3-8 10-4.6-1.7-8-5-8-10V6l8-3Z" />,
  ball: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m12 7 3.4 2.5-1.3 4h-4.2l-1.3-4L12 7ZM4.2 9.5 7 11.4M19.8 9.5 17 11.4M8 20l1.9-3.5M16 20l-1.9-3.5M8.5 4.6l1 3.4M15.5 4.6l-1 3.4" />
    </>
  ),
  spark: <path d="M12 3v5m0 8v5M3 12h5m8 0h5M6 6l3 3m6 6 3 3m0-12-3 3M9 15l-3 3" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="12" cy="12" r="1" fill="currentColor" />
    </>
  ),
  check: <path d="m5 13 4 4L19 7" />,
  keyboard: (
    <>
      <rect x="2.5" y="6" width="19" height="12" rx="2" />
      <path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M6 14h.01M18 14h.01M9.5 14h5" />
    </>
  ),
  hand: <path d="M9 11V5.5a1.5 1.5 0 0 1 3 0V10m0-4.5a1.5 1.5 0 0 1 3 0V10m0-3a1.5 1.5 0 0 1 3 0v7a6 6 0 0 1-6 6h-1.5a6 6 0 0 1-5.2-3L4 14.5a1.6 1.6 0 0 1 2.8-1.6L9 16" />,
  crown: <path d="M3 8l4 3 5-6 5 6 4-3-2 11H5L3 8Z" />,
  menu: <path d="M4 7h16M4 12h16M4 17h10" />,
};

interface IconProps extends SVGProps<SVGSVGElement> {
  name: IconName;
  size?: number;
}

export function Icon({ name, size = 20, strokeWidth = 1.8, ...props }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {PATHS[name]}
    </svg>
  );
}

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <span className="relative grid size-8 shrink-0 place-items-center overflow-hidden rounded-[10px] bg-volt text-ink shadow-[0_0_24px_-4px_rgba(216,255,62,0.55)] sm:size-9 sm:rounded-[11px]">
        <span className="absolute -right-2 -top-2 size-5 rotate-45 bg-ink/10" />
        <Icon name="bolt" size={20} strokeWidth={2.2} />
      </span>
      {!compact && (
        <span className="leading-none">
          <span className="block font-display text-[17px] tracking-[0.05em] text-cream sm:text-[20px] sm:tracking-[0.06em]">STREETKINGS</span>
          <span className="mt-0.5 block text-[7px] font-bold uppercase tracking-[0.3em] text-volt/70 sm:text-[8px] sm:tracking-[0.34em]">Own the street</span>
        </span>
      )}
    </span>
  );
}
