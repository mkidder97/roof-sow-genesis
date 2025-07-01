# Archive Directory

This directory contains legacy files and directories that have been deprecated in favor of the new monorepo structure.

## Archived Directories

The following directories should be moved here as part of the reorganization:

### `mcp-tools/` 
MCP (Model Context Protocol) tools and utilities. These were used for development workflows but are being phased out in favor of cleaner development processes.

**Action**: Move entire directory to `archive/mcp-tools/`

### `development/`
Legacy development scripts and temporary files.

**Action**: Move entire directory to `archive/development/`

### `fixes/`
Temporary fix files and patches.

**Action**: Move entire directory to `archive/fixes/`

### `__MACOSX/`
MacOS metadata files (if they exist).

**Action**: Delete or move to `archive/__MACOSX/`

## Migration Process

1. Before archiving, ensure no critical functionality depends on these directories
2. Update any scripts or references that point to these locations
3. Move directories to archive/ 
4. Update documentation to reflect new structure
5. After successful migration, archived directories can be removed in a future cleanup

## Restoration

If any archived functionality is needed:
1. Copy specific files back to appropriate locations in the new structure
2. Update imports and references 
3. Test thoroughly
4. Update documentation
