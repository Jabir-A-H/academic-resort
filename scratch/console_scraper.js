/**
 * Run this script in the Chrome DevTools Console (F12 > Console tab) 
 * on any of the Academic Resort Google Sites semester pages.
 * 
 * It will extract the embedded Google Drive iframes and print their 
 * IDs along with the closest context heading it can figure out.
 */

(() => {
  console.log("🔍 Scraping Google Drive Links & Headings...");

  const results = [];
  const iframes = Array.from(document.querySelectorAll('iframe'));
  
  iframes.forEach(iframe => {
    const src = iframe.src || '';
    if (!src.includes('drive.google.com')) return;
    
    // Extract simply the ID if we can
    let driveId = src;
    const match = src.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (match && match[1]) driveId = match[1];

    let contextName = "Unknown Section Context";

    // Google Sites often uses blocks stacked linearly. We transverse up from the iframe 
    // to the overarching content block, then look at preceding sibling blocks for title texts.
    let current = iframe.closest('.oKdMpe, .TyRbeb, .wHaqFc, section') || iframe.parentElement;
    
    for (let i = 0; i < 6; i++) {
      if (!current) break;
      
      let prevNode = current.previousElementSibling;
      while (prevNode) {
        // Find visible text inside header-like elements or large spans
        const headingElements = Array.from(prevNode.querySelectorAll('h2, h3, .Rn3Z1b, .zfr3Q, span'));
        // Sort by font size broadly or just take the first meaningful one
        for (const el of headingElements) {
          const text = el.innerText?.trim();
          if (text && text.length > 5 && text.length < 80) {
            contextName = text;
            break;
          }
        }

        if (contextName !== "Unknown Section Context") break;
        
        // As a fallback, check the block's direct text
        const text = prevNode.innerText?.trim();
        if (text && text.length > 5 && text.length < 80 && !text.includes('drive.google.com')) {
          contextName = text;
          break;
        }

        prevNode = prevNode.previousElementSibling;
      }
      
      if (contextName !== "Unknown Section Context") break;
      current = current.parentElement;
    }

    results.push({
      Heading: contextName.replace(/\n/g, ' '),
      'Drive ID': driveId,
      'Full Embed URL': src
    });
  });

  if (results.length === 0) {
    console.warn("⚠️ No Google Drive iframes were found on this page.");
  } else {
    console.log(`✅ Found ${results.length} embedded Drive links!`);
    console.table(results, ['Heading', 'Drive ID']);
    
    // Optional utility to download as JSON automatically:
    // const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' });
    // const a = document.createElement('a');
    // a.href = URL.createObjectURL(blob);
    // a.download = document.title.replace(/\s+/g, '_') + '_DriveLinks.json';
    // a.click();
  }
})();
