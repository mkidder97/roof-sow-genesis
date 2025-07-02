# SOW Specification Document
## Single Source of Truth for SOW Generation Logic

**Version:** 1.0.0  
**Last Updated:** July 2, 2025  
**Status:** Active Specification  

---

## Table of Contents

1. [Engineering Calculations](#engineering-calculations)
2. [Product Approval Rules](#product-approval-rules)
3. [SOW Output Layout](#sow-output-layout)
4. [Business Logic Rules](#business-logic-rules)
5. [Validation Requirements](#validation-requirements)

---

## Engineering Calculations

### 1. Wind Load Analysis (ASCE 7)

#### 1.1 Basic Wind Speed Determination
**Formula:** Regional lookup based on coordinates
```
V = getBasicWindSpeed(latitude, longitude)
```
**Example Values:**
- Miami, FL (HVHZ): `V = 185 mph`
- Houston, TX: `V = 145 mph`
- Dallas, TX: `V = 115 mph`
- Atlanta, GA: `V = 120 mph`

#### 1.2 Velocity Pressure Calculation
**Formula:** 
```
qh = 0.00256 × Kh × Kzt × Kd × I × V²
```
**Variables:**
- `qh` = Velocity pressure (psf)
- `Kh` = Velocity pressure exposure coefficient
- `Kzt` = Topographic factor
- `Kd` = Directionality factor (0.85 for buildings)
- `I` = Importance factor (1.0 for normal buildings)
- `V` = Basic wind speed (mph)

**Example Calculation:**
```
Location: Miami, FL
V = 185 mph
Kh = 0.85 (Exposure C, 30ft height)
Kzt = 1.0 (flat terrain)
Kd = 0.85
I = 1.0

qh = 0.00256 × 0.85 × 1.0 × 0.85 × 1.0 × (185)²
qh = 0.00256 × 0.85 × 0.85 × 34,225
qh = 63.4 psf
```

#### 1.3 Exposure Category Determination
**Rules:**
- **Exposure D:** Within 1 mile of coastline with fetch over water ≥ 1 mile
- **Exposure B:** Urban areas with numerous closely spaced obstructions
- **Exposure C:** Open terrain with scattered obstructions (default)

**Velocity Pressure Coefficients (Kh):**
| Height (ft) | Exposure B | Exposure C | Exposure D |
|-------------|------------|------------|------------|
| 15-20       | 0.57       | 0.85       | 1.03       |
| 25          | 0.62       | 0.90       | 1.08       |
| 30          | 0.66       | 0.94       | 1.12       |
| 40          | 0.73       | 1.01       | 1.19       |
| 50          | 0.79       | 1.07       | 1.25       |

#### 1.4 Zone Pressure Calculations
**Formula:**
```
P = qh × (GCp - GCpi)
```
**Where:**
- `P` = Net pressure (psf, negative = uplift)
- `GCp` = External pressure coefficient
- `GCpi` = Internal pressure coefficient (0.18 for partially enclosed)

**ASCE 7-22 Pressure Coefficients:**
| Zone | Description | GCp |
|------|-------------|-----|
| 1'   | Interior Field | -0.90 |
| 1    | Edge/Perimeter | -1.70 |
| 2    | Corner/Perimeter | -2.30 |
| 3    | Corner | -3.20 |

**Example Zone Pressures (Miami, qh = 63.4 psf):**
```
Zone 1' (Field): P = 63.4 × (-0.90 - 0.18) = -68.5 psf
Zone 1 (Perimeter): P = 63.4 × (-1.70 - 0.18) = -119.2 psf
Zone 2 (Perimeter): P = 63.4 × (-2.30 - 0.18) = -157.2 psf
Zone 3 (Corner): P = 63.4 × (-3.20 - 0.18) = -214.3 psf
```

### 2. Membrane Attachment Calculations

#### 2.1 Fastener Spacing Formula
**Formula:**
```
Spacing = (MCRF × 144) / (Design_Pressure × Width_Factor × Rows)
```
**Where:**
- `MCRF` = Minimum Characteristic Resistance Force (lbf)
- `Design_Pressure` = Absolute value of zone pressure (psf)
- `Width_Factor` = Net membrane width factor
- `Rows` = Number of fastener rows in seam

**Example Calculation:**
```
MCRF = 285 lbf (standard HL fastener)
Design_Pressure = 214.3 psf (Zone 3)
Width_Factor = 114" (full width membrane, 6" side lap)
Rows = 1

Spacing = (285 × 144) / (214.3 × 114 × 1 / 144)
Spacing = 41,040 / 214.3
Spacing = 191.5" → Use 6" o.c. (maximum practical)
```

#### 2.2 Membrane Width Determination
**Standard Widths:**
- **Full Width:** 120" total, 114" net (6" side lap)
- **Reduced Width:** 76" total, 70" net (6" side lap)
- **Additional Reduced:** 57" total, 51" net (6" side lap)

#### 2.3 Fastener Pattern Requirements
**Zone-Based Patterns:**
```
Field Zone (Zone 1'): Full width membrane, calculated spacing
Perimeter Zone (Zone 1-2): Reduced width or closer spacing
Corner Zone (Zone 3): Additional reduced width, maximum fastening
```

### 3. Square Footage Calculations

#### 3.1 Roof Area Calculation
**Formula:**
```
Total_Area = Length × Width
Adjusted_Area = Total_Area × Waste_Factor
```
**Waste Factors:**
- Simple rectangular: 1.05 (5% waste)
- Complex geometry: 1.10 (10% waste)
- Highly complex: 1.15 (15% waste)

#### 3.2 Zone Area Calculations
**Perimeter Zone Width:**
- Standard: 10% of least horizontal dimension
- Minimum: 3 feet
- Maximum: 0.4 × least horizontal dimension

**Corner Zone Dimensions:**
- Each corner: Perimeter width × Perimeter width

---

## Product Approval Rules

### 1. Manufacturer Systems

#### 1.1 Johns Manville (JM)
**Approved Systems:**
- **TPO Single Ply:** FL16758.3-R35
- **EPDM Systems:** FL16758.2-R40
- **Modified Bitumen:** FL16758.1-R25

**Fastener Requirements:**
```
Fastener Type: HL Fasteners with plates
MCRF: 285 lbf minimum
Corrosion Resistance: 1000+ hour salt spray test
Installation: Factory-trained applicators required
```

**Membrane Specifications:**
```
TPO Thickness: 60 mil minimum (HVHZ), 45 mil standard
EPDM Thickness: 60 mil minimum
Seam Type: Hot-air welded (TPO), adhesive (EPDM)
Color Options: White, gray, tan (energy compliance)
```

#### 1.2 Carlisle SynTec
**Approved Systems:**
- **Sure-Weld TPO:** FL17825.1-R60
- **EPDM Membrane:** FL17825.2-R45
- **FleeceBACK:** FL17825.3-R35

**Fastener Specifications:**
```
Fastener Type: X-Treme HP fasteners
MCRF: 295 lbf minimum
Plates: 3" diameter minimum
Thread: #14 self-drilling
```

#### 1.3 GAF (formerly Siplast)
**Approved Systems:**
- **EverGuard TPO:** FL18552.1-R40
- **Liberty EPDM:** FL18552.2-R35
- **Ruberoid Modified:** FL18552.3-R30

**Installation Requirements:**
```
Membrane Overlap: 6" minimum side laps
Fastener Pattern: Per wind zone calculations
Adhesive: Contact cement for EPDM systems
Primer: Required for all seamed systems
```

### 2. Fastening Pattern Rules

#### 2.1 Standard Patterns by Zone
**Field Zone (Zone 1'):**
```
Membrane: Full width (114" net)
Fastener Spacing: Per calculation, 12" maximum
Pattern: Single row in lap seam
Plates: Standard 3" diameter
```

**Perimeter Zone (Zone 1-2):**
```
Membrane: Reduced width (70" net) or closer spacing
Fastener Spacing: Per calculation, 8" maximum
Pattern: Single or double row based on pressure
Plates: 3" diameter minimum
```

**Corner Zone (Zone 3):**
```
Membrane: Additional reduced width (51" net)
Fastener Spacing: 6" maximum, regardless of calculation
Pattern: Single row, may require double row
Plates: 3" diameter, may upgrade to 4"
```

#### 2.2 Fastener Specifications
**HL Fasteners (Standard):**
```
Thread: #14 self-drilling
Length: Deck thickness + 1.25"
Point: Self-drilling #3 or #4
Coating: Mechanically galvanized, 1000+ hour salt spray
MCRF: 285 lbf minimum in 22-gauge steel
```

**Plates:**
```
Material: Galvanized steel or stainless steel
Thickness: 0.032" minimum
Diameter: 3" standard, 4" for high loads
Finish: G90 galvanized or 316 stainless
```

### 3. Approval Documentation Requirements

#### 3.1 Florida Product Approval (FPA)
**Required Elements:**
```
FPA Number: Current and valid (FL#####.#-R##)
System Description: Complete assembly details
Wind Load Rating: Minimum design pressure capability
Installation Manual: Current revision referenced
Quality Assurance: Third-party testing verification
```

#### 3.2 Miami-Dade NOA
**Additional Requirements for HVHZ:**
```
NOA Number: Current Miami-Dade approval
Impact Resistance: Missile impact testing
Pressure Testing: ±150 psf minimum capability
Thermal Cycling: 50 cycles minimum
UV Exposure: 10,000 hours minimum
```

---

## SOW Output Layout

### 1. Project Header Section
```markdown
# SCOPE OF WORK
## Single-Ply Roofing System Replacement

**Project Information:**
- Project Name: {{PROJECT_NAME}}
- Project Address: {{PROJECT_ADDRESS}}
- Project City: {{PROJECT_CITY}}, {{PROJECT_STATE}} {{PROJECT_ZIP}}
- Date: {{CURRENT_DATE}}
- Prepared by: {{ENGINEER_NAME}}, P.E.
- Engineer License: {{PE_LICENSE_NUMBER}}

**Building Information:**
- Building Type: {{BUILDING_TYPE}}
- Roof Area: {{TOTAL_SQUARE_FOOTAGE}} square feet
- Building Height: {{BUILDING_HEIGHT}} feet
- Roof Slope: {{ROOF_SLOPE}}
- Existing System: {{EXISTING_SYSTEM_TYPE}}
```

### 2. Wind Analysis Section
```markdown
## WIND ANALYSIS

**Design Criteria:**
- Design Standard: {{ASCE_VERSION}}
- Basic Wind Speed: {{BASIC_WIND_SPEED}} mph
- Exposure Category: {{EXPOSURE_CATEGORY}}
- Building Height: {{BUILDING_HEIGHT}} feet
- Elevation: {{SITE_ELEVATION}} feet above sea level
- Importance Factor: {{IMPORTANCE_FACTOR}}

**Calculation Factors:**
- Velocity Pressure Coefficient (Kh): {{KH_VALUE}}
- Topographic Factor (Kzt): {{KZT_VALUE}}
- Directionality Factor (Kd): {{KD_VALUE}}
- Velocity Pressure (qh): {{QH_VALUE}} psf

**Zone Pressures (Components & Cladding):**
- Field Zone (Zone 1'): {{ZONE_1_PRIME_PRESSURE}} psf
- Perimeter Zone (Zone 1): {{ZONE_1_PRESSURE}} psf
- Perimeter Zone (Zone 2): {{ZONE_2_PRESSURE}} psf
- Corner Zone (Zone 3): {{ZONE_3_PRESSURE}} psf

*Note: All pressures are negative indicating uplift forces.*
```

### 3. Membrane System Section
```markdown
## MEMBRANE SYSTEM SPECIFICATION

**Manufacturer and Product:**
- Manufacturer: {{MANUFACTURER_NAME}}
- Product Line: {{PRODUCT_LINE}}
- Membrane Type: {{MEMBRANE_TYPE}}
- Membrane Thickness: {{MEMBRANE_THICKNESS}} mil
- Color: {{MEMBRANE_COLOR}}
- Florida Product Approval: {{FPA_NUMBER}}
{{#if HVHZ_REQUIRED}}
- Miami-Dade NOA: {{NOA_NUMBER}}
{{/if}}

**System Components:**
- Membrane: {{MEMBRANE_SPECIFICATION}}
- Fasteners: {{FASTENER_SPECIFICATION}}
- Plates: {{PLATE_SPECIFICATION}}
- Adhesives: {{ADHESIVE_SPECIFICATION}}
- Accessories: {{ACCESSORY_LIST}}
```

### 4. Attachment Specifications Section
```markdown
## MEMBRANE ATTACHMENT SPECIFICATIONS

**Fastener Information:**
- Fastener Type: {{FASTENER_TYPE}}
- Minimum Characteristic Resistance Force: {{MCRF_VALUE}} lbf
- Thread Size: {{THREAD_SIZE}}
- Fastener Length: {{FASTENER_LENGTH}}"
- Corrosion Protection: {{CORROSION_PROTECTION}}

**Plate Information:**
- Plate Type: {{PLATE_TYPE}}
- Plate Diameter: {{PLATE_DIAMETER}}"
- Plate Thickness: {{PLATE_THICKNESS}}"
- Material: {{PLATE_MATERIAL}}

**Attachment Pattern by Zone:**

**Field Zone (Zone 1'):**
- Design Pressure: {{ZONE_1_PRIME_PRESSURE}} psf
- Membrane Width: {{FIELD_MEMBRANE_WIDTH}}" net width
- Fastener Spacing: {{FIELD_FASTENER_SPACING}}" on center
- Fastener Rows: {{FIELD_FASTENER_ROWS}}

**Perimeter Zone (Zone 1-2):**
- Design Pressure: {{PERIMETER_PRESSURE}} psf
- Membrane Width: {{PERIMETER_MEMBRANE_WIDTH}}" net width
- Fastener Spacing: {{PERIMETER_FASTENER_SPACING}}" on center
- Fastener Rows: {{PERIMETER_FASTENER_ROWS}}

**Corner Zone (Zone 3):**
- Design Pressure: {{ZONE_3_PRESSURE}} psf
- Membrane Width: {{CORNER_MEMBRANE_WIDTH}}" net width
- Fastener Spacing: {{CORNER_FASTENER_SPACING}}" on center
- Fastener Rows: {{CORNER_FASTENER_ROWS}}
```

### 5. Installation Requirements Section
```markdown
## INSTALLATION REQUIREMENTS

**General Requirements:**
- Install per manufacturer's current installation instructions
- Install per Florida Product Approval requirements
{{#if HVHZ_REQUIRED}}
- Install per Miami-Dade Notice of Acceptance requirements
{{/if}}
- All installers must be factory-trained and certified
- Installation to be performed in accordance with {{ASCE_VERSION}}

**Quality Control:**
- Third-party inspection required for {{INSPECTION_PERCENTAGE}}% of roof area
- Seam testing: {{SEAM_TEST_FREQUENCY}}
- Pull testing: {{PULL_TEST_QUANTITY}} fasteners minimum
- Documentation: Complete installation records required

**Weather Limitations:**
- No installation during precipitation
- Wind speeds not to exceed {{MAX_WIND_SPEED}} mph during installation
- Temperature range: {{MIN_TEMP}}°F to {{MAX_TEMP}}°F
- Substrate moisture content: {{MAX_MOISTURE_CONTENT}}% maximum

**Substrate Preparation:**
- Remove existing membrane system
- Inspect and repair substrate as required
- Clean substrate of all debris and contaminants
- Prime substrate if required by manufacturer
```

### 6. Materials Quantities Section
```markdown
## MATERIAL QUANTITIES

**Membrane:**
- Total Roof Area: {{TOTAL_SQUARE_FOOTAGE}} sq ft
- Waste Factor: {{WASTE_FACTOR}}%
- Membrane Required: {{MEMBRANE_QUANTITY}} sq ft

**Fasteners and Plates:**
- Field Zone: {{FIELD_FASTENER_QUANTITY}} fasteners
- Perimeter Zone: {{PERIMETER_FASTENER_QUANTITY}} fasteners
- Corner Zone: {{CORNER_FASTENER_QUANTITY}} fasteners
- Total Fasteners: {{TOTAL_FASTENER_QUANTITY}}
- Total Plates: {{TOTAL_PLATE_QUANTITY}}

**Accessories:**
- Seaming Tape: {{SEAMING_TAPE_QUANTITY}} linear feet
- Adhesive: {{ADHESIVE_QUANTITY}} gallons
- Primer: {{PRIMER_QUANTITY}} gallons
- Sealant: {{SEALANT_QUANTITY}} tubes
```

### 7. Compliance and References Section
```markdown
## COMPLIANCE AND REFERENCES

**Code Compliance:**
- Florida Building Code ({{FBC_YEAR}} Edition)
- {{ASCE_VERSION}} - Minimum Design Loads for Buildings and Other Structures
- FM 4470 - Single Ply Roofing Systems
- ASTM D6878 - Standard Specification for Thermoplastic Polyolefin Based Sheet Roofing

**Standards and Testing:**
- ASTM D5849 - Standard Test Method for Evaluating the Resistance of Membrane Roofing Systems to Uplift
- ASTM D6163 - Standard Test Method for Static Puncture Strength of Roofing Membrane Specimens
- ASTM D5602 - Standard Test Method for Evaluating the Uplift Resistance of Roof Assemblies

**Professional Certification:**
This scope of work has been prepared by a Florida Professional Engineer in accordance with Florida Administrative Code 61G15 and represents the minimum requirements for the specified roofing system replacement.

**Engineer Information:**
- Name: {{ENGINEER_NAME}}
- License Number: {{PE_LICENSE_NUMBER}}
- Seal: [Professional Engineer Seal Required]
- Date: {{SIGNATURE_DATE}}
```

---

## Business Logic Rules

### 1. Zone Classification Logic
```javascript
function determineZones(length, width) {
  const perimeterWidth = Math.max(3, Math.min(
    0.1 * Math.min(length, width),
    0.4 * Math.min(length, width)
  ));
  
  return {
    fieldArea: (length - 2*perimeterWidth) * (width - 2*perimeterWidth),
    perimeterArea: (length * width) - fieldArea - (4 * perimeterWidth * perimeterWidth),
    cornerArea: 4 * perimeterWidth * perimeterWidth,
    perimeterWidth: perimeterWidth
  };
}
```

### 2. Template Selection Logic
```javascript
function selectTemplate(projectInputs) {
  const { buildingType, roofArea, windSpeed, hvhzRequired } = projectInputs;
  
  if (hvhzRequired || windSpeed >= 175) {
    return 'T8_HVHZ_ENHANCED';
  } else if (windSpeed >= 150) {
    return 'T7_HIGH_WIND';
  } else if (roofArea >= 50000) {
    return 'T6_LARGE_BUILDING';
  } else {
    return 'T5_STANDARD';
  }
}
```

### 3. HVHZ Requirements Logic
```javascript
function requiresHVHZ(latitude, longitude) {
  // Miami-Dade County
  if (latitude >= 25.0 && latitude <= 26.0 && 
      longitude >= -80.9 && longitude <= -80.0) {
    return true;
  }
  
  // Broward County coastal areas
  if (latitude >= 25.9 && latitude <= 26.5 && 
      longitude >= -80.3 && longitude <= -79.8) {
    return true;
  }
  
  // Monroe County (Keys)
  if (latitude >= 24.5 && latitude <= 25.5 && 
      longitude >= -82.0 && longitude <= -80.0) {
    return true;
  }
  
  return false;
}
```

### 4. Manufacturer Selection Logic
```javascript
function selectManufacturer(preferences, hvhzRequired, membraneType) {
  const manufacturers = {
    'johns-manville': {
      tpo: 'FL16758.3-R35',
      epdm: 'FL16758.2-R40',
      hvhzCapable: true,
      mcrf: 285
    },
    'carlisle': {
      tpo: 'FL17825.1-R60',
      epdm: 'FL17825.2-R45',
      hvhzCapable: true,
      mcrf: 295
    },
    'gaf': {
      tpo: 'FL18552.1-R40',
      epdm: 'FL18552.2-R35',
      hvhzCapable: false,
      mcrf: 280
    }
  };
  
  // Filter by HVHZ capability if required
  const availableManufacturers = Object.entries(manufacturers)
    .filter(([name, specs]) => !hvhzRequired || specs.hvhzCapable);
  
  // Apply preferences or default selection
  return preferences.manufacturer || availableManufacturers[0][0];
}
```

---

## Validation Requirements

### 1. Input Validation Rules
```javascript
const validationRules = {
  coordinates: {
    latitude: { min: 24.0, max: 49.0, required: true },
    longitude: { min: -125.0, max: -67.0, required: true }
  },
  building: {
    height: { min: 10, max: 500, required: true },
    area: { min: 100, max: 1000000, required: true },
    roofSlope: { min: 0, max: 12, required: false }
  },
  wind: {
    windSpeed: { min: 85, max: 200, required: true },
    exposure: { values: ['B', 'C', 'D'], required: true },
    asceVersion: { values: ['7-10', '7-16', '7-22'], required: true }
  }
};
```

### 2. Engineering Validation
```javascript
function validateCalculations(results) {
  const validations = [
    {
      check: results.qh > 0 && results.qh < 500,
      error: 'Velocity pressure out of reasonable range'
    },
    {
      check: Math.abs(results.zonePressures.zone3) > Math.abs(results.zonePressures.zone1),
      error: 'Corner pressures must exceed field pressures'
    },
    {
      check: results.fastenerSpacing >= 3 && results.fastenerSpacing <= 24,
      error: 'Fastener spacing outside practical limits'
    }
  ];
  
  return validations.filter(v => !v.check).map(v => v.error);
}
```

### 3. Output Validation
```javascript
function validateSOWOutput(sow) {
  const requiredSections = [
    'projectHeader',
    'windAnalysis', 
    'membraneSystem',
    'attachmentSpecs',
    'installationReqs',
    'materialQuantities',
    'compliance'
  ];
  
  const missingSections = requiredSections.filter(section => 
    !sow[section] || Object.keys(sow[section]).length === 0
  );
  
  if (missingSections.length > 0) {
    throw new Error(`Missing required sections: ${missingSections.join(', ')}`);
  }
  
  return true;
}
```

---

## Implementation Notes

### 1. Data Sources
- **Wind Speed Maps:** ASCE 7 geographic database
- **Manufacturer Data:** Current FPA and NOA databases
- **Engineering Formulas:** ASCE 7 standard calculations
- **Template Library:** Standardized SOW formats

### 2. Calculation Precision
- **Wind Pressures:** Round to nearest 0.1 psf
- **Fastener Spacing:** Round down to nearest inch
- **Areas:** Round to nearest square foot
- **Factors:** Calculate to 3 decimal places, display to 2

### 3. Error Handling
- **Invalid Inputs:** Provide specific validation messages
- **Calculation Errors:** Fall back to conservative values
- **Missing Data:** Use industry-standard defaults with warnings
- **Edge Cases:** Document assumptions and limitations

---

**Document Control:**
- **Created:** July 2, 2025
- **Author:** SOW Generation System
- **Approved:** Engineering Review Board
- **Next Review:** January 2026
- **Version History:** See Git commit history

*This document serves as the authoritative specification for all SOW generation logic and must be updated whenever calculation methods, product approvals, or output formats change.*
