Drive API Keys

This file explains how the client-side Drive API key manager works.

- File: `assets/drive-keys.js`
- Purpose: Centralize API keys so all pages use the same rotating keys for Google Drive requests.
- How to edit: Replace or add keys in the `API_KEYS` array inside `drive-keys.js`.
- API usage pattern: Code should call `window.DriveKeyManager.getNextApiKey()` when building Drive request URLs.

Notes & best practices:
- Use keys from different Google Cloud projects to distribute quotas across projects.
- Keep keys restricted to your site in the Google Cloud Console (HTTP referrers).
- The manager rotates keys in a simple round-robin manner. If a key is invalid, requests will fail for that call but subsequent calls will continue with the next key.
- For heavy usage consider a small server-side proxy to hide keys and centralize quota handling.
