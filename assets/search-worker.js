// Web Worker for Search Computations
// Runs heavy search operations off the main thread

// This is the worker code that will be converted to a blob URL
const searchWorkerCode = `
// Search Worker - Handles computationally intensive search operations

class SearchWorker {
  constructor() {
    this.searchIndex = new Map();
    this.isBuildingIndex = false;
    this.indexBuildProgress = 0;

    // Listen for messages from main thread
    self.onmessage = (e) => {
      this.handleMessage(e.data);
    };
  }

  handleMessage(message) {
    const { type, data, id } = message;

    switch (type) {
      case 'BUILD_INDEX':
        this.buildSearchIndex(data.items, id);
        break;

      case 'SEARCH':
        this.performSearch(data.searchTerm, data.items, id);
        break;

      case 'UPDATE_INDEX':
        this.updateSearchIndex(data.items, id);
        break;

      case 'CLEAR_INDEX':
        this.clearIndex(id);
        break;

      case 'GET_STATS':
        this.getStats(id);
        break;
    }
  }

  // Build search index
  buildSearchIndex(items, requestId) {
    if (this.isBuildingIndex) {
      this.sendMessage('INDEX_BUILD_BUSY', { requestId });
      return;
    }

    this.isBuildingIndex = true;
    this.indexBuildProgress = 0;
    this.searchIndex.clear();

    // Process items in chunks to provide progress updates
    const chunkSize = 100;
    let processed = 0;

    const processChunk = () => {
      const chunk = items.slice(processed, processed + chunkSize);

      chunk.forEach((item, index) => {
        const searchableText = this.extractSearchableText(item);
        const words = this.tokenizeText(searchableText);
        const itemIndex = processed + index;

        words.forEach(word => {
          if (!this.searchIndex.has(word)) {
            this.searchIndex.set(word, new Set());
          }
          this.searchIndex.get(word).add(itemIndex);
        });
      });

      processed += chunk.length;
      this.indexBuildProgress = (processed / items.length) * 100;

      // Send progress update
      this.sendMessage('INDEX_BUILD_PROGRESS', {
        requestId,
        progress: this.indexBuildProgress,
        processed,
        total: items.length
      });

      if (processed < items.length) {
        // Continue processing in next tick
        setTimeout(processChunk, 0);
      } else {
        // Index building complete
        this.isBuildingIndex = false;
        this.sendMessage('INDEX_BUILD_COMPLETE', {
          requestId,
          indexSize: this.searchIndex.size,
          buildTime: performance.now()
        });
      }
    };

    // Start processing
    processChunk();
  }

  // Perform search using built index
  performSearch(searchTerm, items, requestId) {
    const startTime = performance.now();

    if (!searchTerm || searchTerm.length < 2) {
      const results = items.map((_, index) => index);
      this.sendMessage('SEARCH_COMPLETE', {
        requestId,
        results,
        searchTime: performance.now() - startTime
      });
      return;
    }

    const queryWords = this.tokenizeText(searchTerm.toLowerCase());
    const candidateSets = [];

    // Get candidate item indices for each query word
    queryWords.forEach(word => {
      if (this.searchIndex.has(word)) {
        candidateSets.push(this.searchIndex.get(word));
      }
    });

    if (candidateSets.length === 0) {
      this.sendMessage('SEARCH_COMPLETE', {
        requestId,
        results: [],
        searchTime: performance.now() - startTime
      });
      return;
    }

    // Find intersection of all candidate sets
    let resultIndices = Array.from(candidateSets[0]);
    for (let i = 1; i < candidateSets.length; i++) {
      resultIndices = resultIndices.filter(index => candidateSets[i].has(index));
    }

    // Score and sort results
    const scoredResults = resultIndices.map(index => ({
      index,
      score: this.calculateRelevanceScore(items[index], queryWords)
    })).sort((a, b) => b.score - a.score);

    const results = scoredResults.map(result => result.index);
    const searchTime = performance.now() - startTime;

    this.sendMessage('SEARCH_COMPLETE', {
      requestId,
      results,
      searchTime,
      resultCount: results.length
    });
  }

  // Update existing index with new items
  updateSearchIndex(newItems, requestId) {
    const startIndex = this.currentItemCount || 0;

    newItems.forEach((item, index) => {
      const searchableText = this.extractSearchableText(item);
      const words = this.tokenizeText(searchableText);
      const itemIndex = startIndex + index;

      words.forEach(word => {
        if (!this.searchIndex.has(word)) {
          this.searchIndex.set(word, new Set());
        }
        this.searchIndex.get(word).add(itemIndex);
      });
    });

    this.currentItemCount = startIndex + newItems.length;

    this.sendMessage('INDEX_UPDATE_COMPLETE', {
      requestId,
      newItemsCount: newItems.length,
      totalIndexSize: this.searchIndex.size
    });
  }

  // Clear search index
  clearIndex(requestId) {
    this.searchIndex.clear();
    this.currentItemCount = 0;
    this.isBuildingIndex = false;
    this.indexBuildProgress = 0;

    this.sendMessage('INDEX_CLEARED', { requestId });
  }

  // Get worker statistics
  getStats(requestId) {
    const stats = {
      indexSize: this.searchIndex.size,
      isBuildingIndex: this.isBuildingIndex,
      indexBuildProgress: this.indexBuildProgress,
      currentItemCount: this.currentItemCount || 0,
      memoryUsage: this.estimateMemoryUsage()
    };

    this.sendMessage('STATS', { requestId, stats });
  }

  // Estimate memory usage
  estimateMemoryUsage() {
    let estimatedBytes = 0;

    // Estimate Map overhead
    estimatedBytes += this.searchIndex.size * 50; // Rough estimate per entry

    // Estimate Set contents
    this.searchIndex.forEach(set => {
      estimatedBytes += set.size * 8; // Rough estimate per number
    });

    return estimatedBytes;
  }

  // Utility methods
  extractSearchableText(item) {
    if (typeof item === 'string') return item;

    const fields = ['name', 'title', 'content', 'description', 'text'];
    for (const field of fields) {
      if (item[field]) {
        return String(item[field]);
      }
    }

    return JSON.stringify(item);
  }

  tokenizeText(text) {
    return text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 1);
  }

  calculateRelevanceScore(item, queryWords) {
    const searchableText = this.extractSearchableText(item).toLowerCase();
    let score = 0;

    queryWords.forEach(word => {
      const wordIndex = searchableText.indexOf(word);
      if (wordIndex !== -1) {
        score += wordIndex === 0 ? 100 : 50;

        const regex = new RegExp(\`\\\\b\${word}\\\\b\`, 'i');
        if (regex.test(searchableText)) {
          score += 25;
        }
      }
    });

    return score;
  }

  sendMessage(type, data) {
    self.postMessage({ type, data });
  }
}

// Initialize worker
new SearchWorker();
`;

// Export worker code
window.SearchWorkerCode = searchWorkerCode;</content>
<parameter name="filePath">f:/WebDev/academic-resort/assets/search-worker.js
