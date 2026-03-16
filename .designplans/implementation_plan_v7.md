# Academic Resort: Master Architecture & Framework Blueprint (Next.js 16.1.6)

This master blueprint defines the technical and visual transformation of the Academic Resort into a high-performance, student-centric hub. It prioritizes internal utility, architectural robustness, and a premium "department-only" experience.

---

## 1. Visual Identity & Design Philosophy
The site is designed as a **Premium Digital Library**—professional, expansive, and high-contrast for academic focus.

### A. Surface & Light Strategy
- **Deep Glassmorphism**: Universal `backdrop-filter: blur(18px)` across all overlay components.
- **Micro-Elevation System**: A sophisticated shadow stack (`box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1)`) and 1px borders (`rgba(255, 255, 255, 0.1)`) for a "Glow & Lift" effect.
- **Chromatic Accents**: Vibrant gradients (`#2b6cff` to `#00aaff`) specifically for active navigational headers.

### B. Typography Tier
- **Brand & Headers**: `Outfit` (Google Fonts) – Geometric and futuristic.
- **Body & Data**: `Inter` (Google Fonts) – Optimized for high-density academic material lists.

---

## 2. Advanced Architectural Framework (Next.js 16.1.6)

The migration focuses on a "Framework-First" approach to ensure every department resource is accessible with zero friction.

### A. Data Fetching & Sync Strategy
Instead of client-side crawling, we implement a **Server-Side Data Hydration** model:
- **Supabase Integration**: Direct usage of the `@supabase/supabase-js` client within Server Components.
- **Streaming & Suspense**: Critical data (like course lists) is streamed with `Suspense` placeholders to ensure the page frame is visible instantly.
- **Hybrid Data Patterns**:
    - **Fully Static (SSG)**: Historical batch overviews that rarely change.
    - **Revalidated (ISR)**: Current semester folders (revalidated every 15m).
    - **Dynamic (SSR)**: Faculty search and section-wise updates.

### B. Routing & Student Usability
We move beyond simple routes to **Context-Aware Navigation**:
- **Dynamic Segments**: `/batch/[id]/semester/[id]` – Allows students to bookmark their specific semester.
- **Parallel Routes**: Use `@modal` slots for "Quick View" resource previews (e.g., viewing a PDF without leaving the course list).
- **Intercepting Routes**: Clicking a teacher's name pulls up a slide-over panel instead of a full page reload.

---

## 3. Atomic Implementation Details

### Layer 1: Atoms (Basic UI)
- **`SubjectIcon.tsx`**: SVG-based categorical mapping (📚, 📊, 📋).
- **`StatusIndicator.tsx`**: Pulsing micro-badges for "New" or "Pending" updates.

### Layer 2: Molecules (Interactive Units)
- **`AcademicLink.tsx`**: Intelligent resource wrapper. It detects MIME types from URLs and provides the correct "Premium Icon" (Excel, PDF, Slides).
- **`FacultyChip.tsx`**: Displays teacher name with a hover-state that reveals their Departmental/DU Profile link.

### Layer 3: Organisms (Page Hubs)
- **`UnifiedSearchHero.tsx`**: Central search bar with **Direct Supabase Suggester**.
- **`LiquidAccordion.tsx`**: A deep-nesting folder component built with **Framer Motion**:
    - **Smart Expansion**: Only fetches sub-folders from Supabase when expanded to minimize initial payload.
    - **Layout Persistence**: Keeps the scroll position stable even when large folders are toggled.

---

## 4. Internal Site Reliability & Security

### A. Security Guardrails (Zero-Exposure)
- **Server-Side Boundary**: All sensitive API keys (including Supabase Service Role and Google Service Accounts) are restricted to the server environment.
- **Authenticated Proxy**: The site will be hosted on Vercel, using Edge Middleware to ensure only departmental users (via IP restriction or internal auth) can access the data if required in the future.

### B. Usability & Performance Matrix
- **Zero Content Shift (CLS)**: Every component has a hard-coded aspect-ratio placeholder during loading.
- **Fast Refresh (HMR)**: Architected to support sub-second development refreshes for faculty maintainers.
- **Asset Optimization**: Next.js 16 Image component for all faculty photos and departmental logos, serving WebP/Avif automatically.

---

## 5. Implementation Roadmap (Technical Tiers)

### Tier 1: Core Framework Setup
- Initialize Next.js 16.1.6 with TypeScript and CSS Modules.
- Set up **Zod-based Validation** for Supabase data to prevent "Broken Link" errors in the dynamic routes.

### Tier 2: Premium UI Porting
- Port the Design Tokens from `.designplans` into `globals.css` using CSS Variables.
- Implement the "Modern Library" layout with the sidebar drawer and search landing.

### Tier 3: Supabase Data Migration & Loading
- Connect the `BATCHES`, `SEMESTERS`, `COURSES`, and `RESOURCE_LINKS` tables.
- Implement high-performance SQL views to join course data for consolidated student viewing.

### Tier 4: Final Polishing
- Implement the "Lava Lamp" navigation and Cmd+K command palette.
- Verification of 60fps animations on mobile devices.
