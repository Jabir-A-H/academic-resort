// === SEARCH FUNCTIONALITY ===

// Debounce function for search optimization
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Toggle advanced search options
function toggleAdvancedOptions() {
  const advancedOptions = document.getElementById("advancedOptions");
  const toggleBtn = document.querySelector(".options-toggle-btn");
  
  if (!advancedOptions || !toggleBtn) return;
  
  if (advancedOptions.classList.contains("show")) {
    advancedOptions.classList.remove("show");
    toggleBtn.classList.remove("active");
    toggleBtn.innerHTML = 'Search Globally <span class="accordion-icon">▼</span>';
  } else {
    advancedOptions.classList.add("show");
    toggleBtn.classList.add("active");
    toggleBtn.innerHTML = 'Search Specifically <span class="accordion-icon">▲</span>';
  }
}

// Toggle apps dropdown
function toggleAppsDropdown() {
  const dropdown = document.getElementById("appsDropdown");
  if (dropdown) {
    dropdown.classList.toggle("show");
  }
}

// Toggle filter dropdown
function toggleFilter(filterType) {
  const dropdown = document.getElementById(`${filterType}Dropdown`);
  const button = dropdown?.previousElementSibling;
  
  if (!dropdown) return;
  
  // Close all other dropdowns
  document.querySelectorAll('.filter-dropdown-content').forEach(d => {
    if (d !== dropdown) {
      d.classList.remove('show');
      d.previousElementSibling?.classList.remove('active');
    }
  });
  
  // Toggle current dropdown
  dropdown.classList.toggle('show');
  button?.classList.toggle('active');
}

// Note: optimizedSearch function is implemented in index.html's inline script
// Don't define it here to avoid conflicts

// === UTILITY FUNCTIONS ===

// Show/hide search results and quick access sections
function toggleSections(showResults) {
  const searchResultsContainer = document.getElementById('searchResults') || 
                                 document.querySelector('.search-results-container');
  if (searchResultsContainer) {
    if (showResults) {
      searchResultsContainer.classList.add("visible");
    } else {
      searchResultsContainer.classList.remove("visible");
    }
  }
}

// Retro loading animation control
function showRetroLoading(message = "Searching academic resources...") {
  const retroContainer = document.getElementById('retroLoadingContainer');
  
  if (retroContainer) {
    retroContainer.classList.add('active');
  }
}

function hideRetroLoading() {
  const retroContainer = document.getElementById('retroLoadingContainer');
  if (retroContainer) {
    retroContainer.classList.remove('active');
  }
}

function updateRetroLoadingStatus(status) {
  // Status updates are no longer displayed in the loading animation
  // This function is kept for backward compatibility
}

// === EVENT LISTENERS ===

// Setup event listeners when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  // Close dropdowns when clicking outside
  document.addEventListener('click', function(e) {
    // Close apps dropdown
    const dropdown = document.getElementById("appsDropdown");
    const appsBtn = document.querySelector(".apps-btn");
    
    if (dropdown && !dropdown.contains(e.target) && !appsBtn?.contains(e.target)) {
      dropdown.classList.remove("show");
    }
    
    // Close filter dropdowns
    if (!e.target.closest('.filter-item')) {
      document.querySelectorAll('.filter-dropdown-content').forEach(d => {
        d.classList.remove('show');
        d.previousElementSibling?.classList.remove('active');
      });
    }
  });
});

/**
 * Fix relative paths in included HTML based on current page depth
 */
function fixRelativePaths(html) {
  // No path fixing needed - using proper relative paths in header.html
  // Let the browser handle relative path resolution naturally
  return html;
}

/**
 * Simple HTML include loader
 * Usage: <div data-include="/assets/header.html"></div>
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
    let html = await res.text();
    
    // Fix relative paths based on current page depth
    html = fixRelativePaths(html);
    
    el.innerHTML = html;

    // Mark as loaded
    el.setAttribute('data-include-loaded', '1');

    // Wait for DOM to be updated before initializing components
    await new Promise(resolve => setTimeout(resolve, 10));
    
    // Initialize features that depend on included content
    setupDynamicComponents();
    
    // Execute inline scripts in the loaded content
    executeInlineScripts(el);

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
 * Execute inline scripts in loaded content
 */
function executeInlineScripts(container) {
  try {
    const scripts = container.querySelectorAll('script');
    scripts.forEach(oldScript => {
      // Create a new script element to ensure execution
      const newScript = document.createElement('script');
      
      // Copy attributes
      Array.from(oldScript.attributes).forEach(attr => {
        newScript.setAttribute(attr.name, attr.value);
      });
      
      // Copy content
      newScript.textContent = oldScript.textContent;
      
      // Replace old script with new one to trigger execution
      oldScript.parentNode.replaceChild(newScript, oldScript);
    });
  } catch (error) {
    console.error('Error executing inline scripts:', error);
  }
}

/**
 * Setup interactive components that depend on included HTML
 */
function setupDynamicComponents() {
  try {
    // Try to setup sidebar, with retry if content isn't ready
    setupSidebarToggle();
    // Add more later: setupDarkMode(), setupModals(), etc.
  } catch (error) {
    console.error('Error setting up dynamic components:', error);
    // Retry after a short delay if there was an error
    setTimeout(() => {
      setupSidebarToggle();
    }, 200);
  }
}

/**
 * Setup navigation link event handlers
 */
function setupNavLinkHandlers(appHeader, navLinks) {
  if (!appHeader || !navLinks || navLinks.length === 0) {
    return;
  }

  const toggleEl = appHeader.querySelector('.menu-toggle');
  const mobileToggle = document.querySelector('.mobile-menu-toggle');

  // Close sidebar when clicking a nav link (mobile UX)
  Array.from(navLinks).forEach(link => {
    // Remove any existing listeners by cloning the element
    const newLink = link.cloneNode(true);
    link.parentNode.replaceChild(newLink, link);
    
    newLink.addEventListener('click', () => {
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
  
  // Highlight current page - get fresh list after clone operations
  const currentPath = location.pathname;
  const updatedNavLinks = appHeader.querySelectorAll('.nav-item');
  updatedNavLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (href && (currentPath.endsWith(href) || (href.includes('/') && currentPath.includes(href.split('/').pop())))) {
      link.setAttribute('aria-current', 'page');
      link.classList.add('active');
    }
  });
}

function setupSidebarToggle(retryCount = 0) {
  // Do not initialize sidebar on index.html
  const path = location.pathname || '';
  const isIndex = /(^|\/)index\.html$/.test(path) || /\/$/.test(path);
  if (isIndex) return;

  const appHeader = document.querySelector('.app-header');
  if (!appHeader) {
    if (retryCount < 10) { // Max 10 retries (1 second total)
      setTimeout(() => setupSidebarToggle(retryCount + 1), 100);
    }
    return;
  }

  // Check if navigation links are loaded
  const navLinks = appHeader.querySelectorAll('.nav-item');
  if (navLinks.length === 0) {
    if (retryCount < 15) { // Max 15 retries for nav links (1.5 seconds total)
      setTimeout(() => setupSidebarToggle(retryCount + 1), 100);
    }
    return;
  }

  // Prevent multiple initializations globally
  if (sidebarInitialized) {
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
    
    // Re-setup nav link click handlers for the new page
    setupNavLinkHandlers(appHeader, navLinks);
    return;
  }

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

  const toggleEl = appHeader.querySelector('.menu-toggle');
  
  // Function to toggle sidebar
  const toggleSidebar = () => {
    try {
      const expanded = document.body.classList.toggle('sidebar-expanded');
      
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
    toggleEl.addEventListener('click', toggleSidebar, { passive: true });
  }
  if (mobileToggle) {
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
  setupNavLinkHandlers(appHeader, appHeader.querySelectorAll('.nav-item'));
  
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
  });
} else {
  initIncludes();
}

// Reset global state when page unloads to ensure fresh initialization on next page
window.addEventListener('beforeunload', () => {
  sidebarInitialized = false;
});