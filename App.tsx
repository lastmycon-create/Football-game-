import { useEffect, useRef, useState } from "react";
import { Nav } from "./components/Nav";
import { Home } from "./components/Home";
import { Modal } from "./components/Modal";
import { Studio } from "./components/Studio";
import { Squad } from "./components/Squad";
import { Tournaments } from "./components/Tournaments";
import { GameMatch, type MatchReward } from "./game/Game";
import { Icon } from "./components/Icons";
import {
  DIVISIONS,
  activeTeammate,
  coinsEarned,
  divisionUnlocked,
  levelForXp,
  nextFixture,
  xpEarned,
  type Division,
  type GameResult,
  type Profile,
  type ScoreEntry,
  type Signature,
  type Teammate,
} from "./lib/data";
import { insertScore, loadProfile, loadScores, makeScoreEntry, saveProfile, saveScores } from "./lib/storage";
import { playSound, setSoundEnabled, unlockAudio } from "./lib/audio";

type ModalId = "studio" | "squad" | "tournaments" | null;

export default function App() {
  const [profile, setProfile] = useState<Profile>(() => loadProfile());
  const [scores, setScores] = useState<ScoreEntry[]>(() => loadScores());
  const [modal, setModal] = useState<ModalId>(null);
  const [division, setDivision] = useState<Division | null>(null);
  const [toast, setToast] = useState<{ id: number; message: string } | null>(null);
  const toastTimer = useRef<number | null>(null);

  useEffect(() => {
    saveProfile(profile);
    setSoundEnabled(profile.sound);
  }, [profile]);

  useEffect(() => {
    saveScores(scores);
  }, [scores]);

  useEffect(() => {
    if (!division) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [division]);

  useEffect(() => {
    return () => {
      if (toastTimer.current) window.clearTimeout(toastTimer.current);
    };
  }, []);

  const notify = (message: string) => {
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    setToast({ id: Date.now(), message });
    toastTimer.current = window.setTimeout(() => setToast(null), 3200);
  };

  const openModal = (id: Exclude<ModalId, null>) => {
    unlockAudio();
    playSound("ui");
    setModal(id);
  };

  const startMatch = (target?: Division) => {
    unlockAudio();
    playSound("whistle");
    const chosen = target ?? nextFixture(profile);
    if (!divisionUnlocked(chosen, profile)) {
      notify(`Reach level ${chosen.unlockLevel} to unlock ${chosen.name}. Keep grinding.`);
      return;
    }
    setModal(null);
    setToast(null);
    setDivision(chosen);
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  };

  const exitMatch = () => {
    setDivision(null);
    playSound("ui");
    window.setTimeout(() => window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior }), 0);
  };

  const handleGameResult = (result: GameResult): MatchReward => {
    const coins = coinsEarned(result);
    const xp = xpEarned(result);
    const divisionTrophy = DIVISIONS.find((d) => d.id === result.divisionId)?.trophy ?? `${result.divisionName} trophy`;
    const trophy = result.won && !profile.trophies.includes(result.divisionId) ? divisionTrophy : null;
    const personalBest = result.score > profile.bestScore;
    const entry = makeScoreEntry(profile.name, { ...result, win: result.won }, profile.signature.name);
    const nextScores = insertScore(scores, entry);
    const rankIndex = nextScores.findIndex((s) => s.id === entry.id);

    setScores(nextScores);
    setProfile((prev) => {
      const winning = result.won && !prev.trophies.includes(result.divisionId);
      return {
        ...prev,
        coins: prev.coins + coins,
        xp: prev.xp + xp,
        matches: prev.matches + 1,
        wins: prev.wins + (result.won ? 1 : 0),
        goals: prev.goals + result.goals,
        bestScore: Math.max(prev.bestScore, result.score),
        bestCombo: Math.max(prev.bestCombo, result.bestCombo),
        trophies: winning ? [...prev.trophies, result.divisionId] : prev.trophies,
      };
    });

    return {
      coins,
      xp,
      trophy,
      personalBest,
      rank: rankIndex >= 0 ? rankIndex + 1 : 0,
    };
  };

  const handleSaveSignature = (signature: Signature, playerName: string) => {
    setProfile((prev) => ({ ...prev, signature, name: playerName || prev.name }));
    notify(`"${signature.name}" saved. Your signature is live.`);
    playSound("skill");
  };

  const handleStartFromStudio = (signature: Signature, playerName: string) => {
    unlockAudio();
    setProfile((prev) => ({ ...prev, signature, name: playerName || prev.name }));
    const fixture = nextFixture(profile);
    setToast(null);
    setModal(null);
    setDivision(fixture);
    playSound("whistle");
  };

  const handleRecruit = (mate: Teammate) => {
    const level = levelForXp(profile.xp);
    if (profile.teammates.includes(mate.id)) return;
    if (level < mate.unlockLevel) {
      notify(`Reach level ${mate.unlockLevel} to sign ${mate.name}.`);
      return;
    }
    if (profile.coins < mate.cost) {
      notify(`You need ${mate.cost - profile.coins} more coins to sign ${mate.name}.`);
      playSound("save");
      return;
    }
    setProfile((prev) => ({
      ...prev,
      coins: prev.coins - mate.cost,
      teammates: [...prev.teammates, mate.id],
      activeTeammate: mate.id,
    }));
    notify(`${mate.name} signed to your block. ${mate.boostLabel}.`);
    playSound("win");
  };

  const handleEquip = (mate: Teammate) => {
    if (!profile.teammates.includes(mate.id)) return;
    setProfile((prev) => ({ ...prev, activeTeammate: mate.id }));
    notify(`${mate.name} is in the squad. ${mate.boostLabel}.`);
    playSound("ui");
  };

  const handleToggleSound = () => {
    setProfile((prev) => ({ ...prev, sound: !prev.sound }));
    setSoundEnabled(!profile.sound);
    if (!profile.sound) playSound("ui");
  };

  const teammate = activeTeammate(profile);

  return (
    <div className="min-h-screen bg-ink text-cream">
      {!division && (
        <>
          <Nav
            profile={profile}
            sound={profile.sound}
            onToggleSound={handleToggleSound}
            onPlay={() => startMatch()}
            onOpenStudio={() => openModal("studio")}
            onOpenSquad={() => openModal("squad")}
            onOpenTournaments={() => openModal("tournaments")}
          />
          <Home
            profile={profile}
            scores={scores}
            onPlay={(target) => startMatch(target)}
            onOpenStudio={() => openModal("studio")}
            onOpenSquad={() => openModal("squad")}
            onOpenTournaments={() => openModal("tournaments")}
          />
        </>
      )}

      {division && (
        <GameMatch
          key={division.id}
          division={division}
          profile={profile}
          teammate={teammate}
          signature={profile.signature}
          sound={profile.sound}
          scores={scores}
          onResult={handleGameResult}
          onExit={exitMatch}
          onToggleSound={handleToggleSound}
        />
      )}

      <Modal
        open={modal === "studio"}
        onClose={() => setModal(null)}
        eyebrow="Make it one of one"
        title="Signature Studio"
        wide
      >
        <Studio
          profile={profile}
          onClose={() => setModal(null)}
          onSave={handleSaveSignature}
          onStart={handleStartFromStudio}
        />
      </Modal>

      <Modal open={modal === "squad"} onClose={() => setModal(null)} eyebrow="Recruit · equip · dominate" title="The Crew" wide>
        <Squad profile={profile} onRecruit={handleRecruit} onEquip={handleEquip} onPlay={() => startMatch()} />
      </Modal>

      <Modal
        open={modal === "tournaments"}
        onClose={() => setModal(null)}
        eyebrow="Season 01 · The come-up"
        title="Tournament Ladder"
      >
        <Tournaments profile={profile} onEnter={(target) => startMatch(target)} />
      </Modal>

      {toast && (
        <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[80] flex justify-center px-4 sm:bottom-6">
          <div
            key={toast.id}
            className="animate-pop flex max-w-md items-center gap-2.5 rounded-full border border-volt/40 bg-[#0c130c] px-3.5 py-2.5 shadow-[0_18px_60px_-12px_rgba(0,0,0,0.9)]"
            role="status"
            aria-live="polite"
          >
            <span className="grid size-6 shrink-0 place-items-center rounded-full bg-volt text-ink">
              <Icon name="bolt" size={13} />
            </span>
            <p className="text-[11px] font-bold text-cream">{toast.message}</p>
          </div>
        </div>
      )}

    </div>
  );
}
