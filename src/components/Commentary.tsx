import { useEffect, useState } from "react";
import { generateText } from "../api/pollinations.js";
import type { BattleTurn } from "../engine/types.js";

interface Props {
    turn: BattleTurn;
}

export default function Commentary({ turn }: Props) {
    const [commentary, setCommentary] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        let cancelled = false;
        setCommentary(null);
        setLoading(true);

        const prompt = `You are a witty fight commentator for a tiny fighter arena game. In 1-2 short sentences, deliver an exciting, funny commentary for this turn. Be specific to the fighter names and actions. Turn: ${turn.log}`;

        generateText([
            {
                role: "system",
                content:
                    "You are a sports commentator for an AI fighting game. Keep it punchy, funny, and specific. Max 40 words.",
            },
            { role: "user", content: prompt },
        ])
            .then((text) => {
                if (!cancelled) {
                    setCommentary(text);
                    setLoading(false);
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setCommentary(null);
                    setLoading(false);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [turn.log]);

    if (!commentary && !loading) return null;

    return (
        <div className="commentary">
            {loading ? (
                <span className="commentary-loading">🎙️ Commentating…</span>
            ) : (
                <span>🎙️ {commentary}</span>
            )}
        </div>
    );
}
