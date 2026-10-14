import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getStoredApiKey, setStoredApiKey } from "./api/byop.js";
import { generateImage } from "./api/pollinations.js";
import BattleArena from "./components/BattleArena.js";
import FighterDesign from "./components/FighterDesign.js";
import ShareLink from "./components/ShareLink.js";
import { type BattleResult, runBattle } from "./engine/battleEngine.js";
import { generateRandomChallengerDNA } from "./engine/combatDNA.js";
import type { BattleTurn, CombatDNA, Fighter } from "./engine/types.js";

type Phase = "describe" | "battle" | "result";

interface SharedState {
    dnaA: CombatDNA;
    dnaB: CombatDNA;
    nameA: string;
    nameB: string;
    imageA: string;
    imageB: string;
    result: BattleResult;
}

function encodeShareState(
    state: Omit<SharedState, "imageA" | "imageB">,
): string {
    const json = JSON.stringify(state);
    return btoa(json)
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");
}

function decodeShareState(
    encoded: string,
): Omit<SharedState, "imageA" | "imageB"> | null {
    try {
        const json = atob(encoded.replace(/-/g, "+").replace(/_/g, "/"));
        return JSON.parse(json);
    } catch {
        return null;
    }
}

export default function App() {
    const [phase, setPhase] = useState<Phase>("describe");
    const [apiKey, setApiKeyState] = useState(getStoredApiKey());
    const [shared, setShared] = useState<SharedState | null>(null);
    const [turnIndex, setTurnIndex] = useState(0);
    const [speed, setSpeed] = useState(1);
    const [challengerLoading, setChallengerLoading] = useState(false);
    const battleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Check for shared battle in URL hash on mount
    useEffect(() => {
        const hash = window.location.hash.slice(1);
        if (hash.startsWith("fight=")) {
            const state = decodeShareState(hash.slice(6));
            if (state) {
                setShared({ ...state, imageA: "", imageB: "" });
                setPhase("result");
            }
        }
    }, []);

    // Battle turn advancement
    useEffect(() => {
        if (phase !== "battle" || !shared) return;
        if (turnIndex >= shared.result.turns.length) {
            battleTimer.current = setTimeout(() => setPhase("result"), 800);
            return;
        }
        battleTimer.current = setTimeout(() => {
            setTurnIndex((i) => i + 1);
        }, 1100 / speed);
        return () => {
            if (battleTimer.current) clearTimeout(battleTimer.current);
        };
    }, [phase, turnIndex, shared, speed]);

    const handleFighterReady = useCallback(
        async (dna: CombatDNA, name: string, imageUrl: string) => {
            setChallengerLoading(true);
            try {
                const challengerDna = generateRandomChallengerDNA();
                const challengerName = `Challenger #${Math.floor(Math.random() * 900 + 100)}`;
                const challengerImage = await generateImage(
                    `${challengerDna.archetype} warrior, ${challengerDna.element} theme, ${challengerDna.fightingStyle} pose, fantasy art, dramatic lighting`,
                );
                const result = runBattle(
                    dna,
                    challengerDna,
                    name,
                    challengerName,
                );
                const state: SharedState = {
                    dnaA: dna,
                    dnaB: challengerDna,
                    nameA: name,
                    nameB: challengerName,
                    imageA: imageUrl,
                    imageB: challengerImage,
                    result,
                };
                setShared(state);
                setTurnIndex(0);
                setPhase("battle");
                // Update URL with shareable state
                const shareable = encodeShareState({
                    dnaA: state.dnaA,
                    dnaB: state.dnaB,
                    nameA: state.nameA,
                    nameB: state.nameB,
                    result: state.result,
                });
                window.history.replaceState(null, "", `#fight=${shareable}`);
            } finally {
                setChallengerLoading(false);
            }
        },
        [],
    );

    const fighters: [Fighter, Fighter] | null = useMemo(() => {
        if (!shared) return null;
        return [
            {
                id: "A",
                name: shared.nameA,
                dna: shared.dnaA,
                hp:
                    shared.result.turns.length > 0
                        ? shared.result.turns.filter(
                              (t: BattleTurn) => t.actorId === "A",
                          ).length > 0
                            ? shared.result.turns
                                  .filter((t: BattleTurn) => t.actorId === "A")
                                  .slice(-1)[0].actorHpAfter
                            : shared.result.winner.id === "A"
                              ? shared.result.winner.hp
                              : shared.result.loser.hp
                        : 80 +
                          shared.dnaA.defense * 0.8 +
                          (shared.dnaA.archetype === "Guardian" ? 40 : 0),
                maxHp:
                    80 +
                    shared.dnaA.defense * 0.8 +
                    (shared.dnaA.archetype === "Guardian" ? 40 : 0),
            },
            {
                id: "B",
                name: shared.nameB,
                dna: shared.dnaB,
                hp:
                    shared.result.turns.length > 0
                        ? shared.result.turns.filter(
                              (t: BattleTurn) => t.actorId === "B",
                          ).length > 0
                            ? shared.result.turns
                                  .filter((t: BattleTurn) => t.actorId === "B")
                                  .slice(-1)[0].actorHpAfter
                            : shared.result.winner.id === "B"
                              ? shared.result.winner.hp
                              : shared.result.loser.hp
                        : 80 +
                          shared.dnaB.defense * 0.8 +
                          (shared.dnaB.archetype === "Guardian" ? 40 : 0),
                maxHp:
                    80 +
                    shared.dnaB.defense * 0.8 +
                    (shared.dnaB.archetype === "Guardian" ? 40 : 0),
            },
        ];
    }, [shared]);

    const shareUrl = useMemo(() => {
        if (!shared) return "";
        const shareable = encodeShareState({
            dnaA: shared.dnaA,
            dnaB: shared.dnaB,
            nameA: shared.nameA,
            nameB: shared.nameB,
            result: shared.result,
        });
        return `${window.location.origin}${window.location.pathname}#fight=${shareable}`;
    }, [shared]);

    const handleApiKeySave = (key: string) => {
        setStoredApiKey(key);
        setApiKeyState(key);
    };

    const handleRematch = () => {
        setShared(null);
        setTurnIndex(0);
        setPhase("describe");
        window.history.replaceState(null, "", window.location.pathname);
    };

    return (
        <main className="arena">
            <header className="arena-header">
                <h1>⚔️ Tiny Fighter Arena</h1>
                <div className="auth-area">
                    {apiKey ? (
                        <span className="key-status">🔑 Key set</span>
                    ) : (
                        <div className="key-input-row">
                            <input
                                type="password"
                                placeholder="sk_... (Pollinations API key)"
                                value={apiKey}
                                onChange={(e) => setApiKeyState(e.target.value)}
                            />
                            <button
                                type="button"
                                onClick={() => handleApiKeySave(apiKey)}
                            >
                                Save
                            </button>
                        </div>
                    )}
                </div>
            </header>

            {phase === "describe" && (
                <FighterDesign onReady={handleFighterReady} />
            )}

            {phase === "battle" && shared && fighters && (
                <BattleArena
                    fighters={fighters}
                    turns={shared.result.turns}
                    currentTurn={turnIndex}
                    speed={speed}
                    onSpeedChange={setSpeed}
                    onComplete={() => setPhase("result")}
                />
            )}

            {phase === "result" && shared && (
                <section className="result">
                    <h2>
                        {shared.result.winner.id === "A"
                            ? "🏆 Victory!"
                            : "💀 Defeat!"}
                    </h2>
                    <p className="result-summary">
                        <strong>{shared.result.winner.name}</strong> wins in{" "}
                        {shared.result.totalTurns} turns!
                    </p>
                    <div className="result-fighters">
                        <div className="result-fighter winner">
                            <span className="result-name">
                                {shared.result.winner.name}
                            </span>
                            <span className="result-archetype">
                                {shared.result.winner.dna.archetype}
                            </span>
                        </div>
                        <div className="result-vs">vs</div>
                        <div className="result-fighter loser">
                            <span className="result-name">
                                {shared.result.loser.name}
                            </span>
                            <span className="result-archetype">
                                {shared.result.loser.dna.archetype}
                            </span>
                        </div>
                    </div>
                    <ShareLink shareUrl={shareUrl} />
                    <button
                        type="button"
                        className="rematch-btn"
                        onClick={handleRematch}
                    >
                        🔄 New Fighter
                    </button>
                </section>
            )}

            {challengerLoading && (
                <div className="loading-overlay">
                    <div className="loading-text">Generating challenger…</div>
                </div>
            )}
        </main>
    );
}
