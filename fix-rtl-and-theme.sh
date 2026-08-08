#!/bin/bash

# Script to fix RTL direction and theme issues across all pages
# This script adds dir="rtl" to all page components and fixes table headers

echo "🔧 Starting RTL and Theme Fix Script..."

# Define the project path
PROJECT_PATH="/home/ubuntu/waqf_ai_model/client/src"

# Function to add dir="rtl" to a component if missing
fix_rtl_in_file() {
    local file=$1
    
    # Check if file exists
    if [ ! -f "$file" ]; then
        echo "⚠️  File not found: $file"
        return
    fi
    
    # Check if dir="rtl" already exists
    if grep -q 'dir="rtl"' "$file"; then
        echo "✓ RTL already set in: $(basename $file)"
        return
    fi
    
    # Add dir="rtl" to the main container div
    # Pattern 1: <div className="container
    if grep -q '<div className="container' "$file"; then
        sed -i 's/<div className="container\([^>]*\)>/<div className="container\1" dir="rtl">/g' "$file"
        echo "✓ Added RTL to: $(basename $file)"
        return
    fi
    
    # Pattern 2: First main div in return statement
    if grep -q 'return (' "$file"; then
        sed -i '0,/return (/,/<div/s/<div/<div dir="rtl"/' "$file"
        echo "✓ Added RTL to: $(basename $file)"
        return
    fi
    
    echo "⚠️  Could not auto-fix: $(basename $file) - manual review needed"
}

# Function to fix table headers alignment
fix_table_headers() {
    local file=$1
    
    if [ ! -f "$file" ]; then
        return
    fi
    
    # Check if file contains TableHead
    if grep -q 'TableHead' "$file"; then
        # Add text-center to TableHead if not present
        sed -i 's/<TableHead>/<TableHead className="text-center">/g' "$file"
        sed -i 's/<TableHead className="\([^"]*\)"/<TableHead className="\1 text-center"/g' "$file"
        # Remove duplicate text-center
        sed -i 's/text-center text-center/text-center/g' "$file"
        echo "✓ Fixed table headers in: $(basename $file)"
    fi
}

echo ""
echo "📁 Processing pages directory..."

# Process all page files
for file in "$PROJECT_PATH/pages"/*.tsx; do
    if [ -f "$file" ]; then
        fix_rtl_in_file "$file"
        fix_table_headers "$file"
    fi
done

echo ""
echo "📁 Processing admin pages..."

# Process admin pages if they exist
if [ -d "$PROJECT_PATH/pages/admin" ]; then
    for file in "$PROJECT_PATH/pages/admin"/*.tsx; do
        if [ -f "$file" ]; then
            fix_rtl_in_file "$file"
            fix_table_headers "$file"
        fi
    done
fi

echo ""
echo "📁 Processing components..."

# Process key components
for file in "$PROJECT_PATH/components"/*.tsx; do
    if [ -f "$file" ]; then
        # Only fix RTL in layout components
        if [[ $(basename "$file") == *"Layout"* ]] || [[ $(basename "$file") == *"Dashboard"* ]]; then
            fix_rtl_in_file "$file"
        fi
        fix_table_headers "$file"
    fi
done

echo ""
echo "✅ RTL and table header fixes completed!"
echo ""
echo "📝 Next steps:"
echo "1. Review the changes with: git diff"
echo "2. Test the application thoroughly"
echo "3. Commit the changes if everything looks good"
