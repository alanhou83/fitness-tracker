# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A standalone Progressive Web App (PWA) fitness tracker built entirely with vanilla HTML, CSS, and JavaScript. No build system, no package manager, no external dependencies. Deployed via GitHub Pages from the `main` branch at `alanhou83.github.io`.

## Running Locally

Serve the root directory with any static file server — the app requires a server context (not `file://`) for Service Workers to function:

```bash
python3 -m http.server 8080
```

No build steps, no `npm install`, no compilation required.

## Deployment

- GitHub Pages serves from the `main` branch
- Development happens on feature branches (e.g. `claude/...`)
- After committing to the feature branch, copy changed files to `main` and push:
  ```bash
  git checkout main
  git checkout <feature-branch> -- index.html sw.js
  git commit -m "..." && git push origin main
  git checkout <feature-branch>
  ```
- **Cache busting**: increment the `fitness-vN` version string in `sw.js` whenever changing cached files, to force PWA reload

## Workflow with User

**Always show a preview or describe the plan and wait for confirmation before modifying `index.html`.** The user is non-technical — use plain language, offer HTML preview files for UI changes, and only touch code after explicit approval.

## Architecture

The entire application lives in two files:

- **`index.html`** (~2200 lines) — all HTML structure, CSS (inline `<style>`), and JavaScript (inline `<script>`)
- **`sw.js`** — Service Worker implementing network-first caching (current version: `fitness-v9`)

### JavaScript Module Layout (all inside `index.html`)

| Lines | Responsibility |
|-------|---------------|
| ~850–870 | `EX` object — exercise definitions with MET values, section groupings, goal defaults |
| ~875–904 | `getExGoalSets/Reps()`, `load()` / `save()` / `loadProfile()` / `saveProfileStore()`, `localDate()` / `today()` |
| ~914–960 | `calcBurnKcal()`, `calcBMR()` (Mifflin-St Jeor), achievement logic |
| ~1238–1350 | Modal system, tab switching, feel-tag selection, water intake UI |
| ~1354–1541 | `renderSummary()`, SVG line charts, heatmap, trend rendering |
| ~1546–1674 | `renderHistory()`, `openDetail()` day-detail modal |
| ~1679–1910 | Settings: profile, per-exercise targets (collapsible), JSON import/export, CSV export |
| ~1706–1830 | `setAIRange()`, `exportAIData()` — AI analysis export with date range filter |
| ~1915–1985 | Meal logging with calorie/protein tracking |

### Data Storage (localStorage)

All persistence uses two keys:

**`ft_log`** — daily exercise and health data:
```js
{
  "YYYY-MM-DD": {
    exercises: {
      [exerciseId]: {
        type,           // "reps" | "hold" | "run"
        totalSets, totalReps, totalSecs, totalKm, totalMin,
        feelCompletion, feelMuscle, feelOther,
        lastNote        // per-exercise per-day note (distinct from journals)
      }
    },
    water: 2000,        // ml
    stretch: true,
    energy: 4,          // 1–5
    weight: 75.5,       // kg
    sleep: 7.5,         // hours
    meals: [{ type, kcal, protein, note, time }],
    journals: [{ time, energy, note }],  // general daily diary (not exercise-specific)
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

Exercises belong to one of four sections: `cardio`, `legs`, `upper`, `core`. Each entry:
- `name` — display name (Chinese)
- `section` — section key
- `type` — `"reps"`, `"hold"`, or `"run"`
- `met` — MET value for calorie calculations
- `goalSets`, `goalReps` — default targets

### UI Conventions

- **Color scheme**: dark theme; primary accent `#c8f060` (lime green); CSS custom properties on `:root`
- **Fonts**: `DM Mono` (monospace), `Noto Sans SC` (sans-serif), from Google Fonts
- **Navigation**: four tabs — 今日打卡, 汇总统计, 历史记录, 设置
- **Header**: date + title row with achievement icons inline (`<span class="ach-inline">`), streak badge top-right
- **Modals**: exercise logging and day-detail views use a layered modal pattern
- **Mobile-first**: designed for iOS PWA installation

### Settings Page Structure

- 个人信息 — height, weight, protein/water goals
- 动作目标设置 — collapsible (`toggleExTargets()`), collapsed by default
- 添加到手机桌面 — PWA install instructions
- 导出数据备份 — JSON backup + CSV (for data recovery)
- AI 分析导出 — date-range filtered export (`setAIRange()` / `exportAIData()`) with preset buttons (7/30/90/全部) and custom date inputs; outputs structured Chinese-labeled JSON including per-exercise stats, notes history, feel history, and body metric trends
- 导入数据 — JSON restore
- 数据状态

## Key Conventions

- **No abstraction layers** — flat codebase; DOM manipulation, calculations, and rendering all done inline
- **Re-render on change** — after any data mutation, call the relevant `render*()` function
- **Date keys** — always use `localDate()` (not `new Date().toISOString()`) for `YYYY-MM-DD` keys
- **SVG charts** — built as string markup injected via `innerHTML`; no charting library
- **`lastNote` vs `journals`** — `lastNote` is per-exercise per-day; `journals` is the general daily diary array; keep these separate
