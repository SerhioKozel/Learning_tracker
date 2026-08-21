# Design System

**Project:** Learning Tracker  
**Last Updated:** 2026-08-09

The visual language is implemented as Tailwind CSS utility classes extended with CSS custom properties (`index.css`). The system supports dark and light themes from a single set of class names — no `dark:` variants needed.

---

## Principles

- **Semantic tokens, not raw values** — components reference `ink-700` (a surface color), never `#3a4150`. Theme switching inverts the ink ramp transparently.
- **Dark-first** — `:root` defines dark values. `.light` on `<html>` overrides them.
- **Minimal custom CSS** — Tailwind utilities handle almost everything. Custom classes exist only for patterns repeated across many components (`.surface`, `.btn-primary`, `.chip`).
- **Single source of truth** — every semantic config map (statusConfig, boardColorMap, etc.) lives in `src/config/index.ts`. Components never hardcode color class names directly.

---

## Color System

### Ink Ramp — Surfaces, Text, Borders

The `ink` ramp is a custom neutral scale that inverts between themes. In dark mode it runs from near-black (ink-980) to near-white (ink-100). In light mode those values flip.

| Token | Dark value | Light value | Typical use |
|-------|-----------|------------|-------------|
| `ink-980` | `#0c0e13` | `#f0f2f7` | App background |
| `ink-950` | `#101218` | `#f4f6fa` | Page background |
| `ink-900` | `#151821` | `#ffffff` | Card surfaces |
| `ink-800` | `#1c2029` | `#f7f8fb` | Raised surfaces, inputs |
| `ink-700` | `#3a4150` | `#dde1eb` | Borders, dividers |
| `ink-600` | `#5a6478` | `#b0b9c8` | Muted labels, placeholder |
| `ink-500` | `#828da3` | `#828da3` | Secondary text |
| `ink-400` | `#8b95a8` | `#67707f` | Icon color |
| `ink-300` | `#9ba5b8` | `#5a6373` | Body text |
| `ink-200` | `#cbd5e1` | `#3d4554` | Strong body text |
| `ink-100` | `#e8ecf3` | `#1a1f2e` | High-contrast text |

### Semantic Accent Ramps

Standard Tailwind ramps at specific opacities for semantic meaning:

| Ramp | Semantic role |
|------|--------------|
| `sky` | Primary accent, interactive elements, sky-colored boards |
| `cyan` | DevTools, CLI-colored boards |
| `teal` | Learning status, teal-colored boards |
| `emerald` | Completed status, success states, emerald-colored boards |
| `amber` | Review status, warnings, amber-colored boards |
| `orange` | Mobile, design-colored boards |
| `rose` | Hard difficulty, destructive actions, rose-colored boards |
| `violet` | ML, AI-colored boards |
| `indigo` | Languages, compilers-colored boards |

### Special Tokens

| Token | Use |
|-------|-----|
| `text-white` | Resolves to `var(--text-strong)` — correct heading color in both themes |
| `text-always-white` | Literal `#ffffff` regardless of theme — for text on colored backgrounds |

---

## Typography

| Role | Classes | Weight | Size |
|------|---------|--------|------|
| Page title | `text-3xl font-bold tracking-tight text-white` | 700 | 30px |
| Section heading | `text-sm font-semibold text-white` | 600 | 14px |
| Body | `text-sm text-ink-300` | 400 | 14px |
| Secondary label | `text-xs text-ink-500` | 400 | 12px |
| Caption / meta | `text-[10px] text-ink-600` | 400–600 | 10px |
| Monospace | `font-mono tabular-nums` | — | inherited |

**Font:** Inter (Google Fonts) with `font-feature-settings: 'cv02', 'cv03', 'cv04', 'cv11'`.

---

## Surface Classes

Defined in `index.css @layer components`. Use these instead of rewriting the same border + background pattern.

| Class | Description | Use |
|-------|-------------|-----|
| `.surface` | Card background + hairline border | Cards, panels |
| `.glass` | Blurred background + border | Sidebar |
| `.glass-strong` | Stronger blur + border | Header bar |
| `.overlay` | Semi-transparent backdrop + blur | Modal backgrounds |

---

## Button Variants

| Class | Description | Use |
|-------|-------------|-----|
| `.btn-primary` | Sky accent fill with glow shadow | Primary CTA |
| `.btn-ghost` | Transparent, ink text, subtle hover | Navigation, secondary actions |
| `.btn-soft` | Low-opacity neutral background | Cancel, tertiary |

All buttons include `active:scale-[0.98]` for tactile press feedback.

```tsx
// Primary action
<button className="btn-primary">
  <Plus className="h-4 w-4" /> New topic
</button>

// Secondary
<button className="btn-ghost text-xs">
  View all <ChevronRight className="h-3.5 w-3.5" />
</button>

// Cancel
<button className="btn-soft">Cancel</button>
```

---

## Chip (Badge / Tag)

`.chip` provides the base shape. Always combine with semantic color classes:

```tsx
// Status badge
<span className={`chip ${statusConfig[status].bg} ${statusConfig[status].text} border ${statusConfig[status].border}`}>
  <span className={`h-1.5 w-1.5 rounded-full ${statusConfig[status].dot}`} />
  {statusConfig[status].label}
</span>

// Topic tag
<span className="chip bg-ink-700/40 text-ink-300 border border-ink-600/40">
  typescript
</span>
```

---

## Status System

Each status has a consistent color set accessed via `statusConfig` from `src/config/index.ts`:

```typescript
statusConfig[status] → { label, bg, text, border, dot }
```

| Status | Color | Label | Dot class |
|--------|-------|-------|-----------|
| `to_learn` | Neutral ink | To Learn | `bg-ink-400` |
| `learning` | Teal | Learning | `bg-teal-400` |
| `practice` | Sky | Practice | `bg-sky-400` |
| `review` | Amber | Review | `bg-amber-400` |
| `completed` | Emerald | Completed | `bg-emerald-400` |

---

## Board Color System

Each board has a color that controls its accent across the entire UI. Accessed via `boardColorMap` from `src/config/index.ts`:

```typescript
boardColorMap[board.color] → { bg, text, border, gradient, ring, dot }
```

| Color | Value |
|-------|-------|
| `sky` | Blue — frontend, web |
| `cyan` | Cyan — DevTools, CLI |
| `teal` | Teal — data, APIs |
| `emerald` | Emerald — completed domains |
| `amber` | Amber — algorithms, CS |
| `orange` | Orange — mobile, design |
| `rose` | Rose — systems, infra |
| `violet` | Violet — ML, AI |
| `indigo` | Indigo — languages, compilers |

---

## Board Icons

Five icons map to technology domains. Accessed via `BOARD_ICONS` from `src/config/index.ts`:

| Name | Icon | Domain |
|------|------|--------|
| `Layout` | `<Layout>` | Frontend, UI |
| `Network` | `<Network>` | Networking, APIs |
| `Binary` | `<Binary>` | Algorithms, CS theory |
| `Server` | `<Server>` | Backend, infrastructure |
| `Cloud` | `<Cloud>` | Cloud, DevOps |

Never import these icons directly in components — always access through `BOARD_ICONS[board.icon]`.

---

## Shadows

| Token | CSS | Use |
|-------|-----|-----|
| `shadow-glow` | `0 0 20px rgba(56,189,248,0.25)` | Logo, focused primary elements |
| `shadow-card` | `0 2px 8px rgba(0,0,0,0.3) + ring` | Default card elevation |
| `shadow-lift` | `0 12px 32px rgba(0,0,0,0.5) + ring` | Hovered cards, drawers, modals |

---

## Animations

Defined in `tailwind.config.js`. All use `@keyframes` defined in `index.css`.

| Class | Effect | Duration | Use |
|-------|--------|----------|-----|
| `animate-fade-in` | opacity 0→1 | 250ms | Overlays, page transitions |
| `animate-fade-up` | opacity + translateY 8px→0 | 350ms | Dashboard sections |
| `animate-scale-in` | opacity + scale 0.96→1 | 200ms | Modals, dialogs |
| `animate-slide-in-right` | opacity + translateX 24px→0 | 300ms | TopicDrawer |

Delay utilities: `animate-delay-100` through `animate-delay-400` for staggered entrances.

---

## Icon Usage

All icons from `lucide-react`. Standard sizes:

| Context | Size | strokeWidth |
|---------|------|------------|
| Inline in buttons, labels | `h-4 w-4` | 2 |
| Card header icons | `h-5 w-5` | 2 |
| Empty-state illustrations | `h-8 w-8` | 2 |
| Logo/brand icon | `h-5 w-5` | 2.2 |

---

## Spacing

Standard Tailwind 4px base unit. Common patterns:

| Pattern | Value |
|---------|-------|
| Page padding | `px-8 py-8` |
| Section gap | `mt-6` / `mt-8` |
| Card padding | `p-5` |
| Form field gap | `space-y-4` |
| List rows | `space-y-1` / `py-2.5` |

---

## Design System Reference Page

The `DesignSystem.tsx` component renders a live preview of all tokens and components. It is kept in the codebase as living reference documentation but is intentionally not wired to any route — it is unreachable from the running app in both development and production. To view it, temporarily add a `<Route>` for it in `App.tsx` locally; do not merge that route.
