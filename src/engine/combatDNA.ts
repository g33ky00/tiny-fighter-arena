// ─── Combat DNA Generation ──────────────────────────────────────────────────────

import type { CombatDNA } from "./types.js";

const POLLINATIONS_API_BASE = "https://gen.pollinations.ai";
const API_KEY = import.meta.env.VITE_POLLINATIONS_API_KEY ?? "";

/**
 * Parse a free-text fighter description into structured CombatDNA
 * using the Pollinations text API.
 */
export async function generateCombatDNA(
    description: string,
): Promise<CombatDNA> {
    const systemPrompt = `You are a combat DNA parser for a fighting game.
Given a text description of a fighter, extract and return structured JSON with this EXACT schema:
{
  "archetype": "Berserker" | "Guardian" | "Trickster" | "Mystic" | "Striker" | "Phantom",
  "element": "fire" | "nature" | "ice" | "shadow" | "light" | "tech",
  "speed": <integer 1-100>,
  "power": <integer 1-100>,
  "defense": <integer 1-100>,
  "specialAbility": "<short name, e.g. 'Flame Burst', 'Shadow Step', 'Iron Wall'>",
  "quirk": "<short description of a personality quirk or vulnerability>",
  "fightingStyle": "aggressive" | "defensive" | "balanced" | "evasive" | "tactical"
}

Rules:
- archetype must be exactly one of the 6 options
- element must be exactly one of the 6 options
- speed, power, defense must be integers from 1 to 100
- specialAbility and quirk are short strings
- fightingStyle must be exactly one of the 5 options

Respond with ONLY the JSON object, no markdown, no explanation.`;

    const response = await fetch(`${POLLINATIONS_API_BASE}/text`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${API_KEY}`,
        },
        body: JSON.stringify({
            messages: [
                {
                    role: "user",
                    content: `Parse this fighter description:\n\n${description}`,
                },
                { role: "system", content: systemPrompt },
            ],
            model: "openai",
        }),
    });

    if (!response.ok) {
        throw new Error(
            `Pollinations API error: ${response.status} ${response.statusText}`,
        );
    }

    const data = (await response.json()) as {
        choices?: { message?: { content?: string } }[];
    };
    const content = data.choices?.[0]?.message?.content ?? "";

    const dna = JSON.parse(content) as CombatDNA;

    // Clamp stats
    dna.speed = Math.max(1, Math.min(100, Math.round(dna.speed)));
    dna.power = Math.max(1, Math.min(100, Math.round(dna.power)));
    dna.defense = Math.max(1, Math.min(100, Math.round(dna.defense)));

    return dna;
}

const ARCHETYPES = [
    "Berserker",
    "Guardian",
    "Trickster",
    "Mystic",
    "Striker",
    "Phantom",
] as const;
const ELEMENTS = ["fire", "nature", "ice", "shadow", "light", "tech"] as const;
const FIGHTING_STYLES = [
    "aggressive",
    "defensive",
    "balanced",
    "evasive",
    "tactical",
] as const;

const SPECIAL_ABILITIES = [
    "Flame Burst",
    "Shadow Step",
    "Iron Wall",
    "Nature's Grasp",
    "Blinding Light",
    "System Overload",
    "Frost Nova",
    "Venom Strike",
    "Thunder Crush",
    "Phantom Clone",
    "Crystal Shield",
    "Berserker Rage",
    "Silent Strike",
    "Tech Surge",
    "Spirit Heal",
    "Counter Crush",
];

const QUIRKS = [
    "Cannot resist a direct challenge",
    "Slows down when losing",
    "Becomes reckless at low health",
    "Distracted by shiny objects",
    "Hesitates against faster opponents",
    "Overconfident after a critical hit",
    "Weak to taunts",
    "Loses focus when outnumbered",
];

/** Generate a random challenger DNA (for AI opponents). */
export function generateRandomChallengerDNA(): CombatDNA {
    const pick = <T>(arr: readonly T[]): T =>
        arr[Math.floor(Math.random() * arr.length)];
    const stat = () => Math.floor(Math.random() * 80) + 20; // 20–99

    return {
        archetype: pick(ARCHETYPES),
        element: pick(ELEMENTS),
        speed: stat(),
        power: stat(),
        defense: stat(),
        specialAbility: pick(SPECIAL_ABILITIES),
        quirk: pick(QUIRKS),
        fightingStyle: pick(FIGHTING_STYLES),
    };
}
