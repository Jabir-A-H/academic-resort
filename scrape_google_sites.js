const { chromium } = require('playwright');
const fs = require('fs/promises');

// Using the exact structure from the reference Google Site link list
const targetPages = [
    'https://sites.google.com/ais.du.ac.bd/academic-resort/1st-semester',
    'https://sites.google.com/ais.du.ac.bd/academic-resort/2nd-semester',
    'https://sites.google.com/ais.du.ac.bd/academic-resort/3rd-semester',
    'https://sites.google.com/ais.du.ac.bd/academic-resort/4th-semester',
    'https://sites.google.com/ais.du.ac.bd/academic-resort/5th-semester',
    'https://sites.google.com/ais.du.ac.bd/academic-resort/6th-semester',
    'https://sites.google.com/ais.du.ac.bd/academic-resort/7th-semester',
    'https://sites.google.com/ais.du.ac.bd/academic-resort/8th-semester',
    'https://sites.google.com/ais.du.ac.bd/academic-resort/mba-1st-semester',
    'https://sites.google.com/ais.du.ac.bd/academic-resort/mba-2nd-semester'
];

(async () => {
    console.log('Launching browser to extract Google Drive connections...');
    // We launch headless = false just occasionally for local debug, but keep true here
    const browser = await chromium.launch({ headless: true });
    
    // We'll gather all results in this object Map structure Semester -> Folders
    const allExtractedData = {};

    for (const url of targetPages) {
        console.log(`\nNavigating to: ${url}`);
        
        const context = await browser.newContext();
        const page = await context.newPage();
        
        try {
            await page.goto(url, { waitUntil: 'load', timeout: 30000 });
            
            // Wait an extra few seconds because Google Sites injects iframes asynchronously after load event
            await page.waitForTimeout(4000);

            // Wait for at least one iframe or just proceed if none appear
            try { await page.waitForSelector('iframe', { timeout: 5000 }); } catch (e) {}

            // Google Sites structure groups content under Section Headers. 
            // In the reference, there's a structure like "Section Name" immediately followed by the Drive iframe embedded. 
            // We can attempt to pull headings and match them to the closest following iframe.

            const pageData = await page.evaluate(() => {
                const results = [];
                
                // Get all generic text headings representing a Batch/Teacher structure
                const sectionHeaders = document.querySelectorAll('h2.Rn3Z1b, h3.Rn3Z1b, h2.zfr3Q, h3.zfr3Q');
                
                // Or simply find all iframes, and look up the DOM tree for their closest text identifier
                const iframes = Array.from(document.querySelectorAll('iframe'));
                
                iframes.forEach(iframe => {
                     const src = iframe.src || '';
                     if (!src.includes('drive.google.com')) return;

                     // Attempt to get context: find the parent container of the iframe, then look preceding it for text
                     let contextName = "Unknown Section Context";
                     
                     // Navigate up to a section block if possible
                     let current = iframe.parentElement;
                     for (let i = 0; i < 6; i++) {
                         if (!current) break;
                         // A simple heuristic: check if previous siblings have text
                         let prevNode = current.previousElementSibling;
                         while(prevNode) {
                             const text = prevNode.innerText?.trim();
                             if (text && text.length > 3 && text.length < 100) {
                                 contextName = text;
                                 break;
                             }
                             prevNode = prevNode.previousElementSibling;
                         }
                         if (contextName !== "Unknown Section Context") break;
                         current = current.parentElement;
                     }
                     
                     results.push({
                         context_heading: contextName.replace(/\n/g, ' '),
                         drive_url: src
                     });
                });
                
                return results;
            });
            
            const semesterName = url.split('/').pop() || 'unknown';
            allExtractedData[semesterName] = pageData;
            
            console.log(` -> Found ${pageData.length} drive embeddings in ${semesterName}.`);
            
        } catch (err) {
            console.error(`Failed on ${url}:`, err.message);
        } finally {
            await context.close();
        }
    }

    await browser.close();

    const outputFilename = 'legacy_drive_links_map.json';
    await fs.writeFile(outputFilename, JSON.stringify(allExtractedData, null, 2));
    
    console.log(`\n✅ Extraction complete! Saved all structured mapped URLs to ${outputFilename}`);
})();
