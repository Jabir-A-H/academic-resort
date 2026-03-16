# Academic Resort: Master Design & Architecture Blueprint (Next.js 16.1.6)

This master blueprint defines the definitive vision for the Academic Resort’s transformation into a premium, high-performance digital hub. It integrates sophisticated design systems, a robust relational data model (Supabase), and advanced Next.js 16.1.6 architectural patterns.

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

We are transitioning from static JSON files to a fully normalized relational schema, ensuring data longevity and flexibility.

### A. Relational Schema Mapping
Following the validated `supabase_erd.mmd`, our data flow is:
- **`BATCHES`**: The top-level collection (e.g., "30th Batch").
- **`SEMESTERS`**: Child of Batches; carries the primary `drive_folder_id` for semester-wide views.
- **`COURSES`**: The global catalog. Contains static metadata like course `code`, `title`, and `syllabus`.
- **`BATCH_COURSES`**: The intersection table. Mapping a specific course to a specific batch and semester. This carries unique URLs like `class_updates_url`.
- **`SECTIONS` & `TEACHERS`**: Relational mapping for section-wise faculty assignments (Sections A, B, C).
- **`RESOURCE_LINKS`**: The granular data points (Notes, Slides, etc.) tied to `BATCH_COURSES`.

### B. Infrastructure Benefits
- **Server Actions**: Native Next.js Form/Data mutations directly to Supabase without exposing API endpoints.
- **Real-time Engine**: Optional use of Supabase Realtime for instant "New Resource" notifications in the UI.

---

## 3. Atomic Component Architecture (React / Next.js 16)

The UI will be built using a modular component system, ensuring every element is reusable and performant.

### Layer 1: Atoms (Basic UI tokens)
- **`SubjectIcon.tsx`**: A context-aware component featuring SVG icons (📚, 📊, 📋) with intelligent color-coding based on the course's department.
- **`StatusIndicator.tsx`**: Pulsing micro-badges showing "Live", "Verified", or "New" states.
- **`PremiumAvatar.tsx`**: Soft-rounded faculty avatars with auto-generated initials or DU profiles.

### Layer 2: Molecules (Interactive Units)
- **`AcademicCard.tsx`**: The core navigational unit. Built with a translucent card design, featuring a subtle hover-lift effect and progress indicator if applicable.
- **`DriveItemLink.tsx`**: A smart link component that detects file extensions (PDF, DOCX, ZIP) and displays the corresponding technical icon.
- **`TeacherPill.tsx`**: A compact faculty chip that displays the teacher's name and links to their profile or full archive.

### Layer 3: Organisms (Structural Hubs)
- **`UnifiedSearchHero.tsx`**: The centerpiece. A high-blur search bar featuring **Immediate Suggester** (via Supabase Full-Text Search) and a recent searches history.
- **`InfiniteArchiveAccordion.tsx`**: A deep-nesting folder component powered by **Framer Motion**.
    - Features "Liquid Expansion" (spring-based layout animations).
    - Supports deep-linking (URLs update as you expand folders).
    - Implements Skeleton Hubs for zero-content-shift loading.

---

## 4. Advanced Interaction & UX Patterns

### A. The "Premium" Flow
- **Fluid Page Transitions**: Using Next.js `View Transitions` (Experimental) and Framer Motion for cross-fade and directional slide effects between semesters.
- **Navigation Feedback**: A high-end "Lava Lamp" style active indicator in the sidebar and navigation menus.
- **Command Center (Cmd+K)**: A global command palette allowing students to jump to "Sections", "Courses", or "Teachers" instantly from any page.

### B. Loading & PerformanceUX
- **Skeleton Hubs**: Custom-designed placeholders that maintain the layout of cards, lists, and headers, ensuring a stable visual experience during hydration.
- **Micro-Animations**: 150ms spring transitions on all buttons, toggles, and hover states to give the site a "Responsive & Alive" feel.

---

## 5. Critical Audit: Security & Performance

### A. Security Guardrails
- **Zero-Key Frontend**: No API keys (Google or Supabase) will be present in the client-side bundle. All interactions occur via **Next.js Server Components** and signed-fetch operations.
- **Rate-Limited Proxy**: Vercel Edge Middlewares will prevent API abuse (e.g., bot-driven Drive crawling).

### B. Performance Matrix
- **Data Optimization**: 
    - **SSG**: Build-time generation for all Semester and Course indexes.
    - **ISR**: Automatic revalidation of resource links every 15 minutes.
    - **SSR**: Dedicated server-side rendering for complex teacher-based searches.
- **Code Efficiency**: Moving from 87KB of global CSS to **Modular CSS**, ensuring the landing page initial load stays under 500ms.

---

## 6. SEO & Social Distribution
- **Dynamic OGP Engine**: Auto-generation of rich social cards (Subject Code + Course Title + Current Teacher) for every dynamically generated route.
- **Semantic Hierarchy**: Strict adherence to HTML5 landmarking and Schema.org `Course` and `Organization` JSON-LD for maximum search engine performance.
- **Accessibility (A11y)**: Full Screen-Reader support and WCAG 2.1 Contrast compliance for all premium components.
