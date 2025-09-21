/**
 * Google Drive API Keys Configuration
 * 
 * This file contains the Google Drive API keys used for accessing Google Drive content.
 * To add more API keys, simply add them to the DRIVE_API_KEYS array below.
 * 
 * Note: All API keys should be restricted to your domain in Google Cloud Console
 * for security purposes.
 */

// Array of Google Drive API keys - add your additional keys here
const DRIVE_API_KEYS = [
  "AIzaSyDb3zn-YDS42TONfEMI4FPlbBR8BTfDprw", // Primary API key
  "AIzaSyAEOadL6D0G_c8z5EB-sEp0T3hanYAnmF0", // Second API key (add your actual second key here)
  // Add additional API keys here as needed:
  // "AIzaSy...", // Third API key
  // "AIzaSy...", // Fourth API key
];

// Current API key index for rotation
let currentApiKeyIndex = 0;

/**
 * Get the next API key using round-robin rotation
 * This helps distribute API requests across multiple keys to avoid rate limits
 * @returns {string} The next API key to use
 */
function getNextApiKey() {
  const apiKey = DRIVE_API_KEYS[currentApiKeyIndex];
  currentApiKeyIndex = (currentApiKeyIndex + 1) % DRIVE_API_KEYS.length;
  return apiKey;
}

/**
 * Get a random API key (useful for load balancing)
 * @returns {string} A random API key
 */
function getRandomApiKey() {
  const randomIndex = Math.floor(Math.random() * DRIVE_API_KEYS.length);
  return DRIVE_API_KEYS[randomIndex];
}

/**
 * Get the current API key without rotating
 * @returns {string} The current API key
 */
function getCurrentApiKey() {
  return DRIVE_API_KEYS[currentApiKeyIndex];
}

/**
 * Get the total number of available API keys
 * @returns {number} Number of API keys available
 */
function getApiKeyCount() {
  return DRIVE_API_KEYS.length;
}

/**
 * Reset the API key rotation to start from the beginning
 */
function resetApiKeyRotation() {
  currentApiKeyIndex = 0;
}

/**
 * Get all API keys (for debugging purposes)
 * @returns {Array<string>} Array of all API keys
 */
function getAllApiKeys() {
  return [...DRIVE_API_KEYS];
}

// Export functions for use in other files
window.getNextApiKey = getNextApiKey;
window.getRandomApiKey = getRandomApiKey;
window.getCurrentApiKey = getCurrentApiKey;
window.getApiKeyCount = getApiKeyCount;
window.resetApiKeyRotation = resetApiKeyRotation;
window.getAllApiKeys = getAllApiKeys;

// For backwards compatibility, export the first API key as DRIVE_API_KEY
window.DRIVE_API_KEY = DRIVE_API_KEYS[0];

console.log(`API Keys loaded: ${DRIVE_API_KEYS.length} keys available`);
