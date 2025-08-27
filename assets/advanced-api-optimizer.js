// Advanced API Optimizer - Maximizes API call efficiency
// Implements request batching, deduplication, and smart queuing

class AdvancedAPIOptimizer {
  constructor(apiKeys, options = {}) {
    this.apiKeys = Array.isArray(apiKeys) ? apiKeys : [apiKeys];
    this.currentApiIndex = 0;

    // Configuration
    this.config = {
      maxConcurrent: options.maxConcurrent || 6,
      batchSize: options.batchSize || 10,
      retryAttempts: options.retryAttempts || 3,
      retryDelay: options.retryDelay || 1000,
      timeout: options.timeout || 10000,
      ...options
    };

    // Request management
    this.activeRequests = new Map();
    this.requestQueue = [];
    this.batchQueue = new Map();
    this.isProcessing = false;

    // Performance tracking
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      avgResponseTime: 0,
      responseTimes: []
    };

    // Circuit breaker for API reliability
    this.circuitBreaker = {
      failures: 0,
      lastFailureTime: 0,
      state: 'CLOSED', // CLOSED, OPEN, HALF_OPEN
      failureThreshold: 5,
      recoveryTimeout: 30000
    };
  }

  // Get next API key with round-robin
  getNextApiKey() {
    const key = this.apiKeys[this.currentApiIndex];
    this.currentApiIndex = (this.currentApiIndex + 1) % this.apiKeys.length;
    return key;
  }

  // Advanced request with automatic retry and circuit breaker
  async makeRequest(url, options = {}) {
    const requestId = this.generateRequestId(url);

    // Check circuit breaker
    if (this.circuitBreaker.state === 'OPEN') {
      if (Date.now() - this.circuitBreaker.lastFailureTime < this.circuitBreaker.recoveryTimeout) {
        throw new Error('Circuit breaker is OPEN - API temporarily unavailable');
      } else {
        this.circuitBreaker.state = 'HALF_OPEN';
        console.log('🔄 Circuit breaker moving to HALF_OPEN state');
      }
    }

    // Check for duplicate active request
    if (this.activeRequests.has(requestId)) {
      console.log(`⏳ Reusing active request for ${requestId}`);
      return this.activeRequests.get(requestId);
    }

    const requestPromise = this._executeRequest(url, options, requestId);
    this.activeRequests.set(requestId, requestPromise);

    try {
      const result = await requestPromise;
      this.recordSuccess();
      return result;
    } catch (error) {
      this.recordFailure();
      throw error;
    } finally {
      this.activeRequests.delete(requestId);
    }
  }

  // Execute request with retry logic
  async _executeRequest(url, options, requestId, attempt = 1) {
    const startTime = performance.now();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

      const apiKey = this.getNextApiKey();
      const finalUrl = url.includes('key=') ? url : `${url}&key=${apiKey}`;

      const response = await fetch(finalUrl, {
        ...options,
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache',
          ...options.headers
        }
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const responseTime = performance.now() - startTime;

      this.recordResponseTime(responseTime);
      console.log(`✅ API request completed in ${responseTime.toFixed(0)}ms`);

      return data;

    } catch (error) {
      const responseTime = performance.now() - startTime;
      console.warn(`❌ API request failed (attempt ${attempt}/${this.config.retryAttempts}):`, error.message);

      // Retry logic
      if (attempt < this.config.retryAttempts && this.shouldRetry(error)) {
        const delay = this.config.retryDelay * Math.pow(2, attempt - 1); // Exponential backoff
        console.log(`⏱️ Retrying in ${delay}ms...`);
        await this.delay(delay);
        return this._executeRequest(url, options, requestId, attempt + 1);
      }

      throw error;
    }
  }

  // Batch multiple requests for efficiency
  async batchRequests(requests) {
    if (requests.length === 0) return [];

    const batches = this.createBatches(requests);
    const results = [];

    for (const batch of batches) {
      const batchResults = await this.processBatch(batch);
      results.push(...batchResults);
      await this.delay(100); // Small delay between batches
    }

    return results;
  }

  // Create optimal batches based on request similarity
  createBatches(requests) {
    const batches = [];
    let currentBatch = [];

    for (const request of requests) {
      if (currentBatch.length >= this.config.batchSize) {
        batches.push(currentBatch);
        currentBatch = [];
      }

      // Group similar requests together (same base URL)
      const baseUrl = request.url.split('?')[0];
      const canAddToCurrent = currentBatch.length === 0 ||
        currentBatch[0].url.split('?')[0] === baseUrl;

      if (!canAddToCurrent && currentBatch.length > 0) {
        batches.push(currentBatch);
        currentBatch = [];
      }

      currentBatch.push(request);
    }

    if (currentBatch.length > 0) {
      batches.push(currentBatch);
    }

    return batches;
  }

  // Process a batch of requests
  async processBatch(batch) {
    const promises = batch.map(request =>
      this.makeRequest(request.url, request.options).catch(error => ({
        error: error.message,
        url: request.url
      }))
    );

    const results = await Promise.allSettled(promises);

    return results.map((result, index) => ({
      success: result.status === 'fulfilled',
      data: result.status === 'fulfilled' ? result.value : null,
      error: result.status === 'rejected' ? result.reason.message : null,
      url: batch[index].url
    }));
  }

  // Prefetch likely-needed data
  async prefetch(urls, priority = 'normal') {
    console.log(`🔮 Prefetching ${urls.length} URLs with ${priority} priority`);

    const prefetchPromises = urls.map(url => {
      const controller = new AbortController();

      // Cancel prefetch after 3 seconds to not block important requests
      setTimeout(() => controller.abort(), 3000);

      return fetch(url, {
        method: 'HEAD', // Just check if available, don't download
        signal: controller.signal,
        priority: priority
      }).catch(() => null); // Ignore errors for prefetch
    });

    await Promise.allSettled(prefetchPromises);
    console.log(`✅ Prefetch complete`);
  }

  // Circuit breaker methods
  recordSuccess() {
    if (this.circuitBreaker.state === 'HALF_OPEN') {
      this.circuitBreaker.state = 'CLOSED';
      this.circuitBreaker.failures = 0;
      console.log('🔴 Circuit breaker CLOSED - API recovered');
    }
  }

  recordFailure() {
    this.circuitBreaker.failures++;
    this.circuitBreaker.lastFailureTime = Date.now();

    if (this.circuitBreaker.failures >= this.circuitBreaker.failureThreshold) {
      this.circuitBreaker.state = 'OPEN';
      console.log('🔴 Circuit breaker OPEN - Too many failures');
    }
  }

  // Performance tracking
  recordResponseTime(time) {
    this.metrics.responseTimes.push(time);
    if (this.metrics.responseTimes.length > 100) {
      this.metrics.responseTimes.shift();
    }
    this.metrics.avgResponseTime = this.metrics.responseTimes.reduce((sum, t) => sum + t, 0) / this.metrics.responseTimes.length;
  }

  // Utility methods
  generateRequestId(url) {
    return btoa(url).replace(/[^a-zA-Z0-9]/g, '').substr(0, 16);
  }

  shouldRetry(error) {
    // Don't retry on authentication or client errors
    if (error.message.includes('HTTP 4')) return false;
    if (error.message.includes('Circuit breaker')) return false;
    return true;
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Get performance statistics
  getStats() {
    return {
      ...this.metrics,
      circuitBreakerState: this.circuitBreaker.state,
      activeRequests: this.activeRequests.size,
      queuedRequests: this.requestQueue.length,
      successRate: this.metrics.totalRequests > 0 ?
        (this.metrics.successfulRequests / this.metrics.totalRequests * 100).toFixed(1) + '%' : '0%'
    };
  }
}

// Export for global use
window.AdvancedAPIOptimizer = AdvancedAPIOptimizer;</content>
<parameter name="filePath">f:/WebDev/academic-resort/assets/advanced-api-optimizer.js
