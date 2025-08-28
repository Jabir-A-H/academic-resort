/**
 * Unified Display Manager
 * Handles result rendering and UI interactions
 */

class DisplayManager {
  constructor(driveManager, config = window.SiteConfig) {
    this.driveManager = driveManager;
    this.config = config;
  }

  // ========== MAIN DISPLAY FUNCTION ==========

  displayResults(files) {
    const container = document.getElementById("all-resources");
    if (!container) return;

    container.innerHTML = "";

    if (files.length === 0) {
      container.innerHTML = '<div class="no-results">No files found. Use search to find specific files or folders.</div>';
      this.hideAccordionControls();
      return;
    }

    // Show accordion controls when there are results
    this.showAccordionControls();

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
      const semesterDiv = this.createSemesterGroup(semester, batches);
      container.appendChild(semesterDiv);
    });
  }

  // ========== SEMESTER AND BATCH CREATION ==========

  createSemesterGroup(semester, batches) {
    const semesterDiv = document.createElement("div");
    semesterDiv.className = "semester-group";

    // Create collapsible semester header
    const semesterHeader = document.createElement("div");
    semesterHeader.className = "semester-header";
    semesterHeader.innerHTML = `
      <h2>
        <button onclick="displayManager.toggleSemesterCollapse('${semester}', this)" class="accordion-btn" title="Expand semester">
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
      const batchDiv = this.createBatchGroup(semester, batch, tree);
      semesterContent.appendChild(batchDiv);
    });

    semesterDiv.appendChild(semesterHeader);
    semesterDiv.appendChild(semesterContent);
    return semesterDiv;
  }

  createBatchGroup(semester, batch, tree) {
    const batchDiv = document.createElement("div");
    batchDiv.className = "batch-group";

    // Get batch label from any file in the tree
    const batchLabel = this.getBatchLabelFromTree(tree);

    // Create collapsible batch header
    const batchHeader = document.createElement("div");
    batchHeader.className = "batch-header";
    batchHeader.innerHTML = `
      <h3>
        <button onclick="displayManager.toggleBatchCollapse('${semester}', '${batch}', this)" class="accordion-btn" title="Expand batch">
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
    return batchDiv;
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
        folderDiv.style.opacity = "0.7";
      }

      // Create folder link
      const folderId = this.findFolderId(folderName, folderNode, folderPath, semester, batch);
      let folderLink = "#";
      let clickHandler = "";
      let linkTitle = "";

      if (folderId) {
        folderLink = `https://drive.google.com/drive/folders/${folderId}`;
        linkTitle = isParentFolder ? `Open parent folder: ${folderName}` : `Open folder: ${folderName}`;
      } else {
        clickHandler = `onclick="alert('This folder (${folderName}) doesn\\'t have directly accessible content, but may contain files in subfolders.'); return false;"`;
        linkTitle = `Folder: ${folderName} (content in subfolders)`;
      }

      const folderClass = isParentFolder ? "parent-folder" : "matching-folder";
      const folderIcon = isParentFolder ? "📂" : "📁";

      folderDiv.innerHTML = `
        <div class="file-item ${folderClass}">
          <a href="${folderLink}" target="_blank" class="result-link" ${clickHandler} title="${linkTitle}">
            <span class="file-icon">${folderIcon}</span>
            <span class="file-name">${folderName}${isParentFolder ? " (parent)" : ""}</span>
          </a>
        </div>
      `;
      container.appendChild(folderDiv);

      // Recursively render children
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
          <a href="${link}" target="_blank" class="result-link" title="Open: ${file.name}">
            <span class="file-icon">${icon}</span>
            <span class="file-name">${file.name}</span>
          </a>
        </div>
      `;

      container.appendChild(fileDiv);
    });
  }

  findFolderId(folderName, folderNode, folderPath, semester, batch) {
    // Check resolved folder cache
    if (window.resolvedFolderCache && window.resolvedFolderCache.has(folderPath)) {
      return window.resolvedFolderCache.get(folderPath);
    }

    // Check stored folder file
    if (folderNode.folderFile && folderNode.folderFile.id) {
      return folderNode.folderFile.id;
    }

    // Check all matching folders
    if (folderNode.allMatchingFolders && folderNode.allMatchingFolders.length > 0) {
      const bestMatch = folderNode.allMatchingFolders.find(folder => folder.id);
      if (bestMatch) return bestMatch.id;
    }

    return null;
  }

  // ========== ACCORDION CONTROLS ==========

  showAccordionControls() {
    const controls = document.getElementById("accordionControls");
    if (controls) {
      controls.style.display = "flex";
    }
  }

  hideAccordionControls() {
    const controls = document.getElementById("accordionControls");
    if (controls) {
      controls.style.display = "none";
    }
  }

  toggleSemesterCollapse(semester, button) {
    const content = document.getElementById(`semester-${semester}`);
    if (!content) return;

    const icon = button.querySelector('.accordion-icon');
    const isCollapsed = content.style.display === 'none';

    if (isCollapsed) {
      content.style.display = 'block';
      if (icon) icon.textContent = '▼';
      button.title = 'Collapse semester';
    } else {
      content.style.display = 'none';
      if (icon) icon.textContent = '▶';
      button.title = 'Expand semester';
    }
  }

  toggleBatchCollapse(semester, batch, button) {
    const content = document.getElementById(`batch-${semester}-${batch}`);
    if (!content) return;

    const icon = button.querySelector('.accordion-icon');
    const isCollapsed = content.style.display === 'none';

    if (isCollapsed) {
      content.style.display = 'block';
      if (icon) icon.textContent = '▼';
      button.title = 'Collapse batch';
    } else {
      content.style.display = 'none';
      if (icon) icon.textContent = '▶';
      button.title = 'Expand batch';
    }
  }

  expandAllSemesters() {
    const semesterContents = document.querySelectorAll('.semester-content');
    const semesterButtons = document.querySelectorAll('.semester-header .accordion-btn');

    semesterContents.forEach(content => content.style.display = 'block');
    semesterButtons.forEach(button => {
      const icon = button.querySelector('.accordion-icon');
      if (icon) icon.textContent = '▼';
      button.title = 'Collapse semester';
    });
  }

  collapseAllSemesters() {
    const semesterContents = document.querySelectorAll('.semester-content');
    const semesterButtons = document.querySelectorAll('.semester-header .accordion-btn');

    semesterContents.forEach(content => content.style.display = 'none');
    semesterButtons.forEach(button => {
      const icon = button.querySelector('.accordion-icon');
      if (icon) icon.textContent = '▶';
      button.title = 'Expand semester';
    });
  }

  collapseAllBatches() {
    const batchContents = document.querySelectorAll('.batch-content');
    const batchButtons = document.querySelectorAll('.batch-header .accordion-btn');

    batchContents.forEach(content => content.style.display = 'none');
    batchButtons.forEach(button => {
      const icon = button.querySelector('.accordion-icon');
      if (icon) icon.textContent = '▶';
      button.title = 'Expand batch';
    });
  }
}

// ========== GLOBAL EXPORTS ==========

window.DisplayManager = DisplayManager;
