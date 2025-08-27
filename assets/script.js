/**
 * Simple HTML include loader
 * Usage: <div data-include="/assets/includes/sidebar.html"></div>
 */

// Global flag to prevent multiple sidebar initializations
let sidebarInitialized = false;

async function loadInclude(el) {
  const src = el.getAttribute('data-include');
  if (!src) return;

  try {
  // Skip injecting the sidebar include on index.html
    const path = location.pathname || '';
    const isIndex = /(^|\/)index\.html$/.test(path) || /\/$/.test(path);
  if (isIndex && /\/includes\/sidebar\.html$/.test(src)) {
      el.removeAttribute('data-include');
      el.innerHTML = '';
      return;
    }

    const res = await fetch(src, { cache: 'no-cache' });
    if (!res.ok) throw new Error(res.status + ' ' + res.statusText);
    const html = await res.text();
    el.innerHTML = html;

    // Mark as loaded
    el.setAttribute('data-include-loaded', '1');

    // Initialize features that depend on included content
    setupDynamicComponents();

    // Support nested includes
    initIncludes(el);
  } catch (err) {
    console.error('Include load failed:', src, err);
    el.innerHTML = '';
  }
}

function initIncludes(root = document) {
  const nodes = Array.from(root.querySelectorAll('[data-include]'));
  nodes.forEach(n => {
    if (n.getAttribute('data-include-loaded')) return;
    loadInclude(n);
  });
}

/**
 * Setup interactive components that depend on included HTML
 */
function setupDynamicComponents() {
  try {
    setupSidebarToggle();
    // Add more later: setupDarkMode(), setupModals(), etc.
  } catch (error) {
    console.error('Error setting up dynamic components:', error);
  }
}

function setupSidebarToggle() {
  // Do not initialize sidebar on index.html
  const path = location.pathname || '';
  const isIndex = /(^|\/)index\.html$/.test(path) || /\/$/.test(path);
  if (isIndex) return;

  const appHeader = document.querySelector('.app-header');
  if (!appHeader) return;

  // Prevent multiple initializations globally
  if (sidebarInitialized) {
    console.log('Sidebar already initialized, just updating state');
    // Just ensure the header has the right classes and state
    appHeader.classList.add('sidebar');
    document.body.classList.add('has-sidebar');
    // Reset to collapsed state on page load
    document.body.classList.remove('sidebar-expanded');
    
    // Reset button states
    const toggleEl = appHeader.querySelector('.menu-toggle');
    const mobileToggle = document.querySelector('.mobile-menu-toggle');
    if (toggleEl) {
      toggleEl.setAttribute('aria-expanded', 'false');
      toggleEl.textContent = '☰';
    }
    if (mobileToggle) {
      mobileToggle.setAttribute('aria-expanded', 'false');
      mobileToggle.innerHTML = '☰';
    }
    return;
  }

  console.log('Initializing sidebar for the first time');
  // Mark as initialized
  sidebarInitialized = true;
  appHeader.setAttribute('data-sidebar-initialized', '1');

  // Mark body that sidebar exists so layout CSS can offset
  document.body.classList.add('has-sidebar');

  // Create grid structure: wrap all non-sidebar content in a main content area
  const sidebarInclude = document.querySelector('[data-include*="sidebar"]');
  if (sidebarInclude) {
    // Get all elements after the sidebar include
    const elementsAfterSidebar = [];
    let nextSibling = sidebarInclude.nextSibling;
    while (nextSibling) {
      if (nextSibling.nodeType === Node.ELEMENT_NODE) {
        elementsAfterSidebar.push(nextSibling);
      }
      nextSibling = nextSibling.nextSibling;
    }
    
    // Create main content wrapper
    const mainContentWrapper = document.createElement('div');
    mainContentWrapper.className = 'main-content-area';
    
    // Move all non-sidebar content into the wrapper
    elementsAfterSidebar.forEach(element => {
      mainContentWrapper.appendChild(element);
    });
    
    // Add the wrapper after the sidebar
    sidebarInclude.parentNode.insertBefore(mainContentWrapper, sidebarInclude.nextSibling);
  }

  // Ensure collapsed by default on new page loads
  document.body.classList.remove('sidebar-expanded');

  // Ensure header has sidebar class for scoped CSS
  appHeader.classList.add('sidebar');

  // Clean up any existing mobile elements first
  const existingOverlay = document.querySelector('.sidebar-overlay');
  if (existingOverlay) existingOverlay.remove();
  
  const existingMobileToggle = document.querySelector('.mobile-menu-toggle');
  if (existingMobileToggle) existingMobileToggle.remove();

  // Create fresh overlay for mobile close behavior
  const overlay = document.createElement('div');
  overlay.className = 'sidebar-overlay';
  document.body.appendChild(overlay);

  // Create fresh mobile hamburger button
  const mobileToggle = document.createElement('button');
  mobileToggle.className = 'mobile-menu-toggle';
  mobileToggle.innerHTML = '☰';
  mobileToggle.setAttribute('aria-label', 'Toggle navigation menu');
  mobileToggle.setAttribute('aria-expanded', 'false');
  mobileToggle.setAttribute('type', 'button'); // Ensure it's a button
  document.body.appendChild(mobileToggle);
  
  console.log('Mobile toggle created and added to body');

  const toggleEl = appHeader.querySelector('.menu-toggle');
  
  // Function to toggle sidebar
  const toggleSidebar = () => {
    try {
      console.log('Toggle sidebar called');
      const expanded = document.body.classList.toggle('sidebar-expanded');
      console.log('Sidebar expanded:', expanded);
      
      if (toggleEl) toggleEl.setAttribute('aria-expanded', expanded ? 'true' : 'false');
      if (mobileToggle) mobileToggle.setAttribute('aria-expanded', expanded ? 'true' : 'false');
      
      // Update visual symbols with smooth transitions
      if (toggleEl) toggleEl.textContent = expanded ? '←' : '☰';
      if (mobileToggle) mobileToggle.innerHTML = expanded ? '✕' : '☰';
      
      // Focus management for accessibility
      if (expanded) {
        // Focus first nav item when opened
        const firstNavItem = appHeader.querySelector('.nav-item');
        if (firstNavItem) {
          setTimeout(() => firstNavItem.focus(), 100);
        }
      } else {
        // Return focus to toggle button when closed
        if (mobileToggle) mobileToggle.focus();
      }
      
      // Store user preference (only for desktop)
      if (window.innerWidth >= 769) {
        localStorage.setItem('sidebar-expanded', expanded);
      }
    } catch (error) {
      console.error('Error in toggleSidebar:', error);
    }
  };
  
  // Restore user preference (only on desktop)
  const savedState = localStorage.getItem('sidebar-expanded');
  if (savedState === 'true' && window.innerWidth >= 769) {
    document.body.classList.add('sidebar-expanded');
    if (toggleEl) toggleEl.setAttribute('aria-expanded', 'true');
    if (toggleEl) toggleEl.textContent = '←';
  }

  // Add click listeners to both toggle buttons
  if (toggleEl) {
    console.log('Adding click listener to desktop toggle');
    toggleEl.addEventListener('click', toggleSidebar, { passive: true });
  }
  if (mobileToggle) {
    console.log('Adding click listener to mobile toggle');
    mobileToggle.addEventListener('click', toggleSidebar, { passive: true });
    
    // Also add touch events for better mobile responsiveness
    mobileToggle.addEventListener('touchstart', (e) => {
      e.preventDefault();
      toggleSidebar();
    }, { passive: false });
  }

  // Clicking overlay closes sidebar (mostly mobile)
  overlay.addEventListener('click', () => {
    document.body.classList.remove('sidebar-expanded');
    if (toggleEl) toggleEl.setAttribute('aria-expanded', 'false');
    if (mobileToggle) mobileToggle.setAttribute('aria-expanded', 'false');
    if (toggleEl) toggleEl.textContent = '☰';
    if (mobileToggle) mobileToggle.innerHTML = '☰';
  });

  // Close sidebar when clicking a nav link (mobile UX)
  appHeader.querySelectorAll('.nav-item').forEach(link => {
    link.addEventListener('click', () => {
      // Only close on mobile
      if (window.innerWidth <= 768) {
        document.body.classList.remove('sidebar-expanded');
        if (toggleEl) toggleEl.setAttribute('aria-expanded', 'false');
        if (mobileToggle) mobileToggle.setAttribute('aria-expanded', 'false');
        if (toggleEl) toggleEl.textContent = '☰';
        if (mobileToggle) mobileToggle.innerHTML = '☰';
      }
    }, { passive: true });
  });
  
  // Highlight current page
  const currentPath = location.pathname;
  appHeader.querySelectorAll('.nav-item').forEach(link => {
    const href = link.getAttribute('href');
    if (href && (currentPath.endsWith(href) || (href.includes('/') && currentPath.includes(href.split('/').pop())))) {
      link.setAttribute('aria-current', 'page');
      link.classList.add('active');
    }
  });
  
  // ESC to close and keyboard navigation
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const isExpanded = document.body.classList.contains('sidebar-expanded');
      if (isExpanded) {
        document.body.classList.remove('sidebar-expanded');
        if (toggleEl) {
          toggleEl.setAttribute('aria-expanded', 'false');
          toggleEl.textContent = '☰';
        }
        if (mobileToggle) {
          mobileToggle.setAttribute('aria-expanded', 'false');
          mobileToggle.innerHTML = '☰';
          mobileToggle.focus();
        }
      }
    }
    
    // Keyboard shortcut to toggle sidebar (Ctrl/Cmd + B)
    if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
      e.preventDefault();
      toggleSidebar();
    }
    
    // Arrow key navigation within sidebar
    if (document.body.classList.contains('sidebar-expanded') && appHeader.contains(document.activeElement)) {
      const visibleNavItems = Array.from(appHeader.querySelectorAll('.nav-item'));
      const currentIndex = visibleNavItems.indexOf(document.activeElement);
      
      if (e.key === 'ArrowDown' && currentIndex < visibleNavItems.length - 1) {
        e.preventDefault();
        visibleNavItems[currentIndex + 1].focus();
      } else if (e.key === 'ArrowUp' && currentIndex > 0) {
        e.preventDefault();
        visibleNavItems[currentIndex - 1].focus();
      } else if (e.key === 'Home') {
        e.preventDefault();
        visibleNavItems[0].focus();
      } else if (e.key === 'End') {
        e.preventDefault();
        visibleNavItems[visibleNavItems.length - 1].focus();
      }
    }
  });
}

// Initialize everything when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initIncludes();
    // Disabled background preloader - was causing incomplete cache states
    // initBackgroundCachePreloader();
  });
} else {
  initIncludes();
  // Disabled background preloader - was causing incomplete cache states
  // initBackgroundCachePreloader();
}

// === BACKGROUND CACHE PRELOADER ===
// Builds cache in background on any page for faster search experience

function initBackgroundCachePreloader() {
  // Different delays for different pages
  const path = location.pathname || '';
  const isIndex = /(^|\/)index\.html$/.test(path) || /\/$/.test(path);
  
  // Index page: longer delay to not interfere with main page experience
  // Other pages: shorter delay for faster cache building
  const delay = isIndex ? 10000 : 2000; // 10s for index, 2s for other pages
  
  console.log(`🕒 Background cache preloader will start in ${delay/1000}s...`);

  // Start background preloading after delay
  setTimeout(() => {
    startBackgroundCachePreloader();
  }, delay);
}

class BackgroundCachePreloader {
  constructor() {
    this.DRIVE_API_KEY = "AIzaSyAEOadL6D0G_c8z5EB-sEp0T3hanYAnmF0";
    this.CACHE_VERSION = "v1";
    this.CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
    this.isPreloading = false;
    this.preloadProgress = this.getPreloadProgress();
    
    // Background rate limiter - slower to not interfere with user actions
    this.rateLimiter = new BackgroundRateLimiter(2, 300); // Max 2 concurrent, 300ms delay
  }

  getPreloadProgress() {
    try {
      const progress = localStorage.getItem(`cachePreloadProgress_${this.CACHE_VERSION}`);
      return progress ? JSON.parse(progress) : { completed: [], total: 0, lastUpdated: 0 };
    } catch {
      return { completed: [], total: 0, lastUpdated: 0 };
    }
  }

  savePreloadProgress() {
    try {
      localStorage.setItem(`cachePreloadProgress_${this.CACHE_VERSION}`, JSON.stringify(this.preloadProgress));
    } catch (error) {
      console.warn('Failed to save preload progress:', error);
    }
  }

  async loadDriveMapping() {
    try {
      // Get the base URL and construct the correct absolute path
      const currentURL = new URL(window.location.href);
      let mappingURL;
      
      if (currentURL.pathname.includes('/pages/')) {
        // We're in a subdirectory, go up one level to assets folder
        mappingURL = new URL('../assets/drive-mapping.json', currentURL.href);
      } else {
        // We're in root directory, go to assets folder
        mappingURL = new URL('./assets/drive-mapping.json', currentURL.href);
      }
      
      console.log(`🗂️ Loading drive mapping from: ${mappingURL.href}`);
      const response = await fetch(mappingURL.href);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.warn('Failed to load drive mapping for background preloader:', error);
      return {};
    }
  }

  async startPreloading() {
    if (this.isPreloading) return;
    
    this.isPreloading = true;
    console.log('🚀 Starting background cache preloader...');
    console.log('📍 Current location:', window.location.href);

    try {
      const driveMapping = await this.loadDriveMapping();
      
      if (!driveMapping || Object.keys(driveMapping).length === 0) {
        console.warn('⚠️ No drive mapping loaded, preloader cannot continue');
        this.isPreloading = false;
        return;
      }
      
      const folderList = this.getFolderList(driveMapping);
      
      this.preloadProgress.total = folderList.length;
      
      // Skip already completed folders
      const remainingFolders = folderList.filter(folder => 
        !this.preloadProgress.completed.includes(folder.folderId)
      );

      console.log(`📦 Background preloader: ${remainingFolders.length}/${folderList.length} folders remaining`);

      for (const folder of remainingFolders) {
        if (!this.isPreloading) break; // Allow stopping

        try {
          await this.preloadFolder(folder);
          this.preloadProgress.completed.push(folder.folderId);
          this.preloadProgress.lastUpdated = Date.now();
          this.savePreloadProgress();
        } catch (error) {
          console.warn(`Failed to preload ${folder.label}:`, error);
        }
      }

      console.log('✅ Background cache preloading completed!');
    } catch (error) {
      console.warn('Background preloader error:', error);
    } finally {
      this.isPreloading = false;
    }
  }

  getFolderList(driveMapping) {
    const folders = [];
    for (const [semester, batches] of Object.entries(driveMapping)) {
      for (const [batchKey, batchInfo] of Object.entries(batches)) {
        folders.push({
          folderId: batchInfo.folderId,
          label: batchInfo.label,
          semester,
          batchKey
        });
      }
    }
    return folders;
  }

  async preloadFolder(folder) {
    await this.preloadFolderRecursive(folder.folderId, 0, 4); // Depth 4 like browse page
  }

  async preloadFolderRecursive(folderId, currentDepth, maxDepth) {
    if (currentDepth >= maxDepth) return;

    // Check if already cached
    const cacheKey = this.getCacheKey(folderId, currentDepth);
    const existing = localStorage.getItem(cacheKey);
    if (existing) {
      try {
        const cached = JSON.parse(existing);
        if (Date.now() - cached.timestamp < this.CACHE_DURATION) {
          // Use cached data to continue recursive preloading
          const folders = (cached.data || []).filter(file => 
            file.mimeType === "application/vnd.google-apps.folder"
          );
          
          // Preload subfolders
          for (const folder of folders) {
            await this.preloadFolderRecursive(folder.id, currentDepth + 1, maxDepth);
          }
          return;
        }
      } catch {
        // Invalid cache, will refetch
      }
    }

    // Fetch fresh data
    const url = `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents+and+trashed=false&key=${this.DRIVE_API_KEY}&fields=files(id,name,mimeType,webViewLink)&pageSize=1000&orderBy=name`;
    
    try {
      const data = await this.rateLimiter.makeRequest(url);
      
      // Save to cache
      const cacheData = {
        data: data.files || [],
        timestamp: Date.now(),
        version: this.CACHE_VERSION,
        depth: currentDepth
      };
      localStorage.setItem(cacheKey, JSON.stringify(cacheData));

      // Preload subfolders
      const folders = (data.files || []).filter(file => 
        file.mimeType === "application/vnd.google-apps.folder"
      );
      
      for (const folder of folders) {
        await this.preloadFolderRecursive(folder.id, currentDepth + 1, maxDepth);
      }
    } catch (error) {
      console.warn(`Background preloader failed for folder ${folderId}:`, error);
    }
  }

  getCacheKey(folderId, currentDepth) {
    return `driveCache_${this.CACHE_VERSION}_${folderId}_${currentDepth}`;
  }

  stopPreloading() {
    this.isPreloading = false;
    console.log('⏹️ Background preloader stopped');
  }

  getStats() {
    return {
      isPreloading: this.isPreloading,
      progress: this.preloadProgress,
      rateLimiterStats: this.rateLimiter.getStats()
    };
  }
}

// Background-specific rate limiter (slower, less aggressive)
class BackgroundRateLimiter {
  constructor(maxConcurrent = 2, delayBetween = 300) {
    this.maxConcurrent = maxConcurrent;
    this.delayBetween = delayBetween;
    this.activeRequests = 0;
    this.requestQueue = [];
    this.isProcessing = false;
  }

  async makeRequest(url) {
    return new Promise((resolve, reject) => {
      this.requestQueue.push({ url, resolve, reject });
      this.processQueue();
    });
  }

  async processQueue() {
    if (this.isProcessing || this.requestQueue.length === 0) return;
    
    this.isProcessing = true;

    while (this.requestQueue.length > 0 && this.activeRequests < this.maxConcurrent) {
      const { url, resolve, reject } = this.requestQueue.shift();
      this.activeRequests++;

      this.executeRequest(url, resolve, reject);
      
      if (this.requestQueue.length > 0) {
        await new Promise(resolve => setTimeout(resolve, this.delayBetween));
      }
    }

    this.isProcessing = false;
  }

  async executeRequest(url, resolve, reject) {
    try {
      const response = await fetch(url);
      this.activeRequests--;
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status} - ${response.statusText}`);
      }
      
      const data = await response.json();
      resolve(data);
      
      setTimeout(() => this.processQueue(), this.delayBetween);
      
    } catch (error) {
      this.activeRequests--;
      reject(error);
      setTimeout(() => this.processQueue(), this.delayBetween);
    }
  }

  getStats() {
    return {
      activeRequests: this.activeRequests,
      queueLength: this.requestQueue.length,
      maxConcurrent: this.maxConcurrent
    };
  }
}

// Global preloader instance
let backgroundPreloader = null;

function startBackgroundCachePreloader() {
  if (!backgroundPreloader) {
    backgroundPreloader = new BackgroundCachePreloader();
  }
  
  // Only start if not already preloading and cache might be stale
  const progress = backgroundPreloader.getPreloadProgress();
  const isStale = Date.now() - progress.lastUpdated > backgroundPreloader.CACHE_DURATION;
  
  if (!backgroundPreloader.isPreloading && (progress.total === 0 || isStale)) {
    backgroundPreloader.startPreloading();
  }
}

// Reset global state when page unloads to ensure fresh initialization on next page
window.addEventListener('beforeunload', () => {
  sidebarInitialized = false;
});

// Make preloader available globally for debugging and manual control
window.backgroundCachePreloader = {
  start: startBackgroundCachePreloader,
  stop: () => backgroundPreloader?.stopPreloading(),
  stats: () => backgroundPreloader?.getStats(),
  instance: () => backgroundPreloader
};