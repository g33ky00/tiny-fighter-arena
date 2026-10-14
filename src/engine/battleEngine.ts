// ─── Deterministic Turn-Based Battle Engine ────────────────────────────────

import type { BattleState, BattleTurn, CombatDNA, Fighter } from "./types.js";

// ─── Seeded RNG (mulberry32) ────────────────────────────────────────────────

function hashSeed(str: string): number {
    let h = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) {
        h ^= str.charCodeAt(i);
        h = Math.imul(h, 0x01000193);
    }
    return h >>> 0;
}

function mulberry32(seed: number): () => number {
    let a = seed;
    return () => {
        a |= 0;
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

// ─── Element Advantage Map ──────────────────────────────────────────────────

const ELEMENT_ADVANTAGE: Record<string, string> = {
    fire: "nature",
    nature: "ice",
    ice: "fire",
    shadow: "light",
    light: "shadow",
    tech: "nature",
};

function getElementMultiplier(attacker: string, defender: string): number {
    if (ELEMENT_ADVANTAGE[attacker] === defender) return 1.5;
    if (ELEMENT_ADVANTAGE[defender] === attacker) return 0.7;
    return 1.0;
}

// ─── HP Calculation ─────────────────────────────────────────────────────────

function calcMaxHp(dna: CombatDNA): number {
    return 80 + dna.defense * 0.8 + (dna.archetype === "Guardian" ? 40 : 0);
}

// ─── Damage Formula ─────────────────────────────────────────────────────────

function calcDamage(
    attackerDna: CombatDNA,
    defenderDna: CombatDNA,
    rng: () => number,
    turnNumber: number,
): { damage: number; isCritical: boolean; isSpecial: boolean; note: string } {
    const basePower = attackerDna.power;
    const defense = defenderDna.defense;
    const elementMult = getElementMultiplier(
        attackerDna.element,
        defenderDna.element,
    );

    // Power differential
    const powerDiff = basePower - defense;
    let baseDamage = 10 + powerDiff * 0.3;

    // Fighting style modifiers
    if (attackerDna.fightingStyle === "aggressive") baseDamage *= 1.15;
    if (attackerDna.fightingStyle === "defensive") baseDamage *= 0.85;
    if (defenderDna.fightingStyle === "evasive") baseDamage *= 0.9;

    // RNG variance: ±15%
    const variance = 0.85 + rng() * 0.3;
    baseDamage *= variance;

    // Element multiplier
    baseDamage *= elementMult;

    // Critical hit: 10% chance, 1.5x damage
    const isCritical = rng() < 0.1;
    if (isCritical) baseDamage *= 1.5;

    // Special ability trigger conditions
    let isSpecial = false;
    let note = "";

    const specialRoll = rng();
    const specialChance = getSpecialTriggerChance(attackerDna, turnNumber, rng);
    if (specialRoll < specialChance) {
        isSpecial = true;
        baseDamage *= 1.4;
        note = ` ✨ ${attackerDna.specialAbility}!`;
    }

    // Quirk vulnerability check
    const quirkVulnerable = checkQuirkVulnerability(
        attackerDna,
        defenderDna,
        rng,
    );
    if (quirkVulnerable) {
        baseDamage *= 1.25;
        note += ` 😰 ${defenderDna.quirk} exploited!`;
    }

    // Minimum 1 damage
    baseDamage = Math.max(1, Math.round(baseDamage));

    return { damage: baseDamage, isCritical, isSpecial, note };
}

function getSpecialTriggerChance(
    dna: CombatDNA,
    turn: number,
    _rng: () => number,
): number {
    // Special abilities are more likely in later turns
    const baseChance = 0.08 + turn * 0.02;
    // Mystic and Trickster have higher special rates
    if (dna.archetype === "Mystic") return Math.min(baseChance + 0.1, 0.35);
    if (dna.archetype === "Trickster") return Math.min(baseChance + 0.08, 0.3);
    return Math.min(baseChance, 0.3);
}

function checkQuirkVulnerability(
    _attacker: CombatDNA,
    _defender: CombatDNA,
    rng: () => number,
): boolean {
    // 12% base chance to exploit a quirk
    if (rng() < 0.12) {
        return true;
    }
    // "Overconfident after a critical hit" is exploited if defender just got crit
    // (handled at call site; this is a general check)
    return false;
}

// ─── Battle Engine ──────────────────────────────────────────────────────────

export interface BattleResult {
    turns: BattleTurn[];
    winner: Fighter;
    loser: Fighter;
    totalTurns: number;
}

/**
 * Run a deterministic turn-based battle between two fighters.
 * Same DNA inputs always produce the same battle log.
 */
export function runBattle(
    dnaA: CombatDNA,
    dnaB: CombatDNA,
    nameA = "Fighter A",
    nameB = "Fighter B",
): BattleResult {
    // Create seed from DNA combination (deterministic for replays)
    const seedStr = JSON.stringify([dnaA, dnaB].sort());
    const seed = hashSeed(seedStr);
    const rng = mulberry32(seed);

    const fighterA: Fighter = {
        id: "A",
        name: nameA,
        dna: dnaA,
        hp: calcMaxHp(dnaA),
        maxHp: calcMaxHp(dnaA),
    };

    const fighterB: Fighter = {
        id: "B",
        name: nameB,
        dna: dnaB,
        hp: calcMaxHp(dnaB),
        maxHp: calcMaxHp(dnaB),
    };

    // Turn order: higher speed goes first; tie → seeded random
    let first: Fighter;
    let second: Fighter;
    if (dnaA.speed > dnaB.speed) {
        first = fighterA;
        second = fighterB;
    } else if (dnaB.speed > dnaA.speed) {
        first = fighterB;
        second = fighterA;
    } else {
        if (rng() < 0.5) {
            first = fighterA;
            second = fighterB;
        } else {
            first = fighterB;
            second = fighterA;
        }
    }

    const turns: BattleTurn[] = [];
    let turnNumber = 0;
    const MAX_TURNS = 50;

    while (fighterA.hp > 0 && fighterB.hp > 0 && turnNumber < MAX_TURNS) {
        turnNumber++;

        // First fighter's action
        const result1 = executeTurn(first, second, rng, turnNumber);
        turns.push(result1);
        if (second.hp <= 0) break;

        // Second fighter's action
        const result2 = executeTurn(second, first, rng, turnNumber);
        turns.push(result2);
        if (first.hp <= 0) break;
    }

    const winner = fighterA.hp > 0 ? fighterA : fighterB;
    const loser = fighterA.hp > 0 ? fighterB : fighterA;

    return { turns, winner, loser, totalTurns: turnNumber };
}

function executeTurn(
    attacker: Fighter,
    defender: Fighter,
    rng: () => number,
    turnNumber: number,
): BattleTurn {
    const { damage, isCritical, isSpecial, note } = calcDamage(
        attacker.dna,
        defender.dna,
        rng,
        turnNumber,
    );

    defender.hp = Math.max(0, defender.hp - damage);

    const parts: string[] = [];
    parts.push(`${attacker.name} attacks ${defender.name}`);
    if (isSpecial) parts.push(`with ${attacker.dna.specialAbility}`);
    if (isCritical) parts.push("CRITICAL HIT!");
    if (note) parts.push(note.trim());
    parts.push(`for ${damage} damage`);

    // Element advantage note
    const elementMult = getElementMultiplier(
        attacker.dna.element,
        defender.dna.element,
    );
    if (elementMult > 1) parts.push("(element advantage!)");
    if (elementMult < 1) parts.push("(element disadvantage…)");

    const log = parts.join(" ");

    return {
        turn: turnNumber,
        actorId: attacker.id,
        action: isSpecial ? attacker.dna.specialAbility : "attack",
        damage,
        targetHpAfter: defender.hp,
        actorHpAfter: attacker.hp,
        log,
    };
}

/**
 * Build a full BattleState from a battle result.
 */
export function buildBattleState(result: BattleResult): BattleState {
    return {
        fighters: [
            {
                ...result.winner,
                hp: result.winner.hp,
                maxHp: result.winner.maxHp,
            },
            { ...result.loser, hp: result.loser.hp, maxHp: result.loser.maxHp },
        ],
        turnLog: result.turns,
        winner: result.winner.id,
        isFinished: true,
    };
}
