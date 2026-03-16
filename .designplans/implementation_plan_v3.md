# Academic Resort: Design & Migration Blueprint (Next.js MVP)

This document outlines the detailed design system, component architecture, and migration roadmap for transitioning the Academic Resort from a static site to a premium Next.js 14+ application.

## 1. Design System & Visual Strategy

The goal is to maintain the "Academic" utility while elevating the presentation to a "Premium Digital Library" aesthetic.

### A. Visual Language: "The Modern Library"
- **Surface Strategy**: Deep Glassmorphism (`backdrop-filter: blur(12px)`) for sidebars and overlays.
- **Elevation**: Use subtle multi-layered shadows (Box-shadow `0 10px 40px rgba(0,0,0,0.05)`) to create depth without clutter.
- **Accents**: High-contrast neon-blue gradients for active states and primary buttons.

### B. Design Tokens (Next.js / Vanilla CSS Modules)
| Token | Value | Intent |
| :--- | :--- | :--- |
| **Primary** | `#2b6cff` | Hero branding, primary buttons. |
| **Navy Gradient** | `linear-gradient(135deg, #1e293b, #0f172a)` | Dark mode background depth. |
| **Glass Polish** | `rgba(255, 255, 255, 0.7)` | Light mode card surfaces with blur. |
| **Radius-XL** | `16px` | Standard corner rounding for "soft" premium feel. |

### C. Typography
- **Headings**: `Outfit` (Google Fonts) - High character, modern, and professional.
- **Body**: `Inter` (Google Fonts) - Industry standard for readability and clean data presentation.

---

## 2. Component Architecture (React/Next.js)

We will use an **Atomic Design** approach to ensure the 4000+ lines of CSS are modularized and reusable.

### Atoms & Molecules
- **`SubjectIcon.tsx`**: Dynamic icons (📚, 📝, 📊) mapped to course categories.
- **`StatBadge.tsx`**: Small badges for "New", "Verified", or "Updated" content.
- **`ResourceLink.tsx`**: Unified wrapper for Google Drive exports with mime-type icons.

### Organisms (Core UI Blocks)
- **`SearchHero.tsx`**: The flagship landing component. Featuring a "Universal Search" bar with real-time suggestions and glassmorphism backdrop.
- **`BatchFilter.tsx`**: A unified multi-selection dropdown that replaces the current 3-tier filter system with a much smoother "Pill-based" filtering experience.
- **`ResourceAccordion.tsx`**: Re-engineered Drive folder display with:
    - Smooth height transitions (Framer Motion).
    - Skeleton loading per folder level.
    - Deep-link support (share a specific folder via URL).

---

## 3. Interactive Patterns (The "Premium" Feel)

### A. Navigation & Transitions
- **Page Transitions**: Use `template.tsx` in Next.js for "Fade & Slide" transitions between semesters.
- **Sidebar**: Hardware-accelerated drawer that subtly shifts the main content area (using CSS Grid [fr](file:///f:/WebDev/academic-resort/index.html#2411-2429) units).

### B. Micro-interactions
- **Hover States**: Cards should have a slight "Lift & Glow" effect (TranslateY + Box-shadow intensity).
- **Loading**: A custom "Pulsing Library" skeleton instead of a generic spinner.
- **Search Feedback**: Immediate result count updates with a "Pop-in" animation for new results.

---

## 4. Technical Migration Roadmap

### I. Data Tier (The "Engine")
- **Schema Source**: Retain `batch-xx.json` as the source, but interpret them through a **Unified Data Resolver** in Next.js.
- **ISR (Incremental Static Regeneration)**: Set a revalidation period (e.g., 1 hour) to check Google Drive for new files without manual site rebuilds.

### II. Site Map & Dynamic Routing
| Route | Component | Data Source |
| :--- | :--- | :--- |
| `/` | `HomePage` | [batches/index.json](file:///f:/WebDev/academic-resort/batches/index.json) |
| `/semester/[slug]` | `SemesterView` | Filtered `batch-xx.json` data |
| `/course/[code]` | [CoursePage](file:///f:/WebDev/academic-resort/assets/course-template.html#14-30) | Consolidated data from ALL batches for that code |
| `/search` | `GlobalSearchResults` | Unified search index |

### III. SEO & Sharing
- **Dynamic OGP**: Generate custom social sharing cards showing "Subject Code + Title" when links are shared on WhatsApp/Discord.
- **Structured Data**: Implement `BreadcrumbList` and [Course](file:///f:/WebDev/academic-resort/index.html#514-599) Schema.org JSON-LD for better Google Search rankings.

---

## 5. Verification Steps
1. **Visual Accuracy**: Side-by-side comparison of the static "Original" vs. Next.js "Premium" version.
2. **Interaction Audit**: Ensure accordion animations are fluid (60fps) on mid-range mobile devices.
3. **Link Integrity**: Automated check to ensure the new dynamic routing doesn't break any deep-links shared from the previous version.
