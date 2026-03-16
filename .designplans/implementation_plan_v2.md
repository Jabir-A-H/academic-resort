# Academic Resort: Critical Audit & Next.js MVP Roadmap

## 1. Critical Audit of Current Static Infrastructure

While the current site is a functional marvel for a vanilla implementation, a deep dive reveals significant "architectural friction" that will hinder long-term growth.

### A. Security & API Integrity (Critical)
- **Vulnerability**: [assets/api-keys.js](file:///f:/WebDev/academic-resort/assets/api-keys.js) exposes multiple API keys in the frontend. Even with domain restriction, this allows malicious actors to "borrow" your quota for their own projects.
- **Rotation Logic**: The current round-robin system is purely client-side. If one key hits a hard limit, the client has no persistent way to notify other clients, leading to inconsistent "File Not Found" errors for various users.

### B. Performance & Scalability (High Risk)
- **The Search "Bomb"**: `DriveUtils.fetchAllFilesRecursively` is a performance landmine. Searching across 8+ batches with a 3-level depth can trigger dozens of concurrent API calls. This is the primary cause of the "Retro Loading" lag.
- **Monolithic Data Fetching**: [batch-loader.js](file:///f:/WebDev/academic-resort/assets/batch-loader.js) fetches *every* batch JSON (8 files currently, growing every semester) on initial load. This is a "linear growth" bottleneck—eventually, the landing page will feel sluggish as the archive grows.
- **CSS Bloat**: [styles.css](file:///f:/WebDev/academic-resort/assets/styles.css) at 87KB is significantly oversized for the current UI. The lack of modularity leads to "CSS Specificity Wars" and difficult maintenance.

### C. UX & Stability (Technical Debt)
- **Flaky Custom Hydration**: The `data-include` system and the reliance on `setTimeout(..., 100)` for sidebar initialization indicate frequent race conditions. The UI feels "stuttery" during initial load.
- **Mobile Interaction Friction**: The multi-level accordion in [drive-utils.js](file:///f:/WebDev/academic-resort/assets/drive-utils.js) lacks smooth height transitions (currently using `display: block/none`), leading to jarring layout shifts on mobile devices.

---

## 2. Technical Debt Map

| Component | Debt Level | Issue |
| :--- | :--- | :--- |
| [script.js](file:///f:/WebDev/academic-resort/assets/script.js) | High | Monolithic event handling; tight coupling between UI and Data Fetching. |
| [drive-utils.js](file:///f:/WebDev/academic-resort/assets/drive-utils.js) | Medium | Recursive logic is efficient for tiny folders but dangerous for large archives. |
| [styles.css](file:///f:/WebDev/academic-resort/assets/styles.css) | High | 4000+ lines; massive duplication of media queries; no real utility system. |
| `storage/cache` | Low | `localStorage` approach is clever but prone to "Stale Data" without manual clears. |

---

## 3. The Next.js "Premium" Solution

We won't just "copy" the code; we will **re-engineer** it for production stability.

### I. The "Secret" API Layer
- **No Keys on Client**: All Google Drive API calls move to `app/api/drive/route.ts`.
- **Server Actions**: Moving files/fetching maps will use Server Actions, allowing us to use one "Master Key" (Service Account) safely.
- **Data Pooling**: Implement a server-side cache (Vercel Data Cache) so that if one student searches for "Accounting Notes", the next 100 students get that result in **<10ms** without hitting the Google API.

### II. Modular Architecture
- **CSS-in-JS or CSS Modules**: Split the 87KB monster into `Hero.module.css`, `Navbar.module.css`, etc.
- **Optimized Loading**: Use Next.js `Suspense` with "Skeleton Screens" instead of a full-screen "Retro Loading" overlay. This makes the site feel significantly faster.

### III. Intelligent Search (Search Indexing)
- Instead of crawling Drive on-the-fly, a build-time script (or a CRON job) will crawl the folders and generate a **static search index**.
- **Result**: "Global Search" becomes a local JS-based search (via Fuse.js) that is **truly instant** (0ms network delay).

### IV. SEO & Premium UX
- **Dynamic Meta Tags**: Every course (`/course/1101`) will have a unique title, description, and OpenGraph image for sharing on social media/WhatsApp groups.
- **Framer Motion Integration**: Replace `display: block` toggles with smooth, hardware-accelerated drawer and accordion animations.

---

## 4. Verification & Migration Strategy

### Phase 1: The Foundation (Week 1)
- Initialise Next.js with [app](file:///f:/WebDev/academic-resort/index.html#600-613) router.
- Define a strict `Zod` schema for the `batch-xx.json` files to ensure no "broken links" in the archive.

### Phase 2: The API Proxy (Week 2)
- Port [drive-utils.js](file:///f:/WebDev/academic-resort/assets/drive-utils.js) logic to the server side.
- Implement the "Master Cache" to mitigate API quota issues forever.

### Phase 3: Premium UI Port (Week 3)
- Refactor the design system into modular components.
- Implement the "Instant Search" indexer.
