import { useEffect, useRef } from "react";
import type { BattleTurn, Fighter } from "../engine/types.js";

interface Props {
    fighters: [Fighter, Fighter];
    turns: BattleTurn[];
    currentTurn: number;
    speed: number;
    onSpeedChange: (speed: number) => void;
    onComplete: () => void;
}

export default function BattleArena({
    fighters,
    turns,
    currentTurn,
    speed,
    onSpeedChange,
    onComplete,
}: Props) {
    const logRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (logRef.current) {
            logRef.current.scrollTop = logRef.current.scrollHeight;
        }
    }, [currentTurn]);

    useEffect(() => {
        if (currentTurn >= turns.length) {
            const timer = setTimeout(onComplete, 1200 / speed);
            return () => clearTimeout(timer);
        }
        const timer = setTimeout(() => {
            // advance handled by parent via onComplete when all turns shown
        }, 900 / speed);
        return () => clearTimeout(timer);
    }, [currentTurn, turns.length, speed, onComplete]);

    const visibleTurns = turns.slice(0, currentTurn + 1);
    const maxHp = Math.max(fighters[0].maxHp, fighters[1].maxHp);

    return (
        <section className="battle-arena">
            <div className="speed-controls">
                {[1, 2, 4].map((s) => (
                    <button
                        key={s}
                        type="button"
                        className={s === speed ? "active" : ""}
                        onClick={() => onSpeedChange(s)}
                    >
                        {s}x
                    </button>
                ))}
            </div>

            <div className="fighters-row">
                <FighterCard
                    fighter={fighters[0]}
                    maxHp={maxHp}
                    isActive={
                        visibleTurns[visibleTurns.length - 1]?.actorId ===
                        fighters[0].id
                    }
                />
                <div className="vs">VS</div>
                <FighterCard
                    fighter={fighters[1]}
                    maxHp={maxHp}
                    isActive={
                        visibleTurns[visibleTurns.length - 1]?.actorId ===
                        fighters[1].id
                    }
                />
            </div>

            <div className="battle-log" ref={logRef}>
                {visibleTurns.map((turn) => (
                    <div
                        key={turn.turn}
                        className={`turn ${turn.damage > 20 ? "heavy" : ""}`}
                    >
                        <span className="turn-num">T{turn.turn}</span>
                        <span className="turn-log">{turn.log}</span>
                    </div>
                ))}
                {currentTurn < turns.length && (
                    <div className="turn-indicator">▸</div>
                )}
            </div>
        </section>
    );
}

function FighterCard({
    fighter,
    maxHp,
    isActive,
}: {
    fighter: Fighter;
    maxHp: number;
    isActive: boolean;
}) {
    const hpPct = Math.max(0, (fighter.hp / maxHp) * 100);
    const hpColor = hpPct > 50 ? "#4ade80" : hpPct > 25 ? "#f59e0b" : "#ef4444";

    return (
        <div className={`fighter-card ${isActive ? "active" : ""}`}>
            <div className="fighter-name">{fighter.name}</div>
            <div className="fighter-archetype">{fighter.dna.archetype}</div>
            <div className="hp-bar">
                <div
                    className="hp-fill"
                    style={{ width: `${hpPct}%`, background: hpColor }}
                />
                <span className="hp-text">
                    {fighter.hp} / {fighter.maxHp}
                </span>
            </div>
            <div className="fighter-element">{fighter.dna.element}</div>
        </div>
    );
}
