# Academic Resort 🎓

A modern, responsive web application that provides organized access to academic resources for Accounting & Information Systems students at Dhaka University. This is an improved version of the original [Academic Resort](https://sites.google.com/ais.du.ac.bd/academic-resort) with enhanced performance, caching, and user experience.

## 🌐 Live Site

Visit: [jabir-a-h.github.io/academic-resort](https://jabir-a-h.github.io/academic-resort)

## 🚀 Technology Stack

### Frontend Technologies
- **HTML5** - Semantic markup with modern accessibility features
- **CSS3** - Modern CSS with custom properties, flexbox, and grid
- **Vanilla JavaScript** - Pure ES6+ JavaScript, no frameworks
- **Google Fonts** - Inter font family for modern typography

### Architecture
- **Static Website** - Client-side only, no backend server required
- **GitHub Pages** - Free hosting with automatic deployment
- **Google Drive API** - Dynamic content fetching from organized Google Drive folders
- **Progressive Web App** features - Responsive design, offline-capable caching

### Performance Features
- **Advanced Caching System** - 24-hour localStorage caching with automatic cleanup
- **Background Preloading** - Intelligent cache warming for faster search
- **Rate Limiting** - API request optimization to prevent quota exhaustion
- **Debounced Search** - Optimized search with 500ms debouncing
- **Mobile-First Design** - Responsive layout optimized for all devices

## 📁 Project Structure

```
academic-resort/
├── index.html              # Homepage with semester navigation
├── assets/
│   ├── styles.css          # Main stylesheet with CSS variables
│   ├── script.js           # Core JavaScript functionality
│   ├── drive-mapping.json  # Google Drive folder mappings
│   └── includes/
│       ├── sidebar.html    # Reusable navigation component
│       └── footer.html     # Reusable footer component
└── pages/
    ├── browse.html         # Global search and filter page
    ├── 1st.html - 8th.html # Semester-specific pages
    ├── mba-1st.html        # MBA semester pages
    ├── mba-2nd.html
    └── course-teachers.html # Teacher information
```

## 🔧 Setup & Development

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Text editor (VS Code, Sublime Text, etc.)
- Local development server (optional but recommended)

### Local Development
1. **Clone the repository:**
   ```bash
   git clone https://github.com/Jabir-A-H/academic-resort.git
   cd academic-resort
   ```

2. **Start a local server** (recommended for development):
   ```bash
   # Using Python 3
   python -m http.server 8000
   
   # Using Node.js
   npx serve .
   
   # Using PHP
   php -S localhost:8000
   ```

3. **Open in browser:**
   ```
   http://localhost:8000
   ```

### Configuration

#### Google Drive API Setup
The site uses Google Drive API to fetch academic resources. The API key is configured in each page:
```javascript
const DRIVE_API_KEY = "AIzaSyAEOadL6D0G_c8z5EB-sEp0T3hanYAnmF0";
```

#### Folder Mapping
Academic resources are organized in `assets/drive-mapping.json`:
```json
{
  "1st": {
    "label": "1st Semester",
    "batches": {
      "28": {
        "label": "28th Batch",
        "folderId": "google-drive-folder-id"
      }
    }
  }
}
```

## ⚡ Performance & Caching

### Caching System
- **Duration**: 24 hours automatic expiration
- **Storage**: Browser localStorage (typically 5-10MB limit)
- **Versioning**: Cache version control for easy updates
- **Cleanup**: Automatic expired cache removal

### Cache Statistics
The system provides real-time cache statistics:
- **Entries**: Number of cached folders
- **Size**: Cache size in KB
- **Last Updated**: Timestamp of last cache update

### Performance Optimizations
- **Background Preloading**: Builds cache in background for faster searches
- **Rate Limiting**: 3 concurrent requests max, 100ms delay between requests
- **Search Optimization**: Early termination for large result sets (300+ results)
- **Debounced Input**: 500ms delay to prevent excessive API calls

## 🎯 Features

### 🔍 Advanced Search
- **Global Search**: Search across all semesters and batches
- **Real-time Filtering**: Instant results as you type
- **Speed Search**: Optimized search with progress indicators
- **Smart Results**: Duplicate removal and relevance sorting

### 📱 Mobile-First Design
- **Responsive Layout**: Optimized for phones, tablets, and desktops
- **Touch-Friendly**: Large touch targets and smooth scrolling
- **Modern UI**: Clean design with intuitive navigation
- **Accessibility**: ARIA labels and keyboard navigation support

### 🗂️ Content Organization
- **Semester-Based**: Clear organization by academic semesters
- **Batch-Wise**: Resources separated by student batches (26th, 27th, 28th)
- **Course-Specific**: Individual pages for each course
- **Teacher Information**: Dedicated section for course instructors

## 📊 Usage Statistics

### Daily Operations
- **Cache Refresh**: Automatic every 24 hours
- **Background Sync**: Continuous cache warming when idle
- **API Calls**: Rate-limited to prevent quota exhaustion

### Monthly Maintenance
- **Cache Cleanup**: Automatic removal of expired entries
- **Performance Monitoring**: Cache hit rates and load times
- **Content Updates**: New semester resources and batch additions

## 🛠️ Making Changes

### Adding New Content
1. **Update Drive Mapping**: Add new folder IDs to `assets/drive-mapping.json`
2. **Clear Cache**: Increment `CACHE_VERSION` in relevant pages
3. **Test Locally**: Verify new content loads correctly

### Modifying Styles
1. **CSS Variables**: Update design tokens in `:root` selector
2. **Component Styles**: Modify specific component styles
3. **Responsive Design**: Test across different screen sizes

### JavaScript Modifications
1. **Cache System**: Located in each page's `<script>` section
2. **Search Logic**: Found in `browse.html` and individual pages
3. **Background Preloader**: Implemented in `assets/script.js`

### Deployment
Changes are automatically deployed to GitHub Pages when pushed to the main branch.

## 🎓 Academic Content Structure
### 🎓 Undergraduate Program (B.B.A in Accounting & Information Systems)

#### 1st Semester - Getting Started
**Core Courses:**
- **1101** - Introduction to Financial Accounting
- **1102** - Introduction to Business  
- **1103** - Computer Concepts and Applications
- **1104** - Mathematics for Business Decisions-I
- **1105** - Business Communication

#### 2nd Semester - Just Passed the Entry
**Core Courses:**
- **1201** - Intermediate Accounting
- **1202** - Microeconomics
- **1203** - Management and Organizational Behavior
- **1204** - Mathematics for Business Decisions-II
- **1205** - Bangladesh Studies

#### 3rd Semester - Intermediate Entry
**Core Courses:**
- **2101** - Advanced Financial Accounting-I
- **2102** - Macroeconomics
- **2103** - Programming and Database Management
- **2104** - General Science and Environment
- **2105** - Business Statistics-I

#### 4th Semester - Zigzag Academic Hill
**Core Courses:**
- **2201** - Advanced Financial Accounting-II
- **2202** - Financial Management
- **2203** - Cost Accounting
- **2204** - Marketing
- **2205** - Business Statistics-II

#### 5th Semester - Hurry to End
**Core Courses:**
- **3101** - Management Accounting
- **3102** - Banking and Insurance
- **3103** - Audit and Assurance
- **3104** - Income Tax: Laws and Practice
- **3105** - Business Laws

#### 6th Semester - One and Half to Go
**Core Courses:**
- **3201** - Forensic Accounting and Fraud Investigation
- **3202** - Corporate Finance
- **3203** - Accounting Information Systems
- **3204** - VAT and Cross-border Taxation
- **3205** - Corporate Laws, Governance and Secretarial Practices

#### 7th Semester - Close to Shore
**Core Courses:**
- **4101** - Advanced Management Accounting
- **4102** - Financial Market and Investment Analysis
- **4103** - IT Governance and Information System Audit
- **4104** - Supply Chain and Operation Management
- **4105** - Public Sector Accounting and Financial Management

#### 8th Semester - Epilogue Traits
**Core Courses:**
- **4201** - Accounting Theory
- **4202** - Business Analysis and Valuation
- **4203** - Data Analytics
- **4204** - Strategic Management
- **4205** - Research Methodology

### 🎯 Graduate Program (MBA)

#### MBA 1st Semester - The Real Deal
**Advanced Courses:**
- **6101** - Advanced Financial Accounting
- **6102** - Corporate Governance and Accountability
- **6103** - Advanced Research Methodology
- **7103** - Government Accounting
- **7112** - Strategic Management

#### MBA 2nd Semester
**Advanced Courses:**
- **9909** - Advanced Topics (Various Specializations)

## 🤝 Contributing

We welcome contributions to improve the Academic Resort! Here's how you can help:

### Reporting Issues
- Use GitHub Issues to report bugs or suggest features
- Provide detailed information about browser, device, and steps to reproduce

### Contributing Code
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Content Updates
- Contact the maintainers to update Google Drive folder mappings
- Suggest new semester resources or batch additions
- Help improve documentation and user guides

## 📞 Support & Contact

- **Issues**: [GitHub Issues](https://github.com/Jabir-A-H/academic-resort/issues)
- **Original Site**: [Academic Resort on Google Sites](https://sites.google.com/ais.du.ac.bd/academic-resort)
- **University**: Dhaka University - Accounting & Information Systems Department

## 📜 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- **Dhaka University AIS Department** - For the academic program structure
- **Student Contributors** - For providing and organizing academic resources
- **Google Drive API** - For reliable file hosting and access
- **GitHub Pages** - For free static site hosting

---

**Made with ❤️ for AIS students by AIS students**

> 🎓 *"Simplifying academic resource access, one semester at a time."*