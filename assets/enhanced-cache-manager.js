// Enhanced Cache Manager with Compression & Smart Features
// Improves upon the existing cache system with better performance and storage efficiency

class EnhancedCacheManager {
  constructor(cacheVersion = "v3", maxSizeMB = 50) {
    this.cacheVersion = cacheVersion;
    this.maxSizeBytes = maxSizeMB * 1024 * 1024;
    this.compressionEnabled = this.supportsCompression();
    this.cacheHits = 0;
    this.cacheMisses = 0;
    this.cacheStats = {
      totalSize: 0,
      entries: 0,
      hits: 0,
      misses: 0,
      compressionRatio: 1.0
    };
  }

  // Check if browser supports compression
  supportsCompression() {
    try {
      return !!(window.CompressionStream && window.DecompressionStream);
    } catch {
      return false;
    }
  }

  // Compress data using native CompressionStream
  async compress(data) {
    if (!this.compressionEnabled) return JSON.stringify(data);

    try {
      const stream = new CompressionStream('gzip');
      const writer = stream.writable.getWriter();
      const reader = stream.readable.getReader();

      writer.write(new TextEncoder().encode(JSON.stringify(data)));
      writer.close();

      const chunks = [];
      let result = await reader.read();
      while (!result.done) {
        chunks.push(result.value);
        result = await reader.read();
      }

      return btoa(String.fromCharCode(...chunks.flat()));
    } catch (error) {
      console.warn('Compression failed, using uncompressed data:', error);
      return JSON.stringify(data);
    }
  }

  // Decompress data
  async decompress(compressedData) {
    if (!this.compressionEnabled || !compressedData.startsWith('compressed:')) {
      return JSON.parse(compressedData);
    }

    try {
      const binaryData = compressedData.slice(11); // Remove 'compressed:' prefix
      const bytes = Uint8Array.from(atob(binaryData), c => c.charCodeAt(0));

      const stream = new DecompressionStream('gzip');
      const writer = stream.writable.getWriter();
      const reader = stream.readable.getReader();

      writer.write(bytes);
      writer.close();

      const chunks = [];
      let result = await reader.read();
      while (!result.done) {
        chunks.push(result.value);
        result = await reader.read();
      }

      const decompressed = new TextDecoder().decode(chunks.flat());
      return JSON.parse(decompressed);
    } catch (error) {
      console.warn('Decompression failed, trying uncompressed:', error);
      return JSON.parse(compressedData);
    }
  }

  // Enhanced cache key generation
  getCacheKey(type, identifier, metadata = {}) {
    const metaString = Object.entries(metadata)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}:${v}`)
      .join('|');

    return `cache_${this.cacheVersion}_${type}_${identifier}${metaString ? '_' + metaString : ''}`;
  }

  // Smart cache with size management
  async save(key, data, options = {}) {
    const {
      ttl = 24 * 60 * 60 * 1000, // 24 hours default
      priority = 'normal', // 'high', 'normal', 'low'
      tags = []
    } = options;

    try {
      const cacheData = {
        data: await this.compress(data),
        timestamp: Date.now(),
        ttl,
        priority,
        tags,
        version: this.cacheVersion,
        size: JSON.stringify(data).length
      };

      const serialized = JSON.stringify(cacheData);
      const cacheKey = this.getCacheKey('data', key);

      // Check if we need to make space
      await this.ensureSpace(serialized.length);

      localStorage.setItem(cacheKey, serialized);
      await this.updateCacheIndex(key, cacheData);

      console.log(`💾 Cached ${key} (${this.formatBytes(serialized.length)})`);
    } catch (error) {
      console.warn(`Failed to cache ${key}:`, error);
    }
  }

  // Load with performance tracking
  async load(key) {
    try {
      const cacheKey = this.getCacheKey('data', key);
      const cached = localStorage.getItem(cacheKey);

      if (!cached) {
        this.cacheMisses++;
        return null;
      }

      const cacheData = JSON.parse(cached);
      const age = Date.now() - cacheData.timestamp;

      if (age > cacheData.ttl || cacheData.version !== this.cacheVersion) {
        localStorage.removeItem(cacheKey);
        await this.removeFromIndex(key);
        this.cacheMisses++;
        return null;
      }

      const data = await this.decompress(cacheData.data);
      this.cacheHits++;
      this.cacheStats.hits = this.cacheHits;
      this.cacheStats.misses = this.cacheMisses;

      return data;
    } catch (error) {
      console.warn(`Failed to load cache ${key}:`, error);
      this.cacheMisses++;
      return null;
    }
  }

  // Ensure we don't exceed storage limit
  async ensureSpace(requiredBytes) {
    const currentUsage = await this.getStorageUsage();

    if (currentUsage + requiredBytes <= this.maxSizeBytes) {
      return;
    }

    // Need to make space - remove low priority items first
    const index = await this.getCacheIndex();
    const entries = Object.entries(index).sort(([,a], [,b]) => {
      // Sort by priority (low first) then by age (oldest first)
      const priorityOrder = { 'low': 0, 'normal': 1, 'high': 2 };
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return a.timestamp - b.timestamp;
    });

    let freedBytes = 0;
    for (const [key, metadata] of entries) {
      if (currentUsage + requiredBytes - freedBytes <= this.maxSizeBytes) break;

      localStorage.removeItem(this.getCacheKey('data', key));
      freedBytes += metadata.size;
      await this.removeFromIndex(key);
      console.log(`🗑️ Evicted cache entry: ${key}`);
    }
  }

  // Get storage usage
  async getStorageUsage() {
    let total = 0;
    for (let key in localStorage) {
      if (key.startsWith(`cache_${this.cacheVersion}_`)) {
        total += localStorage[key].length;
      }
    }
    return total;
  }

  // Cache index management
  async getCacheIndex() {
    try {
      const index = localStorage.getItem(`cache_${this.cacheVersion}_index`);
      return index ? JSON.parse(index) : {};
    } catch {
      return {};
    }
  }

  async updateCacheIndex(key, metadata) {
    const index = await this.getCacheIndex();
    index[key] = {
      timestamp: metadata.timestamp,
      ttl: metadata.ttl,
      priority: metadata.priority,
      tags: metadata.tags,
      size: metadata.size
    };
    localStorage.setItem(`cache_${this.cacheVersion}_index`, JSON.stringify(index));
  }

  async removeFromIndex(key) {
    const index = await this.getCacheIndex();
    delete index[key];
    localStorage.setItem(`cache_${this.cacheVersion}_index`, JSON.stringify(index));
  }

  // Get detailed cache statistics
  async getCacheStats() {
    const index = await this.getCacheIndex();
    const usage = await this.getStorageUsage();

    return {
      entries: Object.keys(index).length,
      totalSize: usage,
      totalSizeFormatted: this.formatBytes(usage),
      hitRate: this.cacheHits + this.cacheMisses > 0 ?
        (this.cacheHits / (this.cacheHits + this.cacheMisses) * 100).toFixed(1) + '%' : '0%',
      compressionEnabled: this.compressionEnabled,
      maxSize: this.formatBytes(this.maxSizeBytes),
      usagePercent: ((usage / this.maxSizeBytes) * 100).toFixed(1) + '%'
    };
  }

  // Clear cache by tags or pattern
  async clearCache(options = {}) {
    const { tags = [], pattern = '', priority = null } = options;
    const index = await this.getCacheIndex();

    for (const [key, metadata] of Object.entries(index)) {
      let shouldDelete = false;

      if (tags.length > 0 && tags.some(tag => metadata.tags.includes(tag))) {
        shouldDelete = true;
      }

      if (pattern && key.includes(pattern)) {
        shouldDelete = true;
      }

      if (priority && metadata.priority === priority) {
        shouldDelete = true;
      }

      if (shouldDelete) {
        localStorage.removeItem(this.getCacheKey('data', key));
        await this.removeFromIndex(key);
      }
    }
  }

  // Utility functions
  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Warm cache based on usage patterns
  async warmCache(predictiveData) {
    // This could be enhanced with ML-like predictions
    console.log('🔥 Warming cache with predictive data...');
    // Implementation would analyze user behavior patterns
  }
}

// Export for global use
window.EnhancedCacheManager = EnhancedCacheManager;</content>
<parameter name="filePath">f:/WebDev/academic-resort/assets/enhanced-cache-manager.js
