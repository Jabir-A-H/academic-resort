/**
 * API Rate Limiter - Handles concurrent API requests with rate limiting
 */

class APIRateLimiter {
  constructor(maxConcurrent = 50, delayBetween = 5) {
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
        await new Promise(resolve => setTimeout(resolve, this.delayBetween));
      }
    }

    this.isProcessing = false;
  }

  async executeRequest(url, resolve, reject) {
    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      resolve(data);
    } catch (error) {
      const folderIdMatch = url.match(/'([^']+)'\+in\+parents/);
      const folderId = folderIdMatch ? folderIdMatch[1] : "unknown";
      console.warn(`🚫 Error: ${folderId}`);
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
}

// Utility functions
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Export for global use
window.APIRateLimiter = APIRateLimiter;
window.debounce = debounce;
