# Academic Resort: Definitive Master Design & Architecture Blueprint (Next.js 16.1.6)

This document represents the ultimate synthesis of all project iterations (V1–V8). It serves as the definitive technical and visual guide for migrating the Academic Resort to a premium **Next.js 16.1.6** application powered by **Supabase**, focusing on departmental usability, internal reliability, and high-end aesthetics.

---

## 1. Visual Identity & Design Philosophy
The vision is a **Premium Digital Library**—a high-utility, immersive archive that feels alive and professional.

### A. Surface & Light Strategy
- **Deep Glassmorphism**: Universal `backdrop-filter: blur(18px)` across sidebars, search bars, and card overlays.
- **The "Glow & Lift" System**: 
    - **Shadow Stack**: Complex, multi-layered shadows (`box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)`) to avoid the "flat" look.
    - **Polished Borders**: 1px borders of white-opacity (`border: 1px solid rgba(255, 255, 255, 0.1)`) that simulate edge-light.
- **Chromatic Accents**: High-contrast, vibrant HSL gradients (Core: `HSL(220, 100%, 60%)` to `HSL(200, 100%, 50%)`) for primary interactive states.

### B. Typography & Modular Scale
- **Primary Headers**: `Outfit` (Google Fonts). Weight: **700 (Bold)** for branding/titles; **500 (Medium)** for section headers.
- **Body & Data**: `Inter` (Google Fonts). Tightened tracking (`-0.011em`) for a compact, professional look.
- **Scale**: A strict modular hierarchy ensuring clear information architecture across dense data tables.

---

## 2. Advanced Architectural Framework (Next.js 16.1.6)

The migration focuses on a "Framework-First" approach to ensure every department resource is accessible with zero friction.

### A. Infrastructure & Data Flow
- **Supabase Core**: Powered by the `ehsbbmedneuvsjgefsyj` project. Utilizing a normalized relational schema (Batches, Semesters, Courses, Teachers, Resource Links).
- **Server-Side Boundary**: All API interactions occur via **Next.js Server Actions** and **Server Components**. Service Role keys are strictly environment-side.
- **Hydration & Storage**:
    - **Streaming & Suspense**: Critical data is streamed with `Suspense` for instant UI framing.
    - **Hybrid Rendering**: **SSG** for historical data, **ISR** (15m) for current semester links, and **SSR** for real-time search.

### B. Navigation & Usability (Student First)
- **Context-Aware Navigation**: URLs like `/batch/[id]/semester/[id]` allow granular bookmarking for students.
- **Next.js Parallel Routes**: Use `@modal` slots for "Quick View" resource previews (e.g., viewing a PDF without leaving the course list).
- **Intercepting Routes**: Clicking a teacher's name pulls up a slide-over panel instead of a full page reload.
- **Command Center (Cmd+K)**: A global command palette for instant navigation across batches and faculty profiles.

---

## 3. Atomic Implementation Details

### Layer 1: Atoms (Basic UI)
- **`SubjectIcon.tsx`**: SVG icons (📚, 📊, 📋) with intelligent color-coding.
- **`StatusIndicator.tsx`**: Pulsing micro-badges showing "Live", "Verified", or "New" states.
- **`PremiumAvatar.tsx`**: Soft-rounded faculty avatars with unified fallbacks.

### Layer 2: Molecules (Interactive Units)
- **`AcademicCard.tsx`**: Translucent card unit with a **150ms hover-lift** effect and glass-polish borders.
- **`AcademicLink.tsx`**: Intelligent resource wrapper detecting MIME types and providing premium icons (PDF, DOCX, ZIP).
- **`FacultyChip.tsx`**: Compact teacher identity with a subtle glow-border and profile linkage.

### Layer 3: Organisms (Structural Hubs)
- **`UnifiedSearchHero.tsx`**: High-blur search centerpiece with **Direct Supabase Suggester**.
- **`LiquidAccordion.tsx`**: Folder component powered by **Framer Motion**:
    - **Liquid Expansion**: 150ms spring transitions for a fluid feel.
    - **Skeleton Hubs**: Custom placeholders matching exact content aspect-ratios.
    - **Persistent State**: URLs update as folders expand.

---

## 4. Critical System Audit & Reliability

### A. Technical Debt Map (From Legacy Site)
| Component | Debt Level | Issue | Next.js Solution |
| :--- | :--- | :--- | :--- |
| `script.js` | High | Monolithic event handling; tight coupling. | Modular Component States. |
| `drive-utils.js` | Medium | Recursive logic causes API timeouts. | Supabase Indexing + Cached Proxies. |
| `styles.css` | High | 87KB monolithic file; duplication. | Modular CSS / Design Tokens. |
| `storage/cache` | Low | `localStorage` prone to stale data. | Vercel Data Cache / ISR. |

### B. Performance & Security Guardrails
- **Zero Content Shift (CLS)**: Hard-coded aspect-ratio placeholders for all dynamic content.
- **Lava Lamp Navigation**: High-end active indicator that glides between navigation items.
- **Rate-Limited Proxy**: Vercel Edge Middleware prevents excessive Drive API crawling.

---

## 5. Site Usability & Privacy
- **Internal Focus**: SEO is de-prioritized to protect departmental privacy; site is designed for internal departmental speed.
- **Dynamic OGP**: High-quality social cards optimized for sharing in WhatsApp and Discord student groups.
- **Accessibility**: Full WCAG 2.1 Contrast compliance for the "Dark Library" aesthetic.
