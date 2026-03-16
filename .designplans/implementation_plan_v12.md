# Academic Resort: Definitive High-Fidelity Master Blueprint

This document is the **Absolute Source of Truth** for the transformation of Academic Resort. It synthesizes all 11 previous architectural iterations into an exhaustive guide for migrating to **Next.js 16.1.6** with a **Supabase** backend. It balances premium "Modern Digital Library" aesthetics with high-performance departmental utility.

---

## 1. Visual Identity & "Modern Library" Design System

The objective is a "Digital Archive" that feels living, tactile, and premium.

### A. Surface, Light & tactile Physics
- **Deep Glassmorphism**: Use of `backdrop-filter: blur(20px)` for all primary navigational and overlay elements (sidebars, search bars, modals).
- **The "Glow & Lift" System**:
    - **Physical Elevation**: Multi-layered shadow stacks (`box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)`) to simulate depth.
    - **Polished Borders**: 1px borders using `rgba(255, 255, 255, 0.1)` on glass surfaces to catch simulated edge-light.
- **Vibrant Chromatic Accents (HSL)**:
    - **Active Base**: `HSL(217, 91%, 60%)` (Deep Indigo).
    - **Radiant Highlight**: `HSL(190, 95%, 52%)` (Brilliant Aqua).
    - These are used in "Lava Lamp" indicators and glowing hover-badges.

### B. Typography & Modular Scale
- **Pairing**: `Outfit` (Headings) for a geometric, futuristic feel; `Inter` (Body) for high-density legibility.
- **Tracking**: `-0.022em` for headings and `-0.011em` for secondary text to maintain a compact, "Apple-eque" professional density.
- **Scale**: A strict **1.25x (Major Third)** modular hierarchy for consistent information architecture across all viewports.

---

## 2. Advanced Architectural Framework (Next.js 16.1.6)

We are re-engineering the legacy "Engine" into a modular, server-hydrated system.

### A. The Supabase Relational Infrastructure
The database (`ehsbbmedneuvsjgefsyj`) replaces the legacy JSON monoliths.
- **Data Flow**: `BATCHES` → `SEMESTERS` → `BATCH_COURSES` → `RESOURCE_LINKS`.
- **Relational Integrity**: Unified management of `TEACHERS` across sections, ensuring faculty profiles propagate instantly to all semesters.

### B. Framework Implementation Layers
- **Streaming & Suspense**: Course lists and resource folders are streamed with per-component `Suspense` frames, ensuring zero "Layout Thrash" and instant frame visibility.
- **Contextual Navigation**: 
    - **Dynamic Segments**: `/batch/[batchId]/semester/[semId]` for granular sharing.
    - **Intercepting Routes**: Clicking a teacher’s profile or a resource preview uses `@drawer` slots to keep the student in the current context without a full page reload.
- **Security Boundary**: All API/Service keys are strictly environment-side. Native **Server Actions** handle all mutations, ensuring the client bundle contains zero sensitive information.

---

## 3. Atomic Migration Layer (Legacy to Modern)

Every niche function discovered in the vanilla audit is evolved into a high-performance framework pattern.

| Legacy Site Detail | Technical Debt Issue | Next.js 16.1.6 Evolution |
| :--- | :--- | :--- |
| **`data-include`** | 100ms hydration lag; broken SEO. | **Native Layouts** (Server-injected, instant). |
| **`batch-loader.js`** | Fetches 8+ static JSONs at once. | **Server Components** (Fetches only route-specific data). |
| **`drive-utils.js`** | Recursive API Search Bomb (Slow). | **Supabase Indexing** (Instant SQL queries vs Crawling). |
| **`Duplicate Logic`** | Manual filtering in JS. | **Postgres VIEW / UNIQUE constraints** (Database-level deduplication). |
| **Search Engine** | Vanilla JS `filter()` on large arrays. | **Supabase Full-Text Search** (Sub-10ms fuzzy search). |
| **`styles.css`** | 87KB monolithic file with duplication. | **CSS Modules** (Pay-as-you-view scoped styles). |
| **Apps Grid** | Static, hard-coded grid. | **Premium Masonry/Flex Grid** (Dynamic & responsive). |

---

## 4. Interaction Design & Usability (Student First)

### A. Tactical Feedback Patterns
- **Lava Lamp Side-Nav**: A high-end active indicator built with CSS `mask-image` or Framer Motion `layoutId` that glides smoothly behind navigational links.
- **Liquid Expansion**: Folder accordions use 150ms spring transitions to feel organic and "Alive."
- **Cmd+K Command Center**: A global interaction palette allowing students to jump to "Any Semester", "Any Teacher", or "Any Subject Code" instantly.

### B. Internal Privacy & Social Growth
- **Departmental Privacy**: Public SEO and crawlers are deprioritized in favor of internal speed and gated departmental access.
- **Dynamic OGP Cards**: Social previews are optimized for WhatsApp/Discord student groups, automatically pulling `Semester Name` + `Teacher Count` + `Subject Codes`.

---

## 5. Security & Reliability Guardrails
- **Zero-Key Frontend**: Absolute removal of all API/Service keys from the client code.
- **Rate-Limited Proxy**: Vercel Edge Middleware prevents scraper-bots from triggering Drive API limits.
- **Zod-Strict Hydration**: Every data fetch from Supabase is validated against Zod schemas, ensuring "Broken Links" or "Missing Data" never render in the UI.

---

## 6. Implementation roadmap (Technical Tiers)

- **Tier 1 (Foundation)**: Next.js 16.1.6 initialization + Supabase Server-Client configuration.
- **Tier 2 (Design Port)**: Implementation of HSL design tokens and Shadow Stacks into `globals.css`.
- **Tier 3 (Service Binding)**: Connecting `RESOURCE_LINKS` to the `LiquidAccordion` with Streaming support.
- **Tier 4 (Final Polish)**: Integration of the "Lava Lamp" navigation and the Cmd+K Command Center.
