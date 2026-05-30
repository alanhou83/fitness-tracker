# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A standalone Progressive Web App (PWA) fitness tracker built entirely with vanilla HTML, CSS, and JavaScript. No build system, no package manager, no external dependencies.

## Running Locally

Serve the root directory with any static file server — the app requires a server context (not `file://`) for Service Workers to function:

```bash
python3 -m http.server 8080
# or
npx serve .
# or
php -S localhost:8080
```

Then open `http://localhost:8080` in a browser.

There are no build steps, no `npm install`, and no compilation required.

## Architecture

The entire application lives in two files:

- **`index.html`** (~2000 lines) — all HTML structure, CSS (inline `<style>`), and JavaScript (inline `<script>`)
- **`sw.js`** — Service Worker implementing network-first caching for offline support (cache version: `fitness-v8`)

### JavaScript Module Layout (all inside `index.html`)

| Lines | Responsibility |
|-------|---------------|
| ~844–864 | `EX` object — exercise definitions with MET values, section groupings, goal defaults |
| ~889–898 | `load()` / `save()` / `loadProfile()` / `saveProfileStore()` — localStorage persistence |
| ~908–961 | Calorie burn (`calcBurnKcal`), BMR (Mifflin-St Jeor), achievement logic |
| ~1238–1350 | Modal system, tab switching, feel-tag selection, water intake UI |
| ~1354–1541 | `renderSummary()`, SVG line charts, heatmap, trend rendering |
| ~1546–1674 | `renderHistory()`, `openDetail()` day-detail modal |
| ~1679–1910 | Settings: profile, per-exercise targets, JSON import/export, CSV export |
| ~1915–1985 | Meal logging with calorie/protein tracking |

### Data Storage (localStorage)

All persistence uses two keys:

**`ft_log`** — daily exercise and health data:
```js
{
  "YYYY-MM-DD": {
    exercises: {
      [exerciseId]: {
        type,           // "reps" | "duration" | "distance"
        totalSets, totalReps, totalSecs, totalKm, totalMin,
        feelCompletion, feelMuscle, feelOther, lastNote
      }
    },
    water: 2000,        // ml
    stretch: true,
    energy: 4,          // 1–5
    weight: 75.5,       // kg
    sleep: 7.5,         // hours
    meals: [{ type, kcal, protein, note, time }],
    journals: [{ time, energy, note }],
    kcalIn: 2500,
    protein: 150
  }
}
```

**`ft_profile`** — user settings:
```js
{
  height: 184,
  waterGoal: 2000,
  defaultWeight: 75,
  proteinGoal: 110,
  defaultSets: 3,
  customTargets: { [exerciseId]: { sets, reps } }
}
```

### Exercise Definitions (`EX` object)

Exercises belong to one of four sections: `cardio`, `legs`, `upper`, `core`. Each entry includes:
- `name` — display name
- `section` — section key
- `type` — `"reps"`, `"duration"`, or `"distance"`
- `met` — MET value for calorie calculations
- `goalSets`, `goalReps` (or `goalSecs`) — default targets

### UI Conventions

- **Color scheme**: dark theme; primary accent `#c8f060` (lime green); defined as CSS custom properties on `:root`
- **Fonts**: `DM Mono` (monospace, primary UI font), `Noto Sans SC` (sans-serif fallback), loaded from Google Fonts
- **Navigation**: four tabs — Today, Summary, History, Settings
- **Modals**: exercise logging and day-detail views use a layered modal pattern
- **Mobile-first**: designed for iOS/Android PWA installation; touch targets sized accordingly

## Key Conventions

- **No abstraction layers** — the codebase is intentionally flat. DOM manipulation, calculations, and rendering are all done inline without utility wrappers.
- **Re-render on change** — after any data mutation, call the relevant `render*()` function to refresh the UI rather than doing incremental DOM updates.
- **Date keys** — always use `localDate()` (not `new Date().toISOString()`) to generate `YYYY-MM-DD` keys; this handles timezone offsets correctly.
- **Cache busting** — when modifying `sw.js` caching behavior, increment the `fitness-v8` version string to force cache refresh on next load.
- **SVG charts** — charts are rendered by constructing SVG markup as strings and injecting via `innerHTML`; no charting library is used.
