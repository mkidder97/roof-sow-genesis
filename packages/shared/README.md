# Shared Package

Common types, DTOs, and utilities shared between web-client and api-server packages.

## Overview

This package contains TypeScript interfaces, utility functions, and constants that are used by both the frontend and backend. It helps maintain consistency and reduces code duplication across the monorepo.

## Structure

```
packages/shared/
├── src/
│   ├── types/         # TypeScript interfaces and types
│   ├── utils/         # Utility functions
│   ├── constants/     # Application constants
│   └── index.ts       # Main exports
├── dist/             # Compiled JavaScript (generated)
└── package.json      # Dependencies and scripts
```

## Migration Plan

The following files should be moved from the current locations to this package:

### From `/src/types/` → `/packages/shared/src/types/`
- `src/types/asceRequirements.ts` → `packages/shared/src/types/asceRequirements.ts`
- `src/types/engineering.ts` → `packages/shared/src/types/engineering.ts`
- `src/types/fieldInspection.ts` → `packages/shared/src/types/fieldInspection.ts`
- `src/types/roofingTypes.ts` → `packages/shared/src/types/roofingTypes.ts`
- `src/types/sow.ts` → `packages/shared/src/types/sow.ts`
- `src/types/sowGeneration.ts` → `packages/shared/src/types/sowGeneration.ts`

### From `/utils/` → `/packages/shared/src/utils/`
- `utils/` (root utilities) → `packages/shared/src/utils/`
- Any other utility functions from `src/lib/` that are shared

### From `/server/types/` → `/packages/shared/src/types/`
- Server-specific types that are also used by the client
- DTOs (Data Transfer Objects) for API communication

### Constants and Enums
- Extract hardcoded constants from both packages
- ASCE parameters and lookup tables
- API endpoint definitions
- Status enums and configuration values

## Usage

### In Web Client
```typescript
import { ProjectData, SOWGenerationRequest } from '@roof-sow-genesis/shared';
import { formatCurrency, debounce } from '@roof-sow-genesis/shared/utils';
import { API_ENDPOINTS } from '@roof-sow-genesis/shared/constants';
```

### In API Server  
```typescript
import { SOWGenerationRequest, ASCERequirements } from '@roof-sow-genesis/shared';
import { validateEmail } from '@roof-sow-genesis/shared/utils';
import { BUILDING_CLASSIFICATIONS } from '@roof-sow-genesis/shared/constants';
```

## Development

```bash
# Build the shared package
cd packages/shared
npm run build

# Watch for changes during development
npm run dev
```

## Content Categories

### Types (`src/types/`)
- **Project Management**: ProjectData, FieldInspectionData
- **SOW Generation**: SOWGenerationRequest, SOWGenerationResult
- **Engineering**: ASCERequirements, WindLoadData
- **API Communication**: Request/Response DTOs

### Utils (`src/utils/`)
- **Formatting**: Currency, dates, text processing
- **Validation**: Email, form data, business rules
- **Helpers**: ID generation, debouncing, data transformation

### Constants (`src/constants/`)
- **API**: Endpoint URLs, HTTP methods
- **Business Rules**: Building classifications, roof types
- **Configuration**: Default values, limits, mappings

## Guidelines

1. **Pure Functions**: Utilities should be side-effect free
2. **No Dependencies**: Minimize external dependencies
3. **TypeScript First**: Everything should be strongly typed
4. **Documentation**: JSDoc comments for all public APIs
5. **Testing**: Unit tests for all utilities and type guards

## Dependencies

- **Zod**: Runtime type validation
- **TypeScript**: Type definitions and compilation
- Minimal external dependencies to keep the package lightweight
