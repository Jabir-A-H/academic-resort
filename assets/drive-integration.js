/**
 * Drive Integration for Subject Pages
 * Maps drive-mapping.json content to subject page sections
 */

async function loadDriveMapping() {
  try {
    const response = await fetch('/home/runner/work/academic-resort/academic-resort/assets/drive-mapping.json');
    if (!response.ok) throw new Error('Failed to load drive mapping');
    return await response.json();
  } catch (error) {
    console.warn('Could not load drive mapping:', error);
    return null;
  }
}

function getDriveLinksForSemester(driveData, semesterKey) {
  if (!driveData || !driveData[semesterKey]) return null;
  return driveData[semesterKey];
}

function createDriveLink(folderId, label) {
  return `<a href="https://drive.google.com/drive/folders/${folderId}" target="_blank" rel="noopener" class="drive-link">
    <span class="drive-icon">📁</span>
    ${label}
  </a>`;
}

function generateDriveLinksSection(semesterData) {
  if (!semesterData || !semesterData.batches) return '';
  
  let html = '<div class="drive-links-container">';
  
  // Add batch folders
  Object.entries(semesterData.batches).forEach(([key, batch]) => {
    if (batch.folderId) {
      html += createDriveLink(batch.folderId, batch.label);
    }
  });
  
  html += '</div>';
  return html;
}

function integratePersonalNotes(semesterData) {
  if (!semesterData?.batches?.personal) return '';
  return createDriveLink(semesterData.batches.personal.folderId, 'Personal Notes Collection');
}

function integrateBooks(semesterData) {
  if (!semesterData?.batches?.books) return '';
  return createDriveLink(semesterData.batches.books.folderId, 'Books & Course Materials');
}

function integrateSyllabus(semesterData) {
  if (!semesterData?.batches?.syllabus) return '';
  return createDriveLink(semesterData.batches.syllabus.folderId, 'Course Syllabus');
}

// Add CSS for drive links
const driveLinksCSS = `
<style>
.drive-links-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 12px;
}

.drive-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: linear-gradient(135deg, #f8f9fa, #e9ecef);
  border: 1px solid #dee2e6;
  border-radius: 6px;
  text-decoration: none;
  color: #495057;
  font-size: 14px;
  transition: all 0.2s ease;
}

.drive-link:hover {
  background: linear-gradient(135deg, #e9ecef, #dee2e6);
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.drive-icon {
  font-size: 16px;
}
</style>
`;

// Add the CSS to the document
if (!document.querySelector('#drive-links-css')) {
  const styleElement = document.createElement('style');
  styleElement.id = 'drive-links-css';
  styleElement.textContent = driveLinksCSS.replace(/<\/?style>/g, '');
  document.head.appendChild(styleElement);
}

// Export for use in subject pages
window.driveIntegration = {
  loadDriveMapping,
  getDriveLinksForSemester,
  generateDriveLinksSection,
  integratePersonalNotes,
  integrateBooks,
  integrateSyllabus
};