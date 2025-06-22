# 🧠 Professional Engineering Intelligence Layer

## Overview
The Enhanced Engineering Intelligence Layer provides complete decision transparency for contractors, clients, and inspectors to understand **WHY** the system made each choice, **WHAT** it's complying with, and **WHICH** options were rejected and why.

## 🎯 New Endpoint: `/api/engineering-preview`

### Purpose
Generate professional SOW previews with comprehensive engineering decision transparency.

### Target Users
- **👷 Contractors**: System justification and installation guidance
- **🏢 Clients**: Transparent decision-making and quality assurance  
- **🔍 Inspectors**: Compliance verification and approval documentation
- **👨‍💼 Engineers**: Calculation methodology and safety verification

### Request Format
```bash
curl -X POST http://localhost:3001/api/engineering-preview \
  -H "Content-Type: application/json" \
  -d '{
    "address": "2650 NW 89th Ct, Doral, FL 33172",
    "projectType": "recover", 
    "buildingHeight": 35,
    "squareFootage": 42000,
    "membraneType": "TPO Fleeceback",
    "buildingDimensions": {"length": 280, "width": 150}
  }'
```

## 📊 Complete Response Structure

### 1. Jurisdictional Analysis
```json
{
  "jurisdictionAnalysis": {
    "hvhz": true,
    "county": "Miami-Dade County",
    "city": "Doral", 
    "state": "FL",
    "asceVersion": "ASCE 7-16",
    "codeCycle": "2023 Florida Building Code",
    "sourceData": "/data/code-map.json",
    "specialRequirements": [
      "High Velocity Hurricane Zone provisions apply",
      "NOA (Notice of Acceptance) required for all components",
      "Special inspection required during installation",
      "Enhanced wind resistance requirements per TAS 105"
    ],
    "noaRequired": true
  }
}
```

### 2. ASCE Compliance Details
```json
{
  "windCalculation": {
    "windSpeed": 185,
    "exposureCategory": "C",
    "elevation": 8,
    "factors": {
      "Kd": 0.85,  // Directionality factor for buildings
      "Kzt": 1.0,  // Topographic factor (flat terrain)
      "Kh": 0.98,  // Velocity pressure exposure coefficient  
      "Ke": 1.0,   // Ground elevation factor
      "I": 1.0     // Importance factor (Risk Category II)
    },
    "velocityPressure": 73.2,
    "pressures": {
      "zone1Field": 71.2,
      "zone1Perimeter": 110.6,
      "zone2Perimeter": 158.4,
      "zone3Corner": 220.8
    },
    "roofZoneMap": {
      "fieldArea": "Central roof area >10ft from edges",
      "perimeterArea": "Zone within 10ft of roof edge", 
      "cornerArea": "Corner zones within 3ft of corner intersection",
      "zoneDimensions": {
        "fieldZoneArea": 25200,
        "perimeterZoneArea": 12600,
        "cornerZoneArea": 4200
      }
    },
    "thresholds": {
      "acceptanceMargin": 15,
      "minimumSafetyFactor": 1.15
    }
  }
}
```

### 3. Template Selection Logic
```json
{
  "templateSelection": {
    "selected": "T4 - HVHZ Fleeceback Recover",
    "selectedCode": "T4",
    "rationale": "HVHZ location with fleeceback membrane requires enhanced wind resistance",
    "selectionFactors": {
      "hvhzRequired": true,
      "steepSlope": false,
      "highRise": false,
      "specialMaterial": true,
      "projectType": "recover"
    },
    "rejected": [
      {
        "template": "T1 - Standard Recover",
        "templateCode": "T1",
        "reason": "Fails HVHZ wind resistance requirements",
        "disqualifyingFactor": "HVHZ_COMPLIANCE"
      },
      {
        "template": "T2 - Complete Tear-Off", 
        "templateCode": "T2",
        "reason": "Project type is recover, not tear-off",
        "disqualifyingFactor": "PROJECT_TYPE"
      }
    ]
  }
}
```

### 4. Manufacturer Selection Logic
```json
{
  "manufacturerSelection": {
    "selected": "Carlisle 80mil TPO HVHZ Fleeceback",
    "selectedSystem": {
      "manufacturer": "Carlisle",
      "productLine": "HVHZ Fleeceback TPO",
      "thickness": "80mil",
      "approvalNumbers": [
        "NOA 17-1021.09",
        "TAS 105 Compliant", 
        "FM I-175"
      ]
    },
    "complianceMargin": {
      "fieldMargin": "13.8 psf above required",
      "perimeterMargin": "21.6 psf above required",
      "cornerMargin": "29.2 psf above required",
      "overallSafetyFactor": 1.13
    },
    "rejected": [
      {
        "name": "GAF EverGuard TPO",
        "manufacturer": "GAF",
        "reason": "Not HVHZ approved per NOA requirements",
        "failedZone": "corner",
        "pressureDeficit": "No HVHZ NOA"
      },
      {
        "name": "Firestone UltraPly TPO",
        "manufacturer": "Firestone", 
        "reason": "Fails perimeter uplift pressure requirement",
        "failedZone": "perimeter",
        "pressureDeficit": "12.3 psf under required"
      }
    ],
    "approvalSource": {
      "primaryApproval": "Florida NOA 17-1021.09",
      "secondaryApprovals": ["TAS 105", "ASTM D6878"],
      "hvhzApproval": "Miami-Dade NOA Required and Verified"
    }
  }
}
```

### 5. Takeoff Evaluation & Analysis
```json
{
  "takeoffSummary": {
    "projectMetrics": {
      "totalArea": 42000,
      "drainCount": 8,
      "penetrationCount": 24,
      "flashingLinearFeet": 1200,
      "accessoryCount": 15
    },
    "densityAnalysis": {
      "drainDensity": 1.9,        // per 1000 sq ft
      "penetrationDensity": 5.7,  // per 1000 sq ft  
      "flashingRatio": 0.029,     // LF per sq ft
      "accessoryDensity": 3.6     // per 1000 sq ft
    },
    "riskAssessment": {
      "overallRisk": "Medium",
      "riskFactors": [
        "High penetration density",
        "Extensive flashing work"
      ],
      "wasteFactor": "12%",
      "laborMultiplier": 1.2
    },
    "recommendations": {
      "crewSize": "4 person crew",
      "installationDays": 9,
      "specialEquipment": [],
      "alerts": [
        "High penetration density",
        "Extensive flashing work"
      ],
      "qualityControls": [
        "Daily progress inspections",
        "Penetration sealing verification",
        "Standard QC procedures"
      ]
    }
  }
}
```

### 6. Compliance Summary
```json
{
  "complianceSummary": {
    "codeCompliance": [
      "2023 Florida Building Code",
      "ASCE 7-16 Wind Load Requirements", 
      "TAS 105 Hurricane Standards"
    ],
    "manufacturerCompliance": [
      "Factory Mutual (FM) Approved",
      "UL Listed Components",
      "Florida NOA Compliance"
    ],
    "windCompliance": "HVHZ compliant for 185mph basic wind speed",
    "specialInspections": [
      "Special inspector required during installation",
      "NOA compliance verification",
      "Enhanced quality control documentation"
    ],
    "warrantyPeriod": "20-year enhanced warranty",
    "certificationRequired": true
  }
}
```

## 🎯 Key Benefits

### For Contractors
- **System Justification**: Complete rationale for every decision
- **Installation Guidance**: Crew size, timeline, and special requirements
- **Quality Assurance**: Inspection checkpoints and compliance verification

### For Clients  
- **Transparency**: Understanding why each system was chosen
- **Quality Confidence**: Safety factors and compliance margins
- **Value Verification**: Premium features and enhanced warranties

### For Inspectors
- **Compliance Documentation**: Code references and approval numbers
- **Calculation Verification**: ASCE factors and methodology
- **Approval Requirements**: NOA verification and special inspections

### For Engineers
- **Methodology Transparency**: All calculation factors and assumptions
- **Safety Verification**: Margin analysis and risk assessment
- **Code Compliance**: Version-specific requirements and standards

## 🧪 Example Use Cases

### HVHZ Project Example
```bash
# Request for Miami-Dade HVHZ project
{
  "address": "2650 NW 89th Ct, Doral, FL 33172",
  "projectType": "recover",
  "membraneType": "TPO Fleeceback"
}

# Response highlights HVHZ requirements
{
  "jurisdictionAnalysis": {"hvhz": true, "noaRequired": true},
  "windCalculation": {"windSpeed": 185, "pressures": {"zone3Corner": 220.8}},
  "manufacturerSelection": {
    "approvalSource": {"hvhzApproval": "Miami-Dade NOA Required and Verified"}
  }
}
```

### Standard Project Example  
```bash
# Request for standard Texas project
{
  "address": "123 Main St, Dallas, TX",
  "projectType": "recover"
}

# Response shows standard requirements
{
  "jurisdictionAnalysis": {"hvhz": false, "asceVersion": "ASCE 7-16"},
  "windCalculation": {"windSpeed": 115, "pressures": {"zone3Corner": 56.0}},
  "manufacturerSelection": {
    "approvalSource": {"primaryApproval": "FM I-175 Class 1"}
  }
}
```

## 🚀 Implementation Status

✅ **Complete Implementation**
- Jurisdictional analysis with code mapping
- ASCE compliance details with all factors
- Template selection logic with rejection analysis  
- Manufacturer selection with compliance margins
- Takeoff evaluation with risk assessment
- Comprehensive compliance documentation

✅ **Professional Documentation**
- Complete decision transparency
- Contractor guidance and recommendations
- Client quality assurance information
- Inspector compliance verification
- Engineer calculation methodology

**Ready for Professional Use** 🎯
