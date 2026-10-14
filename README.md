# Tiny Fighter Arena

[![Made with pollinations.ai](https://raw.githubusercontent.com/pollinations/pollinations/main/packages/ui/src/brand/badge-made-with.svg)](https://pollinations.ai/?ref=badge)

A browser game where players describe a fighter in one line and watch it battle. The AI parses the description into structured **CombatDNA** and runs a deterministic turn-based battle — so clever descriptions genuinely win.

## Play

**Live:** https://g33ky00.github.io/tiny-fighter-arena/

## How It Works

1. **Describe** your fighter in one line (e.g. "A vampire knight who drinks sunlight")
2. The AI parses it into **CombatDNA**: archetype, element, speed/power/defense, special ability, quirk, fighting style
3. A **deterministic battle engine** (seeded RNG) runs the fight — same DNA always produces the same battle
4. **AI commentary** narrates each turn
5. **Share** the fight via URL — anyone can watch the exact same battle

## Features

- **Semantic Combat DNA**: descriptions become mechanical stats, not just visuals
- **Deterministic battles**: seeded RNG (mulberry32) — replays work
- **Element advantages**: fire > nature > ice > fire, shadow > light, tech > nature
- **AI-generated fighter portraits** via Pollinations image API
- **Turn-by-turn AI commentary** via Pollinations text API
- **Shareable fight links**: base64-encoded battle state in URL hash
- **BYOP**: players use their own Pollinations API key
- **Dark theme, responsive, mobile-friendly**

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Tech Stack

- Vite + React 19 + TypeScript
- Pollinations API (text, image)
- No backend — fully client-side

## License

MIT
