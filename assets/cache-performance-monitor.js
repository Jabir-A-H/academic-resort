// Cache Performance Monitor - Real-time cache analytics
// Provides insights into cache performance and usage patterns

class CachePerformanceMonitor {
  constructor(cacheManager) {
    this.cacheManager = cacheManager;
    this.metrics = {
      hits: 0,
      misses: 0,
      totalRequests: 0,
      avgLoadTime: 0,
      loadTimes: [],
      storageUsage: 0,
      compressionRatio: 1.0,
      evictionCount: 0
    };
    this.isMonitoring = false;
    this.monitoringInterval = null;
    this.performanceData = [];
  }

  // Start monitoring
  startMonitoring(intervalMs = 30000) { // 30 seconds default
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    console.log('📊 Cache performance monitoring started');

    this.monitoringInterval = setInterval(() => {
      this.collectMetrics();
    }, intervalMs);
  }

  // Stop monitoring
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.isMonitoring = false;
    console.log('📊 Cache performance monitoring stopped');
  }

  // Collect current metrics
  async collectMetrics() {
    try {
      const cacheStats = await this.cacheManager.getCacheStats();
      const storageUsage = await this.cacheManager.getStorageUsage();

      const currentMetrics = {
        timestamp: Date.now(),
        cacheStats,
        storageUsage,
        hitRate: this.calculateHitRate(),
        avgLoadTime: this.calculateAverageLoadTime(),
        performanceScore: this.calculatePerformanceScore()
      };

      this.performanceData.push(currentMetrics);

      // Keep only last 100 data points
      if (this.performanceData.length > 100) {
        this.performanceData.shift();
      }

      // Log significant changes
      this.logSignificantChanges(currentMetrics);

    } catch (error) {
      console.warn('Failed to collect cache metrics:', error);
    }
  }

  // Record a cache hit
  recordHit(loadTimeMs) {
    this.metrics.hits++;
    this.metrics.totalRequests++;
    this.metrics.loadTimes.push(loadTimeMs);
    if (this.metrics.loadTimes.length > 100) {
      this.metrics.loadTimes.shift();
    }
  }

  // Record a cache miss
  recordMiss() {
    this.metrics.misses++;
    this.metrics.totalRequests++;
  }

  // Calculate hit rate
  calculateHitRate() {
    if (this.metrics.totalRequests === 0) return 0;
    return (this.metrics.hits / this.metrics.totalRequests) * 100;
  }

  // Calculate average load time
  calculateAverageLoadTime() {
    if (this.metrics.loadTimes.length === 0) return 0;
    return this.metrics.loadTimes.reduce((sum, time) => sum + time, 0) / this.metrics.loadTimes.length;
  }

  // Calculate performance score (0-100)
  calculatePerformanceScore() {
    const hitRate = this.calculateHitRate();
    const avgLoadTime = this.calculateAverageLoadTime();

    // Hit rate score (0-60 points)
    const hitRateScore = (hitRate / 100) * 60;

    // Load time score (0-40 points) - faster is better
    const loadTimeScore = Math.max(0, 40 - (avgLoadTime / 100)); // Penalize >100ms

    return Math.round(hitRateScore + loadTimeScore);
  }

  // Log significant performance changes
  logSignificantChanges(currentMetrics) {
    if (this.performanceData.length < 2) return;

    const previous = this.performanceData[this.performanceData.length - 2];
    const changes = {
      hitRateChange: currentMetrics.hitRate - previous.hitRate,
      storageChange: currentMetrics.storageUsage - previous.storageUsage,
      scoreChange: currentMetrics.performanceScore - previous.performanceScore
    };

    // Log significant changes
    if (Math.abs(changes.hitRateChange) > 5) {
      console.log(`📈 Hit rate ${changes.hitRateChange > 0 ? 'improved' : 'declined'} by ${Math.abs(changes.hitRateChange).toFixed(1)}%`);
    }

    if (Math.abs(changes.scoreChange) > 10) {
      console.log(`🎯 Performance score ${changes.scoreChange > 0 ? 'improved' : 'declined'} by ${Math.abs(changes.scoreChange)} points`);
    }

    if (Math.abs(changes.storageChange) > 1024 * 1024) { // 1MB change
      const changeMB = (changes.storageChange / (1024 * 1024)).toFixed(2);
      console.log(`💾 Storage usage changed by ${changeMB}MB`);
    }
  }

  // Get comprehensive performance report
  async getPerformanceReport() {
    const cacheStats = await this.cacheManager.getCacheStats();
    const currentMetrics = this.performanceData[this.performanceData.length - 1] || {};

    return {
      summary: {
        hitRate: `${this.calculateHitRate().toFixed(1)}%`,
        avgLoadTime: `${this.calculateAverageLoadTime().toFixed(0)}ms`,
        performanceScore: this.calculatePerformanceScore(),
        totalRequests: this.metrics.totalRequests,
        cacheEntries: cacheStats.entries,
        storageUsage: cacheStats.totalSizeFormatted
      },
      trends: this.analyzeTrends(),
      recommendations: this.generateRecommendations(),
      rawMetrics: {
        hits: this.metrics.hits,
        misses: this.metrics.misses,
        loadTimes: this.metrics.loadTimes,
        performanceData: this.performanceData.slice(-10) // Last 10 data points
      }
    };
  }

  // Analyze performance trends
  analyzeTrends() {
    if (this.performanceData.length < 5) {
      return { trend: 'insufficient_data', description: 'Need more data points for trend analysis' };
    }

    const recent = this.performanceData.slice(-5);
    const hitRateTrend = this.calculateTrend(recent.map(d => d.hitRate));
    const scoreTrend = this.calculateTrend(recent.map(d => d.performanceScore));

    return {
      hitRate: {
        trend: hitRateTrend > 0.5 ? 'improving' : hitRateTrend < -0.5 ? 'declining' : 'stable',
        change: hitRateTrend.toFixed(2)
      },
      performanceScore: {
        trend: scoreTrend > 0.5 ? 'improving' : scoreTrend < -0.5 ? 'declining' : 'stable',
        change: scoreTrend.toFixed(2)
      }
    };
  }

  // Calculate trend (simple linear regression slope)
  calculateTrend(values) {
    const n = values.length;
    if (n < 2) return 0;

    const sumX = (n * (n - 1)) / 2;
    const sumY = values.reduce((sum, val) => sum + val, 0);
    const sumXY = values.reduce((sum, val, idx) => sum + val * idx, 0);
    const sumXX = (n * (n - 1) * (2 * n - 1)) / 6;

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    return slope;
  }

  // Generate optimization recommendations
  generateRecommendations() {
    const recommendations = [];
    const hitRate = this.calculateHitRate();
    const avgLoadTime = this.calculateAverageLoadTime();
    const cacheStats = this.cacheManager.getCacheStats();

    if (hitRate < 70) {
      recommendations.push({
        type: 'warning',
        message: 'Low cache hit rate. Consider increasing cache TTL or preloading more content.',
        action: 'Increase cache duration or implement smart preloading'
      });
    }

    if (avgLoadTime > 200) {
      recommendations.push({
        type: 'warning',
        message: 'Cache load times are high. Consider compression or cache optimization.',
        action: 'Enable compression or optimize cache storage'
      });
    }

    if (cacheStats.usagePercent > 80) {
      recommendations.push({
        type: 'info',
        message: 'Cache storage is nearing capacity. Consider cleanup or increasing storage limit.',
        action: 'Clear old cache entries or increase maxSizeMB'
      });
    }

    if (recommendations.length === 0) {
      recommendations.push({
        type: 'success',
        message: 'Cache performance is optimal!',
        action: 'Keep monitoring for any changes'
      });
    }

    return recommendations;
  }

  // Export performance data
  exportData() {
    const data = {
      metrics: this.metrics,
      performanceData: this.performanceData,
      exportTimestamp: Date.now(),
      version: '1.0'
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `cache-performance-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

// Export for global use
window.CachePerformanceMonitor = CachePerformanceMonitor;
