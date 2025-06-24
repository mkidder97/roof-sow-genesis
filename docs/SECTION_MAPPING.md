# Section-Input Mapping System Documentation

## Overview

The Section-Input Mapping System is a comprehensive engine that dynamically maps project inputs to relevant SOW sections, ensuring that SOWs are generated based on available data with complete auditability and validation.

## Key Features

### 🗺️ **CSV-Driven Mapping**
- Integrates `SOW_SectiontoInput_Mapping.csv` for dynamic section generation
- Maps specific project inputs to relevant SOW sections
- Supports dot-notation paths for complex nested data structures

### ✅ **Comprehensive Validation**
- Multi-level input validation with detailed error reporting
- Validation rules include: required fields, value ranges, pattern matching, enumerated values
- Graceful handling of validation failures with detailed feedback

### 🔄 **Dynamic Transformations**
- Automatic data transformation and formatting functions
- Input-specific transformers (e.g., `formatSquareFootage`, `formatMembraneSpecs`)
- Fallback value system for missing or invalid inputs

### 📋 **Complete Audit Trails**
- Tracks every input resolution, transformation, and validation step
- Provides complete traceability of SOW generation decisions
- Audit entries include timestamps, actions, and detailed context

### 🔧 **Self-Healing System**
- Automatic fallback values when primary inputs are missing
- Confidence scoring for generated content
- Intelligent error recovery with minimal user intervention

## System Architecture

```
┌─────────────────────┐    ┌──────────────────────┐    ┌─────────────────────┐
│   Project Inputs    │────│  Section Mapping     │────│  Enhanced SOW       │
│                     │    │  Engine              │    │  Generation         │
│ • projectName       │    │                      │    │                     │
│ • address           │    │ • Input Resolution   │    │ • Dynamic Sections  │
│ • squareFootage     │    │ • Validation         │    │ • Audit Trails      │
│ • decisionTreeResult│    │ • Transformation     │    │ • Professional PDFs │
│ • windAnalysis      │    │ • Fallback Handling  │    │                     │
│ • buildingCodes     │    │ • Content Generation │    │                     │
└─────────────────────┘    └──────────────────────┘    └─────────────────────┘
```

## Section Mappings

Based on `SOW_SectiontoInput_Mapping.csv`, the system supports these key mappings:

| SOW Section | Relevant Input | Input Path |
|-------------|----------------|------------|
| Project Title | projectName | `projectName` |
| Project Address | address | `address` |
| Company Name | companyName | `companyName` |
| Square Footage | squareFootage | `squareFootage` |
| Template Selection | template_id | `decisionTreeResult.template_selection.template_id` |
| Project Type | projectType | `decisionTreeResult.decision_tree.projectType` |
| Substrate Type | deckType | `decisionTreeResult.decision_tree.deckType` |
| Membrane Specifications | membrane | `decisionTreeResult.enhanced_specifications.materials.membrane` |
| Wind Zone Requirements | zones | `windAnalysis.zones` |
| ASCE Version | asceVersion | `windAnalysis.asceVersion` |
| Uplift Pressures | pressures | `windAnalysis.pressures.zones` |
| Fastening Patterns | fastening_schedule | `zonesAndFastening.fastening_schedule` |
| Building Code Version | primary_code | `buildingCodes.applicable_codes.primary_code` |
| HVHZ Requirements | special_requirements | `buildingCodes.special_requirements` |
| NOA Requirements | miami_dade_requirements | `manufacturerAnalysis.miami_dade_requirements` |
| ESR Requirements | icc_esr_requirements | `manufacturerAnalysis.icc_esr_requirements` |
| Manufacturer System | system_specifications | `manufacturerAnalysis.system_specifications` |
| Warranty Requirements | warranty_information | `manufacturerAnalysis.warranty_information` |
| Special Instructions | special_considerations | `decisionTreeResult.enhanced_specifications.special_considerations` |

## API Endpoints

### Core Generation Endpoints

#### `POST /api/sow/generate-with-mapping`
Enhanced SOW generation using the section-input mapping engine.

**Request:**
```json
{
  "projectName": "Commercial Building SOW",
  "address": "123 Main St, Dallas, TX 75201",
  "companyName": "ABC Roofing",
  "squareFootage": 75000,
  "decisionTreeResult": {
    "template_selection": {
      "template_id": "T1",
      "assembly_description": "Standard TPO recover system"
    },
    "decision_tree": {
      "projectType": "recover",
      "deckType": "steel"
    }
  },
  "windAnalysis": {
    "asceVersion": "ASCE 7-16",
    "zones": {
      "zone1Field": -18.2,
      "zone3Corner": -56.0
    }
  }
}
```

**Response:**
```json
{
  "success": true,
  "filename": "SOW_Commercial_Building_SOW_1703123456789.pdf",
  "generationTime": 2340,
  "sectionAnalysis": {
    "includedSections": 15,
    "excludedSections": 3,
    "confidenceScore": 0.92
  },
  "inputMappingResults": {
    "totalMappings": 25,
    "resolvedMappings": 22,
    "missingInputs": ["manufacturerAnalysis.warranty_information"],
    "validationErrors": []
  },
  "auditTrail": {
    "inputResolutionEntries": 67,
    "sectionGenerationEntries": 18,
    "contentPopulationEntries": 15
  }
}
```

### Debug and Analysis Endpoints

#### `POST /api/sow/debug-mapping`
Comprehensive mapping analysis for debugging and optimization.

**Response:**
```json
{
  "success": true,
  "debugMode": true,
  "mappingResults": [
    {
      "sectionId": "project_title",
      "sectionTitle": "Project Title",
      "hasAllRequiredInputs": true,
      "relevantInputs": [
        {
          "inputName": "projectName",
          "inputPath": "projectName",
          "isResolved": true,
          "transformedValue": "Commercial Building SOW",
          "validationResults": [
            {
              "passed": true,
              "message": null
            }
          ]
        }
      ]
    }
  ],
  "auditTrail": [
    {
      "timestamp": "2024-12-21T10:30:00.000Z",
      "inputPath": "projectName",
      "action": "resolved",
      "details": "Raw value resolved"
    }
  ]
}
```

#### `GET /api/sow/mappings`
Retrieve all available section mappings.

#### `GET /api/sow/mappings/input/:inputPath`
Find all sections that use a specific input path.

#### `POST /api/sow/validate-mapping`
Validate project inputs against mapping requirements.

#### `POST /api/sow/mapping-report`
Generate comprehensive mapping analysis report.

## Configuration Options

The mapping engine supports various configuration options:

```typescript
const mappingEngine = createSectionMappingEngine({
  enableAuditTrail: true,      // Track all input resolution steps
  enableValidation: true,      // Validate inputs against rules
  enableTransformations: true, // Apply transformation functions
  enableFallbacks: true,       // Use fallback values for missing inputs
  strictMode: false           // Fail if required inputs are missing
});
```

## Validation Rules

The system supports comprehensive validation rules:

### Rule Types
- **required**: Input must be present and non-empty
- **minValue/maxValue**: Numeric range validation
- **pattern**: Regular expression pattern matching
- **oneOf**: Value must be from enumerated list

### Example Validation Configuration
```typescript
{
  section: 'Square Footage',
  relevantInput: 'squareFootage',
  inputPath: 'squareFootage',
  isRequired: true,
  validationRules: [
    { type: 'required', message: 'Square footage is required' },
    { type: 'minValue', value: 100, message: 'Square footage must be at least 100 sq ft' }
  ],
  transformFunction: 'formatSquareFootage'
}
```

## Transformation Functions

The system includes built-in transformation functions for common data formatting:

- **formatSquareFootage**: Formats numbers with commas and "sq ft" suffix
- **formatDeckType**: Converts deck type codes to descriptive names
- **formatMembraneSpecs**: Formats membrane specifications with thickness and color
- **formatWindZones**: Formats wind zone pressure data
- **formatUpliftPressures**: Formats uplift pressure calculations
- **formatFasteningPatterns**: Formats fastening spacing requirements

### Custom Transformations
Add new transformation functions to the mapping engine:

```typescript
const transformations = {
  customFormatter: (value: any) => {
    // Custom transformation logic
    return transformedValue;
  }
};
```

## Error Handling and Recovery

### Self-Healing Features
1. **Automatic Fallbacks**: When required inputs are missing, the system applies predefined fallback values
2. **Graceful Degradation**: Sections with missing inputs are excluded rather than causing system failure
3. **Validation Recovery**: Failed validations are logged but don't prevent SOW generation in non-strict mode
4. **Confidence Scoring**: Overall confidence scores help users understand data quality

### Error Reporting
- Detailed validation error messages with specific remediation guidance
- Missing input identification with prioritized recommendations
- Audit trail analysis for troubleshooting input resolution issues

## Best Practices

### Input Structure
1. **Consistent Naming**: Use consistent property names across all input objects
2. **Nested Organization**: Organize related inputs in logical groups (e.g., `windAnalysis`, `buildingCodes`)
3. **Complete Data**: Provide as many inputs as possible for maximum SOW completeness

### Validation Strategy
1. **Required vs Optional**: Carefully consider which inputs are truly required vs nice-to-have
2. **Reasonable Defaults**: Provide sensible fallback values for optional inputs
3. **User Feedback**: Use validation messages to guide users toward providing missing data

### Performance Optimization
1. **Efficient Transformations**: Keep transformation functions lightweight and efficient
2. **Selective Auditing**: Enable detailed auditing only when debugging or analysis is needed
3. **Caching**: Consider caching transformation results for large datasets

## Integration Examples

### Basic Usage
```typescript
import { createSectionMappingEngine } from './core/section-input-mapping.js';

const engine = createSectionMappingEngine();
const results = engine.resolveSectionMappings(projectInputs);

console.log(`Resolved ${results.filter(r => r.hasAllRequiredInputs).length} sections`);
```

### Advanced Usage with Validation
```typescript
import { validateRequiredSections } from './core/section-input-mapping.js';

const validation = validateRequiredSections(projectInputs);
if (!validation.isValid) {
  console.log('Missing required inputs:', validation.missingRequiredSections);
  // Provide user feedback for missing inputs
}
```

### SOW Generation Integration
```typescript
import { selectSectionsEnhanced } from './core/enhanced-section-engine.js';

const sectionAnalysis = selectSectionsEnhanced(enhancedInputs);
console.log(`Generated SOW with ${sectionAnalysis.includedSections.length} sections`);
console.log(`Confidence score: ${(sectionAnalysis.confidenceScore * 100).toFixed(1)}%`);
```

## Testing and Debugging

### Debug Endpoints
Use the debug endpoints to analyze mapping behavior:

```bash
# Test mapping analysis
curl -X POST http://localhost:3001/api/sow/debug-mapping \
  -H "Content-Type: application/json" \
  -d '{"projectName": "Test Project", "squareFootage": 5000}'

# View all available mappings
curl http://localhost:3001/api/sow/mappings

# Validate specific inputs
curl -X POST http://localhost:3001/api/sow/validate-mapping \
  -H "Content-Type: application/json" \
  -d '{"projectName": "Test Project"}'
```

### System Status
Check system health and mapping engine status:

```bash
curl http://localhost:3001/api/test/section-mapping
curl http://localhost:3001/api/status
```

## Future Enhancements

### Planned Features
1. **Dynamic Mapping Rules**: Runtime configuration of mapping rules
2. **ML-Powered Suggestions**: Machine learning recommendations for missing inputs
3. **Advanced Analytics**: Detailed analytics on mapping performance and user patterns
4. **Custom Validators**: User-defined validation rules and transformation functions
5. **Template Optimization**: Automatic template selection based on input completeness

### Extension Points
The system is designed for extensibility:
- Add new transformation functions
- Implement custom validation rules
- Extend audit trail capabilities
- Integrate with external data sources
- Build custom reporting tools

## Troubleshooting

### Common Issues

1. **Missing Inputs**: Check validation results and provide missing required inputs
2. **Transformation Errors**: Verify transformation function logic and input data types
3. **Low Confidence Scores**: Review fallback usage and improve input data quality
4. **Performance Issues**: Optimize transformation functions and consider selective auditing

### Debug Workflow
1. Use `POST /api/sow/debug-mapping` to analyze input resolution
2. Check audit trail for detailed step-by-step processing
3. Review validation results for specific error messages
4. Generate mapping report for comprehensive analysis

This documentation provides comprehensive guidance for using and extending the Section-Input Mapping System. The system successfully integrates the CSV mapping requirements into a robust, scalable, and maintainable solution.
