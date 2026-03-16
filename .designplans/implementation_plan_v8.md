# Academic Resort: Master Design & Architecture Blueprint (Next.js 16.1.6)

This master blueprint defines the definitive vision for the Academic Resort’s transformation into a premium, high-performance digital hub. It integrates hyper-detailed design systems, a robust relational data model (Supabase), and advanced Next.js 16.1.6 architectural patterns.

---

## 1. Visual Identity & Design Philosophy
The "Academic Resort" must feel like a **Modern Digital Library**—professional, expansive, yet effortlessly intuitive.

### A. Surface & Light Strategy
- **Deep Glassmorphism**: Universal use of `backdrop-filter: blur(18px)`. Sidebars, search components, and interactive cards will appear as multi-layered frosted glass surfaces, providing spatial hierarchy.
- **Micro-Elevation System**: Instead of flat shadows, we use a complex, low-opacity shadow stack (`box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)`) combined with a 1px border of white-opacity (`border: 1px solid rgba(255, 255, 255, 0.1)`) to simulate "Glow & Lift."
- **Chromatic Accents**: High-contrast, vibrant gradients (e.g., `HSL(220, 100%, 60%)` to `HSL(200, 100%, 50%)`) for active states, signifying interactive "live" areas.

### B. Typography Tier (Modular Scale)
- **Primary Headers**: `Outfit` (Google Fonts) – Geometric and modern. Weight: 700 (Bold) for Page Titles; 500 (Medium) for Section Headers.
- **Body & Data**: `Inter` (Google Fonts) – Optimized for screen legibility. We will use a tight tracking (`-0.011em`) to maintain a "Compact Professional" feel.

---

## 2. Relational System Architecture (Supabase)

The project utilizes the `ehsbbmedneuvsjgefsyj` Supabase project for a fully normalized relational infrastructure.

### A. Core Data Flow & Logic
- **`BATCHES` / `SEMESTERS` / `COURSES`**: Normalized hierarchy for instant data aggregation.
- **`BATCH_COURSES`**: The central intersection mapping course offerings to specific years.
- **`SECTIONS` & `TEACHERS`**: Direct relational mapping for faculty assignments.
- **`RESOURCE_LINKS`**: High-performance collection for all academic files (Notes, Slides, etc.).

### B. Infrastructure Implementation
- **Server Actions**: Native Next.js 16 migrations for data mutations directly to Supabase.
- **Security Boundary**: All API keys are restricted to the server side; no public keys are exposed in the bundle.

---

## 3. Atomic Component Architecture (React / Next.js 16)

### Layer 1: Atoms (Basic UI tokens)
- **`SubjectIcon.tsx`**: SVG-based categorical mapping (📚, 📊, 📋) with intelligent color-coding.
- **`StatusIndicator.tsx`**: Pulsing micro-badges showing "Live", "Verified", or "New" states.
- **`PremiumAvatar.tsx`**: Soft-rounded faculty avatars with auto-generated initials for departmental consistency.

### Layer 2: Molecules (Interactive Units)
- **`AcademicCard.tsx`**: Built with a translucent card design, featuring a 150ms hover-lift effect and glass-polish borders.
- **`AcademicLink.tsx`**: Intelligent resource wrapper that detects file extensions and provides high-end icons (PDF, DOCX, ZIP).
- **`FacultyChip.tsx`**: Compact teacher identity with a subtle glow-border on hover.

### Layer 3: Organisms (Structural Hubs)
- **`UnifiedSearchHero.tsx`**: A high-blur centerpiece featuring **Supabase Text Search** for sub-10ms query results.
- **`LiquidAccordion.tsx`**: A deep-nesting folder component powered by **Framer Motion**.
    - **Spring Animations**: 150ms spring transitions for a "Liquid Expansion" feel.
    - **Skeleton Hubs**: Custom-designed placeholders that match content aspect ratios during loading.
    - **Persistent State**: URLs update as folders expand, allowing students to share specific folder states.

---

## 4. Advanced Interaction & UX Patterns

### A. The "Premium" Flow
- **Fluid Page Transitions**: Using Next.js `View Transitions` and Framer Motion for directional slide effects between semesters.
- **Navigation Feedback**: A "Lava Lamp" style active indicator in the sidebar and navigation menus.
- **Command Center (Cmd+K)**: A global command palette for instant navigation to any course, batch, or faculty member.

### B. Loading & PerformanceUX
- **Zero Content Shift (CLS)**: Strict aspect-ratio placeholders for all dynamic content.
- **Micro-Animations**: Unified micro-animations across the entire site to give it a "Responsive & Alive" feeling.

---

## 5. Critical Architecture & Internal Reliability

### A. Hydration & Fetching
- **Streaming & Suspense**: Critical data is streamed with `Suspense` to ensure the core UI is visible instantly.
- **Hybrid Rendering**:
    - **SSG**: Index and Historical Batch pages.
    - **ISR**: Current Semester folders (15m revalidation).
    - **SSR**: Teacher and Course Archive searches.

### B. Implementation Tiers
- **Tier 1**: Next.js 16.1.6 / TypeScript / CSS Modules initialized with Zod-based Supabase validation.
- **Tier 2**: Design tokens from `.designplans` ported into `globals.css` using CSS Variables.
- **Tier 3**: Supabase-to-UI binding using Server Components and Parallel Routes for resource previews.

---

## 6. Privacy & Internal Growth
- **Department-First Access**: SEO is deprioritized to focus on internal departmental speed and privacy.
- **Dynamic OGP**: Social cards are optimized for sharing in WhatsApp/Discord groups (Subject Code + Title).
- **Accessibility**: Full WCAG 2.1 Contrast compliance for the "Premium Legacy" aesthetic.
