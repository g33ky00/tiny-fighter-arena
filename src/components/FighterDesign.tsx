import { useState } from "react";
import { getStoredApiKey } from "../api/byop.js";
import { generateImage } from "../api/pollinations.js";
import { generateCombatDNA } from "../engine/combatDNA.js";
import type { CombatDNA } from "../engine/types.js";

interface Props {
    onReady: (dna: CombatDNA, name: string, imageUrl: string) => void;
}

const ARCHETYPE_EMOJI: Record<string, string> = {
    Berserker: "⚔️",
    Guardian: "🛡️",
    Trickster: "🃏",
    Mystic: "🔮",
    Striker: "⚡",
    Phantom: "👻",
};

const ELEMENT_COLOR: Record<string, string> = {
    fire: "#ff6b35",
    nature: "#4ade80",
    ice: "#67e8f9",
    shadow: "#a78bfa",
    light: "#fde047",
    tech: "#22d3ee",
};

export default function FighterDesign({ onReady }: Props) {
    const [description, setDescription] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [preview, setPreview] = useState<{
        dna: CombatDNA;
        name: string;
        imageUrl: string;
    } | null>(null);

    const handleGenerate = async () => {
        if (!getStoredApiKey()) {
            setError("Add your Pollinations API key first (top right).");
            return;
        }
        if (!description.trim()) {
            setError("Describe your fighter first!");
            return;
        }
        setLoading(true);
        setError(null);
        setPreview(null);
        try {
            const dna = await generateCombatDNA(description.trim());
            const name = description.trim().slice(0, 40);
            const imagePrompt = `${dna.archetype} warrior, ${dna.element} theme, ${dna.fightingStyle} pose, fantasy art, dramatic lighting`;
            const imageUrl = await generateImage(imagePrompt);
            const result = { dna, name, imageUrl };
            setPreview(result);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to generate fighter",
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="fighter-design">
            <h2>Design Your Fighter</h2>
            <p className="hint">
                Describe your fighter in one line. Clever descriptions win
                battles.
            </p>

            <div className="input-row">
                <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    onKeyDown={(e) =>
                        e.key === "Enter" && !loading && handleGenerate()
                    }
                    placeholder="e.g. A vampire knight who drinks sunlight"
                    maxLength={120}
                    disabled={loading}
                />
                <button
                    type="button"
                    onClick={handleGenerate}
                    disabled={loading || !description.trim()}
                >
                    {loading ? "Forging…" : "Generate Fighter"}
                </button>
            </div>

            {error && <p className="error">{error}</p>}

            {preview && (
                <div className="fighter-preview">
                    <div className="preview-image">
                        <img src={preview.imageUrl} alt={preview.name} />
                    </div>
                    <div className="preview-dna">
                        <h3>
                            {ARCHETYPE_EMOJI[preview.dna.archetype]}{" "}
                            {preview.name}
                        </h3>
                        <div className="dna-grid">
                            <div className="dna-item">
                                <span className="label">Archetype</span>
                                <span className="value">
                                    {preview.dna.archetype}
                                </span>
                            </div>
                            <div className="dna-item">
                                <span className="label">Element</span>
                                <span
                                    className="value"
                                    style={{
                                        color: ELEMENT_COLOR[
                                            preview.dna.element
                                        ],
                                    }}
                                >
                                    {preview.dna.element}
                                </span>
                            </div>
                            <div className="dna-item">
                                <span className="label">Speed</span>
                                <div className="stat-bar">
                                    <div
                                        className="stat-fill"
                                        style={{
                                            width: `${preview.dna.speed}%`,
                                            background: "#f59e0b",
                                        }}
                                    />
                                    <span>{preview.dna.speed}</span>
                                </div>
                            </div>
                            <div className="dna-item">
                                <span className="label">Power</span>
                                <div className="stat-bar">
                                    <div
                                        className="stat-fill"
                                        style={{
                                            width: `${preview.dna.power}%`,
                                            background: "#ef4444",
                                        }}
                                    />
                                    <span>{preview.dna.power}</span>
                                </div>
                            </div>
                            <div className="dna-item">
                                <span className="label">Defense</span>
                                <div className="stat-bar">
                                    <div
                                        className="stat-fill"
                                        style={{
                                            width: `${preview.dna.defense}%`,
                                            background: "#3b82f6",
                                        }}
                                    />
                                    <span>{preview.dna.defense}</span>
                                </div>
                            </div>
                            <div className="dna-item">
                                <span className="label">Style</span>
                                <span className="value">
                                    {preview.dna.fightingStyle}
                                </span>
                            </div>
                        </div>
                        <div className="dna-ability">
                            <strong>✨ {preview.dna.specialAbility}</strong>
                            <span className="quirk">
                                😰 {preview.dna.quirk}
                            </span>
                        </div>
                    </div>
                    <button
                        type="button"
                        className="battle-btn"
                        onClick={() =>
                            onReady(preview.dna, preview.name, preview.imageUrl)
                        }
                    >
                        ⚔️ To Battle!
                    </button>
                </div>
            )}
        </section>
    );
}
