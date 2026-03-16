# Academic Resort: Master Migration & Design Blueprint (Supabase Edition)

This document serves as the "Master Source of Truth" for transitioning the Academic Resort to a premium Next.js 14+ application, powered by **Supabase**. It synthesizes visual excellence, relational data integrity, and advanced architectural planning.

---

## 1. Project Vision & Aesthetic Philosophy

The Next.js MVP is an evolution into a **Premium Digital Academic Hub**, moving from flat file storage to a professional relational database.

### A. Visual Identity: "The Modern Library"
- **Surface Strategy**: Implementation of **Deep Glassmorphism** (`backdrop-filter: blur(16px)`).
- **Micro-elevation**: Multi-layered shadows (`box-shadow: 0 10px 40px rgba(11, 22, 48, 0.05)`) for spatial depth.
- **Typography Tier**: `Outfit` (Headings) and `Inter` (Body).

---

## 2. Relational Data Architecture (Supabase)

We are moving away from monolithic `batch-xx.json` files to a normalized relational schema.

### A. Database Schema Overview
Our Supabase instance will follow the structure defined in the [supabase_erd.mmd](file:///f:/WebDev/academic-resort/.designplans/supabase_erd.mmd):
- **Inventory Hierarchy**: `BATCHES` → `SEMESTERS` → `BATCH_COURSES`.
- **Course Catalog**: Global `COURSES` table linked to batch-specific instances.
- **Faculty Management**: `TEACHERS` linked via `SECTIONS` to specific batch courses.
- **Resource Repository**: `RESOURCE_LINKS` mapped to `BATCH_COURSES` with specific categories (Notes, Slides, etc.).

### B. Why Supabase?
- **Real-time Updates**: Instant data propagation without redeployments.
- **PostgREST API**: Auto-generated RESTful API for our data.
- **RLS (Row Level Security)**: Future-proofing for potential student-submitted resources.

---

## 3. Component Architecture (Atomic Design)

### Layer 1: Atoms (Basic Utilities)
- **`SubjectIcon.tsx`**: Dynamic icons based on course category.
- **`StatusBadge.tsx`**: Live indicators for "Verified" or "Newly Uploaded" content.

### Layer 2: Molecules (Composite Elements)
- **`FacultyCard.tsx`**: Displays teacher info, linked to their research or DU profiles.
- **`ResourceItem.tsx`**: Fetches link metadata, showing file types and titles.

### Layer 3: Organisms (Page Structures)
- **`SearchHero.tsx`**: Glassmorphism search section. Powered by **Supabase Full-Text Search** for instant, database-driven results.
- **`ResourceAccordion.tsx`**: Recursive folder hierarchy built with **Framer Motion**. It will fetch sub-levels dynamically from Supabase `RESOURCE_LINKS`.

---

## 4. High-Performance Infrastructure Strategy

### A. Data Fetching & Hydration
- **Edge Data**: Use Next.js **Server Components** to fetch data directly from Supabase via `supabase-js`.
- **Hybrid Rendering**:
    - **SSG**: Index pages and semester overviews (static build).
    - **ISR**: Course link pages (revalidated every 30 mins) to reflect new Supabase entries.
    - **SSR**: Search results for real-time accuracy.

### B. Routing & Data Mapping
| Path Structure | Component | Data Query |
| :--- | :--- | :--- |
| `/` | `LandingPage` | Fetch latest 5 `batches`. |
| `/semester/[id]` | `SemesterDashboard` | `batch_courses` where `semester_id = id`. |
| `/course/[code]` | `CourseMaterialView` | `resource_links` joined with `batch_courses`. |
| `/faculty/[id]` | `TeacherProfile` | All `sections` taught by the teacher. |

---

## 5. Critical System Audit & Security

### A. Security Guardrails (Supabase RLS)
- **Problem**: Legacy client-side API keys were exposed.
- **Solution**: All data queries move to the server side using the **Supabase Service Role Key** (hidden from browser).
- **RLS Policies**: Restrict anonymous users to `SELECT` only on non-sensitive tables.

### B. Performance Optimization
- **Supabase Search Indices**: Implement indices on `COURSES.code`, `COURSES.title`, and `BATCHES.name`.
- **Master CDN**: Vercel's Edge Network will cache Supabase responses, ensuring the site stays fast even under high load.

---

## 6. Migration Roadmap (JSON to Relational)

### Phase 1: Data Migration Script (Days 1-2)
- Develop a Node.js script to parse all `batch-xx.json` files and bulk-insert them into Supabase following the relational ERD.
- Standardize teacher names using the legacy `faculty-mapping.json` logic.

### Phase 2: Foundation & Framework (Days 3-5)
- Initialize Next.js 14+ / TypeScript / CSS Modules.
- Set up Supabase Client and Server utilities.

### Phase 3: Visual Port & Component Build (Days 6-10)
- Build the "Modern Library" UI.
- Implement the "Instant Search" using Supabase `text_search`.

### Phase 4: Verification (Days 11-14)
- Compare Supabase counts vs JSON entry totals.
- Final mobile UX and performance audits.
