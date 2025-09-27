/**
 * Shared API Rate Limiter
 * Provides centralized rate limiting for Google Drive API calls
 */

class APIRateLimiter {
  constructor(maxConcurrent = 200, delayBetween = 2) {
    this.maxConcurrent = maxConcurrent;
    this.delayBetween = delayBetween;
    this.activeRequests = 0;
    this.requestQueue = [];
    this.isProcessing = false;
  }

  async makeRequest(url) {
    return new Promise((resolve, reject) => {
      this.requestQueue.push({ url, resolve, reject });
      this.processQueue();
    });
  }

  async processQueue() {
    if (this.isProcessing || this.requestQueue.length === 0) return;

    this.isProcessing = true;

    while (
      this.requestQueue.length > 0 &&
      this.activeRequests < this.maxConcurrent
    ) {
      const { url, resolve, reject } = this.requestQueue.shift();
      this.activeRequests++;

      this.executeRequest(url, resolve, reject);

      // Small delay between starting requests
      if (this.requestQueue.length > 0) {
        await new Promise(resolve =>
          setTimeout(resolve, this.delayBetween)
        );
      }
    }

    this.isProcessing = false;
  }

  async executeRequest(url, resolve, reject) {
    try {
      const response = await fetch(url);

      if (!response.ok) {
        // Extract folder ID for better debugging
        const folderIdMatch = url.match(/'([^']+)'\+in\+parents/);
        const folderId = folderIdMatch ? folderIdMatch[1] : "unknown";

        // Handle different error types
        if (response.status === 500) {
          resolve({ files: [] });
          return;
        } else if (response.status === 403) {
          resolve({ files: [] });
          return;
        } else if (response.status === 429) {
          // Rate limited - retry with exponential backoff
          setTimeout(() => {
            this.executeRequest(url, resolve, reject);
          }, Math.random() * 2000 + 1000); // 1-3 second delay
          return;
        } else {
          console.warn(`API Error ${response.status} for folder ${folderId}`);
          resolve({ files: [] });
          return;
        }
      }

      const data = await response.json();
      resolve(data);
    } catch (error) {
      const folderIdMatch = url.match(/'([^']+)'\+in\+parents/);
      const folderId = folderIdMatch ? folderIdMatch[1] : "unknown";
      console.warn(`Request error for folder ${folderId}:`, error.message);
      resolve({ files: [] }); // Return empty result to continue search
    } finally {
      // Always decrement counter, whether success or error
      this.activeRequests = Math.max(0, this.activeRequests - 1);

      // Continue processing queue
      setTimeout(() => this.processQueue(), this.delayBetween);
    }
  }

  getStats() {
    return {
      activeRequests: this.activeRequests,
      queueLength: this.requestQueue.length,
      maxConcurrent: this.maxConcurrent,
    };
  }

  // Reset the limiter (useful for testing or reinitialization)
  reset() {
    this.activeRequests = 0;
    this.requestQueue = [];
    this.isProcessing = false;
  }
}

// Create single global rate limiter instance
window.apiLimiter = new APIRateLimiter(200, 2);