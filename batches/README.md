# Batch JSON Management System

This folder contains the consolidated batch JSON files that power the entire Academic Resort website.

## File Structure

- `batch-24.json` through `batch-31.json` - Active batch configuration files
- `batch-template.json` - Template for creating new batch files

## Adding a New Batch

1. **Copy the template**: `cp batch-template.json batch-32.json`
2. **Update batch information**:
   - Change `batch_name` to "32nd Batch"
   - Update `batch_year` to the appropriate years
   - Update `last_updated` to current date
3. **Add drive folder IDs**:
   - Replace `REPLACE_WITH_X_DRIVE_FOLDER_ID` with actual Google Drive folder IDs
   - Only include semesters that exist for this batch
4. **Populate subject information**:
   - Add/remove subjects as needed
   - Update teacher assignments
   - Add links to notes, slides, question papers, etc.

## Data Structure

Each batch file contains:

- **Batch metadata**: name, year, contact person, faculty reference
- **Drive folders**: Google Drive folder IDs for each semester
- **Semesters**: Complete academic data organized by semester
  - **Subjects**: Course code, title, description, teacher, links

## Website Integration

The website automatically:

- Loads all batch files on page load
- Populates dropdowns with available batches/semesters/courses
- Enables search across all batch data
- Displays subject pages with consolidated information

## Migration Benefits

- **83% file reduction**: From 40+ individual JSON files to 8 batch files
- **Single-source editing**: Update one batch file instead of multiple separate files
- **Automatic propagation**: Changes instantly affect all related pages
- **Easy scaling**: Add new batches without code changes

## Technical Notes

- Files are cached for 24 hours in browser localStorage
- All changes are immediately visible across the website
- File structure is validated on load with graceful error handling
- Supports both `drive_folders` object and individual `drive_folder` per semester