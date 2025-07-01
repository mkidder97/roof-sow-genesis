# Archive Directory

This directory contains legacy code, tools, and experimental features that are no longer actively used in the main codebase but are preserved for historical reference and potential future use.

## Recently Archived (2025-07-01)

### 🛠️ MCP Tools (`archive/mcp-tools/`)
Legacy Model Context Protocol (MCP) tools that were used during early development phases:
- **analyze-pdf-output**: PDF analysis and quality checking tools
- **pdf-formatting-optimizer**: Template formatting optimization utilities  
- **propose-fix-snippet**: AI-powered code improvement suggestions
- **write-fix-module**: Automated fix implementation tools
- **trigger-regeneration**: PDF regeneration automation
- **log-fix-history**: Fix tracking and history logging
- **uplift.js**: Wind uplift calculation utilities

### 🧪 Development Scripts (`archive/development/`)
Development and testing utilities used during the build phase:
- **test-all-templates.js**: Comprehensive template testing suite
- **test-pdf-simple.js**: Basic PDF generation testing
- **test-system-configurations.js**: System configuration validation

### 🔧 Legacy Fixes (`archive/fixes/`)
Historical bug fixes and patches:
- **README.md**: Documentation of fix procedures
- **change_log.json**: Historical change tracking
- **snippets/**: Code snippet library for quick fixes

## Archive Policy

**Why Archived**: These directories contained tools and scripts that served their purpose during development but are no longer needed for the production codebase. They have been moved to archive to:

1. **Clean up the main repository** - Remove clutter from active development areas
2. **Preserve history** - Maintain access to tools that might be useful for reference
3. **Improve navigation** - Make the project structure clearer for new developers
4. **Maintain CI/CD efficiency** - Remove unused code from build processes

## Archive Structure

```
archive/
├── README.md                    # This file
├── mcp-tools/                   # Legacy MCP development tools
│   ├── analyze-pdf-output/      # PDF analysis utilities
│   ├── pdf-formatting-optimizer/ # Template optimization
│   ├── propose-fix-snippet/     # AI code suggestions
│   ├── write-fix-module/        # Automated fix tools
│   ├── trigger-regeneration/    # PDF regeneration
│   ├── log-fix-history/         # Fix tracking
│   └── uplift.js               # Wind calculation utilities
├── development/                 # Development and testing scripts
│   ├── test-all-templates.js    # Template testing suite
│   ├── test-pdf-simple.js       # Basic PDF testing
│   └── test-system-configurations.js # System validation
└── fixes/                       # Legacy fixes and patches
    ├── README.md                # Fix documentation
    ├── change_log.json          # Historical changes
    └── snippets/                # Code snippet library
```

## Accessing Archived Code

If you need to reference or restore any archived code:

1. **Browse the archive**: Navigate to the specific directory under `archive/`
2. **Copy what you need**: Extract relevant code to active directories
3. **Update dependencies**: Ensure compatibility with current codebase
4. **Test thoroughly**: Archived code may not be compatible with current versions

## Archive Guidelines

When archiving future code:

1. **Document the reason** - Explain why code is being archived
2. **Preserve structure** - Maintain original directory organization
3. **Update this README** - Add entries for new archived content
4. **Test CI/CD** - Ensure builds still pass after archiving
5. **Update references** - Remove any imports or references to archived code

---

**Last Updated**: July 1, 2025  
**Archived By**: Shared Code Extraction Process  
**Reason**: Legacy tools no longer needed for production codebase
