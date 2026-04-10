const { createClient } = require('@supabase/supabase-js');
const fs = require('fs/promises');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const { google } = require('googleapis');

// Supabase Setup
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Google Drive API Setup
// Use the API Key from .env.local (split to pick the first one)
const apiKeyString = process.env.GOOGLE_DRIVE_API_KEYS;
if (!apiKeyString) {
  console.error("Missing Google Drive API key in .env.local");
  process.exit(1);
}
const apiKeys = apiKeyString.split(',');
const drive = google.drive({ version: 'v3', auth: apiKeys[0] });

// Get all the JSON files in .designplans directory
const dir = path.join(__dirname, '..', '.designplans');

async function processDriveLinks() {
  const files = await fs.readdir(dir);
  const jsonFiles = files.filter(f => f.includes('DriveLinks') && f.endsWith('.json'));
  
  console.log(`Found ${jsonFiles.length} JSON files to process...`);
  
  // Create an array to hold all the parsed data
  let allSemestersData = [];
  
  for (const file of jsonFiles) {
    // Extract semester name from file name (e.g., "Academic_Resort_-_1st_Semester_DriveLinks.json")
    const match = file.match(/Academic_Resort_-_(.*)_DriveLinks.json/);
    if (!match) continue;
    
    let semesterStr = match[1].replace(/_/g, ' '); 
    // Format appropriately: "1st Semester", "MBA 1st Semester"
    // Wait, the DB semesters might have standard names. "1st Semester" etc.
    
    const filePath = path.join(dir, file);
    const content = await fs.readFile(filePath, 'utf-8');
    const links = JSON.parse(content);
    
    allSemestersData.push({ semesterName: semesterStr, links: links });
  }

  // Before processing, let's look at the database to see how things map
  // First, get all batches to see the structure
  const { data: batches, error: batchError } = await supabase.from('batches').select('*');
  if (batchError) throw batchError;
  
  console.log(`DB has ${batches.length} batches.`);
  
  // Actually, we're trying to figure out top 1-2 level drive folders using the API.
  let validFoldersList = [];

  for (const sem of allSemestersData) {
    console.log(`\nProcessing Semester: ${sem.semesterName}`);
    for (const linkObj of sem.links) {
      const folderId = linkObj['Drive ID'];
      const heading = linkObj['Heading'];
      
      try {
        // Query Google Drive API to get folder details
        // Note: files.get requires the folder to be publicly accessible if using just API key
        const response = await drive.files.get({
          fileId: folderId,
          fields: 'id, name, mimeType',
          supportsAllDrives: true
        });
        
        const folderName = response.data.name;
        console.log(`  -> Found Folder: "${folderName}" for Heading "${heading}"`);
        
        // Also get children (top 1-2 levels)
        const children = await drive.files.list({
          q: `'${folderId}' in parents and trashed=false`, // and mimeType='application/vnd.google-apps.folder'`,
          fields: 'files(id, name, mimeType)',
          supportsAllDrives: true
        });
        
        console.log(`     Has ${children.data.files?.length || 0} immediate files/folders`);
        if (children.data.files) {
          for (const child of children.data.files) {
             console.log(`       - ${child.name} (${child.mimeType})`);
          }
        }
        
      } catch (err) {
        console.error(`  -> ERROR for folder ${folderId} (Heading: ${heading}): ${err.message}`);
      }
    }
  }
}

processDriveLinks().catch(console.error);
