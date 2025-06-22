# Self-Healing PDF Agent System

This document describes the complete self-healing PDF agent system for the `roof-sow-genesis` project. The system automatically detects, fixes, and regenerates improved SOW PDFs using a modular MCP tools architecture.

## Overview

The self-healing PDF agent is a comprehensive system that:

- **🔍 Detects Issues**: Uses Puppeteer to analyze PDF layout and compare against input JSON
- **🧠 Proposes Fixes**: Claude-driven logic analyzer generates targeted code fixes
- **📝 Applies Fixes**: Writes versioned TypeScript fix modules with full traceability
- **📚 Tracks History**: Maintains complete audit trail of all fixes and iterations
- **🔄 Regenerates**: Automatically rebuilds PDFs using the latest fixes

## Architecture

```
Self-Healing PDF Agent System
├── 🔍 analyze-pdf-output/     # Puppeteer-based PDF analyzer
├── 🧠 propose-fix-snippet/    # Claude-driven fix proposal engine
├── 📝 write-fix-module/       # Versioned fix writer
├── 📚 log-fix-history/        # Fix tracking and history
├── 🔄 trigger-regeneration/   # PDF regeneration with fixes
└── 🎛️ self-healing-agent.ts   # Main orchestrator
```

## Directory Structure

```
roof-sow-genesis/
├── fixes/                    # All generated fixes and logs
│   ├── change_log.json       # Complete fix history
│   └── snippets/             # Versioned TypeScript fixes
│       ├── addProjectInfo_v2.ts
│       ├── addZonePressures_v1.ts
│       └── generatePDF_v3.ts
├── mcp-tools/                # MCP-compatible analysis and fix tools
│   ├── analyze-pdf-output/   # PDF layout analyzer
│   ├── propose-fix-snippet/  # Fix proposal engine
│   ├── write-fix-module/     # Fix file writer
│   ├── log-fix-history/      # History logger
│   └── trigger-regeneration/ # PDF regeneration
├── output/                   # Generated PDFs (existing)
├── input_versions/           # Input JSON files (existing)
├── mcp-config.json          # MCP tool configuration
└── self-healing-agent.ts    # Main orchestrator
```

## How It Works

### 1. PDF Analysis (`analyze-pdf-output`)

**Purpose**: Detects formatting, layout, and data-binding issues in generated PDFs.

**Process**:
- Uses Puppeteer to load and analyze PDF content
- Extracts key values (project name, addresses, zone pressures, etc.)
- Compares against source input JSON
- Flags mismatches, missing values, and layout issues

**Output**: Structured list of issues with severity levels and suggested fixes.

```typescript
interface PDFIssue {
  type: 'missing_value' | 'formatting_error' | 'layout_issue' | 'data_mismatch';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  expectedValue?: string;
  actualValue?: string;
  suggestedFix?: string;
}
```

**Example Issues Detected**:
- Missing project name in PDF output
- Zone pressure mismatch: expected -89.2 psf, got -45.1 psf
- Address formatting inconsistency
- Layout spacing issues

### 2. Fix Proposal (`propose-fix-snippet`)

**Purpose**: Generates targeted code fixes using Claude-driven logic analysis.

**Process**:
- Analyzes issues from PDF analysis
- Groups related issues by type and target module
- Generates surgical fixes (not full rewrites)
- Creates proper TypeScript functions with error handling
- Includes test cases and explanations

**Output**: Versioned fix proposals with complete metadata.

**Example Generated Fix**:
```typescript
// CLAUDE FIX v2 - Missing project name fix
function addProjectName(inputData: any, pdf: any, options: any = {}): void {
  // Validation and safety checks
  if (!inputData || !inputData.projectName) {
    console.error('Project name is required');
    return;
  }
  
  // Render with proper formatting
  pdf.fontSize(14)
     .font('Helvetica-Bold')
     .text(`Project: ${inputData.projectName}`, options.x || 50, options.y || 100);
}
```

### 3. Fix Writing (`write-fix-module`)

**Purpose**: Saves proposed fixes to versioned TypeScript files with complete metadata.

**Process**:
- Creates versioned files: `moduleName_vX.ts`
- Includes comprehensive headers and documentation
- Adds test cases and usage examples
- Generates integrity checksums
- Creates backup files when overwriting

**Features**:
- **Version Management**: Automatic version incrementing
- **Metadata Tracking**: Complete fix lineage and usage statistics
- **Backup System**: Prevents accidental overwrites
- **Validation**: Ensures fix integrity and completeness

### 4. History Logging (`log-fix-history`)

**Purpose**: Maintains complete audit trail of all fixes and their effectiveness.

**Process**:
- Updates `change_log.json` with each fix application
- Tracks success rates and performance metrics
- Generates checksums for integrity verification
- Provides reporting and analytics capabilities

**Log Entry Example**:
```json
{
  "version": "v5",
  "based_on": "v4",
  "fixes": [
    "Fixed missing project name in PDF header",
    "Corrected zone pressure decimal formatting"
  ],
  "input": "input_versions/input_v4.json",
  "output": "output/SOW_Project_v5.pdf",
  "timestamp": "2025-06-22T14:30:00.000Z",
  "success": true,
  "targetModules": ["addProjectInfo", "addZonePressures"],
  "generationTime": 1250,
  "checksums": {
    "input": "abc123",
    "output": "def456",
    "fixes": ["ghi789", "jkl012"]
  }
}
```

### 5. PDF Regeneration (`trigger-regeneration`)

**Purpose**: Rebuilds PDFs using the latest fixes and validates improvements.

**Process**:
- Loads fix modules and applies them to the generator
- Creates temporary generator with fixes integrated
- Executes PDF generation with enhanced logic
- Validates output and measures improvements
- Cleans up temporary files

**Features**:
- **Non-Destructive**: Never overwrites original generators
- **Isolated Execution**: Each fix application is completely isolated
- **Validation**: Verifies PDF quality and fix effectiveness
- **Performance Tracking**: Measures generation time and file size

## Self-Healing Cycle

The complete self-healing cycle runs through these steps:

```
🔄 Self-Healing Cycle:
┌─ 1. 🔍 Analyze PDF ─────────────────────────┐
│   • Load PDF and input JSON                │
│   • Extract layout and key values          │
│   • Compare and flag issues                │
│   • Generate structured issue report       │
└─────────────────────────────────────────────┘
                         │
                         ▼
┌─ 2. 🧠 Propose Fixes ──────────────────────┐
│   • Group issues by type and module        │
│   • Generate targeted fix code             │
│   • Create test cases and documentation    │
│   • Version and validate proposals         │
└─────────────────────────────────────────────┘
                         │
                         ▼
┌─ 3. 📝 Write Fix Modules ──────────────────┐
│   • Save versioned TypeScript files        │
│   • Add comprehensive metadata             │
│   • Create backups and validate integrity  │
│   • Update fix registry                    │
└─────────────────────────────────────────────┘
                         │
                         ▼
┌─ 4. 📚 Log Fix History ────────────────────┐
│   • Update change_log.json                 │
│   • Track success metrics                  │
│   • Generate checksums                     │
│   • Update statistics                      │
└─────────────────────────────────────────────┘
                         │
                         ▼
┌─ 5. 🔄 Regenerate PDF ─────────────────────┐
│   • Apply fixes to temporary generator     │
│   • Execute enhanced PDF generation        │
│   • Validate improvements                  │
│   • Clean up and report results            │
└─────────────────────────────────────────────┘
                         │
                         ▼
         🔁 Repeat until no issues found
```

## Usage Examples

### Basic Self-Healing

```bash
# Run complete self-healing cycle
npx tsx self-healing-agent.ts heal input.json output.pdf

# Run with custom parameters
npx tsx self-healing-agent.ts heal input.json output.pdf 5 true
```

### Individual Tool Usage

```bash
# Analyze PDF issues
cd mcp-tools/analyze-pdf-output
npx tsx index.ts ../../output/SOW_v1.pdf ../../input.json

# Propose fixes for issues
cd mcp-tools/propose-fix-snippet
npx tsx index.ts ../../pdf-analysis-result.json v1

# Write fix modules
cd mcp-tools/write-fix-module
npx tsx index.ts write ../../fix-proposals.json

# Log fix to history
cd mcp-tools/log-fix-history
npx tsx index.ts log v2 input.json output.pdf true "Fixed missing project name"

# Regenerate PDF with fixes
cd mcp-tools/trigger-regeneration
npx tsx index.ts generate input.json addProjectInfo_v2.ts
```

### Reporting and Analysis

```bash
# Generate fix history report
npx tsx self-healing-agent.ts report

# List available fix modules
npx tsx self-healing-agent.ts list-fixes

# Export fix history
cd mcp-tools/log-fix-history
npx tsx index.ts export csv fix_history.csv
```

## Configuration

### MCP Tool Configuration (`mcp-config.json`)

```json
{
  "mcpVersion": "2024-11-05",
  "name": "roof-sow-pdf-healing-agent",
  "version": "1.0.0",
  "tools": [
    {
      "name": "analyze-pdf-output",
      "description": "Puppeteer-based PDF analyzer",
      "path": "./mcp-tools/analyze-pdf-output"
    },
    {
      "name": "propose-fix-snippet",
      "description": "Claude-driven fix proposal engine",
      "path": "./mcp-tools/propose-fix-snippet"
    }
  ]
}
```

### Self-Healing Configuration

```typescript
interface SelfHealingConfig {
  inputJsonPath: string;           // Required: Input JSON file
  pdfPath?: string;               // Optional: Initial PDF (will generate if missing)
  maxIterations?: number;         // Default: 3
  autoApplyFixes?: boolean;       // Default: true
  outputDir?: string;             // Optional: Custom output directory
  originalGeneratorPath?: string; // Optional: Path to PDF generator
}
```

## Fix Examples

### Missing Value Fix

**Issue**: Project name missing from PDF output

**Generated Fix**:
```typescript
// CLAUDE FIX v2 - Missing value fix for: Project name is missing from PDF output
function addProjectName(inputData: any, pdf: any, options: any = {}): void {
  // Validation and safety checks
  if (!inputData) {
    console.error('Input data is required for addProjectName');
    return;
  }
  
  // Extract required value from input
  const value = inputData.projectName || inputData.name || 'Unknown Project';
  
  if (!value || value.trim() === '') {
    console.warn('Missing or empty value in input data');
    return;
  }
  
  // Set proper positioning
  const x = options.x || 50;
  const y = options.y || 100;
  
  // Render with proper formatting
  pdf.fontSize(14)
     .font('Helvetica-Bold')
     .text(`Project: ${value}`, x, y);
  
  // Add spacing for next element
  return y + 25;
}
```

### Data Mismatch Fix

**Issue**: Zone pressure values don't match input data

**Generated Fix**:
```typescript
// CLAUDE FIX v3 - Data mismatch fix for zone pressures
function fixZonePressureBinding(inputData: any, pdf: any, options: any = {}): void {
  // Navigate to correct data path
  const zonePressures = inputData.windAnalysis?.zonePressures || inputData.zonePressures;
  
  if (!zonePressures) {
    console.error('Zone pressures not found in input data');
    return;
  }
  
  // Render zone pressure table with correct values
  const startY = options.y || 200;
  let currentY = startY;
  
  pdf.fontSize(12).font('Helvetica-Bold');
  pdf.text('Wind Uplift Pressures:', 50, currentY);
  currentY += 20;
  
  // Render each zone with proper formatting
  Object.entries(zonePressures).forEach(([zone, pressure], index) => {
    const formattedPressure = `${Math.abs(Number(pressure)).toFixed(1)} psf`;
    pdf.fontSize(10).font('Helvetica');
    pdf.text(`${zone.toUpperCase()}: ${formattedPressure}`, 70, currentY);
    currentY += 15;
  });
}
```

### Layout Fix

**Issue**: Poor spacing and positioning

**Generated Fix**:
```typescript
// CLAUDE FIX v2 - Layout fix for spacing and positioning issues
function fixLayoutSpacing(pdf: any, content: any[], options: any = {}): number {
  // Calculate page dimensions and margins
  const pageWidth = pdf.page.width;
  const pageHeight = pdf.page.height;
  const margin = options.margin || 50;
  const lineHeight = options.lineHeight || 20;
  
  // Set up content area
  const contentArea = {
    x: margin,
    y: margin,
    width: pageWidth - (margin * 2),
    height: pageHeight - (margin * 2)
  };
  
  let currentY = contentArea.y;
  
  // Process each content item with proper spacing
  for (const item of content) {
    // Check if we need a new page
    if (currentY + lineHeight > contentArea.y + contentArea.height) {
      pdf.addPage();
      currentY = margin;
    }
    
    // Render item with consistent spacing
    currentY = this.renderContentItem(pdf, item, contentArea.x, currentY);
    currentY += lineHeight * 0.5; // Add spacing after each item
  }
  
  return currentY;
}
```

## Integration with Existing System

The self-healing agent integrates seamlessly with the existing SOW generation system:

### 1. **Non-Destructive**: Never modifies original code
### 2. **Version Controlled**: All fixes are versioned and tracked
### 3. **Backward Compatible**: Original generators continue to work
### 4. **Modular**: Each tool can be used independently
### 5. **Extensible**: Easy to add new analysis and fix types

## Benefits

### For Development
- **Automatic Issue Detection**: No manual PDF review required
- **Intelligent Fix Generation**: Claude-powered solutions
- **Complete Traceability**: Full audit trail of all changes
- **Rapid Iteration**: Fix and verify in minutes, not hours

### For Production
- **Continuous Improvement**: PDFs get better over time
- **Quality Assurance**: Automatic validation of outputs
- **Performance Tracking**: Detailed metrics and reporting
- **Reliability**: Isolated fixes prevent system breakage

### For Maintenance
- **Version Management**: Easy rollback and comparison
- **Issue Tracking**: Comprehensive problem history
- **Analytics**: Success rates and common patterns
- **Documentation**: Auto-generated fix explanations

## Troubleshooting

### Common Issues

1. **Puppeteer Installation**: Ensure Chrome/Chromium is available
2. **TypeScript Compilation**: Verify tsx is installed globally
3. **File Permissions**: Check write access to output directories
4. **Memory Limits**: Large PDFs may need increased Node.js memory

### Debug Mode

```bash
# Enable verbose logging
DEBUG=* npx tsx self-healing-agent.ts heal input.json

# Run individual tools for debugging
cd mcp-tools/analyze-pdf-output
npx tsx index.ts --debug ../../output/test.pdf ../../input.json
```

### Validation

```bash
# Verify system health
npx tsx self-healing-agent.ts report

# Check fix integrity
cd mcp-tools/log-fix-history
npx tsx index.ts history

# Validate generated fixes
cd fixes/snippets
npx tsc --noEmit *.ts
```

## Future Enhancements

### Planned Features
- **Machine Learning**: Pattern recognition for common issues
- **Performance Optimization**: Parallel processing and caching
- **Advanced Analytics**: Predictive issue detection
- **Integration APIs**: REST endpoints for external integration

### Extensibility Points
- **Custom Analyzers**: Plugin architecture for new analysis types
- **Fix Templates**: User-defined fix patterns
- **Validation Rules**: Custom quality checks
- **Reporting Formats**: Additional export options

The self-healing PDF agent represents a significant advancement in automated document generation quality assurance, providing intelligent, traceable, and continuous improvement capabilities for the SOW generation system.
