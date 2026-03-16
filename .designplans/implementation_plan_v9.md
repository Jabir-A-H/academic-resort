# Academic Resort: Definitive Master Design & Architecture Blueprint

This document represents the ultimate synthesis of all project iterations (V1–V8). it serves as the definitive technical and visual guide for migrating the Academic Resort to a premium **Next.js 16.1.6** application powered by **Supabase**.

---

## 1. Visual Identity & Design Philosophy
The vision is a **Premium Digital Library**—a high-utility, immersive archive that feels alive and professional.

### A. Surface & Light Strategy
- **Deep Glassmorphism**: Universal `backdrop-filter: blur(18px)` across sidebars, search bars, and card overlays.
- **The "Glow & Lift" System**: 
    - **Shadow Stack**: Complex, multi-layered shadows (`box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)`) to avoid the "flat" look.
    - **Polished Borders**: 1px borders of white-opacity (`border: 1px solid rgba(255, 255, 255, 0.1)`) that simulate edge-light.
- **Chromatic Accents**: High-contrast, vibrant HSL gradients (Core: `HSL(220, 100%, 60%)` to `HSL(200, 100%, 50%)`) for active navigational items and primary CTA states.

### B. Typography & Modular Scale
- **Primary Headers**: `Outfit` (Google Fonts). Weight: **700 (Bold)** for branding/titles; **500 (Medium)** for section headers.
- **Body & Data**: `Inter` (Google Fonts). Tightened tracking (`-0.011em`) for a compact, professional look.
- **Scale**: A strict modular hierarchy ensuring clear information architecture across dense data tables.

---

## 2. Relational System Architecture (Supabase)

The back-end is anchored by the `ehsbbmedneuvsjgefsyj` Supabase project, providing a fully normalized Relational Model.

### A. Core Relational Logic
- **Inventory Hierarchy**: `BATCHES` → `SEMESTERS` → `BATCH_COURSES`. 
- **The Course Catalog**: Global `COURSES` table containing canonical code/title/syllabus data.
- **Faculty Linkage**: `TEACHERS` joined via `SECTIONS` to specific `BATCH_COURSES`.
- **Resource Repository**: `RESOURCE_LINKS` (Notes, Slides, etc.) uniquely keyed to the `BATCH_COURSES` intersection.

### B. Framework Implementation
- **Server Actions**: Native Next.js 16.1.6 actions for all data mutations, bypassing public API exposure.
- **Signed-Fetch Operations**: Secure, server-side data retrieval ensuring no Supabase/Drive keys are sent to the client bundle.
- **Zod Validation**: Strict schema enforcement at the data-fetch layer to eliminate "broken-link" runtime errors.

---

## 3. Atomic Component Infrastructure (React / Next.js)

### Layer 1: Atoms (Basic UI tokens)
- **`SubjectIcon.tsx`**: SVG icons (📚, 📊, 📋) with intelligent, category-based color-coding.
- **`StatusIndicator.tsx`**: Pulsing micro-badges for "Live", "Verified", or "New Resource" states.
- **`PremiumAvatar.tsx`**: Soft-rounded faculty profiles with unified fallback initials.

### Layer 2: Molecules (Interactive Units)
- **`AcademicCard.tsx`**: Translucent card unit with a **150ms hover-lift** effect and glass-polish borders.
- **`ResourceLink.tsx`**: Context-aware link component that detects MIME types and displays specific "Premium Icons" for PDF, Word, and Slide formats.
- **`FacultyChip.tsx`**: Compact teacher identity with a subtle glow-border and hover-state profile linkage.

### Layer 3: Organisms (Structural Hubs)
- **`UnifiedSearchHero.tsx`**: High-blur search centerpiece with **Direct Supabase Suggester** for sub-10ms result rendering.
- **`LiquidAccordion.tsx`**: Folder component powered by **Framer Motion**:
    - **Liquid Expansion**: 150ms spring-based transitions for a fluid feel.
    - **Skeleton Hubs**: Custom placeholders that match exact content aspect-ratios to prevent layout shift.
    - **Shareable State**: Persistent URL parameters as users expand nested departments/folders.

---

## 4. Interaction Design & Usability (Student First)

### A. The "Premium" Interaction Layer
- **Fluid Page Transitions**: Native Next.js `View Transitions` combined with cross-fade route effects.
- **Lava Lamp Navigation**: High-end active indicator that glides between navigation items in the sidebar.
- **Command Center (Cmd+K)**: A global command palette for "Instant Jump" navigation to any course, batch, or faculty profile.

### B. Performance & Reliability
- **Zero Content Shift (CLS)**: Hard-coded skeleton frames for all dynamic content areas.
- **HMR (Fast Refresh)**: Architected for sub-second development refreshes for faculty maintenance work.
- **Hydration Strategy**: Mixed **SSG** (Historical archives) + **ISR** (Recent semesters) + **SSR** (Global search).

---

## 5. Security, Privacy & Compliance
- **Zero-Key Frontend**: Absolute removal of all API/Service keys from the client-side code.
- **Internal-Focus (No Active SEO)**: SEO is de-prioritized to focus on departmental speed/privacy, though **Dynamic OGP** remains for WhatsApp/Discord link quality.
- **Accessibility (A11y)**: Full Screen-Reader support and WCAG 2.1 contrast compliance for the high-end "Dark Library" theme.

---

## 6. Implementation Technical Tiers

- **Tier 1 (Foundation)**: Next.js 16.1.6 initialization with Supabase Server-Client utilities and Zod schema mapping.
- **Tier 2 (Design Port)**: Porting of HSL tokens and Shadow Stacks from `.designplans` into Modular CSS.
- **Tier 3 (Service Integration)**: Connecting the `RESOURCE_LINKS` and `TEACHERS` tables to the `LiquidAccordion` UI.
- **Tier 4 (Final Polish)**: Implementation of the "Lava Lamp" navigation and the Cmd+K Command Center.
