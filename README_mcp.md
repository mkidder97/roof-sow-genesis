# MCP Tools Documentation - roof-sow-genesis

This document provides comprehensive documentation for all MCP (Model Context Protocol) tools in the roof-sow-genesis self-healing PDF system.

## Overview

The MCP tools provide a modular interface for the self-healing PDF agent system, enabling analysis, fix generation, application, and testing of PDF generation improvements. Each tool is designed to work independently while integrating seamlessly with the overall system.

## Tool Architecture

```
mcp-tools/
├── analyze-pdf-output/         # PDF analysis and issue detection
├── propose-fix-snippet/        # AI-powered fix generation
├── write-fix-module/          # Fix application and validation
├── log-fix-history/           # History tracking and Supabase sync
└── trigger-regeneration/      # Enhanced regeneration with testing
```

## Tool Reference

### 1. analyze-pdf-output

**Purpose**: Analyzes generated PDFs to identify layout issues, missing content, and structural problems.

**Input Schema**:
```typescript
interface AnalysisInput {
  pdfPath: string;              // Path to PDF file to analyze
  inputJsonPath: string;        // Original input JSON for comparison
  expectedLayout?: LayoutSpec;  // Optional layout expectations
  comparisonMode?: 'strict' | 'flexible'; // Analysis sensitivity
}
```

**Output Schema**:
```typescript
interface AnalysisResult {
  success: boolean;
  issues: Array<{
    type: 'layout' | 'content' | 'formatting' | 'calculation';
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    location?: { page: number; section: string };
    suggestedFix?: string;
  }>;
  metrics: {
    analysisTime: number;
    confidence: number;
    fileSize: number;
    pageCount: number;
  };
  layout: PDFLayout;
}
```

**Usage Examples**:
```bash
# Basic analysis
analyze-pdf-output analyze output.pdf input.json

# Strict comparison mode
analyze-pdf-output analyze output.pdf input.json --mode strict

# With custom layout expectations
analyze-pdf-output analyze output.pdf input.json --layout custom-layout.json
```

**CLI Commands**:
- `analyze <pdf-path> <input-json>` - Perform complete PDF analysis
- `layout <pdf-path>` - Extract layout structure only
- `compare <pdf1> <pdf2>` - Compare two PDFs
- `validate <pdf-path> <expectations>` - Validate against expectations

---

### 2. propose-fix-snippet

**Purpose**: Generates AI-powered fix suggestions based on PDF analysis results.

**Input Schema**:
```typescript
interface FixProposalInput {
  analysisResults: AnalysisResult;
  targetModule?: string;        // Specific module to fix
  fixType?: 'automatic' | 'guided' | 'manual';
  context?: {
    previousFixes: string[];
    codebase: string[];
    constraints: string[];
  };
}
```

**Output Schema**:
```typescript
interface FixProposal {
  success: boolean;
  fixes: Array<{
    id: string;
    targetModule: string;
    functionName: string;
    fixType: string;
    description: string;
    codeSnippet: string;
    confidence: number;
    estimatedImpact: 'low' | 'medium' | 'high';
    dependencies: string[];
    testingNotes: string;
  }>;
  metadata: {
    generationTime: number;
    claudeModel: string;
    totalSuggestions: number;
  };
}
```

**Usage Examples**:
```bash
# Generate fixes from analysis
propose-fix-snippet generate analysis-results.json

# Target specific module
propose-fix-snippet generate analysis.json --module pdf-generator

# Guided fix generation
propose-fix-snippet generate analysis.json --type guided --context context.json
```

**CLI Commands**:
- `generate <analysis-file>` - Generate fix proposals
- `review <fix-id>` - Review specific fix proposal
- `test <fix-file>` - Test fix proposal syntax
- `apply <fix-id>` - Apply fix to codebase

---

### 3. write-fix-module

**Purpose**: Applies fix proposals to the codebase with validation and error handling.

**Input Schema**:
```typescript
interface FixApplicationInput {
  fixProposal: FixProposal;
  targetPath?: string;
  validationLevel?: 'basic' | 'strict' | 'comprehensive';
  backupEnabled?: boolean;
  dryRun?: boolean;
}
```

**Output Schema**:
```typescript
interface FixApplicationResult {
  success: boolean;
  appliedFixes: Array<{
    fixId: string;
    filePath: string;
    backupPath?: string;
    validationPassed: boolean;
    quarantined: boolean;
  }>;
  errors: Array<{
    fixId: string;
    error: string;
    quarantinePath?: string;
  }>;
  metrics: {
    applicationTime: number;
    filesModified: number;
    backupsCreated: number;
    testsRun: number;
  };
}
```

**Usage Examples**:
```bash
# Apply fix with validation
write-fix-module apply fix-proposal.json

# Dry run mode
write-fix-module apply fix-proposal.json --dry-run

# Strict validation
write-fix-module apply fix-proposal.json --validation strict
```

**CLI Commands**:
- `apply <fix-file>` - Apply fixes to codebase
- `validate <fix-file>` - Validate fix without applying
- `rollback <application-id>` - Rollback applied fixes
- `quarantine <fix-id>` - Move fix to quarantine

---

### 4. log-fix-history

**Purpose**: Tracks fix history with local JSON storage and Supabase synchronization.

**Input Schema**:
```typescript
interface LogInput {
  version: string;
  basedOn?: string;
  fixes: string[];
  inputPath: string;
  outputPath: string;
  success: boolean;
  targetModules: string[];
  functionNames: string[];
  generationTime?: number;
  fileSize?: number;
  metadata?: Record<string, any>;
  // Enhanced fields
  baseVersionId?: string;
  newVersionId?: string;
  confidenceScore?: number;
  executionTimeMs?: number;
  errorDetails?: Record<string, any>;
  quarantineReason?: string;
  projectId?: string;
}
```

**Output Schema**:
```typescript
interface FixLogEntry {
  version: string;
  timestamp: string;
  success: boolean;
  appliedFixes: string[];
  performance: {
    generationTime: number;
    fileSize: number;
    confidence: number;
  };
  supabaseSync: {
    synced: boolean;
    syncId?: string;
    syncError?: string;
  };
}
```

**Usage Examples**:
```bash
# Log a successful fix
log-fix-history log v3 input.json output.pdf true "Fixed wind calculations"

# Sync to Supabase
log-fix-history sync project-123

# Generate comprehensive report
log-fix-history report

# Export history
log-fix-history export csv output/history.csv
```

**CLI Commands**:
- `log <version> <input> <output> <success> <fixes...>` - Log new fix
- `sync [project-id]` - Sync to Supabase
- `report` - Generate fix history report
- `export [format] [path]` - Export history (json/csv)
- `history [version]` - Show fix history
- `latest` - Show latest fix
- `stats` - Show performance statistics

---

### 5. trigger-regeneration

**Purpose**: Enhanced PDF regeneration with automatic testing and validation.

**Input Schema**:
```typescript
interface RegenerationInput {
  inputJsonPath: string;
  fixModules: string[];
  outputDir?: string;
  version?: string;
  originalGeneratorPath?: string;
  runTests?: boolean;
  comparisonBaseline?: string;
  projectId?: string;
}
```

**Output Schema**:
```typescript
interface RegenerationResult {
  success: boolean;
  outputPath?: string;
  version: string;
  generationTime: number;
  fileSize?: number;
  appliedFixes: string[];
  testResults?: {
    passed: boolean;
    testSuite: any;
    layoutComparison?: any;
  };
  backupInfo?: {
    created: boolean;
    backupPaths: string[];
  };
}
```

**Usage Examples**:
```bash
# Basic regeneration
trigger-regeneration generate input.json fix1.ts fix2.ts

# With testing enabled
trigger-regeneration generate input.json fix1.ts --test

# With layout comparison
trigger-regeneration generate input.json fix1.ts --test --baseline old.pdf

# Full monitoring
trigger-regeneration generate input.json fix1.ts --test --project-id proj-123
```

**CLI Commands**:
- `generate <input> <fixes...> [options]` - Regenerate PDF with fixes
- `list-fixes` - List available fix modules
- `latest-fixes <module>` - Get latest fixes for module

**Generate Options**:
- `--test` - Run regression tests after generation
- `--baseline <path>` - Compare layout against baseline PDF
- `--project-id <id>` - Log results to Supabase project

## Integration Patterns

### 1. Complete Self-Healing Workflow

```bash
# 1. Analyze PDF for issues
analyze-pdf-output analyze output.pdf input.json > analysis.json

# 2. Generate fix proposals
propose-fix-snippet generate analysis.json > fixes.json

# 3. Apply fixes with validation
write-fix-module apply fixes.json

# 4. Regenerate with testing
trigger-regeneration generate input.json applied_fixes.ts --test --project-id my-project

# 5. Log the complete cycle
log-fix-history log v4 input.json new_output.pdf true "Complete self-healing cycle"
```

### 2. Regression Testing Pipeline

```bash
# Run comprehensive testing
trigger-regeneration generate input.json latest_fixes.ts --test --baseline baseline.pdf

# Export test results
log-fix-history export json test-results.json

# Compare with previous versions
analyze-pdf-output compare new_output.pdf previous_output.pdf
```

### 3. Continuous Monitoring

```bash
# Monitor fix success rates
log-fix-history stats

# Sync all data to Supabase
log-fix-history sync production-project

# Generate performance report
log-fix-history report > weekly-report.md
```

## Error Handling

### Quarantine System

When fixes fail validation or cause issues, they are automatically moved to quarantine:

```
error-quarantine/
├── fixes/          # Failed fix snippets
├── modules/        # Problematic modules
└── logs/          # Quarantine log entries
```

### Backup System

All critical files are automatically backed up before modification:

```
backups/
├── pdf-generator_2025-06-22T15-30-00.ts
├── wind-calculations_2025-06-22T15-31-15.ts
└── ...
```

### Recovery Procedures

```bash
# List quarantined items
ls error-quarantine/fixes/

# Review quarantine log
cat error-quarantine/logs/quarantine_log.json

# Restore from backup
cp backups/pdf-generator_latest.ts src/pdf-generator.ts

# Rollback specific fix application
write-fix-module rollback application-id-123
```

## Performance Monitoring

### Key Metrics

- **Fix Success Rate**: Percentage of successful fix applications
- **Generation Time**: PDF generation performance
- **Test Pass Rate**: Regression test success rate
- **Confidence Scores**: AI fix proposal confidence
- **File Size Trends**: PDF output size tracking

### Monitoring Commands

```bash
# Get current statistics
log-fix-history stats

# Performance trend analysis
log-fix-history export csv | analyze-trends.py

# Supabase dashboard sync
log-fix-history sync --full-sync production
```

## Configuration

### Environment Variables

See `.env.example` for complete configuration:

```bash
# Core settings
SUPABASE_URL=https://your-project.supabase.co
CLAUDE_API_KEY=sk-ant-api03-your-key
FIX_THRESHOLD=0.7
CONFIDENCE_THRESHOLD=0.85

# Feature flags
ENABLE_SUPABASE_LOGGING=true
ENABLE_AUTO_BACKUP=true
ENABLE_REGRESSION_TESTS=true
```

### Tool Configuration

Each tool can be configured via `config/config.json`:

```json
{
  "self_healing": {
    "max_auto_fixes": 3,
    "fix_threshold": 0.7,
    "confidence_threshold": 0.85
  },
  "testing": {
    "enable_regression_tests": true,
    "layout_comparison_threshold": 0.85
  }
}
```

## Troubleshooting

### Common Issues

1. **Fix Application Fails**
   - Check TypeScript compilation errors
   - Verify module imports
   - Review quarantine logs

2. **PDF Generation Errors**
   - Validate input JSON structure
   - Check file permissions
   - Verify generator path

3. **Supabase Sync Issues**
   - Verify connection credentials
   - Check network connectivity
   - Review database schema

4. **Test Failures**
   - Update test expectations
   - Check baseline PDFs
   - Review layout comparison thresholds

### Debug Mode

Enable verbose logging:

```bash
DEBUG=true trigger-regeneration generate input.json fixes.ts --test
```

### Log Analysis

```bash
# View recent logs
tail -f logs/self-healing-agent.log

# Search for specific errors
grep "ERROR" logs/*.log

# Analyze fix patterns
grep "Applied fix" logs/*.log | sort | uniq -c
```

## Best Practices

### 1. Fix Development

- Start with small, targeted fixes
- Include comprehensive test cases
- Document fix intentions clearly
- Use semantic versioning for fixes

### 2. Testing Strategy

- Always run regression tests before deployment
- Maintain baseline PDFs for comparison
- Test with multiple input variations
- Monitor performance impact

### 3. Monitoring & Maintenance

- Regularly sync data to Supabase
- Monitor fix success rates
- Clean up old backups periodically
- Review quarantined fixes weekly

### 4. Error Recovery

- Maintain recent backups
- Document rollback procedures
- Test recovery processes
- Monitor system health metrics

## API Integration

For programmatic access, all tools can be imported as modules:

```typescript
import { FixHistoryLogger } from './mcp-tools/log-fix-history/index.js';
import { PDFRegenerationTrigger } from './mcp-tools/trigger-regeneration/index.js';

const logger = new FixHistoryLogger();
const trigger = new PDFRegenerationTrigger();

// Use programmatically
const result = await trigger.regeneratePDF({
  inputJsonPath: 'input.json',
  fixModules: ['fix1.ts'],
  runTests: true
});
```

## Contributing

When adding new MCP tools:

1. Follow the established CLI interface patterns
2. Include comprehensive TypeScript types
3. Add Supabase integration for logging
4. Implement error quarantine handling
5. Include backup/restore capabilities
6. Add comprehensive documentation
7. Include usage examples and test cases

For detailed implementation guidelines, see the existing tool implementations as reference patterns.
