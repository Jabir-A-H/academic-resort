# Implement Master Migration Plan Phase 4

## Summary
Building on the successful migration to Next.js and Supabase, Phase 4 focuses on elevating the platform's user experience to a premium "Modern Digital Library" standard. This involves implementing a global Cmd+K search interface, fluid "Lava Lamp" navigation, and a refined design system using HSL color normalization for better consistency and dynamic manipulation.

## User Review Required

### Why HSL?
| Feature | Hex (`#3b82f6`) | HSL (`217 91% 60%`) | Benefit |
| :--- | :--- | :--- | :--- |
| **Readability** | Cryptic string | Intuitive components | Easier to understand which part is the color vs. brightness. |
| **Variations** | Requires external tools | Modify 3rd value (`60%` -> `70%`) | Effortless creation of hover states/shades in CSS. |
| **Opacity** | Requires `rgba` conversion | `hsl(... / 0.5)` | Native support for variable transparency in Tailwind. |
| **Consistency** | Hard to match vibrancy | Target specific saturation | Ensures all brand colors feel like they belong to the same family. |

> [!IMPORTANT]
> This plan introduces new dependencies (`framer-motion`, `kbar`).
> It also involves a significant refactor of `globals.css` to normalize colors to HSL.

## Proposed Changes

### Dependencies
- Install `framer-motion` for animations.
- Install `kbar` for the Cmd+K Command Center.

---

### Global Styling
#### [MODIFY] [globals.css](file:///f:/WebDev/academic-resort/app/globals.css)
- Refactor color variables from Hex to HSL.
- Base primary: `hsl(217, 91%, 60%)`.
- Increase glassmorphism blur from default to 20px.
- Define "light-catch" border utility.

#### [MODIFY] [tailwind.config.js](file:///f:/WebDev/academic-resort/tailwind.config.js)
- Map HSL variables to Tailwind colors (primary, background, etc.).

---

### Components
#### [MODIFY] [Sidebar.tsx](file:///f:/WebDev/academic-resort/components/Sidebar.tsx)
- Integrate `framer-motion`.
- Use `layoutId` on a background div for the "Lava Lamp" active link effect.
- Ensure smooth transitions between collapsed and expanded states.

#### [NEW] [CommandBar.tsx](file:///f:/WebDev/academic-resort/components/CommandBar.tsx)
- Implement `KBarProvider` and `KBarPortal`.
- Add core actions: Search, Navigate to Semesters, Toggle Sidebar.

#### [MODIFY] [layout.tsx](file:///f:/WebDev/academic-resort/app/layout.tsx)
- Wrap application with `CommandBar`.
- Add `Suspense` boundaries for resource streaming.

---

### Technical Refinements
#### [NEW] [route.ts](file:///f:/WebDev/academic-resort/app/api/cron/link-monitor/route.ts)
- Implement a Vercel Cron endpoint to check Google Drive links (metadata validation).

## Verification Plan

### Automated Tests
- No existing test suite found. I will rely on visual verification and console logging.

### Manual Verification
1. **Cmd+K Center**:
   - Press `Ctrl+K` (or `Cmd+K` on Mac) to open the command bar.
   - Verify search functionality works as expected.
2. **Lava Lamp Side-Nav**:
   - Click between navigation items.
   - Verify the active indicator "slides" smoothly between links.
3. **Glassmorphism**:
   - Inspect modal and card borders/backgrounds for the 20px blur and light-catch effect.
4. **Streaming**:
   - Throttling network in DevTools to verify `Suspense` skeletons appear during data fetching.
