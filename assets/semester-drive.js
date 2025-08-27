/**
 * Semester Drive Manager - Optimized version
 * Handles Google Drive integration for semester pages
 */

class SemesterDriveManager {
  constructor(semesterName, apiKeys) {
    this.semesterName = semesterName;
    this.apiKeys = Array.isArray(apiKeys) ? apiKeys : [apiKeys]; // Support single key or array
    this.batches = {};
    this.cacheVersion = "v2";
    this.cacheDuration = 24 * 60 * 60 * 1000; // 24 hours
    this.currentApiIndex = 0; // For round-robin API key usage
    this.activeRequests = new Map(); // Track ongoing requests to prevent duplicates
  }

  // ========== CACHE MANAGEMENT ==========
  
  getCacheKey(folderId) {
    return `driveCache_${this.semesterName}_${this.cacheVersion}_${folderId}`;
  }

  saveToCache(folderId, data) {
    try {
      const cacheData = {
        data: data,
        timestamp: Date.now(),
        version: this.cacheVersion
      };
      localStorage.setItem(this.getCacheKey(folderId), JSON.stringify(cacheData));
    } catch (error) {
      console.warn("Cache save failed:", error);
    }
  }

  loadFromCache(folderId) {
    try {
      const cached = localStorage.getItem(this.getCacheKey(folderId));
      if (!cached) return null;

      const cacheData = JSON.parse(cached);
      const age = Date.now() - cacheData.timestamp;

      if (age > this.cacheDuration || cacheData.version !== this.cacheVersion) {
        localStorage.removeItem(this.getCacheKey(folderId));
        return null;
      }

      return cacheData.data;
    } catch (error) {
      console.warn("Cache load failed:", error);
      return null;
    }
  }

  // ========== BATCH MANAGEMENT ==========

  async loadBatchMapping() {
    try {
      const response = await fetch("../assets/drive-mapping.json");
      if (!response.ok) throw new Error(`Failed to load mapping: ${response.status}`);
      
      const mapping = await response.json();
      
      if (mapping[this.semesterName]?.batches) {
        Object.entries(mapping[this.semesterName].batches).forEach(
          ([batchKey, batchData]) => {
            this.batches[batchKey] = batchData.folderId;
          }
        );
      }

      return this.batches;
    } catch (error) {
      console.error("Error loading drive mapping:", error);
      // Return empty object if mapping fails
      return {};
    }
  }

  // ========== API CALLS ==========

  // Get next API key using round-robin
  getNextApiKey() {
    const key = this.apiKeys[this.currentApiIndex];
    this.currentApiIndex = (this.currentApiIndex + 1) % this.apiKeys.length;
    return key;
  }

  // Make multiple parallel requests for different folders
  async fetchMultipleFolders(folderIds) {
    const promises = folderIds.map(folderId => this.fetchFolderContents(folderId));
    
    try {
      const results = await Promise.allSettled(promises);
      return results.map((result, index) => ({
        folderId: folderIds[index],
        success: result.status === 'fulfilled',
        data: result.status === 'fulfilled' ? result.value : null,
        error: result.status === 'rejected' ? result.reason : null
      }));
    } catch (error) {
      console.error("Batch fetch failed:", error);
      return folderIds.map(folderId => ({ folderId, success: false, data: null, error }));
    }
  }

  async fetchFolderContents(folderId) {
    // Check if request is already in progress
    if (this.activeRequests.has(folderId)) {
      console.log(`⏳ Request already in progress for folder ${folderId}`);
      return this.activeRequests.get(folderId);
    }

    // Check cache first
    const cachedData = this.loadFromCache(folderId);
    if (cachedData) {
      console.log(`📋 Using cached data for folder ${folderId}`);
      return cachedData;
    }

    // Create the request promise
    const requestPromise = this._performApiRequest(folderId);
    
    // Store the promise to prevent duplicate requests
    this.activeRequests.set(folderId, requestPromise);

    try {
      const result = await requestPromise;
      return result;
    } finally {
      // Clean up the active request
      this.activeRequests.delete(folderId);
    }
  }

  async _performApiRequest(folderId) {
    const apiKey = this.getNextApiKey();
    
    try {
      console.log(`🌐 Fetching data for folder ${folderId} with API key ${this.apiKeys.indexOf(apiKey) + 1}/${this.apiKeys.length}`);
      
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents&key=${apiKey}&fields=files(id,name,mimeType,webViewLink)`
      );

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      const files = data.files || [];

      // Save to cache
      this.saveToCache(folderId, files);

      return files;
    } catch (error) {
      console.error(`API request failed for folder ${folderId}:`, error);
      throw error;
    }
  }

  // ========== RENDERING ==========

  renderFileList(files, container) {
    if (!files || files.length === 0) {
      container.innerHTML = '<li class="empty">No files found</li>';
      return;
    }

    // Sort files alphabetically
    files.sort((a, b) => a.name.localeCompare(b.name));

    const listItems = files.map(file => {
      if (file.mimeType === "application/vnd.google-apps.folder") {
        return `
          <li class="drive-list-item">
            <div class="folder-item">
              <a href="https://drive.google.com/drive/folders/${file.id}" target="_blank" class="folder-link">
                📁 ${file.name}
              </a>
              <div class="folder-actions">
                <button class="expand-btn" onclick="semesterDrive.toggleFolderExpansion('${file.id}', this)" title="Expand folder contents">
                  ▼
                </button>
              </div>
            </div>
            <ul class="subfolder-list" id="subfolder-${file.id}" style="display: none;"></ul>
          </li>
        `;
      } else {
        const fileUrl = file.webViewLink || `https://drive.google.com/file/d/${file.id}/view`;
        return `
          <li class="drive-list-item">
            <a href="${fileUrl}" target="_blank">📄 ${file.name}</a>
          </li>
        `;
      }
    });

    container.innerHTML = listItems.join('');
  }

  // ========== MAIN FUNCTIONS ==========

  async loadBatch(batchNum, folderId) {
    const spinner = document.getElementById(`spinner-${batchNum}`);
    const list = document.getElementById(`drive-list-${batchNum}`);

    if (!spinner || !list) {
      console.error(`Elements not found for batch ${batchNum}`);
      return;
    }

    spinner.style.display = "block";
    list.innerHTML = "";

    try {
      const files = await this.fetchFolderContents(folderId);
      this.renderFileList(files, list);
    } catch (error) {
      list.innerHTML = `<li class="error-message">Error loading files: ${error.message}</li>`;
    } finally {
      spinner.style.display = "none";
    }
  }

  async toggleFolderExpansion(folderId, button) {
    const subfolderList = document.getElementById(`subfolder-${folderId}`);
    
    if (!subfolderList) {
      console.error(`Subfolder list not found: ${folderId}`);
      return;
    }

    if (subfolderList.style.display === "none") {
      // Expand folder
      button.innerHTML = "▲";
      button.title = "Collapse folder contents";
      subfolderList.style.display = "block";

      // Load contents if not already loaded
      if (subfolderList.children.length === 0) {
        subfolderList.innerHTML = '<li class="loading">Loading...</li>';

        try {
          const files = await this.fetchFolderContents(folderId);
          this.renderFileList(files, subfolderList);
        } catch (error) {
          subfolderList.innerHTML = `<li class="error">Error loading: ${error.message}</li>`;
        }
      }
    } else {
      // Collapse folder
      button.innerHTML = "▼";
      button.title = "Expand folder contents";
      subfolderList.style.display = "none";
    }
  }

  // ========== INITIALIZATION ==========

  async initialize() {
    try {
      // Load batch mapping
      await this.loadBatchMapping();

      // Set up spinners
      document.querySelectorAll(".drive-spinner").forEach(spinner => {
        spinner.innerHTML = '<div class="loading-spinner"></div>';
      });

      // Populate table of contents
      this.populateTableOfContents();

      // Set up root folder buttons and load batches
      this.setupBatches();

      console.log(`✅ ${this.semesterName} semester drive manager initialized`);
    } catch (error) {
      console.error("Initialization failed:", error);
    }
  }

  populateTableOfContents() {
    const toc = document.getElementById("table-of-contents");
    if (!toc) return;

    const batchKeys = Object.keys(this.batches).sort((a, b) => parseInt(b) - parseInt(a));
    toc.innerHTML = batchKeys
      .map(batchNum => `<li><a href="#batch-${batchNum}">${batchNum}th Batch</a></li>`)
      .join("");
  }

  setupBatches() {
    // Get all folder IDs for parallel loading
    const folderIds = Object.values(this.batches);
    
    // Load all batches in parallel using multiple API keys
    if (folderIds.length > 1) {
      console.log(`🚀 Loading ${folderIds.length} batches in parallel with ${this.apiKeys.length} API keys`);
      this.loadMultipleBatchesParallel();
    }

    // Set up UI elements for each batch
    Object.entries(this.batches).forEach(([batchNum, folderId]) => {
      // Set up root folder button
      const rootBtn = document.getElementById(`root-btn-${batchNum}`);
      if (rootBtn) {
        rootBtn.onclick = () => window.open(
          `https://drive.google.com/drive/folders/${folderId}`,
          "_blank"
        );
      }

      // Set up spinner
      const spinner = document.getElementById(`spinner-${batchNum}`);
      if (spinner) {
        spinner.style.display = "block";
      }
    });
  }

  async loadMultipleBatchesParallel() {
    const batchEntries = Object.entries(this.batches);
    const folderIds = batchEntries.map(([_, folderId]) => folderId);

    try {
      // Fetch all folders in parallel
      const results = await this.fetchMultipleFolders(folderIds);

      // Process results
      results.forEach((result, index) => {
        const [batchNum] = batchEntries[index];
        const list = document.getElementById(`drive-list-${batchNum}`);
        const spinner = document.getElementById(`spinner-${batchNum}`);

        if (result.success) {
          this.renderFileList(result.data, list);
        } else {
          if (list) {
            list.innerHTML = `<li class="error-message">Error loading files: ${result.error?.message || 'Unknown error'}</li>`;
          }
        }

        if (spinner) {
          spinner.style.display = "none";
        }
      });

      console.log(`✅ Loaded ${results.filter(r => r.success).length}/${results.length} batches successfully`);
    } catch (error) {
      console.error("Parallel batch loading failed:", error);
      // Fallback to individual loading
      this.setupBatchesIndividually();
    }
  }

  setupBatchesIndividually() {
    Object.entries(this.batches).forEach(([batchNum, folderId]) => {
      this.loadBatch(batchNum, folderId);
    });
  }

  // ========== UTILITY FUNCTIONS ==========

  getCacheStats() {
    const keys = Object.keys(localStorage).filter(key => 
      key.startsWith(`driveCache_${this.semesterName}_${this.cacheVersion}`)
    );

    let totalSize = 0;
    keys.forEach(key => {
      const item = localStorage.getItem(key);
      if (item) totalSize += item.length;
    });

    return {
      entries: keys.length,
      sizeKB: Math.round(totalSize / 1024),
      apiKeys: this.apiKeys.length,
      activeRequests: this.activeRequests.size
    };
  }

  clearCache() {
    const keys = Object.keys(localStorage).filter(key => 
      key.startsWith(`driveCache_${this.semesterName}`)
    );
    
    keys.forEach(key => localStorage.removeItem(key));
    console.log(`🗑️ Cleared ${keys.length} cache entries for ${this.semesterName}`);
  }
}

// ========== PAGE-SPECIFIC UTILITIES ==========

function toggleTOC() {
  const tocContent = document.getElementById("table-of-contents");
  const tocToggle = document.getElementById("toc-toggle");

  if (!tocContent || !tocToggle) return;

  if (tocContent.style.display === "none") {
    tocContent.style.display = "block";
    tocToggle.textContent = "▲";
  } else {
    tocContent.style.display = "none";
    tocToggle.textContent = "▼";
  }
}

// ========== GLOBAL INITIALIZATION ==========

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  // Use centralized Drive key manager when available
  const apiKeys = (window.DriveKeyManager && window.DriveKeyManager.getApiKeys && window.DriveKeyManager.getApiKeys()) || [];

  // Create global instance with keys (may be empty if DriveKeyManager not loaded)
  window.semesterDrive = new SemesterDriveManager("1st", apiKeys);
  
  // Initialize the manager
  window.semesterDrive.initialize();

  // Make cache functions available for debugging
  window.firstSemesterCache = {
    stats: () => window.semesterDrive.getCacheStats(),
    clear: () => window.semesterDrive.clearCache()
  };
});
