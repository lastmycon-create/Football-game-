import { useEffect, type ReactNode } from "react";
import { Icon } from "./Icons";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  eyebrow?: string;
  title: string;
  wide?: boolean;
  children: ReactNode;
}

export function Modal({ open, onClose, eyebrow, title, wide = false, children }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-[#050805]/80 p-0 backdrop-blur-md sm:items-center sm:p-6"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`animate-rise flex max-h-[94svh] w-full flex-col overflow-hidden rounded-t-3xl border border-line bg-ink-2 shadow-[0_40px_120px_-20px_rgba(0,0,0,0.9)] sm:max-h-[90svh] sm:rounded-3xl ${
          wide ? "sm:max-w-5xl" : "sm:max-w-3xl"
        }`}
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-line bg-[#0c110c]/90 px-4 py-3.5 backdrop-blur sm:px-6 sm:py-4">
          <div className="min-w-0">
            {eyebrow && (
              <p className="flex items-center gap-1.5 text-[9px] font-extrabold uppercase tracking-[0.24em] text-volt">
                <span className="size-1 rounded-full bg-volt" />
                {eyebrow}
              </p>
            )}
            <h2 className="mt-0.5 truncate font-display text-2xl leading-none tracking-wide sm:text-3xl">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="grid size-9 shrink-0 place-items-center rounded-full border border-line bg-white/[0.03] text-muted transition hover:border-cream/30 hover:text-cream"
            aria-label="Close"
          >
            <Icon name="close" size={17} />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6">{children}</div>
      </div>
    </div>
  );
}
