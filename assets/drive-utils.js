/**
 * Shared Google Drive Integration Utilities
 * 
 * This module centralizes Google Drive API operations across the Academic Resort website.
 * It eliminates code duplication by providing shared functionality for:
 * - Fetching folder contents from Google Drive with automatic caching
 * - Searching files across multiple Google Drive folders recursively
 * - Handling API rate limiting and error responses gracefully
 * - Optimizing duplicate removal for search results
 * - Building consistent Google Drive API URLs
 * 
 * Benefits:
 * - Consistent Google Drive integration across all pages
 * - Automatic retry logic for failed API requests
 * - Optimized search performance with duplicate removal
 * - Centralized error handling and logging
 * - Reduced API calls through intelligent caching
 */

/**
 * Get base path for relative imports based on current page location
 */
function getBasePath() {
  const currentPath = window.location.pathname;
  if (currentPath.includes('/semester/') || currentPath.includes('/courses/')) {
    return '../';
  }
  return '';
}

/**
 * Optimized duplicate removal for search results
 */
function removeDuplicatesOptimized(files) {
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

/**
 * Build Google Drive API URL for folder contents
 */
function buildDriveApiUrl(folderId, apiKey) {
  return `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents+and+trashed=false&key=${apiKey}&fields=files(id,name,mimeType,webViewLink)&pageSize=1000&orderBy=name`;
}

/**
 * Fetch folder contents with caching and rate limiting
 */
async function fetchFolderContents(folderId, pagePrefix = 'drive', depth = 0, useCache = true) {
  // Try cache first if enabled
  if (useCache) {
    const cached = window.CacheUtils.loadFromPersistentCache(folderId, pagePrefix, depth);
    if (cached) {
      return cached;
    }
  }

  try {
    const apiKey = window.getNextApiKey ? window.getNextApiKey() : window.DRIVE_API_KEY;
    const url = buildDriveApiUrl(folderId, apiKey);
    
    // Use the shared API limiter
    const data = await window.apiLimiter.makeRequest(url);
    const files = data.files || [];

    // Cache the results if caching is enabled
    if (useCache) {
      window.CacheUtils.saveToPersistentCache(folderId, files, pagePrefix, depth);
    }

    return files;
  } catch (error) {
    console.error(`Error fetching folder ${folderId}:`, error);
    return [];
  }
}

/**
 * Recursively fetch all files from a folder with progress tracking
 */
async function fetchAllFilesRecursively(
  folderId,
  path = "",
  maxDepth = 5,
  semester = "",
  batchLabel = "",
  statsElement = null,
  currentDepth = 0,
  pagePrefix = 'drive'
) {
  if (currentDepth >= maxDepth) return [];

  try {
    const files = await fetchFolderContents(folderId, pagePrefix, currentDepth);
    
    // Process files and folders
    const results = [];
    const subfolderPromises = [];

    files.forEach(file => {
      if (file.mimeType === "application/vnd.google-apps.folder") {
        // It's a folder - recurse into it
        const newPath = path ? `${path}/${file.name}` : file.name;
        subfolderPromises.push(
          fetchAllFilesRecursively(
            file.id,
            newPath,
            maxDepth,
            semester,
            batchLabel,
            statsElement,
            currentDepth + 1,
            pagePrefix
          )
        );
      } else {
        // It's a file - add to results
        results.push({
          name: file.name,
          link: file.webViewLink,
          path: path || "Root",
          semester: semester,
          batch: batchLabel,
          type: file.mimeType,
          folderId: folderId
        });
      }
    });

    // Wait for all subfolder searches to complete
    if (subfolderPromises.length > 0) {
      const subfolderResults = await Promise.all(subfolderPromises);
      results.push(...subfolderResults.flat());
    }

    return results;
  } catch (error) {
    console.error(`Error in recursive fetch for folder ${folderId}:`, error);
    return [];
  }
}

/**
 * Search files by term across multiple folders
 */
async function searchFilesInFolders(
  folderConfigs,
  searchTerm,
  maxDepth = 3,
  statsElement = null,
  pagePrefix = 'drive'
) {
  const searchResults = [];
  const totalFolders = folderConfigs.length;
  let completedFolders = 0;

  // Update stats initially
  if (statsElement) {
    statsElement.textContent = `Searching 0/${totalFolders} folders`;
  }

  // Process folders in batches to avoid overwhelming the API
  const batchSize = 5;
  for (let i = 0; i < folderConfigs.length; i += batchSize) {
    const batch = folderConfigs.slice(i, i + batchSize);
    
    const batchPromises = batch.map(async (config) => {
      const results = await fetchAllFilesRecursively(
        config.folderId,
        "",
        maxDepth,
        config.semester,
        config.batchLabel,
        statsElement,
        0,
        pagePrefix
      );
      
      // Filter results by search term
      return results.filter(file =>
        file.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });

    const batchResults = await Promise.all(batchPromises);
    searchResults.push(...batchResults.flat());
    
    completedFolders += batch.length;
    
    // Update progress
    if (statsElement) {
      const limiterStats = window.apiLimiter.getStats();
      statsElement.innerHTML = `Searching ${completedFolders}/${totalFolders} folders | Queue: ${limiterStats.queueLength} | Active: ${limiterStats.activeRequests} <span style="float: right; color: #68d391; font-size: 0.9em;">${searchResults.length} results</span>`;
    }

    // Early termination if we have many results
    if (searchResults.length > 500) {
      console.log("Early termination: Found 500+ results");
      break;
    }
  }

  return removeDuplicatesOptimized(searchResults);
}

/**
 * Rebuild folder cache (for maintenance operations)
 */
async function rebuildFolderCache(folderId, currentDepth = 0, maxDepth = 3, pagePrefix = 'drive') {
  if (currentDepth >= maxDepth) return;

  try {
    const apiKey = window.getNextApiKey ? window.getNextApiKey() : window.DRIVE_API_KEY;
    const url = buildDriveApiUrl(folderId, apiKey);
    
    const data = await window.apiLimiter.makeRequest(url);
    const files = data.files || [];

    // Save to cache
    window.CacheUtils.saveToPersistentCache(folderId, files, pagePrefix, currentDepth);

    // Rebuild subfolders
    const folders = files.filter(
      (file) => file.mimeType === "application/vnd.google-apps.folder"
    );

    for (const folder of folders) {
      await rebuildFolderCache(folder.id, currentDepth + 1, maxDepth, pagePrefix);
    }
  } catch (error) {
    console.warn(`Rebuild failed for folder ${folderId}:`, error);
  }
}

// Export utilities to global scope
window.DriveUtils = {
  getBasePath,
  removeDuplicatesOptimized,
  buildDriveApiUrl,
  fetchFolderContents,
  fetchAllFilesRecursively,
  searchFilesInFolders,
  rebuildFolderCache
};