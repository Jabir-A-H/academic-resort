# Academic Resort: Definitive Master Design & Architecture Blueprint

This document represents the ultimate synthesis of all project iterations (V1–V8). It serves as the definitive technical and visual guide for migrating the Academic Resort to a premium **Next.js 16.1.6** application powered by **Supabase**. It focuses on departmental speed, internal privacy, and a "Modern Library" aesthetic.

---

## 1. Visual Identity & Design Philosophy
The vision is to transform the site into a **Premium Digital Library**—a space that feels as professional as a research archive but as responsive as a modern SaaS tool.

### A. Surface & Light Strategy
- **Deep Glassmorphism**: Universal `backdrop-filter: blur(18px)` across sidebars, search bars, and card overlays.
- **The "Glow & Lift" System**: 
    - **Shadow Stack**: Multi-layered shadows (`box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)`) to provide depth without visual mud.
    - **Physical Border**: 1px border of white-opacity (`border: 1px solid rgba(255, 255, 255, 0.1)`) simulating edge-light on glass panes.
- **Chromatic Accents (HSL)**: 
    - **Primary Base**: `HSL(220, 100%, 60%)` (Deep Navy).
    - **Active Accent**: `HSL(200, 100%, 50%)` (Cyan-Blue).

### B. Typography & Modular Scale
- **Pairing**: `Outfit` (Headings) and `Inter` (Body).
- **Scale**: Strict **1.25x modular scale**.
- **Tracking**: `-0.011em` for `Inter` to maintain a compact, professional information density.

---

## 2. Advanced Architectural Framework (Next.js 16.1.6)

The migration focuses on a "Framework-First" approach to ensure every department resource is accessible with zero friction.

### A. The Supabase Relational Engine
The database (`ehsbbmedneuvsjgefsyj`) replaces the legacy `batch-xx.json` files.
- **Data Flow**: `BATCHES` → `SEMESTERS` → `BATCH_COURSES` → `RESOURCE_LINKS`.
- **Relational Benefit**: Centralized management of faculty profiles and course titles across 8+ batches.

### B. Framework Implementation Layers
- **Streaming & Suspense**: Critical data is streamed ensuring the core UI is visible instantly.
- **Parallel & Intercepting Routes**:
    - **Resource Previews**: Clicking a drive link opens a parallel route drawer (`@drawer`), allowing the student to preview files without losing their scroll position in the archive.
    - **Teacher Profiling**: Clicking a teacher’s name intercepts the route to show a slide-over panel.
- **Security Boundary**: All API interactions occur via **Next.js Server Actions**. Service Role keys are strictly environment-side; the client bundle contains ZERO external keys.

---

## 3. Atomic Migration Layer (Vanilla to Next.js)

Every niche function of the current site is mapped to its modern equivalent for a 1:1 (or better) transition.

| Legacy Site Aspect | Technical Debt Issue | Next.js 16.1.6 Evolution |
| :--- | :--- | :--- |
| **`data-include`** | Stuttery load; race conditions. | **Next.js Layouts** (Stable, SSR-injected). |
| **`batch-loader.js`** | Large initial payload (8+ JSONs). | **Server Components** (Fetches only what's needed). |
| **`drive-utils.js`** | Recursive crawl = API Search Bomb. | **Supabase Indexing** (Instant query vs wait-for-crawl). |
| **Duplicate Logic** | Manual filtering in `drive-utils.js`. | **Postgres UNIQUE constraints** on Resource Links. |
| **Apps Grid** | Static HTML grid; difficult to update. | **Command Center (Cmd+K)** - Global, interactive palette. |
| **`styles.css`** | 87KB monolithic, duplicate rules. | **CSS Modules** (Scoped, Pay-as-you-load styles). |
| **hydration lag** | `setTimeout(..., 100)` logic. | **Native React Concurrent Rendering**. |

---

## 4. Interaction Design & Usability (Student First)

### A. The "Premium" Flow
- **Lava Lamp Side-Nav**: A high-end active indicator that glides behind navigation links during router changes.
- **Liquid Expansion**: Folder components built with **Framer Motion** featuring 150ms spring-transitions for a tactile feel.
- **Skeleton Hubs**: Custom placeholders matching exact content aspect-ratios to prevent Layout Shift (CLS).

### B. Internal Privacy & SEO
- **Department Privacy**: Public SEO and crawlers are deprioritized.
- **Social Sharing**: High-quality **Dynamic OGP social cards** optimized for WhatsApp and Discord groups (e.g., "30th Batch: Accounting Notes").

---

## 5. Security & Internal Reliability Matrix

- **Zero-Key Frontend**: Absolute removal of all API/Service keys from the client-side bundle.
- **Rate-Limited Proxy**: Vercel Edge Middleware prevents bot-driven Drive crawling.
- **Zod Schema Validation**: Every data fetch from Supabase is validated against Zod schemas to eliminate "broken-link" errors in dynamic routes.

---

## 6. Implementation roadmap (Technical Tiers)

- **Tier 1 (Foundation)**: Next.js 16.1.6 initialization with Supabase Server-Client utilities.
- **Tier 2 (Design Port)**: Porting of HSL tokens and Shadow Stacks from `.designplans` into Modular CSS.
- **Tier 3 (Service Integration)**: Connecting the `RESOURCE_LINKS` and `TEACHERS` tables to the `LiquidAccordion` UI.
- **Tier 4 (Final Polish)**: Implementation of the "Lava Lamp" navigation and the Cmd+K Command Center.
