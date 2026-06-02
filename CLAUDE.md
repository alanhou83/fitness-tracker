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

**所有代码改动必须先描述方案、等用户确认后才能动手执行。** 除非用户明确说"不用确认"或"直接做"，否则任何文件修改都必须等待确认。

**Always show a preview or describe the plan and wait for confirmation before modifying `index.html`.** The user is non-technical — use plain language, offer HTML preview files for UI changes, and only touch code after explicit approval.

## Architecture

The entire application lives in two files:

- **`index.html`** (~2200 lines) — all HTML structure, CSS (inline `<style>`), and JavaScript (inline `<script>`)
- **`sw.js`** — Service Worker implementing network-first caching (current version: `fitness-v10`)

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
  customTargets: { [exerciseId]: { sets, reps, secPerSet } },  // per-exercise overrides; sets=0 hides from today
  sectionTargets: { cardio: 5, legs: 5, upper: 5, core: 5 }  // section achievement threshold (0–20); 0 hides section
}
```

### Exercise Definitions (`EX` object)

Exercises belong to one of four sections: `cardio`, `legs`, `upper`, `core`. Each entry:
- `name` — display name (Chinese)
- `section` — section key
- `type` — `"reps"`, `"hold"`, or `"run"`
- `met` — MET value for calorie calculations
- `goalSets`, `goalReps` — default targets
- `secPerSet` — default seconds per set (reps type only); used for calorie calculation; `hold` and `run` set to 0

**Adding a new exercise** requires changes in two places:
1. Add entry to the `EX` object in the JS section
2. Add the corresponding `<div class="ex-item" data-id="...">` HTML block inside the correct section card in the today's check-in page

Current core exercises include `situp_crunch`（仰卧卷腹，3组×20个）added 2026-05-31.

### UI Conventions

- **Color scheme**: dark theme; primary accent `#c8f060` (lime green); CSS custom properties on `:root`
- **Fonts**: `DM Mono` (monospace), `Noto Sans SC` (sans-serif), from Google Fonts
- **Navigation**: four tabs — 今日打卡, 汇总统计, 历史记录, 设置
- **Header**: date + title row with achievement icons inline (`<span class="ach-inline">`), streak badge top-right
- **Modals**: exercise logging and day-detail views use a layered modal pattern
- **Mobile-first**: designed for iOS PWA installation

### Settings Page Structure

- 个人信息 — height, weight, protein/water goals
- 动作目标设置 — collapsible (`toggleExTargets()`), collapsed by default; rendered by `renderExTargetList()` grouped by section (cardio → legs → upper → core); each section header has a collapsible toggle and section achievement threshold (−/+); each exercise row shows 3 columns: 组数 / 每组次数 / 每组用时 (reps type), or 组数 / 每组秒数 (hold type), or 组数 + note (run type); all values support inline tap-to-edit input
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
- **`getExGoalSets/Reps(id)`** — must use `custom.sets !== undefined` (not `custom.sets`) to correctly read stored value of `0`; using truthiness check causes 0 to fall back to default
- **Exercise visibility** — `applyExVisibility()` shows/hides `.ex-item` elements in today's tab based on `getExGoalSets(id) === 0`; also hides the parent `.section-card` if all its exercises are hidden; called on page init, tab switch to 今日打卡, and after `adjExSets()`
- **Sets = 0 means disabled** — setting goalSets to 0 hides the exercise from today's check-in; displayed in red in settings; `adjExSets` allows min 0 (not 1)
- **Section target** — `getSectionTarget(section)` reads `profile.sectionTargets[section]` (default 5); used by `getSectionAchievement()`; set to 0 hides the entire section card in today's tab; adjusted via `adjSectionTarget(section, delta)` (range 0–20); UI controls are in each section header inside `renderExTargetList()`
- **Progress circle** — `updateCircle(id, log)` uses `getExGoalSets(id) * getExGoalReps(id)` for goalTotal (NOT `ex.goalSets * ex.goalReps`); modal target text also reads from `getExGoalSets/Reps`
- **Calorie formula** — `calcBurnKcal()`: reps type uses `totalReps × (getExSecPerSet(id) / getExGoalReps(id)) / 3600 × MET × weight`; hold type uses `totalSecs / 3600 × MET × weight`; run type uses `totalKm × weight × 1.036`; `getExSecPerSet(id)` reads `customTargets[id].secPerSet` with fallback to `EX[id].secPerSet`
- **Inline edit** — `inlineEdit(span, id, field)` replaces a value span with a number input on click; fields: `'sets'`, `'reps'`, `'sec'`; saves on blur or Enter, cancels on Escape
- **Run type special handling** — settings row shows only sets column + 「记录时长/距离」note; modal subtitle shows 「记录时长 / 距离」instead of target sets×reps; modal shows time(min) + distance(km) inputs; no secPerSet applies
