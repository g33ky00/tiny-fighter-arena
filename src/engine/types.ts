// ─── Combat Engine Types ─────────────────────────────────────────────────────

export type Archetype =
    | "Berserker"
    | "Guardian"
    | "Trickster"
    | "Mystic"
    | "Striker"
    | "Phantom";

export type Element = "fire" | "nature" | "ice" | "shadow" | "light" | "tech";

export type FightingStyle =
    | "aggressive"
    | "defensive"
    | "balanced"
    | "evasive"
    | "tactical";

export interface CombatDNA {
    archetype: Archetype;
    element: Element;
    speed: number; // 1–100
    power: number; // 1–100
    defense: number; // 1–100
    specialAbility: string;
    quirk: string;
    fightingStyle: FightingStyle;
}

export interface Fighter {
    id: string;
    name: string;
    dna: CombatDNA;
    hp: number;
    maxHp: number;
}

export interface BattleTurn {
    turn: number;
    actorId: string;
    action: string;
    damage: number;
    targetHpAfter: number;
    actorHpAfter: number;
    log: string;
}

export interface BattleState {
    fighters: [Fighter, Fighter];
    turnLog: BattleTurn[];
    winner: string | null;
    isFinished: boolean;
}
