# Interactive Skill Tree Builder

Client-side React app for creating and interacting with a skill tree: add skills as nodes, connect prerequisites as edges, and unlock/complete skills based on prerequisite completion.

## Features

- Create skill nodes (title required + unique, optional description, cost, level).
- Connect skills with prerequisite edges (A → B means A is required before B).
- Progression model: `locked → unlockable → unlocked → completed` (prerequisites require `completed`).
- Persistence to `localStorage` (key: `skill-tree-builder`).
- Search + highlight: search by title substring (case-insensitive), highlight matches and their prerequisite paths, dim everything else.
- Validation + feedback: prevents self-loops, duplicate edges, and direct 2-node cycles; shows toast feedback for invalid actions.

## Tech Stack

- React + Vite
- React Flow
- Tailwind CSS
- Jest (unit tests)
- ESLint + Prettier

## Getting Started

From the repo root:

```sh
cd interactive-skill-tree-builder
npm install
npm run dev
```

Open the URL printed in the terminal (usually `http://localhost:5173`).

## Scripts

- `npm run dev` — run the app locally
- `npm run build` — production build
- `npm run preview` — preview the production build locally
- `npm test` — run unit tests
- `npm run lint` — run ESLint
- `npm run format` — format via Prettier
- `npm run format:check` — check formatting

## Completed Extensions / Bonuses

- Required extension: Search + highlight (matches + prerequisite paths; non-matches dimmed).
- Additional UX/validation: prevents duplicate edges, self-loops, and direct A↔B cycles with toast feedback.

## AI Tooling Disclosure

AI tools were used for project brainstorming and implementation planning, and to assist with implementation and refactoring (OpenAI Codex CLI), with manual review of all changes.
