/**
 * Browse Display Manager - Handles result rendering and UI
 */

class BrowseDisplayManager {
  constructor(driveManager) {
    this.driveManager = driveManager;
  }

  // ========== MAIN DISPLAY FUNCTION ==========

  displayResults(files) {
    this.driveManager.domCache.allResources.innerHTML = "";

    if (files.length === 0) {
      this.driveManager.domCache.allResources.innerHTML =
        '<div class="no-results">No files found. Use search to find specific files or folders.</div>';
      this.driveManager.domCache.accordionControls.style.display = "none";
      return;
    }

    // Show accordion controls when there are results
    this.driveManager.domCache.accordionControls.style.display = "flex";

    // Build hierarchical tree structure
    const treeStructure = this.buildTreeStructure(files);

    // Group by semester and batch
    const grouped = {};
    Object.entries(treeStructure).forEach(([key, tree]) => {
      const [semester, batch] = key.split("_");
      if (!grouped[semester]) grouped[semester] = {};
      grouped[semester][batch] = tree;
    });

    // Sort semesters (highest first: 8th, 7th, 6th, etc.)
    const sortedSemesters = Object.entries(grouped).sort(([a], [b]) => {
      const numA = parseInt(a.replace(/\D/g, "")) || 0;
      const numB = parseInt(b.replace(/\D/g, "")) || 0;
      return numB - numA;
    });

    sortedSemesters.forEach(([semester, batches]) => {
      const semesterDiv = document.createElement("div");
      semesterDiv.className = "semester-group";

      // Create collapsible semester header
      const semesterHeader = document.createElement("div");
      semesterHeader.className = "semester-header";
      semesterHeader.innerHTML = `
        <h2>
          <button onclick="browseDisplay.toggleSemesterCollapse('${semester}', this)" class="accordion-btn" title="Expand semester">
            <span class="accordion-icon">▼</span>
            ${semester.charAt(0).toUpperCase() + semester.slice(1)} Semester
          </button>
        </h2>
      `;

      const semesterContent = document.createElement("div");
      semesterContent.className = "semester-content";
      semesterContent.id = `semester-${semester}`;

      // Sort batches (most recent first: 30th, 29th, 28th, etc.)
      const sortedBatches = Object.entries(batches).sort(([a], [b]) => {
        const numA = parseInt(a.replace(/\D/g, "")) || 0;
        const numB = parseInt(b.replace(/\D/g, "")) || 0;
        return numB - numA;
      });

      sortedBatches.forEach(([batch, tree]) => {
        const batchDiv = document.createElement("div");
        batchDiv.className = "batch-group";

        // Get batch label from any file in the tree
        const batchLabel = this.getBatchLabelFromTree(tree);

        // Create collapsible batch header
        const batchHeader = document.createElement("div");
        batchHeader.className = "batch-header";
        batchHeader.innerHTML = `
          <h3>
            <button onclick="browseDisplay.toggleBatchCollapse('${semester}', '${batch}', this)" class="accordion-btn" title="Expand batch">
              <span class="accordion-icon">▼</span>
              ${batchLabel}
            </button>
          </h3>
        `;

        const batchContent = document.createElement("div");
        batchContent.className = "batch-content";
        batchContent.id = `batch-${semester}-${batch}`;

        const resultsList = document.createElement("div");
        resultsList.className = "tree-results";

        // Render the tree structure with path context
        this.renderTreeNode(tree, resultsList, 0, "", semester, batch);

        batchContent.appendChild(resultsList);
        batchDiv.appendChild(batchHeader);
        batchDiv.appendChild(batchContent);
        semesterContent.appendChild(batchDiv);
      });

      semesterDiv.appendChild(semesterHeader);
      semesterDiv.appendChild(semesterContent);
      this.driveManager.domCache.allResources.appendChild(semesterDiv);
    });
  }

  // ========== TREE STRUCTURE BUILDING ==========

  buildTreeStructure(files) {
    const trees = {};
    const folderLookup = new Map();
    const foldersByName = new Map();

    // First pass: build lookup table of all folders
    files.forEach((file) => {
      if (file.isFolder) {
        folderLookup.set(file.path, file);
        const folderKey = `${file.semester}_${file.batch}_${file.name}`;
        if (!foldersByName.has(folderKey)) {
          foldersByName.set(folderKey, []);
        }
        foldersByName.get(folderKey).push(file);
      }
    });

    files.forEach((file) => {
      const treeKey = `${file.semester}_${file.batch}`;
      if (!trees[treeKey]) {
        trees[treeKey] = {
          files: [],
          children: {}
        };
      }

      const pathParts = file.path.split("/");
      let currentNode = trees[treeKey];
      let currentPath = "";

      // Build path to the file, creating parent folders as needed
      for (let i = 0; i < pathParts.length - 1; i++) {
        const folderName = pathParts[i];
        currentPath = currentPath ? `${currentPath}/${folderName}` : folderName;

        if (!currentNode.children[folderName]) {
          currentNode.children[folderName] = {
            files: [],
            children: {},
            hasMatchingContent: false,
            folderFile: folderLookup.get(currentPath),
            allMatchingFolders: foldersByName.get(`${file.semester}_${file.batch}_${folderName}`) || []
          };
        }
        currentNode.children[folderName].hasMatchingContent = true;
        currentNode = currentNode.children[folderName];
      }

      // Add the file to the final folder
      currentNode.files.push(file);
    });

    return trees;
  }

  getBatchLabelFromTree(tree) {
    // Find first file in tree to get batch label
    function findFirstFile(node) {
      if (node.files && node.files.length > 0) {
        return node.files[0].batchLabel;
      }
      for (const child of Object.values(node.children)) {
        const result = findFirstFile(child);
        if (result) return result;
      }
      return null;
    }
    return findFirstFile(tree) || "Unknown Batch";
  }

  // ========== TREE RENDERING ==========

  renderTreeNode(node, container, depth, currentPath = "", semester = "", batch = "") {
    // Render folders first (sorted alphabetically)
    const sortedFolders = Object.entries(node.children).sort(([a], [b]) =>
      a.localeCompare(b)
    );

    sortedFolders.forEach(([folderName, folderNode]) => {
      const folderDiv = document.createElement("div");
      folderDiv.className = "tree-file";
      folderDiv.style.paddingLeft = `${depth * 20}px`;

      // Build the full path for this folder
      const folderPath = currentPath ? `${currentPath}/${folderName}` : folderName;

      // Add visual indicator for non-matching parent folders
      const isParentFolder = !folderNode.hasMatchingContent;
      if (isParentFolder) {
        folderDiv.classList.add("parent-folder");
      }

      // Create a clickable folder link
      const folderId = this.findFolderInFiles(folderName, folderNode, folderPath, semester, batch);
      let folderLink = "#";
      let clickHandler = "";
      let linkTitle = "";

      if (folderId) {
        folderLink = `https://drive.google.com/drive/folders/${folderId}`;
        linkTitle = "Open folder in Google Drive";
      } else {
        clickHandler = `onclick="alert('Folder link not available')"`;
        linkTitle = "Folder link not available";
      }

      // Add visual styling for parent vs matching folders
      const folderClass = isParentFolder ? "parent-folder" : "matching-folder";
      const folderIcon = isParentFolder ? "📂" : "📁";

      folderDiv.innerHTML = `
        <div class="file-item ${folderClass}">
          <a href="${folderLink}" target="_blank" title="${linkTitle}" ${clickHandler}>
            ${folderIcon} ${folderName}${isParentFolder ? " (parent)" : ""}
          </a>
        </div>
      `;
      container.appendChild(folderDiv);

      // Recursively render children with updated path context
      this.renderTreeNode(folderNode, container, depth + 1, folderPath, semester, batch);
    });

    // Render files (sorted alphabetically)
    const sortedFiles = node.files.sort((a, b) => a.name.localeCompare(b.name));

    sortedFiles.forEach((file) => {
      const fileDiv = document.createElement("div");
      fileDiv.className = "tree-file";
      fileDiv.style.paddingLeft = `${depth * 20}px`;

      const icon = file.isFolder ? "📁" : "📄";
      const link = file.isFolder
        ? `https://drive.google.com/drive/folders/${file.id}`
        : file.webViewLink || `https://drive.google.com/file/d/${file.id}/view`;

      fileDiv.innerHTML = `
        <div class="file-item">
          <a href="${link}" target="_blank" title="Open in Google Drive">
            ${icon} ${file.name}
          </a>
        </div>
      `;

      container.appendChild(fileDiv);
    });
  }

  // ========== FOLDER FINDING ==========

  findFolderInFiles(folderName, folderNode, fullPath = "", semester = "", batch = "") {
    // First check the resolved folder cache with precise path matching
    if (window.resolvedFolderCache && fullPath && semester && batch) {
      const exactKey = `${semester}_${batch}_${fullPath}`;
      if (window.resolvedFolderCache.has(exactKey)) {
        return window.resolvedFolderCache.get(exactKey);
      }

      // Also try just the folder name within the same semester/batch context
      for (const [cacheKey, folderId] of window.resolvedFolderCache.entries()) {
        if (cacheKey.startsWith(`${semester}_${batch}_`) && cacheKey.endsWith(`/${folderName}`)) {
          return folderId;
        }
      }
    }

    // Return the stored folder file if available
    if (folderNode.folderFile && folderNode.folderFile.id) {
      return folderNode.folderFile.id;
    }

    // Fallback 1: Check all matching folders stored during tree building
    if (folderNode.allMatchingFolders && folderNode.allMatchingFolders.length > 0) {
      const bestMatch = folderNode.allMatchingFolders.find(
        (folder) => folder.path === fullPath
      );
      if (bestMatch) {
        return bestMatch.id;
      }

      const anyMatch = folderNode.allMatchingFolders.find((folder) => folder.id);
      if (anyMatch) {
        return anyMatch.id;
      }
    }

    // Fallback 2: Look for folder in the files array
    const folderInFiles = folderNode.files.find(
      (file) => file.isFolder && file.name === folderName && file.id
    );

    if (folderInFiles) {
      return folderInFiles.id;
    }

    return null;
  }

  // ========== ACCORDION CONTROLS ==========

  toggleSemesterCollapse(semester, button) {
    const content = document.getElementById(`semester-${semester}`);
    const icon = button.querySelector(".accordion-icon");

    if (content.style.display === "none") {
      // Expand
      content.style.display = "block";
      icon.textContent = "▼";
      button.title = "Collapse semester";
    } else {
      // Collapse
      content.style.display = "none";
      icon.textContent = "▶";
      button.title = "Expand semester";
    }
  }

  toggleBatchCollapse(semester, batch, button) {
    const content = document.getElementById(`batch-${semester}-${batch}`);
    const icon = button.querySelector(".accordion-icon");

    if (content.style.display === "none") {
      // Expand
      content.style.display = "block";
      icon.textContent = "▼";
      button.title = "Collapse batch";
    } else {
      // Collapse
      content.style.display = "none";
      icon.textContent = "▶";
      button.title = "Expand batch";
    }
  }

  // ========== GLOBAL ACCORDION FUNCTIONS ==========

  collapseAllSemesters() {
    document.querySelectorAll(".semester-content").forEach((content) => {
      content.style.display = "none";
    });
    document.querySelectorAll(".semester-header .accordion-icon").forEach((icon) => {
      icon.textContent = "▶";
    });
  }

  expandAllSemesters() {
    // First expand all semesters
    document.querySelectorAll(".semester-content").forEach((content) => {
      content.style.display = "block";
    });
    document.querySelectorAll(".semester-header .accordion-icon").forEach((icon) => {
      icon.textContent = "▼";
    });

    // Then expand all batches within those semesters
    document.querySelectorAll(".batch-content").forEach((content) => {
      content.style.display = "block";
    });
    document.querySelectorAll(".batch-header .accordion-icon").forEach((icon) => {
      icon.textContent = "▼";
    });
  }

  collapseAllBatches() {
    document.querySelectorAll(".batch-content").forEach((content) => {
      content.style.display = "none";
    });
    document.querySelectorAll(".batch-header .accordion-icon").forEach((icon) => {
      icon.textContent = "▶";
    });
  }

  expandAllBatches() {
    document.querySelectorAll(".batch-content").forEach((content) => {
      content.style.display = "block";
    });
    document.querySelectorAll(".batch-header .accordion-icon").forEach((icon) => {
      icon.textContent = "▼";
    });
  }
}

// Export for global use
window.BrowseDisplayManager = BrowseDisplayManager;

// ====== BOOTSTRAP: create global instances for legacy pages ======

(function () {
  // Ensure DOM cache is initialized before constructing managers
  if (window.DOM_CACHE && typeof window.DOM_CACHE.init === 'function') {
    window.DOM_CACHE.init();
  } else if (typeof DOM_CACHE !== 'undefined' && typeof DOM_CACHE.init === 'function') {
    DOM_CACHE.init();
    window.DOM_CACHE = DOM_CACHE;
  }

  try {
    const apiKeys = (window.DriveKeyManager && window.DriveKeyManager.getApiKeys && window.DriveKeyManager.getApiKeys()) || [];

    // Only create if not already present
    if (!window.browseDrive) {
      // Pass DOM_CACHE to BrowseDriveManager if constructor supports it
      window.browseDrive = new BrowseDriveManager(apiKeys);
      if (window.DOM_CACHE) window.browseDrive.domCache = window.DOM_CACHE;
    }

    if (!window.browseSearch) {
      if (window.BrowseSearchEngine) {
        window.browseSearch = new BrowseSearchEngine(window.browseDrive);
      }
    }

    if (!window.browseDisplay) {
      window.browseDisplay = new BrowseDisplayManager(window.browseDrive);
    }

    // Wire displayResults to the old global function name used by pages
    window.displayResults = function (files) {
      if (window.browseDisplay && typeof window.browseDisplay.displayResults === 'function') {
        window.browseDisplay.displayResults(files || []);
      }
    };

    // Expose cache/control helpers expected by legacy inline code
    window.clearCacheAndReload = function () {
      if (window.browseDrive && typeof window.browseDrive.clearCacheAndReload === 'function') {
        return window.browseDrive.clearCacheAndReload();
      }
      return false;
    };

    window.getCacheStats = function () {
      if (window.browseDrive && typeof window.browseDrive.getCacheStats === 'function') {
        return window.browseDrive.getCacheStats();
      }
      return { entries: 0, sizeKB: 0 };
    };

    window.startImmediateRebuild = async function () {
      if (window.browseDrive && typeof window.browseDrive.startImmediateRebuild === 'function') {
        return await window.browseDrive.startImmediateRebuild();
      }
    };

    window.rebuildFolderCache = async function (folderId, currentDepth, maxDepth) {
      if (window.browseDrive && typeof window.browseDrive.rebuildFolderCache === 'function') {
        return await window.browseDrive.rebuildFolderCache(folderId, currentDepth, maxDepth);
      }
    };

    // Ensure browseDrive exposes displayResults binding for any code referencing it
    window.browseDrive.displayResults = function (results) {
      if (window.browseDisplay && typeof window.browseDisplay.displayResults === 'function') {
        window.browseDisplay.displayResults(results || []);
      }
    };

    // Listen for DriveKeyManager changes to update apiKeys live
    if (window.DriveKeyManager && window.DriveKeyManager.onChange) {
      window.DriveKeyManager.onChange((newKeys) => {
        if (window.browseDrive) {
          window.browseDrive.apiKeys = Array.isArray(newKeys) ? newKeys.slice() : [];
          window.browseDrive.currentApiIndex = 0;
          console.log('DriveKeyManager: updated browseDrive.apiKeys', window.browseDrive.apiKeys.length);
        }
      });
    }
  } catch (e) {
    console.warn('Browse bootstrap failed', e);
  }
})();
