/**
 * Unified Search Engine
 * Handles all search operations and filtering
 */

class SearchEngine {
  constructor(driveManager, config = window.SiteConfig) {
    this.driveManager = driveManager;
    this.config = config;
    this.searchSettings = config.search;
  }

  // ========== FILTER HANDLERS ==========

  handleFilterChange() {
    const searchTerm = this.getSearchTerm();

    // Only trigger search if there's already text in the search bar
    if (searchTerm && searchTerm.length >= this.searchSettings.minLength) {
      this.optimizedSearch();
    } else {
      // Clear results if no search term
      this.displayResults([]);
      this.updateStats("Enter a search term to find resources.");
    }
  }

  // ========== MAIN SEARCH FUNCTION ==========

  async optimizedSearch() {
    const searchTerm = this.getSearchTerm();
    const semesterFilter = this.getSemesterFilter();
    const batchFilter = this.getBatchFilter();

    // Always require a search term for manual search
    if (!searchTerm) {
      this.displayResults([]);
      this.updateStats("Enter a search term to find resources.");
      return;
    }

    if (searchTerm.length < this.searchSettings.minLength) {
      this.updateStats(`Type at least ${this.searchSettings.minLength} characters to search...`);
      return;
    }

    this.updateStats("Searching...");

    try {
      const results = await this.smartSearch(searchTerm, semesterFilter, batchFilter);
      this.displayResults(results);
      this.updateStats(`Found ${results.length} results`);
    } catch (error) {
      console.error("Search failed:", error);
      this.updateStats("Search failed. Please try again.");
    }
  }

  // ========== SMART SEARCH ==========

  async smartSearch(searchTerm, semesterFilter, batchFilter) {
    const results = [];

    // Smart folder organization: Group by semester, then distribute evenly
    const semesterBatches = {};
    for (const [semester, batches] of Object.entries(this.driveManager.allDriveResources)) {
      if (semesterFilter && semester !== semesterFilter) continue;
      semesterBatches[semester] = [];
      for (const [batchKey, batchInfo] of Object.entries(batches)) {
        if (batchFilter && batchKey !== batchFilter) continue;
        semesterBatches[semester].push({ batchKey, batchInfo });
      }
    }

    // Create round-robin batches: 1st from each semester, then 2nd from each, etc.
    const smartBatches = [];
    const maxBatchesPerSemester = Math.max(
      ...Object.values(semesterBatches).map((batches) => batches.length)
    );

    for (let batchIndex = 0; batchIndex < maxBatchesPerSemester; batchIndex++) {
      const roundRobinBatch = [];
      for (const semester of Object.keys(semesterBatches)) {
        if (semesterBatches[semester][batchIndex]) {
          roundRobinBatch.push({
            semester,
            ...semesterBatches[semester][batchIndex]
          });
        }
      }
      if (roundRobinBatch.length > 0) {
        smartBatches.push(roundRobinBatch);
      }
    }

    // Search folders in parallel batches
    const PARALLEL_BATCH_SIZE = this.searchSettings.parallelBatchSize;
    const MAX_SEARCH_DEPTH = this.searchSettings.maxDepth;

    // Clear results container at start
    this.clearResultsContainer();

    let totalFolders = 0;
    let completedFolders = 0;

    // Count total folders
    smartBatches.forEach((batch) => (totalFolders += batch.length));

    // Process each round-robin batch
    for (const roundRobinBatch of smartBatches) {
      // Split into parallel batches for maximum speed
      for (let i = 0; i < roundRobinBatch.length; i += PARALLEL_BATCH_SIZE) {
        const batch = roundRobinBatch.slice(i, i + PARALLEL_BATCH_SIZE);

        // Process this batch of folders in parallel
        const batchPromises = batch.map(({ semester, batchKey, batchInfo }) =>
          this.driveManager.searchFolder(
            batchInfo.folderId,
            "",
            MAX_SEARCH_DEPTH,
            searchTerm
          ).then(folderResults => {
            // Add metadata to results
            return folderResults.map(result => ({
              ...result,
              semester,
              batch: batchKey,
              batchLabel: batchInfo.label
            }));
          })
        );

        // Wait for this batch to complete
        const batchResults = await Promise.all(batchPromises);

        // Add results and update progress
        for (const folderResults of batchResults) {
          results.push(...folderResults);
        }

        completedFolders += batch.length;
        const limiterStats = this.driveManager.apiLimiter.getStats();

        // Update results display in real-time after each batch
        const currentResults = this.removeDuplicatesOptimized(results);
        if (currentResults.length > 0) {
          this.updateStats(`🔍 Searching ${completedFolders}/${totalFolders} folders | Queue: ${limiterStats.queueLength} | Active: ${limiterStats.activeRequests} <span style="float: right; color: #68d391; font-size: 0.9em;">${currentResults.length} results</span>`);
        } else {
          this.updateStats(`🔍 Searching ${completedFolders}/${totalFolders} folders | Queue: ${limiterStats.queueLength} | Active: ${limiterStats.activeRequests}`);
        }

        // Early termination if we have many results
        if (currentResults.length > this.config.ui.maxResults) {
          this.updateStats(`Search stopped early - found ${currentResults.length} results <span style="float: right; color: #68d391; font-size: 0.9em;">Try more specific terms</span>`);
          break;
        }

        // Also stop early if search term is very specific and we found good matches
        if (currentResults.length > 100 && searchTerm.length > 8) {
          this.updateStats(`Search complete <span style="float: right; color: #68d391; font-size: 0.9em;">${currentResults.length} results</span>`);
          break;
        }
      }
    }

    const flatResults = this.removeDuplicatesOptimized(results);

    // Save captured folder IDs to persistent cache
    this.driveManager.saveResolvedFolderCache();

    // Final update - show completion in stats line
    this.updateStats(`Search complete <span style="float: right; color: #68d391; font-size: 0.9em;">${flatResults.length} results</span>`);

    return flatResults;
  }

  // ========== UTILITY METHODS ==========

  getSearchTerm() {
    const searchInput = document.getElementById("globalSearch");
    return searchInput ? searchInput.value.toLowerCase().trim() : "";
  }

  getSemesterFilter() {
    const semesterSelect = document.getElementById("semesterFilter");
    return semesterSelect ? semesterSelect.value : "";
  }

  getBatchFilter() {
    const batchSelect = document.getElementById("batchFilter");
    return batchSelect ? batchSelect.value : "";
  }

  clearResultsContainer() {
    const container = document.getElementById("all-resources");
    if (container) {
      container.innerHTML = '<div class="live-results">Searching...</div>';
    }
  }

  displayResults(results) {
    // This will be handled by the display manager
    if (window.displayManager && typeof window.displayManager.displayResults === 'function') {
      window.displayManager.displayResults(results);
    }
  }

  updateStats(message) {
    const statsElement = document.getElementById("resultsStats");
    if (statsElement) {
      statsElement.innerHTML = message;
    }
  }

  removeDuplicatesOptimized(files) {
    if (files.length === 0) return [];

    const uniqueResults = new Map();

    // Use Map for O(1) lookups instead of array scanning
    files.forEach((file) => {
      const key = `${file.semester}_${file.batch}_${file.path}`;
      if (!uniqueResults.has(key)) {
        uniqueResults.set(key, file);
      }
    });

    return Array.from(uniqueResults.values());
  }
}

// ========== GLOBAL EXPORTS ==========

window.SearchEngine = SearchEngine;
