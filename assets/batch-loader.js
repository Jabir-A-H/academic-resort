/**
 * Batch Data Loader Utility
 * Provides functions to load and access consolidated batch JSON data
 */

// Global cache for batch data
window.BATCH_DATA_CACHE = new Map();
window.SUBJECT_DATA_CACHE = new Map();

/**
 * Load all batch JSON files and cache them
 */
async function loadAllBatchData() {
  if (window.BATCH_DATA_CACHE.size > 0) {
    return window.BATCH_DATA_CACHE;
  }

  const batchFiles = [
    'batch-24.json', 'batch-25.json', 'batch-26.json', 'batch-27.json', 
    'batch-28.json', 'batch-29.json', 'batch-30.json', 'batch-31.json'
  ];

  try {
    // Load all batch files in parallel
    const batchPromises = batchFiles.map(async (batchFile) => {
      try {
        const basePath = getBasePath();
        const response = await fetch(`${basePath}assets/${batchFile}`);
        if (!response.ok) {
          console.warn(`Could not load ${batchFile}: ${response.status}`);
          return null;
        }
        const data = await response.json();
        const batchNumber = batchFile.replace('batch-', '').replace('.json', '');
        return { batchNumber, data };
      } catch (error) {
        console.warn(`Error loading ${batchFile}:`, error);
        return null;
      }
    });

    const batchResults = await Promise.all(batchPromises);

    // Cache all batch data
    batchResults.forEach(result => {
      if (result && result.data) {
        window.BATCH_DATA_CACHE.set(result.batchNumber, result.data);
      }
    });

    console.log('Batch data loaded successfully:', Array.from(window.BATCH_DATA_CACHE.keys()));
    return window.BATCH_DATA_CACHE;
  } catch (error) {
    console.error('Error loading batch data:', error);
    return window.BATCH_DATA_CACHE;
  }
}

/**
 * Get base path for asset loading based on current page location
 */
function getBasePath() {
  const currentPath = window.location.pathname;
  if (currentPath.includes('/pages/subjects/')) {
    return '../../';
  } else if (currentPath.includes('/pages/')) {
    return '../';
  } else {
    return './';
  }
}

/**
 * Find subject data by course code across all batches
 */
async function getSubjectDataByCode(courseCode) {
  // Check cache first
  if (window.SUBJECT_DATA_CACHE.has(courseCode)) {
    return window.SUBJECT_DATA_CACHE.get(courseCode);
  }

  // Load batch data if not already loaded
  await loadAllBatchData();

  const subjectData = {
    code: courseCode,
    title: 'Unknown Subject',
    description: 'Course information will be available soon.',
    current_teacher: '',
    links: {
      class_updates: '',
      notes: [],
      slides_lectures: [],
      books_manuals: [],
      previous_materials: [],
      question_papers: [],
      assignments: []
    }
  };

  // Search through all batches for this subject
  for (const [batchNumber, batchData] of window.BATCH_DATA_CACHE.entries()) {
    if (batchData.semesters) {
      for (const [semesterKey, semesterData] of Object.entries(batchData.semesters)) {
        if (semesterData.subjects && semesterData.subjects[courseCode]) {
          const subjectInfo = semesterData.subjects[courseCode];
          
          // Merge data from this batch
          subjectData.title = subjectInfo.title || subjectData.title;
          subjectData.description = subjectInfo.description || subjectData.description;
          subjectData.current_teacher = subjectInfo.teacher || subjectData.current_teacher;
          
          // Merge links
          if (subjectInfo.links) {
            subjectData.links.class_updates = subjectInfo.links.class_updates || subjectData.links.class_updates;
            
            // Merge arrays while avoiding duplicates
            ['notes', 'slides_lectures', 'books_manuals', 'previous_materials', 'question_papers', 'assignments'].forEach(linkType => {
              if (subjectInfo.links[linkType]) {
                const newLinks = Array.isArray(subjectInfo.links[linkType]) ? subjectInfo.links[linkType] : [];
                newLinks.forEach(link => {
                  if (link && !subjectData.links[linkType].includes(link)) {
                    subjectData.links[linkType].push(link);
                  }
                });
              }
            });
          }
          
          // Add batch information for context
          if (!subjectData.batches) {
            subjectData.batches = [];
          }
          subjectData.batches.push({
            batch: batchNumber,
            batchName: batchData.batch_name,
            semester: semesterKey
          });
        }
      }
    }
  }

  // Cache the result
  window.SUBJECT_DATA_CACHE.set(courseCode, subjectData);
  return subjectData;
}

/**
 * Get all subjects for a specific semester across all batches
 */
async function getSubjectsBySemester(semesterKey) {
  await loadAllBatchData();
  
  const subjects = new Map();
  
  for (const [batchNumber, batchData] of window.BATCH_DATA_CACHE.entries()) {
    if (batchData.semesters && batchData.semesters[semesterKey]) {
      const semesterData = batchData.semesters[semesterKey];
      if (semesterData.subjects) {
        for (const [code, subjectInfo] of Object.entries(semesterData.subjects)) {
          if (!subjects.has(code)) {
            subjects.set(code, {
              code: code,
              title: subjectInfo.title,
              description: subjectInfo.description,
              batches: []
            });
          }
          
          subjects.get(code).batches.push({
            batch: batchNumber,
            batchName: batchData.batch_name,
            teacher: subjectInfo.teacher
          });
        }
      }
    }
  }
  
  return Array.from(subjects.values());
}

/**
 * Get drive folder mapping for search functionality
 */
async function getDriveFolderMapping() {
  await loadAllBatchData();
  
  const mapping = {};
  
  for (const [batchNumber, batchData] of window.BATCH_DATA_CACHE.entries()) {
    if (batchData.semesters && batchData.drive_folders) {
      for (const semesterKey of Object.keys(batchData.semesters)) {
        if (!mapping[semesterKey]) {
          mapping[semesterKey] = {};
        }
        
        // Look for drive folder with different possible naming patterns
        let folderId = null;
        const possibleKeys = [
          `${semesterKey}_semester`,
          `${semesterKey.replace('-', '_')}_semester`,
          semesterKey
        ];
        
        for (const key of possibleKeys) {
          if (batchData.drive_folders[key]) {
            folderId = batchData.drive_folders[key];
            break;
          }
        }
        
        if (folderId) {
          mapping[semesterKey][batchNumber] = {
            folderId: folderId,
            label: batchData.batch_name || `${batchNumber}th Batch`
          };
        }
      }
    }
  }
  
  return mapping;
}

/**
 * Get batch information by batch number
 */
async function getBatchInfo(batchNumber) {
  await loadAllBatchData();
  return window.BATCH_DATA_CACHE.get(batchNumber) || null;
}

/**
 * Clear all cached data (useful for development/debugging)
 */
function clearBatchDataCache() {
  window.BATCH_DATA_CACHE.clear();
  window.SUBJECT_DATA_CACHE.clear();
  console.log('Batch data cache cleared');
}

// Export functions for global use
window.loadAllBatchData = loadAllBatchData;
window.getSubjectDataByCode = getSubjectDataByCode;
window.getSubjectsBySemester = getSubjectsBySemester;
window.getDriveFolderMapping = getDriveFolderMapping;
window.getBatchInfo = getBatchInfo;
window.clearBatchDataCache = clearBatchDataCache;