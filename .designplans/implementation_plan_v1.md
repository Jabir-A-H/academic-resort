# Academic Resort: Static Analysis & Next.js MVP Blueprint

## Analysis of Current Static Site

The current [Academic Resort](https://jabir-a-h.github.io/academic-resort) is a sophisticated static web application designed to manage and explore academic resources (Google Drive links) across multiple batches, semesters, and courses.

### Core Architecture
- **Framework**: No-framework (Vanilla JS, HTML5, CSS3).
- **Hosting**: GitHub Pages (Static).
- **Component System**: Reusable components ([header.html](file:///f:/WebDev/academic-resort/assets/header.html), [footer.html](file:///f:/WebDev/academic-resort/assets/footer.html)) are injected via a custom `data-include` system.
- **Data Model**: Batch-centric JSON files stored in `/batches/`. These files consolidate academic data (course titles, teachers, section-wise breakdown, and resource links).
- **API Integration**: Direct client-side integration with Google Drive API v3.
- **Resource Search**: A recursive crawler that traverses Google Drive folders based on IDs provided in the batch JSON files.

### Key Logic & Workflows
1. **Dynamic Data Loading**: The `batch-loader.js` discovers batch JSONs via an `index.json` registry. It aggregates course data across batches to show historical trends (which teachers taught a course in previous years).
2. **Drive Integration**: Uses a multi-key rotation system (`api-keys.js`) to bypass Google Drive API query limits.
3. **Template Engine**: Course pages are standardized using a JS-based template (`course-template.html`) that populates content based on a `window.subjectConfig` object.
4. **Caching Strategy**: Implements a robust `localStorage` caching layer (`cache-utils.js`) for API responses, reducing redundant network calls.

---

## Production-Ready Next.js MVP Blueprint

### 1. Technology Stack
- **Framework**: Next.js 14+ (App Router) for superior SEO and performance.
- **Styling**: **Premium Vanilla CSS** with CSS Modules to maintain the existing sleek aesthetics while ensuring scoping and maintainability.
- **Component Library**: Modular design system (no generic UI libraries to maintain "premium" feel).
- **Data Handling**: 
    - Keep JSON files as the "Source of Truth" for now (easy to manage via Git).
    - Use Next.js **ISR (Incremental Static Regeneration)** to fetch Drive metadata periodically and cache it on the server.
- **Hosting**: Vercel (for global CDN and seamless Next.js features).

### 2. Component Mapping & UX Improvements

| Current Static Component | Next.js Component | Proposed UX Improvements |
| :--- | :--- | :--- |
| `index.html` Search Landing | `SearchHero.tsx` | Sleeker glassmorphism design; "Search Globally" -> "Search All Resources" (more intuitive). |
| `data-include` Header | `Navbar.tsx` | Native Next.js Link prefetching; better mobile drawer with smooth framer-motion animations. |
| Google-style Apps Grid | `QuickAccess.tsx` | Unified command palette (Cmd+K) for even faster navigation. |
| `course-template.html` | `[courseId]/page.tsx` | Dedicated dynamic routes; SEO-optimized titles and meta-descriptions per subject. |
| `toggleFolderExpansion` | `FolderAccordion.tsx` | Animated transitions; multi-level deep nesting with skeleton loading states. |

### 3. Data Flow & Caching (The Next.js Way)
- **Server Component Fetching**: Drive API calls happen on the server. This hides API keys from the client and allows for centralized caching (Vercel Data Cache).
- **Dynamic Routes**: 
    - `/semester/[id]`: SSG at build time.
    - `/course/[id]`: SSG with the standard subjects list.
- **Real-time Search**: Use a professional search indexer (like Fuse.js on the client or a small Supabase Search index) to make "Global Search" truly instant without recursive API calls on every search.

### 4. UI/UX "Premium" Adjustments
- **Typography**: Move from standard fonts to a curated pair like `Outfit` (Headings) and `Inter` (Body).
- **Micro-interactions**: Subtle hover states on subject cards; "Lava Lamp" style gradients for active navigation items.
- **Dark Mode**: Native `next-themes` support with a high-end "Midnight Blue" palette.
- **Dashboard View**: A student-centric dashboard showing "Recently Visited" courses and "New Materials" from their batch.

---

## Verification Plan

### Automated Tests
- **Data Integrity Test**: Script to validate all `batch-xx.json` files against a Zod schema.
- **Link Checker**: A server-side script to verify that Google Drive folder IDs in the JSON files are still valid/accessible.
- **Lighthouse CI**: Automate performance auditing to maintain 95+ scores for LCP and FID.

### Manual Verification
- **Cross-Batch Validation**: Verify that the same course code correctly pulls data from all relevant batch years.
- **Mobile UX Audit**: Test the multi-level folder expansion on small touchscreens to ensure no "layout shift" occurs.
- **API Failover Test**: Simulate an API key failure to ensure the rotation system works seamlessly in the Next.js environment.
