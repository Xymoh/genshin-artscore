# Genshin ArtScore

A web application that scores Genshin Impact artifact builds based on Roll Value (RV), Crit Value (CV), and Weighted Substat Efficiency (WSE). Enter your Genshin UID to see your showcased characters' artifact quality in a card-based layout inspired by the Fribbels HSR Relic Optimizer.

## Features

- **UID Lookup**: Enter any Genshin Impact UID to fetch the player's showcase via Enka.Network API
- **Artifact Scoring**: Each artifact receives a composite score (0–100) and letter grade (S+ through F)
- **Scoring Methodology**:
  - **RV (30%)**: Roll Value — how well substats rolled relative to max possible
  - **CV (15%)**: Crit Value — normalized crit rate × 2 + crit damage
  - **WSE (40%)**: Weighted Substats Efficiency — substat rolls weighted per character's build preferences
  - **Multipliers**: Main stat correctness (1.0 / 0.6 / 0.3) and set bonus affiliation
- **Per-Character Optimization**: Each character has curated substat weights and ideal main stats (e.g., Diluc values CR/CD > ATK% > EM; Sucrose only cares about EM and ER)
- **Responsive Card Layout**: Mobile-friendly grid with expandable character cards
- **Dark/Light Theme**: Toggle between themes, persisted in localStorage
- **Recent Lookups**: Previously searched UIDs saved for quick access

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 + TypeScript |
| Build Tool | Vite 6 |
| Styling | TailwindCSS 4 (CSS-first `@theme`) |
| Routing | React Router v7 |
| Data Fetching | TanStack Query v5 |
| Proxy | Vercel Edge Functions |
| Testing | Vitest + jsdom + Testing Library |
| Linting | ESLint 9 flat config |
| Formatting | Prettier |

## Project Structure

```
genshin-artscore/
├── api/
│   └── proxy.ts              # Vercel Edge Function — Enka.Network CORS proxy
├── plans/
│   └── development-plan.md   # Full technical specification
├── src/
│   ├── App.tsx               # Root: QueryClient + Router
│   ├── main.tsx              # Entry point
│   ├── index.css             # TailwindCSS v4 @theme + custom classes
│   ├── components/
│   │   ├── layout/           # Layout, Header (theme toggle), Footer
│   │   ├── showcase/         # ArtifactCard, CharacterCard, CharacterGrid, PlayerHeader
│   │   └── ui/               # ScoreBadge, SubstatBar, SetBonusGrid, BuildScoreBar, UidInput, LoadingSkeleton
│   ├── data/
│   │   ├── characters.json   # GenshinData character catalog
│   │   ├── artifacts.json    # GenshinData artifact catalog
│   │   ├── stat-keys.json    # FightProp ↔ display name mappings
│   │   └── character-builds.json  # Curated substat weights & main stats per character
│   ├── hooks/
│   │   ├── useShowcase.ts    # TanStack Query hook: fetch → parse → score → return
│   │   └── useLocalStorage.ts
│   ├── lib/
│   │   ├── api.ts            # fetchShowcase with AbortController timeout
│   │   ├── constants.ts      # Max roll values, grade thresholds, scoring weights
│   │   ├── parsing.ts        # EnkaResponse → ShowcaseData transformation
│   │   ├── scoring.ts        # RV, CV, WSE, main stat check, grade mapping
│   │   └── uid.ts            # UID validation, sanitization, region detection
│   ├── pages/
│   │   ├── HomePage.tsx      # Hero + UID input + recent lookups
│   │   ├── ShowcasePage.tsx  # Player header + character grid
│   │   └── NotFoundPage.tsx  # 404
│   └── types/
│       ├── artifact.ts       # Artifact, ArtifactScore, ScoreGrade, ArtifactSubstat
│       ├── character.ts      # CharacterData, BuildScore, ShowcaseData
│       ├── enka.ts           # Full Enka.Network API v2 types
│       └── scoring.ts        # ScoringWeights, CharacterBuildConfig
├── tests/
│   ├── setup.ts              # jest-dom matchers
│   └── unit/
│       ├── uid.test.ts       # 8 tests: UID validation, region, sanitization
│       └── scoring.test.ts   # 10 tests: RV, CV, WSE, grade thresholds
├── vercel.json               # SPA routing + Edge Function route
├── vitest.config.ts
├── vite.config.ts
└── package.json
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm 9+

### Installation

```bash
git clone <repo-url>
cd genshin-artscore
npm install
```

### Development

```bash
npm run dev
```

Opens at `http://localhost:3000`. Enter a Genshin UID (e.g., `700600838`) and press Enter to view the showcase.

### Build

```bash
npm run build
npm run preview   # Preview production build
```

### Test

```bash
npm test          # Run all tests
npm run test:watch  # Watch mode
```

### Edge Function (local dev)

The Vercel Edge Function at [`api/proxy.ts`](api/proxy.ts) only runs when deployed to Vercel. For local development, the app calls the proxy path which Vercel CLI handles:

```bash
npx vercel dev
```

## Architecture

```
Browser                    Vercel Edge                 Enka.Network
┌──────────┐   fetch()    ┌──────────┐   HTTPS GET   ┌──────────────┐
│  React   │ ──────────→ │ /api/     │ ────────────→ │ enka.network │
│  SPA     │ ←────────── │ proxy.ts  │ ←──────────── │ /api/uid/    │
│          │   JSON +    │ (CORS     │   JSON        │ {uid}/       │
│  Vite    │   CORS hdr   │  proxy)   │               │ hsr/         │
└──────────┘             └──────────┘               └──────────────┘
     │                                                    │
     │  Static data (characters.json,                     │
     │  artifacts.json, character-builds.json)            │
     └────────────────────────────────────────────────────┘
```

1. User enters UID → React Router navigates to `/showcase/:uid`
2. [`useShowcase`](src/hooks/useShowcase.ts) hook fires TanStack Query → calls [`fetchShowcase`](src/lib/api.ts)
3. Request hits [`/api/proxy`](api/proxy.ts) Edge Function → forwards to Enka.Network API v2
4. Edge Function adds CORS headers, returns typed `EnkaResponse`
5. [`parseShowcaseData`](src/lib/parsing.ts) transforms raw response → domain `ShowcaseData`
6. [`scoreArtifact`](src/lib/scoring.ts) computes RV/CV/WSE per artifact, [`scoreBuild`](src/lib/scoring.ts) averages per character
7. React renders [`PlayerHeader`](src/components/showcase/PlayerHeader.tsx) + [`CharacterGrid`](src/components/showcase/CharacterGrid.tsx) → expandable [`CharacterCard`](src/components/showcase/CharacterCard.tsx) components with [`ArtifactCard`](src/components/showcase/ArtifactCard.tsx) children

## Scoring Reference

### Roll Value (RV)

`RV = (Σ substat.value / substat.maxRoll) / 9 × 100`

Each 5★ artifact can reach up to 9 effective substat rolls. RV measures how close an artifact is to perfect rolls.

### Crit Value (CV)

`CV = CRIT_RATE × 2 + CRIT_DMG`

Capped at 50 for normalization purposes (54.6 is the theoretical max from base + 6 perfect rolls, but ~50 is a realistic cap).

### Weighted Substat Efficiency (WSE)

`WSE = (Σ rolls_i × weight_i) / (Σ 2.25 × weight_i) × 100`

Each character has curated weights (0–1) per substat. WSE measures how efficiently the substats align with that character's scaling.

### Grade Thresholds

| Score | Grade |
|------:|:-----:|
| 90–100 | **S+** |
| 80–89  | **S** |
| 70–79  | **A** |
| 60–69  | **B** |
| 50–59  | **C** |
| 40–49  | **D** |
| 0–39   | **F** |

## Environment Variables

None required for core functionality. The Enka.Network API is public.

## Deployment (Vercel)

1. Push to GitHub
2. Import repo in Vercel dashboard
3. Framework: **Vite**
4. Build command: `npm run build`
5. Output directory: `dist`
6. The [`vercel.json`](vercel.json) handles SPA fallback and Edge Function routing automatically

## License

MIT

## Acknowledgments

- [Enka.Network](https://enka.network/) for the Genshin Impact showcase API
- [Fribbels HSR Relic Optimizer](https://fribbels.github.io/hsr-optimizer/) for design inspiration
- [Dimbreath/GenshinData](https://github.com/Dimbreath/GenshinData) for character/artifact static data
#   g e n s h i n - a r t s c o r e  
 