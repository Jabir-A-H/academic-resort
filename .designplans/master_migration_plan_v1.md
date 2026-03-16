# Master Migration Plan: Academic Resort

## Overview
This document outlines the strategic transition of Academic Resort from a static vanilla JS architecture to a high-fidelity, dynamic Next.js + Supabase platform. It synthesizes the goals from Blueprint v12 with the current implementation status.

---

## 🗺️ Migration Roadmap (AESTHETIC & FUNCTIONAL)

### Phase 1: Structural Foundation ✅
- **Framework**: Migration from Vanilla HTML/JS to Next.js 15.1 (App Router).
- **Styling**: Transition from monolithic `styles.css` to Tailwind CSS + CSS Variables for design tokens.
- **Database**: Deprecation of 8+ local JSON files in favor of a relational Supabase PostgreSQL schema.
- **Asset Strategy**: Keeping heavy assets on Google Drive while managing metadata/links centrally in SQL.

### Phase 2: Knowledge Synthesis ✅
- **Migration Script**: Conversion of `batch-*.json` files into normalized SQL rows (`migrate.ts`).
- **Data Integrity**: Implementation of `Syllabus Versioning` to handle course name/code changes over time.
- **Relational Mapping**: Centralizing `TEACHERS` registry to prevent duplication across semesters.

### Phase 3: Dynamic Interaction ✅
- **Search Evolution**: Replacing client-side JS filtering with a debounced `searchResources` API (Supabase Full-Text Search ready).
- **Admin Capabilities**: Deployment of a secure Representative Dashboard (`/admin`) for non-technical data management.
- **Smart Importing**: Implementation of `LinkImportModal` for automated URL categorization.

### Phase 4: High-Fidelity Refinement 🏗️ (Current Objective)
The following "Modern Digital Library" features from Blueprint v12 remain to be fully integrated:

| Blueprint Goal | Current Status | Implementation Path |
| :--- | :--- | :--- |
| **Cmd+K Command Center** | 🔲 Pending | Integrate `kbar` or a custom CMDK component for global instant navigation. |
| **Lava Lamp Side-Nav** | 🔲 Pending | Use Framer Motion `layoutId` on the Sidebar active state indicator for fluid motion. |
| **HSL Color Normalization** | ⚠️ Partial | Refactor `globals.css` from Hex to HSL values (Base: 217, 91%, 60%). |
| **Deep Glassmorphism** | ⚠️ Subtle | Increase standard blur to 20px and add 1px "light-catch" borders to modals. |

---

## 📊 Technical Debt & Evolution
- **SEO & Streaming**: Currently utilizes Server Actions. Next step is fully streaming course lists using React `Suspense` for zero layout thrash.
- **Link Health**: Implementation of the Vercel Cron "Link Monitor" to check Google Drive availability automatically.

---

## 🏁 Verification & Finality
- **Parity Check**: Ensure every course from the legacy `index.json` is searchable in the new UI.
- **Auth Validation**: Confirm only authorized representatives can access mutation actions in the Admin panel.
- **Visual Polish**: Final design pass to ensure the "Apple-esque" density and geometric typography (Outfit/Inter) are consistent.
