# Migration Guide: Monorepo Restructuring

This guide provides step-by-step instructions for migrating from the current flat repository structure to the new organized monorepo structure.

## Overview

The repository is being reorganized into three main packages:
- `packages/web-client/` - React/Vite frontend
- `packages/api-server/` - Express.js backend  
- `packages/shared/` - Common types and utilities

## Migration Steps

### Phase 1: Prepare Workspace

1. **Install workspace dependencies**
   ```bash
   npm install
   ```

2. **Verify new structure**
   ```bash
   ls packages/
   # Should show: web-client/ api-server/ shared/
   ```

### Phase 2: Migrate Shared Package

**Priority: High** - Other packages depend on this

1. **Move type definitions**
   ```bash
   # Move all type files
   mkdir -p packages/shared/src/types
   cp src/types/* packages/shared/src/types/
   
   # Remove duplicate exports and consolidate
   # Edit packages/shared/src/types/index.ts to export all types
   ```

2. **Move utilities**
   ```bash
   # Move utility functions
   mkdir -p packages/shared/src/utils
   cp utils/* packages/shared/src/utils/ 2>/dev/null || true
   cp src/lib/utils.ts packages/shared/src/utils/ 2>/dev/null || true
   ```

3. **Extract constants**
   ```bash
   # Create constants from hardcoded values in both packages
   # Review src/ and server/ for hardcoded strings/enums
   # Add to packages/shared/src/constants/
   ```

4. **Build shared package**
   ```bash
   cd packages/shared
   npm run build
   cd ../..
   ```

### Phase 3: Migrate API Server

1. **Move server files**
   ```bash
   # Create source directory
   mkdir -p packages/api-server/src
   
   # Move all server code
   cp -r server/* packages/api-server/src/
   
   # Move backend files if any
   cp -r backend/* packages/api-server/ 2>/dev/null || true
   ```

2. **Update imports**
   ```bash
   # In packages/api-server/src/
   # Replace any imports from '../src/types' with '@roof-sow-genesis/shared'
   # Replace utility imports with '@roof-sow-genesis/shared/utils'
   ```

3. **Update entry point**
   ```bash
   # Choose main entry point (recommended: index-production.ts)
   # Update packages/api-server/package.json main field
   # Rename chosen file to packages/api-server/src/index.ts
   ```

4. **Environment configuration**
   ```bash
   cp server/.env* packages/api-server/ 2>/dev/null || true
   cp server/railway.json packages/api-server/ 2>/dev/null || true
   ```

### Phase 4: Migrate Web Client

1. **Move React application**
   ```bash
   # Create source directory
   mkdir -p packages/web-client/src
   
   # Move all frontend code
   cp -r src/* packages/web-client/src/
   
   # Move public assets
   cp -r public packages/web-client/
   
   # Move configuration files
   cp index.html packages/web-client/
   cp tailwind.config.ts packages/web-client/
   cp postcss.config.js packages/web-client/
   cp eslint.config.js packages/web-client/
   cp components.json packages/web-client/
   ```

2. **Update imports**
   ```bash
   # In packages/web-client/src/
   # Replace imports from '../types' with '@roof-sow-genesis/shared'
   # Replace utility imports with '@roof-sow-genesis/shared/utils'
   # Update path aliases in vite.config.ts
   ```

3. **Update configurations**
   ```bash
   # Edit packages/web-client/vite.config.ts
   # Update path aliases to point to shared package
   # Configure API proxy to api-server
   ```

### Phase 5: Archive Legacy Directories

1. **Move deprecated directories**
   ```bash
   # Archive MCP tools
   mv mcp-tools archive/ 2>/dev/null || true
   
   # Archive development files
   mv development archive/ 2>/dev/null || true
   
   # Archive fixes
   mv fixes archive/ 2>/dev/null || true
   
   # Remove macOS metadata
   rm -rf __MACOSX__ 2>/dev/null || true
   ```

2. **Clean up root directory**
   ```bash
   # Remove old files (keep important ones)
   # Move documentation files to docs/ if desired
   # Keep: package.json, README.md, ARCHITECTURE.md, .gitignore
   ```

### Phase 6: Update Scripts and Configuration

1. **Update root package.json scripts**
   ```json
   {
     "scripts": {
       "dev": "npm run dev:client",
       "dev:client": "npm run dev --workspace=packages/web-client",
       "dev:server": "npm run dev --workspace=packages/api-server", 
       "dev:all": "concurrently \"npm run dev:server\" \"npm run dev:client\"",
       "build": "npm run build --workspaces",
       "test": "npm run test --workspaces"
     }
   }
   ```

2. **Update Docker configuration**
   ```dockerfile
   # Update Dockerfile to use new package structure
   # Multi-stage build for web-client and api-server
   ```

3. **Update CI/CD**
   ```bash
   # Update GitHub Actions or other CI/CD to use new structure
   # Test both packages independently
   ```

### Phase 7: Testing and Validation

1. **Install all dependencies**
   ```bash
   npm install
   ```

2. **Build all packages**
   ```bash
   npm run build
   ```

3. **Test development servers**
   ```bash
   # Terminal 1
   npm run dev:server
   
   # Terminal 2  
   npm run dev:client
   ```

4. **Test production builds**
   ```bash
   npm run build:client
   npm run build:server
   ```

## Import Update Patterns

### Before (Old Structure)
```typescript
// Frontend
import { ProjectData } from '../types/sow';
import { formatCurrency } from '../lib/utils';

// Backend  
import { ASCERequirements } from './types/engineering';
```

### After (New Structure)
```typescript
// Frontend
import { ProjectData } from '@roof-sow-genesis/shared';
import { formatCurrency } from '@roof-sow-genesis/shared/utils';

// Backend
import { ASCERequirements } from '@roof-sow-genesis/shared';
```

## Common Issues and Solutions

### Issue: Import errors after migration
**Solution**: Check path aliases in tsconfig.json and vite.config.ts

### Issue: Shared package not found
**Solution**: Run `npm install` in workspace root, then build shared package

### Issue: Type conflicts
**Solution**: Ensure only one definition exists in shared package, remove duplicates

### Issue: Missing environment variables
**Solution**: Copy .env files to appropriate package directories

## Rollback Plan

If migration causes issues:

1. **Revert to main branch**
   ```bash
   git checkout main
   ```

2. **Cherry-pick specific fixes**
   ```bash
   # Apply only the fixes that don't break existing structure
   git cherry-pick <commit-hash>
   ```

3. **Gradual migration**
   ```bash
   # Migrate one package at a time instead of all at once
   ```

## Verification Checklist

- [ ] All packages install successfully
- [ ] Shared package builds without errors
- [ ] API server starts and responds to health checks
- [ ] Web client builds and loads in browser
- [ ] API communication works between client and server
- [ ] All tests pass
- [ ] Documentation is updated
- [ ] CI/CD pipelines work with new structure

## Post-Migration Tasks

1. Update README.md with new structure
2. Update deployment scripts
3. Train team on new development workflow
4. Monitor for any missed imports or references
5. Consider removing archived directories after validation period

## Support

If you encounter issues during migration:
1. Check the package-specific README files
2. Verify import paths and aliases
3. Ensure all dependencies are installed
4. Check for circular dependencies
5. Create an issue with specific error messages
