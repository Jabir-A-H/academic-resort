# academic-resort
A take on making a better version of https://sites.google.com/ais.du.ac.bd/academic-resort

## 🌐 Live Site

Visit: [jabir-a-h.github.io/academic-resort](https://jabir-a-h.github.io/academic-resort)


## 🚀 Technology Stack

### Frontend Technologies
- **HTML5** - Semantic markup with modern accessibility features
- **CSS3** - Modern CSS with custom properties, flexbox, and grid
- **Vanilla JavaScript** - Pure ES6+ JavaScript, no frameworks

### Architecture
- **Static Website** - Client-side only, no backend server required
- **GitHub Pages** - Free hosting with automatic deployment
- **Google Drive API** - Dynamic content fetching from organized Google Drive folders
- **Progressive Web App** features - Responsive design, offline-capable caching


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
The site uses Google Drive API to fetch academic resources.

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

## 🎯 Features

### Search
- Search across semesters and batches
- Filters by semester and batch

### Design
- Responsive layout for mobile and desktop
- Folder tree structure with clickable links
- Clean interface

### Organization
- Semester-based content structure
- Batch-wise resource separation

## 📊 Performance

### Caching
- 24-hour localStorage cache
- 150 concurrent API requests with 3ms delays
- 50 parallel folder processing

### Search Optimization
- 4-level depth traversal
- Early termination at 500 results

## 🛠️ Development

### Adding Content
1. Update folder IDs in `data/drive-mapping.json`
2. Increment `CACHE_VERSION` to clear cache
3. Test changes locally

### Code Structure
- Cache system in individual page scripts
- Search logic in `pages/browse.html`
- Shared utilities in `assets/script.js`

### Deployment
Changes are automatically deployed to GitHub Pages when pushed to the main branch.



## Contributing

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
- Suggest new semester resources or additions
- Help improve documentation and user guides

## Support & Contact

- **Issues**: [GitHub Issues](https://github.com/Jabir-A-H/academic-resort/issues)
- **Original Site**: [Academic Resort](https://sites.google.com/ais.du.ac.bd/academic-resort)

## License

This project is open source and available under the [MIT License](LICENSE).

## Semesters

#### 1st Semester - Getting started
This page contains resources for 1st Semester courses: Introduction to Financial Accounting (1101), Introduction to Business (1102), Computer Concepts and Applications (1103), Mathematics for Business Decisions-I (1104), and Business Communication (1105).
#### 2nd Semester - Just Passed the Entry
This page contains resources for 2nd Semester courses: Intermediate Accounting (1201), Microeconomics (1202), Management and Organizational Behavior (1203), Mathematics for Business Decisions-II (1204), and Bangladesh Studies (1205).
#### 3rd Semester - Intermediate Entry
This page contains resources for 3rd Semester courses: Advanced Financial Accounting-I (2101), Macroeconomics (2102), Programming and Database Management (2103), General Science and Environment (2104), and Business Statistics-I (2105).
#### 4th Semester - Zigzag Academic Hill
This page contains resources for 4th Semester courses: Advanced Financial Accounting-II (2201), Financial Management (2202), Cost Accounting (2203), Marketing (2204), and Business Statistics-II (2205).
#### 5th Semester - Hurry to End
This page contains resources for 5th Semester courses: Management Accounting (3101), Banking and Insurance (3102), Audit and Assurance (3103), Income Tax: Laws and Practice (3104), and Business Laws (3105).
#### 6th Semester - One and Half to Go
This page contains resources for 6th Semester courses: Forensic Accounting and Fraud Investigation (3201), Corporate Finance (3202), Accounting Information Systems (3203), VAT and Cross-border Taxation (3204), and Corporate Laws, Governance and Secretarial Practices (3205).
#### 7th Semester - Close to Shore
This page contains resources for 7th Semester courses: Advanced Management Accounting (4101), Financial Market and Investment Analysis (4102), IT Governance and Information System Audit (4103), Supply Chain and Operation Management (4104), and Public Sector Accounting and Financial Management (4105).
#### 8th Semester - Epilogue Traits
This page contains resources for 8th Semester courses: Accounting Theory (4201), Business Analysis and Valuation (4202), Data Analytics (4203), Strategic Management (4204), and Research Methodology (4205).
#### MBA 1st Semester - The Real Deal
This page contains resources for MBA 1st Semester courses: Advanced Financial Accounting (6101), Corporate Governance and Accountability (6102), Advanced Research Methodology (6103), Government Accounting (7103), and Strategic Management (7112).
#### MBA 2nd Semester - 
This page contains resources for MBA 2nd Semester courses: Stuffs (9909).

## Courses

### Semester 1
*   1101 - Introduction to Financial Accounting
*   1102 - Introduction to Business
*   1103 - Computer Concepts and Applications
*   1104 - Mathematics for Business Decisions-I
*   1105 - Business Communication
### Semester 2
*   1201 - Intermediate Accounting
*   1202 - Microeconomics
*   1203 - Management and Organizational Behavior
*   1204 - Mathematics for Business Decisions-II
*   1205 - Bangladesh Studies
### Semester 3
*   2101 - Advanced Financial Accounting-I
*   2102 - Macroeconomics
*   2103 - Programming and Database Management
*   2104 - General Science and Environment
*   2105 - Business Statistics-I
### Semester 4
*   2201 - Advanced Financial Accounting-II
*   2202 - Financial Management
*   2203 - Cost Accounting
*   2204 - Marketing
*   2205 - Business Statistics-II
### Semester 5
*   3101 - Management Accounting
*   3102 - Banking and Insurance
*   3103 - Audit and Assurance
*   3104 - Income Tax: Laws and Practice
*   3105 - Business Laws
### Semester 6
*   3201 - Forensic Accounting and Fraud Investigation
*   3202 - Corporate Finance
*   3203 - Accounting Information Systems
*   3204 - VAT and Cross-border Taxation
*   3205 - Corporate Laws, Governance and Secretarial Practices
### Semester 7
*   4101 - Advanced Management Accounting
*   4102 - Financial Market and Investment Analysis
*   4103 - IT Governance and Information System Audit
*   4104 - Supply Chain and Operation Management
*   4105 - Public Sector Accounting and Financial Management
### Semester 8
*   4201 - Accounting Theory
*   4202 - Business Analysis and Valuation
*   4203 - Data Analytics
*   4204 - Strategic Management
*   4205 - Research Methodology
