#!/usr/bin/env python3
"""
Simple build script for Academic Resort
Provides CSS and JS minification and optimization
"""

import os
import re
import json
from pathlib import Path

class SimpleMinifier:
    """Simple CSS and JS minifier"""
    
    @staticmethod
    def minify_css(css_content):
        """Basic CSS minification"""
        # Remove comments
        css_content = re.sub(r'/\*.*?\*/', '', css_content, flags=re.DOTALL)
        
        # Remove unnecessary whitespace
        css_content = re.sub(r'\s+', ' ', css_content)
        css_content = re.sub(r';\s*}', '}', css_content)
        css_content = re.sub(r'{\s*', '{', css_content)
        css_content = re.sub(r'}\s*', '}', css_content)
        css_content = re.sub(r';\s*', ';', css_content)
        css_content = re.sub(r':\s*', ':', css_content)
        css_content = re.sub(r',\s*', ',', css_content)
        
        return css_content.strip()
    
    @staticmethod
    def minify_js(js_content):
        """Basic JS minification"""
        # Remove single-line comments (but preserve URLs)
        js_content = re.sub(r'//(?![^\'"]*["\'][^"\']*["\'][^\'"]*$).*$', '', js_content, flags=re.MULTILINE)
        
        # Remove multi-line comments
        js_content = re.sub(r'/\*.*?\*/', '', js_content, flags=re.DOTALL)
        
        # Remove unnecessary whitespace
        js_content = re.sub(r'\s+', ' ', js_content)
        js_content = re.sub(r';\s*}', ';}', js_content)
        js_content = re.sub(r'{\s*', '{', js_content)
        js_content = re.sub(r'}\s*', '}', js_content)
        
        return js_content.strip()

def create_minified_assets():
    """Create minified versions of CSS and JS files"""
    assets_dir = Path('./assets')
    dist_dir = Path('./dist')
    dist_dir.mkdir(exist_ok=True)
    
    minifier = SimpleMinifier()
    
    # CSS files to minify
    css_files = ['styles.css', 'utilities.css', 'homepage.css']
    
    for css_file in css_files:
        css_path = assets_dir / css_file
        if css_path.exists():
            with open(css_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            minified = minifier.minify_css(content)
            
            # Save minified version
            min_name = css_file.replace('.css', '.min.css')
            min_path = dist_dir / min_name
            
            with open(min_path, 'w', encoding='utf-8') as f:
                f.write(minified)
            
            original_size = len(content)
            minified_size = len(minified)
            reduction = ((original_size - minified_size) / original_size) * 100
            
            print(f"✅ {css_file}: {original_size} → {minified_size} bytes ({reduction:.1f}% reduction)")
    
    # JS files to minify
    js_files = ['script.js', 'batch-loader.js', 'cache-utils.js', 'api-limiter.js', 'drive-utils.js']
    
    for js_file in js_files:
        js_path = assets_dir / js_file
        if js_path.exists():
            with open(js_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            minified = minifier.minify_js(content)
            
            # Save minified version
            min_name = js_file.replace('.js', '.min.js')
            min_path = dist_dir / min_name
            
            with open(min_path, 'w', encoding='utf-8') as f:
                f.write(minified)
            
            original_size = len(content)
            minified_size = len(minified)
            reduction = ((original_size - minified_size) / original_size) * 100
            
            print(f"✅ {js_file}: {original_size} → {minified_size} bytes ({reduction:.1f}% reduction)")

def generate_build_stats():
    """Generate build statistics"""
    stats = {
        'build_time': __import__('datetime').datetime.now().isoformat(),
        'files_processed': 0,
        'total_original_size': 0,
        'total_minified_size': 0,
        'optimizations': [
            'Extracted shared utilities for cache management',
            'Consolidated API rate limiting implementations', 
            'Created modular CSS architecture with utilities',
            'Moved inline styles to external files',
            'Implemented basic minification'
        ]
    }
    
    # Count files processed
    assets_dir = Path('./assets')
    dist_dir = Path('./dist')
    
    if dist_dir.exists():
        stats['files_processed'] = len(list(dist_dir.glob('*.min.*')))
    
    with open('./dist/build-stats.json', 'w') as f:
        json.dump(stats, f, indent=2)
    
    print(f"📊 Build statistics saved to dist/build-stats.json")

def main():
    print("🚀 Starting Academic Resort build process...")
    print()
    
    # Create minified assets
    create_minified_assets()
    print()
    
    # Generate build statistics
    generate_build_stats()
    print()
    
    print("✨ Build complete! Minified files are available in ./dist/")
    print("💡 To use minified files in production, update HTML files to reference .min versions")

if __name__ == '__main__':
    main()