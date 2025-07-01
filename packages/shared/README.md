# @roof-sow-genesis/shared

This package contains shared types, interfaces, utilities, and constants used by both the frontend (`web-client`) and backend (`api-server`) components of the roof SOW generation system.

## Overview

The shared package promotes code reuse, consistency, and maintainability by centralizing common functionality that both frontend and backend need access to. This includes TypeScript types, utility functions, validation logic, and business logic constants.

## Package Structure

```
src/
├── constants/          # Shared constants and enums
├── types/             # TypeScript type definitions
│   ├── api.ts         # API request/response types
│   ├── engineering.ts # Engineering and wind analysis types
│   ├── fieldInspection.ts # Field inspection data types
│   ├── roofing.ts     # Roofing system and material types
│   └── sow.ts         # SOW generation types
└── utils/             # Shared utility functions
    ├── fieldInspection.ts # Field inspection utilities
    ├── jurisdiction.ts    # Jurisdiction analysis utilities
    ├── sow.ts            # SOW generation utilities
    ├── validation.ts     # Common validation functions
    ├── windAnalysis.ts   # Wind analysis calculations
    └── index.ts          # General utility functions
```

## Key Features

### 📋 Type Definitions
- **API Types**: Request/response interfaces for all API endpoints
- **Engineering Types**: Wind analysis, ASCE requirements, and calculations
- **Field Inspection Types**: Data models for roof inspections and findings
- **Roofing Types**: Material specifications, systems, and manufacturer data
- **SOW Types**: Project metadata, environmental conditions, and generation parameters

### 🔧 Utility Functions
- **Wind Analysis**: ASCE 7 wind load calculations and pressure coefficients
- **Jurisdiction Analysis**: Building code mapping, HVHZ detection, compliance validation
- **Field Inspection**: Data processing, validation, and SOW integration
- **Validation**: Common validation patterns for forms and data
- **General Utilities**: Date formatting, string manipulation, file handling

### 🏗️ Business Logic
- **Wind Speed Mapping**: Geographic wind speed determination
- **Code Cycle Management**: Building code version mapping by jurisdiction
- **HVHZ Detection**: High Velocity Hurricane Zone identification
- **Pressure Calculations**: Zone-based wind pressure calculations per ASCE standards

## Usage

### Installing the Package

The shared package is automatically linked in the monorepo. Both `web-client` and `api-server` include it as a dependency:

```json
{
  "dependencies": {
    "@roof-sow-genesis/shared": "*"
  }
}
```

### Importing Types

```typescript
import { 
  FieldInspection, 
  SOWGenerationRequest, 
  WindAnalysisParams,
  HealthCheckResponse 
} from '@roof-sow-genesis/shared';
```

### Using Utilities

```typescript
import { 
  getBasicWindSpeed,
  validateJurisdictionCompliance,
  formatDate,
  isValidEmail 
} from '@roof-sow-genesis/shared';

// Wind analysis
const windSpeed = getBasicWindSpeed(25.7617, -80.1918);

// Jurisdiction validation
const compliance = validateJurisdictionCompliance(jurisdictionInfo, projectRequirements);

// General utilities
const formattedDate = formatDate(new Date(), 'long');
const isValidUserEmail = isValidEmail('user@example.com');
```

### Wind Analysis Example

```typescript
import { 
  calculateVelocityPressure,
  calculateZonePressures,
  getStandardWindPressureCoefficients 
} from '@roof-sow-genesis/shared';

const qh = calculateVelocityPressure(
  180, // wind speed
  30,  // building height
  'C', // exposure category
  0,   // elevation
  '7-16', // ASCE version
  1.0  // importance factor
);

const GCp = getStandardWindPressureCoefficients('7-16');
const zonePressures = calculateZonePressures(qh, GCp, '7-16');
```

### Jurisdiction Analysis Example

```typescript
import { 
  parseAddress,
  isHVHZLocation,
  getWindSpeedForLocation,
  validateJurisdictionCompliance 
} from '@roof-sow-genesis/shared';

const address = "123 Main St, Miami, FL 33101";
const components = parseAddress(address);
const isHVHZ = isHVHZLocation(25.7617, -80.1918);
const windSpeed = getWindSpeedForLocation(25.7617, -80.1918, '7-16');

const jurisdictionInfo = {
  county: components.city,
  state: components.state,
  codeCycle: '2020',
  asceVersion: '7-16' as const,
  hvhz: isHVHZ,
  windSpeed
};

const compliance = validateJurisdictionCompliance(jurisdictionInfo, {
  hvhzRequired: true,
  windUpliftPressure: 90
});
```

## Development

### Building the Package

```bash
npm run build
```

### Type Checking

```bash
npm run type-check
```

### Adding New Shared Code

When adding new types, utilities, or constants:

1. **Add the code** to the appropriate file in `src/`
2. **Export from index.ts** to make it available for import
3. **Update this README** with usage examples
4. **Update imports** in `web-client` and `api-server` to use the shared version
5. **Remove duplicated code** from the individual packages

### Guidelines

- **Pure Functions**: Utilities should be pure functions without side effects
- **Type Safety**: All functions should have proper TypeScript types
- **Documentation**: Include JSDoc comments for complex functions
- **Testing**: Consider adding unit tests for critical business logic
- **Dependencies**: Minimize external dependencies to reduce bundle size

## Migration Notes

This package was created by extracting common code from both frontend and backend:

- **Types**: Consolidated duplicate type definitions
- **Utilities**: Moved pure functions that both sides need
- **Constants**: Centralized business logic constants
- **Validation**: Unified validation patterns

Both `web-client` and `api-server` now import from this shared package instead of maintaining duplicate code.

## Dependencies

The shared package has minimal dependencies to keep it lightweight:

- **TypeScript**: For type definitions
- **No runtime dependencies**: Pure TypeScript/JavaScript utilities

## Versioning

The shared package version should be incremented when:

- **Major**: Breaking changes to public APIs
- **Minor**: New features or types added
- **Patch**: Bug fixes or internal improvements

Both `web-client` and `api-server` should be updated to use the latest shared package version when changes are made.
