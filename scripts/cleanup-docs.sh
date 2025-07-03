#!/bin/bash

# Repository Cleanup Script
# This script helps organize and clean up the cluttered documentation

echo "🧹 Starting repository cleanup..."

# Create documentation structure
echo "📁 Creating docs directory structure..."
mkdir -p docs/{archive,development,deployment,phases,reference}

# Files to archive (move to docs/archive/)
ARCHIVE_FILES=(
    "ARCHIVE_SUMMARY.md"
    "AUTH_SETUP_COMPLETE.md" 
    "BACKEND_DIAGNOSTIC.md"
    "BACKEND_FRONTEND_INTEGRATION_COMPLETE.md"
    "BACKEND_REFACTORING_COMPLETE.md"
    "CLEAN_PRODUCTION_IMPLEMENTATION.md"
    "COMPLETE_8_TEMPLATE_IMPLEMENTATION.md"
    "COMPLETE_LOGIC_ENGINE.md"
    "COMPREHENSIVE_ACTION_PLAN.md"
    "COMPREHENSIVE_PROJECT_ASSESSMENT.md"
    "DOCKER_IMPLEMENTATION_COMPLETE.md"
    "ENHANCED_CONTENT_IMPLEMENTATION.md"
    "ENHANCED_FIELD_INSPECTION_SOW_INTEGRATION.md"
    "EXTERNALIZED_GEO_WIND_COMPLETE.md"
    "FILE_MANAGEMENT_SYSTEM.md"
    "FRONTEND_BACKEND_INTEGRATION.md"
    "IMMEDIATE_CHECKLIST.md"
    "IMPLEMENTATION_SUMMARY.md"
    "INSPECTOR_WORKFLOW_FIXES.md"
    "INTELLIGENCE_COMPLETE.md"
    "JURISDICTION_IMPLEMENTATION.md"
    "MCP_TOOLING_SETUP_COMPLETE.md"
    "MEMBRANE_INSULATION_INTEGRATION.md"
    "NATIONWIDE_COVERAGE_REPORT.md"
    "PDF_FORMATTING_IMPLEMENTATION_COMPLETE.md"
    "PDF_PARSING_COMPLETE.md"
    "PDF_PARSING_IMPLEMENTATION.md"
    "PROFESSIONAL_INTELLIGENCE.md"
    "SECTION_ENGINE_COMPLETE.md"
    "SELF_HEALING_AGENT.md"
    "SOW_GENERATION_API_INTEGRATION.md"
    "SOW_WORKFLOW_INTEGRATION_COMPLETE.md"
    "SOW_WORKFLOW_REFACTORING.md"
    "SUPABASE_INTEGRATION_COMPLETE.md"
    "SUPABASE_PHASE1_FIXES.md"
)

# Files to move to development
DEVELOPMENT_FILES=(
    "TESTING_GUIDE.md"
    "ESLINT_SETUP.md"
    "UPDATES.md"
)

# Files to move to deployment  
DEPLOYMENT_FILES=(
    "DOCKER_README.md"
    "REALTIME_COLLABORATION_GUIDE.md"
)

# Files to move to phases
PHASE_FILES=(
    "PHASE1_COMPLETE.md"
    "PHASE1_COMPLETION.md" 
    "PHASE1_DEMO_CHECKLIST.md"
    "PHASE1_DEMO_READY.md"
    "PHASE1_INTEGRATION_PLAN.md"
    "PHASE2_PHASE4_COMPLETE.md"
    "PHASE2_PHASE4_IMPLEMENTATION.md"
)

# Move files to archive
echo "📦 Moving files to archive..."
for file in "${ARCHIVE_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "  Moving $file to docs/archive/"
        git mv "$file" "docs/archive/"
    fi
done

# Move development files
echo "🔧 Moving development files..."
for file in "${DEVELOPMENT_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "  Moving $file to docs/development/"
        git mv "$file" "docs/development/"
    fi
done

# Move deployment files
echo "🚀 Moving deployment files..."
for file in "${DEPLOYMENT_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "  Moving $file to docs/deployment/"
        git mv "$file" "docs/deployment/"
    fi
done

# Move phase files
echo "📋 Moving phase files..."
for file in "${PHASE_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "  Moving $file to docs/phases/"
        git mv "$file" "docs/phases/"
    fi
done

# Keep only essential files in root
echo "✅ Essential files remaining in root:"
echo "  - README.md (main project overview)"
echo "  - QUICK_START.md (getting started)"
echo "  - ARCHITECTURE.md (high-level design)"
echo "  - IMPLEMENTATION.md (current implementation guide)"
echo "  - TESTING.md (if exists)"

echo ""
echo "🎯 Cleanup Summary:"
echo "  - Moved ~40 documentation files to organized docs/ structure"
echo "  - Root directory now contains only essential files"
echo "  - Documentation is organized by purpose and audience"
echo "  - Historical docs preserved in docs/archive/"
echo ""
echo "✨ Next steps:"
echo "  1. Review the moved files and commit changes"
echo "  2. Update README.md to reference docs/ structure" 
echo "  3. Consider removing duplicate or obsolete archived docs"
echo "  4. Update documentation links in code/configs"
echo ""
echo "🧹 Repository cleanup complete!"
