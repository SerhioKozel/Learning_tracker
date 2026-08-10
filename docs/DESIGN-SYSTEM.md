# Design System

**Project:** Learning Tracker  
**Last Updated:** 2026-08-07  

The visual language is implemented as a combination of Tailwind CSS utility classes and CSS custom properties (`index.css`). The system is designed to work in both dark (default) and light themes through a single set of semantic color tokens.

---

## Principles

- **Semantic tokens over raw values** — components reference `ink-700` (a surface color), not `#3a4150`. This lets the theme invert without class duplication.
- **Minimal custom CSS** — almost everything is Tailwind utilities. Custom classes exist only for patterns repeated 10+ times (`.surface`, `.btn-primary`, `.chip`).
- **Dark-first** — the dark theme is `:root`. Light is a `.light` class override on `<html>`.

---

## Color Ramps

### Ink — Surfaces, Text, Borders

The `ink` ramp is a custom neutral scale that inverts between themes. In dark mode it runs from very dark (ink-980) to near-white (ink-100). In light mode those values flip — `--ink-980: #f0f2f7`, `--ink-100: #1a1f2e`.

| Token | Dark | Light | Typical Use |
|-------|------|-------|-------------|
| `ink-980` | `#0c0e13` | `#f0f2f7` | App background |
| `ink-950` | `#101218` | `#f4f6fa` | Page background |
| `ink-900` | `#151821` | `#ffffff` | Surface (cards) |
| `ink-800` | `#1c2029` | `#f7f8fb` | Raised surface, inputs |
| `ink-700` | `#3a4150` | `#dde1eb` | Borders, disabled elements |
| `ink-600` | `#5a6478` | `#b0b9c8` | Muted labels |
| `ink-500` | `#828da3` | `#828da3` | Secondary text |
| `ink-400` | `#8b95a8` | `#67707f` | Icon color |
| `ink-300` | `#9ba5b8` | `#5a6373` | Body text |
| `ink-200` | `#cbd5e1` | `#3d4554` | Strong body text |
| `ink-100` | `#e8ecf3` | `#1a1f2e` | High-contrast text |

### Semantic Accent Ramps

Standard Tailwind ramps used at fixed opacities for semantic meaning:

| Ramp | Use Case |
|------|----------|
| `sky-*` | Primary accent, interactive elements, sky boards |
| `teal-*` | Secondary accent, "learning" status, teal boards |
| `emerald-*` | Success, "completed" status, mastered topics |
| `amber-*` | Warning, "review" status, notifications |
| `rose-*` | Destructive actions, "hard" difficulty, error states |

### `text-white` Override

The `textColor.white` Tailwind alias resolves to `var(--text-strong)` — which is `#ffffff` in dark mode and `#0d1220` in light mode. This means `text-white` is the correct class for "high-contrast heading" rather than forcing literal white in both themes.

Use `text-always-white` (a utility class) when you genuinely need `#ffffff` regardless of theme (e.g. text on a colored background like avatar initials or the logo icon).

---

## Typography

| Element | Class | Weight | Size |
|---------|-------|--------|------|
| Page title | `text-3xl font-bold tracking-tight text-white` | 700 | 30px |
| Section heading | `text-sm font-semibold text-white` | 600 | 14px |
| Body / labels | `text-sm text-ink-300` | 400 | 14px |
| Secondary label | `text-xs text-ink-500` | 400 | 12px |
| Meta / caption | `text-[10px] text-ink-600` | 400–600 | 10px |
| Monospace (IDs, dates) | `font-mono tabular-nums` | — | inherited |

**Font:** Inter (via Google Fonts) with `font-feature-settings: 'cv02', 'cv03', 'cv04', 'cv11'` for slightly more refined numerals and punctuation.

---

## Spacing Scale

Standard Tailwind 4px base unit. Common patterns:

- Page padding: `px-8 py-8`
- Section gap: `mt-6` / `mt-8`
- Card padding: `p-5`
- Form field gap: `space-y-4`
- Tight list rows: `space-y-1` / `py-2.5`

---

## Surface Classes

Defined in `index.css` `@layer components`:

```css
.surface        { background-color: var(--surface-bg); border: 1px solid var(--hairline); }
.surface-raised { background-color: var(--surface-raised-bg); border: 1px solid var(--hairline-strong); }
.glass          { background-color: var(--glass-bg); backdrop-filter: blur(16px); border: 1px solid var(--hairline); }
.glass-strong   { background-color: var(--glass-strong-bg); backdrop-filter: blur(16px); border: 1px solid var(--hairline-strong); }
```

| Class | Use |
|-------|-----|
| `.surface` | Cards, panels |
| `.surface-raised` | Dropdowns, popovers |
| `.glass` | Sidebar |
| `.glass-strong` | Header |

---

## Button Variants

```css
.btn-primary  /* Sky accent, with glow shadow */
.btn-ghost    /* Transparent, ink text, subtle hover */
.btn-soft     /* Low-opacity white/black background */
```

Usage patterns:

```jsx
// Primary action
<button className="btn-primary">
  <Plus className="h-4 w-4" /> New topic
</button>

// Secondary / navigation
<button className="btn-ghost text-xs">
  View all <ChevronRight className="h-3.5 w-3.5" />
</button>

// Tertiary / cancel
<button className="btn-soft">Cancel</button>
```

All buttons include `active:scale-[0.98]` for tactile feedback.

---

## Chip (Badge/Tag)

```css
.chip { @apply inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium; }
```

Always combined with semantic color classes:

```jsx
// Status badge
<span className={`chip ${statusConfig[status].bg} ${statusConfig[status].text} border ${statusConfig[status].border}`}>
  <span className={`h-1.5 w-1.5 rounded-full ${statusConfig[status].dot}`} />
  {statusConfig[status].label}
</span>

// Simple tag
<span className="chip bg-ink-700/40 text-ink-300 border border-ink-600/40">
  TypeScript
</span>
```

---

## Shadows

| Token | CSS | Use |
|-------|-----|-----|
| `shadow-glow` | `0 0 20px rgba(56,189,248,0.25)` | Logo icon, focused primary elements |
| `shadow-card` | `0 2px 8px rgba(0,0,0,0.3) + ring` | Default card shadow |
| `shadow-lift` | `0 12px 32px rgba(0,0,0,0.5) + ring` | Elevated/hovered cards, drawers |

---

## Overlay / Modal Backdrop

```css
.overlay {
  background-color: var(--overlay-bg);
  backdrop-filter: blur(4px);
}
```

Dark: semi-transparent black. Light: semi-transparent white. Always used as a fixed inset behind drawers and modals.

---

## Animations

Defined in `tailwind.config.js`:

| Class | Effect | Use |
|-------|--------|-----|
| `animate-fade-in` | Opacity 0→1, 250ms | Modal overlays |
| `animate-fade-up` | Opacity + translateY 8px→0, 350ms | Page sections |
| `animate-scale-in` | Opacity + scale 0.96→1, 200ms | Modal dialogs |
| `animate-slide-in-right` | Opacity + translateX 24px→0, 300ms | Topic drawer |

Staggered entrance for dashboard sections uses `animate-delay-100/200/300/400`.

---

## Icon Usage

All icons are from `lucide-react`. Standard sizes:

- `h-4 w-4` — inline icons in buttons, labels
- `h-5 w-5` — card header icons
- `h-8 w-8` — empty-state icons
- `strokeWidth={2}` — default
- `strokeWidth={2.2}` — logo icon (slightly heavier for brand feel)

---

## Board Icons

Five icons represent different technology domains:

| Icon | Name | Use Case |
|------|------|----------|
| `Layout` | Layout | Frontend, UI |
| `Network` | Network | Networking, APIs |
| `Binary` | Binary | Algorithms, CS theory |
| `Server` | Server | Backend, Infrastructure |
| `Cloud` | Cloud | Cloud, DevOps |

These are always accessed through the `boardIcons` map rather than hardcoded icon names.

---

## Status Color System

Each status has a consistent set of color values used across the app:

```typescript
statusConfig[status] → { label, bg, text, border, dot }
```

| Status | Color | Label |
|--------|-------|-------|
| `to_learn` | ink (neutral) | To Learn |
| `learning` | teal | Learning |
| `practice` | sky | Practice |
| `review` | amber | Review |
| `completed` | emerald | Completed |
