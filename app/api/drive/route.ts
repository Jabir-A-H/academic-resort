import { NextRequest, NextResponse } from 'next/server';

// ─── API Key Rotation ──────────────────────────────────────────────────────────
const DRIVE_API_KEYS = (process.env.GOOGLE_DRIVE_API_KEYS ?? '')
  .split(',')
  .map(k => k.trim())
  .filter(Boolean);

let keyIndex = 0;
function getNextKey(): string {
  if (DRIVE_API_KEYS.length === 0) throw new Error('GOOGLE_DRIVE_API_KEYS is not set');
  const key = DRIVE_API_KEYS[keyIndex];
  keyIndex = (keyIndex + 1) % DRIVE_API_KEYS.length;
  return key;
}

// ─── Drive API Fetcher ─────────────────────────────────────────────────────────
async function fetchFromDrive(folderId: string): Promise<{ files: DriveFile[] }> {
  const key = getNextKey();
  const url =
    `https://www.googleapis.com/drive/v3/files` +
    `?q='${encodeURIComponent(folderId)}'+in+parents+and+trashed=false` +
    `&key=${key}` +
    `&fields=files(id,name,mimeType,webViewLink)` +
    `&pageSize=1000` +
    `&orderBy=name`;

  const res = await fetch(url, { next: { revalidate: 3600 } }); // 1-hour server-side cache

  // Gracefully handle all error codes — never 500 the client
  if (!res.ok) {
    if ([403, 404, 429, 500, 401].includes(res.status)) {
      return { files: [] };
    }
    return { files: [] };
  }

  return res.json();
}

// ─── Types ─────────────────────────────────────────────────────────────────────
interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
}

// ─── Route Handler ─────────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const folderId = searchParams.get('folderId');

  if (!folderId || !/^[a-zA-Z0-9_-]{10,}$/.test(folderId)) {
    return NextResponse.json({ error: 'Invalid folderId' }, { status: 400 });
  }

  try {
    const data = await fetchFromDrive(folderId);

    return NextResponse.json(data, {
      headers: {
        // Allow browser to cache for 1 hour, CDN for 2 hours
        'Cache-Control': 'public, s-maxage=7200, stale-while-revalidate=3600',
      },
    });
  } catch (err: any) {
    console.error('[Drive API]', err.message);
    return NextResponse.json({ files: [] }, { status: 200 }); // Always 200 to client
  }
}
