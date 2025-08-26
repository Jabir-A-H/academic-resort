/**
 * Simple HTML include loader
 * Usage: <div data-include="/assets/includes/sidebar.html"></div>
 */
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
  setupSidebarToggle();
  // Add more later: setupDarkMode(), setupModals(), etc.
}

function setupSidebarToggle() {
  // Do not initialize sidebar on index.html
  const path = location.pathname || '';
  const isIndex = /(^|\/)index\.html$/.test(path) || /\/$/.test(path);
  if (isIndex) return;

  const appHeader = document.querySelector('.app-header');
  if (!appHeader) return;

  // Only initialize once per header load
  if (appHeader.hasAttribute('data-sidebar-initialized')) return;
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

  // Ensure collapsed by default
  document.body.classList.remove('sidebar-expanded');

  // Ensure header has sidebar class for scoped CSS
  appHeader.classList.add('sidebar');

  // Create overlay for mobile close behavior
  let overlay = document.querySelector('.sidebar-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.className = 'sidebar-overlay';
    document.body.appendChild(overlay);
  }

  // Create mobile hamburger button
  let mobileToggle = document.querySelector('.mobile-menu-toggle');
  if (!mobileToggle) {
    mobileToggle = document.createElement('button');
    mobileToggle.className = 'mobile-menu-toggle';
    mobileToggle.innerHTML = '☰';
    mobileToggle.setAttribute('aria-label', 'Toggle navigation menu');
    mobileToggle.setAttribute('aria-expanded', 'false');
    document.body.appendChild(mobileToggle);
  }

  const toggleEl = appHeader.querySelector('.menu-toggle');
  
  // Function to toggle sidebar
  const toggleSidebar = () => {
    const expanded = document.body.classList.toggle('sidebar-expanded');
    if (toggleEl) toggleEl.setAttribute('aria-expanded', expanded ? 'true' : 'false');
    if (mobileToggle) mobileToggle.setAttribute('aria-expanded', expanded ? 'true' : 'false');
    
    // Update visual symbols
    if (toggleEl) toggleEl.textContent = expanded ? '←' : '☰';
    if (mobileToggle) mobileToggle.innerHTML = expanded ? '✕' : '☰';
  };

  // Add click listeners to both toggle buttons
  if (toggleEl) {
    toggleEl.addEventListener('click', toggleSidebar, { passive: true });
  }
  if (mobileToggle) {
    mobileToggle.addEventListener('click', toggleSidebar, { passive: true });
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
      document.body.classList.remove('sidebar-expanded');
      if (toggleEl) toggleEl.setAttribute('aria-expanded', 'false');
      if (mobileToggle) mobileToggle.setAttribute('aria-expanded', 'false');
      if (toggleEl) toggleEl.textContent = '☰';
      if (mobileToggle) mobileToggle.innerHTML = '☰';
    }, { passive: true });
  });

  // ESC to close
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.body.classList.remove('sidebar-expanded');
      if (toggleEl) {
        toggleEl.setAttribute('aria-expanded', 'false');
        toggleEl.textContent = '☰';
      }
      if (mobileToggle) {
        mobileToggle.setAttribute('aria-expanded', 'false');
        mobileToggle.innerHTML = '☰';
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