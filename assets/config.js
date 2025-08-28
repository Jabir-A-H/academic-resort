// Unified Configuration for Academic Resort
// This file contains all site-wide configuration including API keys, Drive mappings, and settings

window.SiteConfig = {
  // API Keys for Google Drive
  apiKeys: [
    "AIzaSyDb3zn-YDS42TONfEMI4FPlbBR8BTfDprw",
    "AIzaSyAEOadL6D0G_c8z5EB-sEp0T3hanYAnmF0"
  ],

  // Drive folder mappings by semester and batch
  driveMapping: {
    "8th": {
      "label": "8th Semester",
      "batches": {
        "30": {
          "label": "30th Batch",
          "folderId": "1ROStto-XpFTVfxyo9SLUL6Ou78pL6sat"
        },
        "29": {
          "label": "29th Batch",
          "folderId": "1SV50Qd7OcbRsMd5tHzl0qXqW6BMdQ7uO"
        }
      }
    },
    "7th": {
      "label": "7th Semester",
      "batches": {
        "30": {
          "label": "30th Batch",
          "folderId": "1ROStto-XpFTVfxyo9SLUL6Ou78pL6sat"
        },
        "29": {
          "label": "29th Batch",
          "folderId": "1SV50Qd7OcbRsMd5tHzl0qXqW6BMdQ7uO"
        }
      }
    },
    "6th": {
      "label": "6th Semester",
      "batches": {
        "28": {
          "label": "28th Batch",
          "folderId": "1cSYiB69iMz2czYOHZAlI7nzVniD4bmH9"
        },
        "27": {
          "label": "27th Batch",
          "folderId": "1V1bC-dZV6_NrHvA8q75TmfLIp-tXN-pj"
        },
        "26": {
          "label": "26th Batch",
          "folderId": "1U7chsBvKxAoiN_VRlAQC1mG5jggPYDvb"
        },
        "prior": {
          "label": "Prior to 26th",
          "folderId": "1SDMCnjAHNYDd0WXApaAQ9swaYw75U9Zl"
        },
        "syllabus": {
          "label": "Syllabus",
          "folderId": "1WkOJq5ep_6p3YZw3tENrH6wbAOWdWrjI"
        }
      }
    },
    "5th": {
      "label": "5th Semester",
      "batches": {
        "28": {
          "label": "28th Batch",
          "folderId": "1xU30Tj4q6oXZWb17ubqszqwLVBi-a6N_"
        },
        "27": {
          "label": "27th Batch",
          "folderId": "1AjQxHD_A3HjKA0tKyBNb-A2p5ypf6hi6"
        },
        "26": {
          "label": "26th Batch",
          "folderId": "155q0US7eYWzDnHxMmtg3iFO9kXQZJIUJ"
        },
        "seniors": {
          "label": "Materials from Seniors",
          "folderId": "1dWMahU0ugtF9Em5sGZ0aywkuGY1noN81"
        },
        "personal": {
          "label": "Personal Notes",
          "folderId": "1S0SFn1__66OTcOu5GoLo8iC-GKFrihqE"
        },
        "solution": {
          "label": "Solution Manuals",
          "folderId": "1S0SFn1__66OTcOu5GoLo8iC-GKFrihqE"
        }
      }
    },
    "4th": {
      "label": "4th Semester",
      "batches": {
        "30": {
          "label": "30th Batch",
          "folderId": "1ROStto-XpFTVfxyo9SLUL6Ou78pL6sat"
        },
        "29": {
          "label": "29th Batch",
          "folderId": "1SV50Qd7OcbRsMd5tHzl0qXqW6BMdQ7uO"
        }
      }
    },
    "3rd": {
      "label": "3rd Semester",
      "batches": {
        "30": {
          "label": "30th Batch",
          "folderId": "1ROStto-XpFTVfxyo9SLUL6Ou78pL6sat"
        },
        "29": {
          "label": "29th Batch",
          "folderId": "1SV50Qd7OcbRsMd5tHzl0qXqW6BMdQ7uO"
        }
      }
    },
    "2nd": {
      "label": "2nd Semester",
      "batches": {
        "30": {
          "label": "30th Batch",
          "folderId": "1ROStto-XpFTVfxyo9SLUL6Ou78pL6sat"
        },
        "29": {
          "label": "29th Batch",
          "folderId": "1SV50Qd7OcbRsMd5tHzl0qXqW6BMdQ7uO"
        }
      }
    },
    "1st": {
      "label": "1st Semester",
      "batches": {
        "30": {
          "label": "30th Batch",
          "folderId": "1ROStto-XpFTVfxyo9SLUL6Ou78pL6sat"
        },
        "29": {
          "label": "29th Batch",
          "folderId": "1SV50Qd7OcbRsMd5tHzl0qXqW6BMdQ7uO"
        }
      }
    }
  },

  // Cache settings
  cache: {
    duration: 24 * 60 * 60 * 1000, // 24 hours
    version: "v2", // Increment to force cache refresh
    maxConcurrent: 200,
    delayBetween: 2
  },

  // Search settings
  search: {
    minLength: 2,
    maxDepth: 5,
    parallelBatchSize: 40,
    debounceMs: 500
  },

  // UI settings
  ui: {
    maxResults: 500,
    virtualScrollThreshold: 100
  }
};

// Legacy compatibility - expose API keys for existing code
window.API_KEYS = window.SiteConfig.apiKeys;

// Export for ES modules if needed
if (typeof module !== 'undefined' && module.exports) {
  module.exports = window.SiteConfig;
}
