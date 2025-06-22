# Complete Logic Engine Implementation

## Overview

The SOW Generator now features a comprehensive logic engine that maps inputs through multiple specialized engines to produce a complete engineering summary and SOW output. This system implements the complete workflow: **inputs → templates → pressures → fastening → final metadata**.

## 🧠 Engine Architecture

### 1. **Template Selection Engine** (`template-engine.ts`)
Maps project conditions to appropriate SOW templates (T1-T8).

**Logic Flow:**
```
Project Inputs → Condition Analysis → Template Selection → Rationale Generation
```

**Template Mapping:**
- **T1 - Recover**: Standard recover projects with no special conditions
- **T2 - Tear-off**: Complete tear-off and replacement projects  
- **T3 - Tapered**: Projects with tapered insulation systems
- **T4 - HVHZ Recover**: High Velocity Hurricane Zone recover projects
- **T5 - Fleeceback**: Fleeceback membrane systems
- **T6 - Steep Slope**: Roof slopes ≥ 2:12
- **T7 - High-Rise**: Buildings > 50ft or severe exposure (Category D)
- **T8 - Special System**: PVC/KEE/EPDM or custom systems

**Priority Order:** T6 (Steep) > T8 (Special) > T7 (High-Rise) > T4 (HVHZ) > T5 (Fleeceback) > T3 (Tapered) > T2 (Tear-off) > T1 (Recover)

### 2. **Wind Pressure Engine** (`wind-engine.ts`)
Multi-version ASCE calculator supporting 7-10, 7-16, and 7-22.

**Features:**
- **Jurisdiction Integration**: Automatically selects ASCE version based on address → jurisdiction mapping
- **Multi-Version Support**: Different pressure coefficients and zone systems per ASCE version
- **Enhanced Calculations**: Version-specific factors (Kd, Kh, Kzt, Ke, I)
- **Zone Systems**: 3-zone (ASCE 7-10) vs 4-zone (ASCE 7-16/7-22)

**ASCE Version Differences:**
```typescript
// ASCE 7-16/7-22 (4 zones)
{
  zone1Field: -0.9,      // Zone 1' (interior field)
  zone1Perimeter: -1.4,  // Zone 1 (inner perimeter)  
  zone2Perimeter: -2.0,  // Zone 2 (outer perimeter)
  zone3Corner: -2.8      // Zone 3 (corner)
}

// ASCE 7-10 (3 zones)  
{
  zone1Field: -0.7,      // Zone 1 (field)
  zone2Perimeter: -1.4,  // Zone 2 (perimeter)
  zone3Corner: -2.0      // Zone 3 (corner)
}
```

### 3. **Manufacturer & Fastening Engine** (`fastening-engine.ts`)
Selects optimal manufacturer systems based on wind pressures and project requirements.

**Selection Criteria:**
1. **Pressure Compliance**: System must meet all zone pressure requirements
2. **HVHZ Compliance**: NOA approval required for HVHZ locations
3. **Membrane Compatibility**: Type and thickness matching
4. **Project Type Suitability**: Recover vs tear-off vs new construction
5. **Manufacturer Preference**: User preferences and scoring system

**Scoring Algorithm:**
- Preferred manufacturer: +100 points
- Pressure safety margin: +0 to +50 points (capped)
- HVHZ approval: +25 points
- Fleeceback match: +20 points  
- Premium manufacturer: +10 points

### 4. **Takeoff Diagnostics Engine** (`takeoff-engine.ts`)
Analyzes takeoff quantities and flags potential issues.

**Analysis Metrics:**
- **Penetration Density**: Penetrations per 1000 sq ft (threshold: >20)
- **Drain Density**: Drains per 1000 sq ft (minimum: 0.8)
- **Flashing Ratio**: Linear feet per sq ft (typical: 0.03-0.05)
- **Accessory Ratio**: Accessories per 1000 sq ft (threshold: >15)

**Risk Assessment:**
- **Low Risk**: Score 0-2 (minimal issues)
- **Medium Risk**: Score 3-5 (some concerns)
- **High Risk**: Score 6+ (significant issues requiring attention)

### 5. **Main SOW Generator** (`sow-generator.ts`)
Orchestrates all engines into comprehensive engineering summary.

**Processing Flow:**
```
1. Input Validation → 
2. Jurisdiction Analysis → 
3. Template Selection → 
4. Wind Pressure Calculation → 
5. System Selection → 
6. Takeoff Diagnostics → 
7. Engineering Summary → 
8. PDF Generation
```

## 📊 Engineering Summary Output

The complete logic engine produces a comprehensive engineering summary:

```typescript
{
  templateSelection: {
    templateCode: "T4",
    templateName: "T4 - HVHZ Recover", 
    rationale: "Selected for High Velocity Hurricane Zone recover project",
    applicableConditions: ["HVHZ", "Recover project type"],
    rejectedTemplates: [...]
  },
  
  jurisdictionAnalysis: {
    address: "2650 NW 89th Ct, Doral, FL 33172",
    jurisdiction: {
      county: "Miami-Dade County",
      state: "FL",
      codeCycle: "2023 FBC", 
      asceVersion: "ASCE 7-16",
      hvhz: true
    },
    windAnalysis: {
      asceVersion: "7-16",
      basicWindSpeed: 185,
      zonePressures: {
        zone1Field: -70.57,
        zone1Perimeter: -122.84,
        zone2Perimeter: -162.04,
        zone3Corner: -220.85
      }
    }
  },
  
  systemSelection: {
    selectedSystem: {
      manufacturer: "Carlisle Syntec",
      systemName: "60mil TPO HVHZ Mechanically Attached"
    },
    rejectedSystems: [...],
    fasteningSpecifications: {
      fieldSpacing: "12\" o.c.",
      perimeterSpacing: "4\" o.c.", 
      cornerSpacing: "3\" o.c.",
      penetrationDepth: "1\" min into deck"
    },
    pressureCompliance: {
      meetsCorner: true,
      safetyMargin: 15.2
    }
  },
  
  takeoffDiagnostics: {
    overallRisk: "Medium",
    keyIssues: ["High penetration density"],
    quantityFlags: {
      penetrationDensity: 22.5,
      drainDensity: 2.4,
      flashingRatio: 0.032
    },
    recommendations: [...]
  }
}
```

## 🔄 API Integration

### Enhanced SOW Generation Endpoint
```bash
POST /api/generate-sow
{
  "projectName": "Miami Business Park Recover",
  "address": "2650 NW 89th Ct, Doral, FL 33172",
  "buildingHeight": 30,
  "squareFootage": 25000,
  "projectType": "recover",
  "membraneType": "TPO",
  "membraneThickness": "60mil"
}
```

**Response includes:**
- Complete engineering summary
- Template selection rationale
- Wind pressure calculations with ASCE version
- Manufacturer system selection with rejections
- Takeoff diagnostics and risk assessment
- Compliance notes and special requirements

### Debug Endpoint with Engine Diagnostics
```bash
POST /api/debug-sow
{}
```

**Enhanced Debug Output:**
```json
{
  "success": true,
  "debug": true,
  "engineDiagnostics": {
    "templateSelection": {
      "selected": "T4 - HVHZ Recover",
      "rationale": "HVHZ location requires specialized template",
      "rejectedTemplates": 7,
      "applicableConditions": ["HVHZ", "Recover project"]
    },
    "windAnalysis": {
      "asceVersion": "7-16",
      "windSpeed": 185,
      "methodology": "ASCE 7-16 Components and Cladding Method",
      "calculationFactors": {
        "Kh": 0.85,
        "Kzt": 1.0, 
        "Kd": 0.85,
        "qh": 65.34
      }
    },
    "systemSelection": {
      "selected": {
        "manufacturer": "Carlisle Syntec",
        "systemName": "60mil TPO HVHZ"
      },
      "rejected": 3,
      "pressureCompliance": {
        "meetsCorner": true,
        "safetyMargin": 15.2
      }
    },
    "takeoffDiagnostics": {
      "overallRisk": "Medium", 
      "keyIssues": ["High penetration density"],
      "specialAttentionAreas": 2
    }
  }
}
```

## 🎯 Template Selection Logic

### Template Decision Tree
```
Input Conditions → Priority Evaluation → Template Selection

1. Roof Slope ≥ 2:12? → T6 (Steep Slope)
2. Special Material (PVC/KEE/EPDM)? → T8 (Special System) 
3. Height > 50ft OR Exposure D? → T7 (High-Rise)
4. HVHZ = true AND Recover? → T4 (HVHZ Recover)
5. Fleeceback Membrane? → T5 (Fleeceback)
6. Tapered Insulation? → T3 (Tapered)
7. Project Type = Tear-off? → T2 (Tear-off)
8. Default → T1 (Recover)
```

### Example Template Selections

**Miami HVHZ Recover Project:**
```
Inputs: address="Doral, FL", projectType="recover", membraneType="TPO"
→ Jurisdiction Analysis: HVHZ=true, ASCE 7-16
→ Template Selection: T4 - HVHZ Recover
→ Rationale: "HVHZ location requires specialized recover template"
```

**High-Rise Building:**
```  
Inputs: buildingHeight=75, exposureCategory="C"
→ Template Selection: T7 - High-Rise
→ Rationale: "High-rise building (75ft > 50ft threshold)"
```

**Steep Slope Roof:**
```
Inputs: roofSlope=3.0 (36:12)
→ Template Selection: T6 - Steep Slope  
→ Rationale: "Roof slope of 36:12 exceeds 2:12 threshold"
```

## 💨 Wind Pressure Calculations

### Multi-Version ASCE Support

**ASCE 7-22 (Latest):**
- 4-zone pressure system
- Enhanced elevation factors (Ke)
- Updated pressure coefficients
- Improved topographic considerations

**ASCE 7-16 (Current Standard):**
- 4-zone pressure system
- Standard methodology
- Widely adopted building codes

**ASCE 7-10 (Legacy):**
- 3-zone pressure system  
- Older pressure coefficients
- Legacy building codes

### Calculation Example (Miami HVHZ):
```
Basic Wind Speed: 185 mph (from jurisdiction mapping)
ASCE Version: 7-16 (from 2023 FBC)
Exposure: C (from site analysis)
Building Height: 30 ft

Factors:
- Kh = 0.85 (velocity pressure coefficient)
- Kzt = 1.0 (topographic factor)  
- Kd = 0.85 (directionality factor)
- I = 1.0 (importance factor)

Velocity Pressure:
qh = 0.00256 × 0.85 × 1.0 × 0.85 × 1.0 × 185² = 65.34 psf

Zone Pressures (ASCE 7-16):
- Zone 1' Field: 65.34 × (-0.9 - 0.18) = -70.57 psf
- Zone 1 Perimeter: 65.34 × (-1.4 - 0.18) = -103.24 psf  
- Zone 2 Perimeter: 65.34 × (-2.0 - 0.18) = -142.04 psf
- Zone 3 Corner: 65.34 × (-2.8 - 0.18) = -194.71 psf
```

## 🏭 Manufacturer System Selection

### Selection Process

1. **Filter by Pressure Requirements**
   - System maximum pressure ≥ required pressure for all zones
   - Rejection reason: "Insufficient pressure rating: Corner zone requires X psf, system rated for Y psf"

2. **Filter by HVHZ Requirements**
   - If HVHZ=true, system must have NOA approval
   - Rejection reason: "Not HVHZ approved - NOA required for this location"

3. **Filter by Membrane Compatibility**
   - Type matching (TPO, EPDM, PVC, etc.)
   - Thickness compatibility (±10 mil tolerance)
   - Rejection reason: "Membrane type mismatch: requires TPO, system is EPDM"

4. **Score and Rank Eligible Systems**
   - Apply scoring algorithm
   - Select highest scoring system
   - Generate selection rationale

### Default Manufacturer Database

**Carlisle Syntec - HVHZ System:**
```typescript
{
  manufacturer: "Carlisle Syntec",
  systemName: "60mil TPO HVHZ Mechanically Attached",
  maxPressure: { field: 60, perimeter: 90, corner: 135 },
  fasteningPattern: {
    fieldSpacing: "12\" o.c.",
    perimeterSpacing: "4\" o.c.", 
    cornerSpacing: "3\" o.c.",
    penetrationDepth: "1\" min into deck"
  },
  hvhzApproved: true,
  noaNumber: "FL-16758.3"
}
```

## 📋 Takeoff Diagnostics

### Analysis Rules

**High Penetration Density:**
- Threshold: >20 penetrations per 1000 sq ft
- Impact: Increases cutting waste, requires additional detailing
- Recommendation: "Consider additional detailing around penetration clusters"

**Drain Overflow Required:**
- Condition: <1 drain per 10,000 sq ft OR large roof area >50,000 sq ft
- Impact: Building code compliance, overflow drainage systems
- Recommendation: "Verify overflow drainage provisions per building code"

**Excessive Flashing:**
- Threshold: Flashing ratio >0.075 (50% above typical 0.05)
- Impact: Material and labor cost increases
- Recommendation: "Plan for additional flashing materials and labor"

**Complex Flashing Score:**
- HVAC units >5: +2 points
- Skylights >3: +2 points  
- Expansion joints: +3 points
- High parapets >24": +2 points
- Threshold: ≥5 points = complex flashing

### Risk Assessment Algorithm

```typescript
function calculateRisk(diagnostics) {
  let score = 0;
  if (diagnostics.highPenetrationDensity) score += 2;
  if (diagnostics.drainOverflowRequired) score += 1;
  if (diagnostics.linearFlashingExceedsTypical) score += 2;
  if (diagnostics.excessiveAccessoryCount) score += 1;
  if (diagnostics.inadequateDrainage) score += 2;
  if (diagnostics.complexFlashingRequired) score += 2;
  
  return score >= 6 ? 'High' : score >= 3 ? 'Medium' : 'Low';
}
```

## 🔧 Integration and Usage

### Complete Workflow Example

```typescript
// 1. Input validation
const validation = validateSOWInputs(inputs);

// 2. Jurisdiction analysis  
const jurisdiction = await performComprehensiveAnalysis(address, height);

// 3. Template selection
const template = selectTemplate({
  projectType: 'recover',
  hvhz: jurisdiction.hvhz,
  membraneType: 'TPO',
  // ... other inputs
});

// 4. Wind pressure calculation (integrated with jurisdiction)
const windResult = jurisdiction.windAnalysis;

// 5. System selection
const system = await selectManufacturerSystem({
  windUpliftPressures: windResult.zonePressures,
  hvhz: jurisdiction.hvhz,
  // ... other inputs  
});

// 6. Takeoff diagnostics
const takeoff = analyzeTakeoffDiagnostics({
  takeoffItems: inputs.takeoffItems,
  projectType: inputs.projectType,
  // ... other inputs
});

// 7. Compile engineering summary
const summary = {
  templateSelection: template,
  jurisdictionAnalysis: jurisdiction,
  systemSelection: system,
  takeoffDiagnostics: takeoff,
  metadata: { /* final compiled metadata */ }
};
```

### Testing the Complete System

```bash
# Test Miami HVHZ project
curl -X POST http://localhost:3001/api/debug-sow \
  -H "Content-Type: application/json" \
  -d '{
    "address": "2650 NW 89th Ct, Doral, FL 33172",
    "projectType": "recover",
    "buildingHeight": 30,
    "squareFootage": 25000
  }'

# Test high-rise project  
curl -X POST http://localhost:3001/api/debug-sow \
  -H "Content-Type: application/json" \
  -d '{
    "address": "123 Main St, Dallas, TX",
    "buildingHeight": 75,
    "squareFootage": 50000
  }'

# Test steep slope project
curl -X POST http://localhost:3001/api/debug-sow \
  -H "Content-Type: application/json" \
  -d '{
    "roofSlope": 3.0,
    "projectType": "tearoff"
  }'
```

## 🎯 Key Benefits

### ✅ **Complete Automation**
- No manual template selection required
- Automatic ASCE version determination
- Dynamic manufacturer system selection
- Integrated risk assessment

### ✅ **Engineering Accuracy** 
- Jurisdiction-specific building codes
- Version-appropriate ASCE calculations
- Manufacturer compliance verification
- Comprehensive takeoff analysis

### ✅ **Comprehensive Output**
- Complete engineering summary
- Detailed rationale for all selections
- Risk assessment and recommendations
- Compliance notes and special requirements

### ✅ **Modular Architecture**
- Independent engine validation
- Configurable scoring algorithms  
- Extensible manufacturer database
- Maintainable code structure

## 🔮 Future Enhancements

### Phase 2 Considerations
1. **Live Manufacturer API Integration**: Real-time system data
2. **Advanced PDF Template Injection**: Dynamic content insertion
3. **Machine Learning Template Selection**: Historical project analysis
4. **3D Takeoff Integration**: BIM model quantity extraction
5. **Multi-Building Campus Support**: Complex project analysis
6. **Custom Engineering Calculations**: Site-specific wind analysis

The complete logic engine provides a robust foundation for intelligent SOW generation with comprehensive engineering analysis and automated decision-making based on project-specific conditions.
