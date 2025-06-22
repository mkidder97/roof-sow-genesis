# Self-Healing PDF Agent System

This directory contains all generated fixes, logs, and patched modules for the self-healing PDF agent system.

## Structure

- `change_log.json` - JSON log of all fixes, their source versions, and outputs
- `snippets/` - Claude-generated TypeScript fixes with version tagging

## Fix Versioning

All fixes are versioned using the pattern: `moduleName_vX.ts` where X is the version number.

Examples:
- `addKeyValue_v2.ts`
- `generatePDF_v3.ts`
- `addHeader_v5.ts`

## Change Log Format

Each entry in `change_log.json` contains:
- `version` - The fix version
- `based_on` - Previous version it's based on
- `fixes` - List of issues addressed
- `input` - Source input JSON file
- `output` - Generated PDF file
- `timestamp` - When the fix was applied
- `success` - Whether regeneration succeeded
