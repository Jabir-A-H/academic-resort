/**
 * Browse Search Engine - Optimized search functionality
 */

class BrowseSearchEngine {
  constructor(driveManager) {
    this.driveManager = driveManager;
  }

  // ========== FILTER HANDLERS ==========

  handleFilterChange() {
    const searchTerm = this.driveManager.domCache.globalSearch.value.toLowerCase().trim();

    // Only trigger search if there's already text in the search bar
    if (searchTerm && searchTerm.length >= 2) {
      this.optimizedSearch();
    } else {
      // Clear results if no search term
      this.driveManager.displayResults([]);
      this.driveManager.domCache.resultsStats.textContent = "Enter a search term to find resources.";
    }
  }

  // ========== MAIN SEARCH FUNCTION ==========

  async optimizedSearch() {
    const searchTerm = this.driveManager.domCache.globalSearch.value.toLowerCase().trim();
    const semesterFilter = this.driveManager.domCache.semesterFilter.value;
    const batchFilter = this.driveManager.domCache.batchFilter.value;

    // Always require a search term for manual search
    if (!searchTerm) {
      this.driveManager.displayResults([]);
      this.driveManager.domCache.resultsStats.textContent = "Enter a search term to find resources.";
      return;
    }

    if (searchTerm.length < 2) {
      this.driveManager.domCache.resultsStats.textContent = "Type at least 2 characters to search...";
      return;
    }

    this.driveManager.domCache.resultsStats.textContent = "Searching...";

    try {
      const results = await this.smartSearch(searchTerm, semesterFilter, batchFilter);
      this.driveManager.displayResults(results);
      this.updateStats(results.length, "∞", ` (search results)`);
      this.driveManager.domCache.resultsStats.innerHTML = `Found ${results.length} results`;
    } catch (error) {
      this.driveManager.domCache.resultsStats.textContent = "Search failed. Please try again.";
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
    const PARALLEL_BATCH_SIZE = 40;
    const MAX_SEARCH_DEPTH = 5;

    // Clear results container at start
    const container = document.getElementById("all-resources");
    container.innerHTML = '<div class="live-results">Searching...</div>';

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
          this.searchInFolderRecursive(
            batchInfo.folderId,
            "",
            MAX_SEARCH_DEPTH,
            searchTerm,
            semester,
            batchKey,
            batchInfo.label,
            this.driveManager.domCache.resultsStats
          )
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
          this.driveManager.domCache.resultsStats.innerHTML = `🔍 Searching ${completedFolders}/${totalFolders} folders | Queue: ${limiterStats.queueLength} | Active: ${limiterStats.activeRequests} <span style="float: right; color: #68d391; font-size: 0.9em;">${currentResults.length} results</span>`;
        } else {
          this.driveManager.domCache.resultsStats.innerHTML = `🔍 Searching ${completedFolders}/${totalFolders} folders | Queue: ${limiterStats.queueLength} | Active: ${limiterStats.activeRequests}`;
        }

        // Early termination if we have many results
        if (currentResults.length > 500) {
          this.driveManager.domCache.resultsStats.innerHTML = `Search stopped early - found ${currentResults.length} results <span style="float: right; color: #68d391; font-size: 0.9em;">Try more specific terms</span>`;
          break;
        }

        // Also stop early if search term is very specific and we found good matches
        if (currentResults.length > 100 && searchTerm.length > 8) {
          this.driveManager.domCache.resultsStats.innerHTML = `Search complete <span style="float: right; color: #68d391; font-size: 0.9em;">${currentResults.length} results</span>`;
          break;
        }
      }
    }

    const flatResults = this.removeDuplicatesOptimized(results);

    // Save captured folder IDs to persistent cache
    this.driveManager.saveResolvedFolderCache();

    // Final update - show completion in stats line
    this.driveManager.domCache.resultsStats.innerHTML = `Search complete <span style="float: right; color: #68d391; font-size: 0.9em;">${flatResults.length} results</span>`;

    return flatResults;
  }

  // ========== RECURSIVE FOLDER SEARCH ==========

  async searchInFolderRecursive(
    folderId,
    path,
    maxDepth,
    searchTerm,
    semester,
    batchKey,
    batchLabel,
    statsElement,
    currentDepth = 0
  ) {
    // Check depth limit
    if (maxDepth >= 0 && currentDepth >= maxDepth) return [];

    // Check persistent cache first
    let cachedFiles = this.driveManager.loadFromPersistentCache(folderId, currentDepth);

    if (cachedFiles) {
      // Also update in-memory cache
      const cacheKey = `${folderId}_${currentDepth}`;
      this.driveManager.fileCache.set(cacheKey, cachedFiles);

      return await this.processFilesRecursively(
        cachedFiles,
        path,
        maxDepth,
        searchTerm,
        semester,
        batchKey,
        batchLabel,
        statsElement,
        currentDepth
      );
    }

    // Check in-memory cache second
    const cacheKey = `${folderId}_${currentDepth}`;
    if (this.driveManager.fileCache.has(cacheKey)) {
      const memCachedFiles = this.driveManager.fileCache.get(cacheKey);
      return await this.processFilesRecursively(
        memCachedFiles,
        path,
        maxDepth,
        searchTerm,
        semester,
        batchKey,
        batchLabel,
        statsElement,
        currentDepth
      );
    }

    try {
      // Rate-limited API call with multiple API keys
      const apiKey = this.driveManager.getNextApiKey();
      const url = `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents+and+trashed=false&key=${apiKey}&fields=files(id,name,mimeType,webViewLink)&pageSize=1000&orderBy=name`;

      const data = await this.driveManager.apiLimiter.makeRequest(url);

      // Cache the raw response in both memory and persistent storage
      const files = data.files || [];
      this.driveManager.fileCache.set(cacheKey, files);
      this.driveManager.saveToPersistentCache(folderId, currentDepth, files);

      return await this.processFilesRecursively(
        files,
        path,
        maxDepth,
        searchTerm,
        semester,
        batchKey,
        batchLabel,
        statsElement,
        currentDepth
      );
    } catch (error) {
      console.error(`Error searching folder ${folderId}:`, error);
      return [];
    }
  }

  // ========== FILE PROCESSING ==========

  async processFilesRecursively(
    files,
    path,
    maxDepth,
    searchTerm,
    semester,
    batchKey,
    batchLabel,
    statsElement,
    currentDepth
  ) {
    const results = [];
    const subfolderPromises = [];

    files.forEach((file) => {
      const filePath = path ? `${path}/${file.name}` : file.name;
      const isFolder = file.mimeType === "application/vnd.google-apps.folder";

      // Enhanced fuzzy search with multiple matching strategies
      const matchesSearch = !searchTerm || this.smartMatch(searchTerm, file.name, filePath);

      if (matchesSearch) {
        results.push({
          id: file.id,
          name: file.name,
          path: filePath,
          parentPath: path,
          webViewLink: file.webViewLink,
          isFolder: isFolder,
          semester: semester,
          batch: batchKey,
          batchLabel: batchLabel,
          depth: currentDepth
        });
      }

      // Store folder IDs during initial search
      if (isFolder) {
        const exactKey = `${semester}_${batchKey}_${filePath}`;
        if (window.resolvedFolderCache) {
          window.resolvedFolderCache.set(exactKey, file.id);
        }
      }

      // If it's a folder, search it recursively
      if (isFolder && (maxDepth < 0 || currentDepth < maxDepth - 1)) {
        subfolderPromises.push(
          this.searchInFolderRecursive(
            file.id,
            filePath,
            maxDepth,
            searchTerm,
            semester,
            batchKey,
            batchLabel,
            statsElement,
            currentDepth + 1
          )
        );
      }
    });

    // Wait for all subfolder searches to complete
    if (subfolderPromises.length > 0) {
      const subfolderResults = await Promise.all(subfolderPromises);
      results.push(...subfolderResults.flat());
    }

    return results;
  }

  // ========== SEARCH MATCHING ==========

  smartMatch(searchTerm, fileName, filePath) {
    const search = searchTerm.toLowerCase().trim();
    const name = fileName.toLowerCase();
    const path = filePath.toLowerCase();

    // If search is empty, don't match anything
    if (!search) return false;

    // 1. EXACT PHRASE MATCH (highest priority)
    if (name.includes(search) || path.includes(search)) {
      return true;
    }

    // 2. COMPLETE WORD BOUNDARIES
    const searchWords = search.split(/\s+/).filter((word) => word.length > 0);

    // For single word searches, use word boundaries
    if (searchWords.length === 1) {
      const word = searchWords[0];
      const wordBoundaryRegex = new RegExp(
        `\\b${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
        "i"
      );
      return wordBoundaryRegex.test(name) || wordBoundaryRegex.test(path);
    }

    // 3. ALL WORDS MUST BE PRESENT
    const allWordsPresent = searchWords.every((word) => {
      const wordBoundaryRegex = new RegExp(
        `\\b${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
        "i"
      );
      return wordBoundaryRegex.test(name) || wordBoundaryRegex.test(path);
    });

    if (allWordsPresent) {
      return true;
    }

    // 4. FLEXIBLE SPACING
    const searchNoSpaces = search.replace(/\s+/g, "");
    const nameNoSpaces = name.replace(/\s+/g, "");
    const pathNoSpaces = path.replace(/\s+/g, "");

    if (nameNoSpaces.includes(searchNoSpaces) || pathNoSpaces.includes(searchNoSpaces)) {
      return true;
    }

    // 5. ACRONYM MATCHING
    if (search.length >= 3 && !search.includes(" ")) {
      const nameWords = name.split(/[\s\-_\.]+/).filter((w) => w.length > 0);
      const pathWords = path.split(/[\s\-_\.\/]+/).filter((w) => w.length > 0);

      const nameAcronym = nameWords.map((word) => word.charAt(0)).join("");
      const pathAcronym = pathWords.map((word) => word.charAt(0)).join("");

      if (nameAcronym.includes(search) || pathAcronym.includes(search)) {
        return true;
      }
    }

    return false;
  }

  // ========== UTILITY FUNCTIONS ==========

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

  updateStats(shown, total, extraMessage = "") {
    if (shown === 0 && total === 0) {
      this.driveManager.domCache.resultsStats.textContent = "No resources loaded yet.";
    } else if (shown === 0) {
      this.driveManager.domCache.resultsStats.textContent = `No matches found in ${total} total resources.`;
    } else {
      this.driveManager.domCache.resultsStats.textContent = `Showing ${shown} of ${total} resources${extraMessage}`;
    }
  }
}

// Export for global use
window.BrowseSearchEngine = BrowseSearchEngine;
