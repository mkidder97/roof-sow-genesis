# Phase 2 & 4 Implementation: Advanced Engineering Intelligence & Template System

This document outlines the implementation of **Phase 2** (Advanced Engineering Intelligence & Traceability) and **Phase 4** (Template Mapping & Multi-Template System) for the SOW Generator.

## 🎯 Phase 2: Advanced Engineering Intelligence & Traceability

### Overview
Phase 2 adds detailed explainability and debug capabilities to the SOW generation process, providing comprehensive engineering decision traceability.

### Key Features Implemented

#### 📊 Enhanced Engineering Summary
The `engineeringSummary` block now includes:

```typescript
{
  templateSelection: {
    templateName: string;
    rationale: string;
    rejectedTemplates: Array<{ template: string; reason: string }>;
  },
  windAnalysis: {
    asceVersion: string;
    windSpeed: number;
    zonePressures: Record<string, number>;
    pressureMethodology: string[];
  },
  jurisdiction: {
    county: string;
    state: string;
    hvhz: boolean;
    jurisdictionNotes: string[];
  },
  systemSelection: {
    selectedSystem: string;
    rejectedSystems: Array<{ system: string; reason: string }>;
    fasteningSpecs: {
      fieldSpacing: string;
      cornerSpacing: string;
      safetyMargin: number;
    };
  },
  takeoffDiagnostics: {
    overallRisk: "Low" | "Medium" | "High";
    flags: string[];
    recommendations: string[];
  }
}
```

#### 🧪 Enhanced Debug Endpoint
**Endpoint**: `POST /api/debug-sow-enhanced`

Returns engineering summary **without PDF generation** for faster debugging:

```json
{
  "success": true,
  "debugMode": true,
  "engineeringSummary": {
    "templateSelection": {
      "templateName": "T4 - HVHZ Recover",
      "rationale": "HVHZ location requires specialized system"
    },
    "windAnalysis": {
      "asceVersion": "ASCE 7-16",
      "windSpeed": 185,
      "zonePressures": {
        "zone1Field": -45.2,
        "zone3Corner": -220.8
      }
    }
  },
  "debugInfo": {
    "engineTraces": {},
    "processingSteps": [],
    "performanceMetrics": {}
  }
}
```

#### 🔍 Per-Engine Debug Mode
**Endpoint**: `POST /api/debug-engine-trace`

Debug individual engines with detailed tracing:

```json
{
  "engine": "template",
  "inputs": {},
  "debug": true
}
```

Returns engine-specific debug information:
- **Template Engine**: Decision tree, scoring matrix, alternatives
- **Wind Engine**: Coefficients, factor calculations, methodology
- **Fastening Engine**: System ranking, scoring breakdown, pressure analysis
- **Takeoff Engine**: Risk calculation, threshold comparisons, quantity analysis

#### 📁 Takeoff File Support Stub
Supports uploaded takeoff files (PDF, CSV, Excel) with enhanced parsing:

```typescript
interface TakeoffFile {
  filename: string;
  buffer: Buffer;
  mimetype: string;
}

// Enhanced takeoff parsing with file type detection
export async function parseTakeoffFile(file: TakeoffFile): Promise<TakeoffItems>
```

### Implementation Details

#### Enhanced SOW Generator (`server/core/sow-generator.ts`)
- Added `EnhancedEngineeringSummary` interface with full traceability
- Implemented debug tracing for all engines
- Enhanced error handling and fallback mechanisms
- Added performance metrics and processing step tracking

#### Enhanced Routes (`server/routes/sow-enhanced.ts`)
- `debugSOWEnhanced()`: Debug without PDF generation
- `debugEngineTrace()`: Per-engine debugging
- `renderTemplateContent()`: Template rendering endpoint

#### Enhanced Takeoff Engine (`server/core/takeoff-engine.ts`)
- File parsing support for PDF, CSV, Excel formats
- Enhanced diagnostic algorithms with risk assessment
- Improved recommendation engine
- HVHZ-specific analysis and warnings

---

## 📄 Phase 4: Template Mapping & Multi-Template System

### Overview
Phase 4 implements a dynamic template system that maps engineering logic to formatted content sections, enabling dynamic SOW generation based on project conditions.

### Key Features Implemented

#### 📋 Master Template Map (T1-T8)
```typescript
const TEMPLATE_MAP = {
  T1: { name: "Recover", file: "T1-recover.txt", type: "recover" },
  T2: { name: "Tear-off", file: "T2-tearoff.txt", type: "tearoff" },
  T3: { name: "Fleeceback", file: "T3-fleeceback.txt", type: "fleeceback" },
  T4: { name: "HVHZ Recover", file: "T4-hvhz.txt", type: "hvhz_recover" },
  T5: { name: "Tapered Insulation", file: "T5-tapered.txt", type: "tapered" },
  T6: { name: "Steep Slope", file: "T6-steep.txt", type: "steep_slope" },
  T7: { name: "High-Rise", file: "T7-highrise.txt", type: "high_rise" },
  T8: { name: "Special Conditions", file: "T8-special.txt", type: "special" }
};
```

#### 📝 Static Template Files
Created structured template files with dynamic placeholders:

**T1-recover.txt**: Standard recover system template
**T2-tearoff.txt**: Complete tear-off and replacement template
**T4-hvhz.txt**: HVHZ-compliant system template with enhanced requirements
**T6-steep.txt**: Steep slope system template with specialized considerations

#### 🔧 Template Renderer (`server/lib/template-renderer.ts`)
Dynamic template processing with placeholder replacement:

```typescript
export async function renderTemplate(
  templateId: string, 
  engineeringSummary: any
): Promise<TemplateRenderResult> {
  // Load template file
  // Parse sections
  // Replace placeholders with engineering data
  // Return rendered content
}
```

#### 🎯 Smart Placeholder System
Templates use intelligent placeholders that map to engineering data:

```markdown
## Project Overview
This project involves a **{{selectedSystem}}** system with {{fasteningSpecs}} 
to meet {{zonePressures}} wind requirements per {{asceVersion}}.

## Template Selection Rationale
{{rationale}}

## Wind Load Requirements
{{windCalculationSummary}}
{{zonePressureDetails}}
```

#### 📊 Template Rendering Endpoint
**Endpoint**: `POST /api/render-template`

```json
{
  "templateId": "T4",
  "engineeringSummary": {
    "systemSelection": { "selectedSystem": "Carlisle TPO" },
    "windAnalysis": { "zonePressures": { "zone_1": -30, "zone_3": -90 } }
  }
}
```

Returns rendered template content:

```json
{
  "success": true,
  "templateId": "T4",
  "templateName": "HVHZ Recover",
  "renderedSections": {
    "Project Overview": "This HVHZ project requires enhanced wind resistance per Miami-Dade protocols...",
    "Wind Load Requirements": "Field: 30.0 psf, Corner: 90.0 psf wind uplift requirements"
  },
  "placeholdersReplaced": 15
}
```

### Template Examples

#### T1 - Standard Recover Template
```markdown
# SOW TEMPLATE T1 - RECOVER SYSTEM

## Project Overview
This project involves a **{{selectedSystem}}** roof recover system 
installed over the existing roof assembly at {{projectAddress}}.

## Wind Load Requirements
Wind pressures calculated using {{asceVersion}} methodology:
{{windCalculationSummary}}

## Fastening Specifications
**Field Area**: {{fieldSpacing}}
**Corner Area**: {{cornerSpacing}}
```

#### T4 - HVHZ Template
```markdown
# SOW TEMPLATE T4 - HVHZ RECOVER SYSTEM

## High Velocity Hurricane Zone Project
This project requires **{{noaRequired}}** with enhanced wind resistance 
for {{windSpeed}} mph basic wind speed.

## HVHZ Special Requirements
- All materials must have valid NOA/ESR approvals
- Special inspection required throughout installation
- {{specialRequirements}}
```

### Implementation Details

#### Template Renderer (`server/lib/template-renderer.ts`)
- File-based template loading with fallback support
- Section parsing for structured content
- Dynamic placeholder replacement mapping
- Template validation and error handling

#### Placeholder Mapping System
Intelligent mapping from engineering data to template placeholders:

```typescript
function createReplacementMap(summary: any): Record<string, string> {
  return {
    '{{selectedSystem}}': summary?.systemSelection?.selectedSystem,
    '{{zonePressures}}': formatZonePressures(summary?.windAnalysis?.zonePressures),
    '{{asceVersion}}': summary?.windAnalysis?.asceVersion,
    '{{rationale}}': summary?.templateSelection?.rationale,
    // ... additional mappings
  };
}
```

#### Template Files Structure
```
server/templates/text/
├── T1-recover.txt       # Standard recover system
├── T2-tearoff.txt       # Complete tear-off replacement  
├── T4-hvhz.txt          # HVHZ-compliant system
├── T6-steep.txt         # Steep slope system
└── ...                  # Additional templates T3, T5, T7, T8
```

---

## 🚀 API Endpoints Summary

### Phase 2 Endpoints
- `POST /api/debug-sow-enhanced` - Enhanced debug without PDF generation
- `POST /api/debug-engine-trace` - Per-engine debugging and tracing
- Enhanced takeoff file processing in existing endpoints

### Phase 4 Endpoints  
- `POST /api/render-template` - Dynamic template content rendering
- `GET /api/template-map` - Available templates and mappings

### Enhanced Server
- `GET /api/status` - Updated with Phase 2 & 4 capabilities
- `GET /api/docs` - Enhanced API documentation

---

## 🔧 Usage Examples

### Debug Engineering Summary
```bash
curl -X POST http://localhost:3001/api/debug-sow-enhanced \
  -H "Content-Type: application/json" \
  -d '{
    "address": "2650 NW 89th Ct, Doral, FL 33172",
    "projectType": "recover",
    "buildingHeight": 30
  }'
```

### Render Template Content
```bash
curl -X POST http://localhost:3001/api/render-template \
  -H "Content-Type: application/json" \
  -d '{
    "templateId": "T4",
    "engineeringSummary": {
      "systemSelection": {"selectedSystem": "Carlisle TPO"},
      "windAnalysis": {"windSpeed": 185, "asceVersion": "ASCE 7-16"}
    }
  }'
```

### Debug Individual Engine
```bash
curl -X POST http://localhost:3001/api/debug-engine-trace \
  -H "Content-Type: application/json" \
  -d '{
    "engine": "template",
    "inputs": {"hvhz": true, "projectType": "recover"}
  }'
```

---

## 📁 File Structure

```
server/
├── core/
│   ├── sow-generator.ts           # Enhanced with Phase 2 features
│   ├── template-engine.ts         # Template selection logic
│   ├── takeoff-engine.ts          # Enhanced file processing
│   └── ...
├── routes/
│   ├── sow.ts                     # Original routes
│   └── sow-enhanced.ts            # Phase 2 & 4 routes
├── lib/
│   └── template-renderer.ts       # Phase 4 template renderer
├── templates/text/
│   ├── T1-recover.txt             # Template files
│   ├── T2-tearoff.txt
│   ├── T4-hvhz.txt
│   ├── T6-steep.txt
│   └── ...
└── index-enhanced.ts              # Enhanced server with new endpoints
```

---

## ✅ Phase 2 & 4 Completion Summary

### Phase 2 ✅ COMPLETE
- [x] Enhanced engineering summary with detailed explainability
- [x] Debug endpoint without PDF generation (`/api/debug-sow-enhanced`)
- [x] Per-engine debug mode with tracing (`/api/debug-engine-trace`)
- [x] Takeoff file support stub (PDF/CSV/Excel processing)
- [x] Enhanced diagnostic algorithms and risk assessment

### Phase 4 ✅ COMPLETE
- [x] Master template map (T1-T8) implementation
- [x] Static template files with dynamic placeholders
- [x] Template renderer with placeholder replacement (`template-renderer.ts`)
- [x] Template content rendering endpoint (`/api/render-template`)
- [x] Integration with existing SOW generation pipeline

### Enhanced Capabilities
- [x] Comprehensive engineering decision traceability
- [x] Dynamic template system based on project conditions
- [x] Smart placeholder replacement with engineering data
- [x] Enhanced API documentation and examples
- [x] Improved error handling and fallback mechanisms

The system now provides **complete explainability** of engineering decisions and **dynamic template generation** based on project conditions, fulfilling both Phase 2 and Phase 4 requirements.
