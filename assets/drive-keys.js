// Centralized Drive API key manager (client-side)
// Loads keys from api-config.js (window.API_KEYS or similar).
// You can also set keys at runtime by calling DriveKeyManager.setApiKeys([...])
// or storing JSON array under localStorage key `drive_api_keys`.
(function () {
  // No hardcoded fallbacks - all keys come from api-config.js or runtime/localStorage
  const FALLBACK_KEYS = []; // Removed hardcoded keys

  // Internal keys array (may be replaced at runtime)
  let API_KEYS = [];
  let currentIndex = 0;
  const STORAGE_KEY = "drive_api_keys";
  const listeners = new Set();
  let DEBUG = false;

  function _loadFromLocalStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed.filter(k => !!k);
    } catch (e) {
      console.warn("DriveKeyManager: failed to parse localStorage keys", e);
    }
    return null;
  }

  function _ensureKeys() {
    // Priority: api-config.js -> localStorage -> empty (no fallbacks)
    const fromConfig = _loadFromApiConfig();
    if (fromConfig && fromConfig.length > 0) {
      API_KEYS = fromConfig.slice();
      if (DEBUG) console.info('DriveKeyManager: loaded keys from api-config');
      return;
    }

    const fromStorage = _loadFromLocalStorage();
    if (fromStorage && fromStorage.length > 0) {
      API_KEYS = fromStorage.slice();
      if (DEBUG) console.info('DriveKeyManager: loaded keys from localStorage');
    } else {
      API_KEYS = [];
      if (DEBUG) console.warn('DriveKeyManager: no keys found in api-config.js or localStorage');
    }
  }

  function getApiKeys() {
    _ensureKeys();
  if (DEBUG) console.debug('DriveKeyManager.getApiKeys ->', API_KEYS.slice());
    return API_KEYS.slice();
  }

  function getNextApiKey() {
    _ensureKeys();
    if (!API_KEYS || API_KEYS.length === 0) return "";
    const key = API_KEYS[currentIndex];
    currentIndex = (currentIndex + 1) % API_KEYS.length;
  if (DEBUG) console.debug('DriveKeyManager.getNextApiKey ->', key);
    return key;
  }

  function setApiKeys(newKeys, persist = true) {
    if (!Array.isArray(newKeys)) return false;
    API_KEYS = newKeys.filter(k => !!k);
    currentIndex = 0;
    // optionally persist to localStorage so reloads keep the keys
    if (persist) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(API_KEYS));
      } catch (e) {
        console.warn("DriveKeyManager: unable to persist keys to localStorage", e);
      }
    }
    if (DEBUG) console.info('DriveKeyManager.setApiKeys', API_KEYS.slice(), 'persist=', !!persist);
    // notify listeners
    listeners.forEach(cb => {
      try { cb(API_KEYS.slice()); } catch (e) { console.warn(e); }
    });
    return true;
  }

  // Try a few common global shapes used by a simple site-level `api-config.js`.
  function _loadFromApiConfig() {
    try {
      // Examples maintainers might use:
      // window.apiConfig = { driveApiKeys: [...] }
      // window.API_CONFIG = { driveApiKeys: [...] }
      // window.API_KEYS = [ ... ]
      // window.DRIVE_API_KEYS = [ ... ]
      // window.getDriveApiKeys && window.getDriveApiKeys()
      const candidates = [];
      if (typeof window.apiConfig === 'object' && window.apiConfig) candidates.push(window.apiConfig.driveApiKeys || window.apiConfig.drive_keys || window.apiConfig.apiKeys || []);
      if (typeof window.API_CONFIG === 'object' && window.API_CONFIG) candidates.push(window.API_CONFIG.driveApiKeys || window.API_CONFIG.drive_keys || window.API_CONFIG.apiKeys || []);
      if (Array.isArray(window.API_KEYS)) candidates.push(window.API_KEYS);
      if (Array.isArray(window.DRIVE_API_KEYS)) candidates.push(window.DRIVE_API_KEYS);
      if (Array.isArray(window.api_keys)) candidates.push(window.api_keys);
      if (typeof window.getDriveApiKeys === 'function') {
        try { const r = window.getDriveApiKeys(); if (Array.isArray(r)) candidates.push(r); } catch (e) { /* ignore */ }
      }

      for (let c of candidates) {
        if (Array.isArray(c) && c.length > 0) return c.filter(k => !!k);
      }
    } catch (e) {
      if (DEBUG) console.warn('DriveKeyManager: error while checking api-config', e);
    }
    return null;
  }

  // Toggle console debug logging for easier troubleshooting from the console.
  function setDebug(enabled) {
    DEBUG = !!enabled;
    console.info('DriveKeyManager: debug', DEBUG ? 'enabled' : 'disabled');
    return DEBUG;
  }

  function isDebug() { return !!DEBUG; }

  // Allow external code to listen for key changes
  function onChange(cb) {
    if (typeof cb !== 'function') return () => {};
    listeners.add(cb);
    return () => listeners.delete(cb);
  }

  // Listen for storage events so changes in another tab propagate immediately
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY) {
      const fromStorage = _loadFromLocalStorage();
      if (fromStorage) {
        API_KEYS = fromStorage.slice();
        currentIndex = 0;
  if (DEBUG) console.info('DriveKeyManager: storage event updated keys');
  listeners.forEach(cb => { try { cb(API_KEYS.slice()); } catch (err) { console.warn(err); } });
      }
    }
  });

  // Initialize keys from localStorage if present
  _ensureKeys();

  // Expose a simple manager
  window.DriveKeyManager = {
    getApiKeys,
    getNextApiKey,
    setApiKeys,
    onChange,
  setDebug,
  isDebug,
  // convenience: try reloading keys from api-config.js if maintainer edited that
  loadFromApiConfig: function () { const arr = _loadFromApiConfig(); if (arr) { API_KEYS = arr.slice(); currentIndex = 0; listeners.forEach(cb => { try { cb(API_KEYS.slice()); } catch (e) { console.warn(e); } }); return true; } return false; }
  };
})();
