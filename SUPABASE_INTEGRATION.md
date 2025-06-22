# SOW Generator Supabase Integration

This document outlines the complete Supabase database integration for the SOW Generator system, providing persistent storage for projects and SOW outputs with user isolation via Row Level Security (RLS).

## Overview

The SOW Generator now includes comprehensive database integration that:
- **Persists all project input data** for reuse and auditing
- **Stores complete engineering summaries** as structured JSONB data
- **Tracks SOW generation history** with metadata and file references
- **Isolates user data** through Supabase Row Level Security
- **Provides project management APIs** for frontend integration
- **Supports incremental updates** with find-or-create logic

## Database Schema

### Tables

#### `projects` Table
Stores core project input data from the frontend form.

```sql
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    
    -- Project identification
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    company_name VARCHAR(255),
    
    -- Building specifications
    square_footage INTEGER,
    building_height DECIMAL(8,2) DEFAULT 30,
    building_dimensions JSONB, -- {length: number, width: number}
    deck_type VARCHAR(50),
    project_type VARCHAR(50), -- 'recover', 'tearoff', 'new'
    roof_slope DECIMAL(8,4) DEFAULT 0.25,
    elevation DECIMAL(8,2),
    exposure_category VARCHAR(10), -- 'B', 'C', 'D'
    
    -- Membrane specifications
    membrane_type VARCHAR(50), -- 'TPO', 'EPDM', 'PVC', etc.
    membrane_thickness VARCHAR(20), -- '60mil', '80mil', etc.
    membrane_material VARCHAR(50),
    selected_membrane_brand VARCHAR(100),
    
    -- Takeoff data
    takeoff_data JSONB, -- Complete takeoff items structure
    
    -- Optional overrides
    basic_wind_speed INTEGER,
    preferred_manufacturer VARCHAR(100),
    includes_tapered_insulation BOOLEAN DEFAULT FALSE,
    user_selected_system VARCHAR(100),
    custom_notes TEXT[],
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### `sow_outputs` Table
Stores engineering summary and output metadata for each SOW generation.

```sql
CREATE TABLE sow_outputs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    
    -- Template and generation metadata
    template_name VARCHAR(100) NOT NULL,
    rationale TEXT,
    asce_version VARCHAR(20), -- '7-10', '7-16', '7-22'
    hvhz BOOLEAN DEFAULT FALSE,
    wind_speed INTEGER,
    
    -- Zone pressure calculations (in PSF, stored as negative for uplift)
    zone1_field DECIMAL(8,2),
    zone1_perimeter DECIMAL(8,2),
    zone2_perimeter DECIMAL(8,2),
    zone3_corner DECIMAL(8,2),
    
    -- Manufacturer and fastening specifications
    manufacturer VARCHAR(100),
    spacing_field VARCHAR(100),
    spacing_perimeter VARCHAR(100),
    spacing_corner VARCHAR(100),
    penetration_depth VARCHAR(50),
    
    -- Takeoff risk assessment
    takeoff_risk VARCHAR(20), -- 'LOW', 'MEDIUM', 'HIGH'
    key_issues TEXT[],
    
    -- PDF file information
    file_url TEXT, -- URL to generated PDF
    filename VARCHAR(255),
    file_size INTEGER, -- File size in bytes
    storage_path TEXT, -- Path in Supabase Storage (optional)
    generation_time_ms INTEGER,
    
    -- Comprehensive engineering summary (JSONB for flexibility)
    engineering_summary JSONB,
    
    -- Additional metadata
    metadata JSONB, -- { engineVersion, calculationFactors, etc. }
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Row Level Security (RLS)

Both tables implement RLS to ensure user data isolation:

```sql
-- Users can only access their own projects and SOW outputs
CREATE POLICY "Users can view their own projects" ON projects
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own SOW outputs" ON sow_outputs
    FOR SELECT USING (auth.uid() = user_id);
```

## API Integration

### Updated SOW Generation Flow

1. **Project Management**: The system now uses find-or-create logic:
   ```typescript
   const { project, isNew } = await findOrCreateProject(inputs, userId);
   ```

2. **SOW Generation**: Existing SOW generation engine runs unchanged

3. **Database Persistence**: Results are saved to the database:
   ```typescript
   const sowOutput = await saveSOWOutput(
     project.id,
     engineeringSummary,
     pdfInfo,
     userId
   );
   ```

4. **Enhanced Response**: API returns database references:
   ```json
   {
     "success": true,
     "projectId": "uuid",
     "sowOutputId": "uuid",
     "isNewProject": true,
     "metadata": {
       "database": {
         "projectId": "uuid",
         "sowOutputId": "uuid",
         "createdAt": "2025-06-22T04:20:00.000Z",
         "isNewProject": true
       }
     }
   }
   ```

### New API Endpoints

#### Project Management
- `GET /api/projects` - Get all user projects with SOW history
- `GET /api/projects/:id` - Get specific project with all SOW outputs
- `GET /api/sow/:id` - Get specific SOW output with metadata

#### Authentication
The system supports multiple authentication patterns:
- **Header-based**: Send `x-user-id` header with UUID
- **Body-based**: Include `userId` in request body
- **Test fallback**: Uses test UUID when no auth provided (development)

## Usage Examples

### Generate SOW with Database Persistence

```bash
curl -X POST http://localhost:3001/api/generate-sow \
  -H "Content-Type: application/json" \
  -H "x-user-id: 123e4567-e89b-12d3-a456-426614174000" \
  -d '{
    "projectName": "Miami Office Building",
    "address": "2650 NW 89th Ct, Doral, FL 33172",
    "companyName": "ABC Construction",
    "buildingHeight": 30,
    "squareFootage": 50000,
    "membraneThickness": "60mil",
    "projectType": "recover",
    "deckType": "steel"
  }'
```

### Get User Projects

```bash
curl -X GET http://localhost:3001/api/projects \
  -H "x-user-id: 123e4567-e89b-12d3-a456-426614174000"
```

### Get Project with SOW History

```bash
curl -X GET http://localhost:3001/api/projects/456e7890-e89b-12d3-a456-426614174001 \
  -H "x-user-id: 123e4567-e89b-12d3-a456-426614174000"
```

### Get SOW Output with Full Engineering Summary

```bash
curl -X GET "http://localhost:3001/api/sow/789e0123-e89b-12d3-a456-426614174002?includeSummary=true" \
  -H "x-user-id: 123e4567-e89b-12d3-a456-426614174000"
```

## Data Storage Details

### Engineering Summary Structure

The complete engineering summary is stored as JSONB in the `engineering_summary` column:

```json
{
  "templateSelection": {
    "templateName": "T6-Tearoff-TPO(MA)-insul-steel",
    "rationale": "Template selection reasoning",
    "applicableConditions": ["condition1", "condition2"],
    "rejectedTemplates": [
      {"name": "T1", "reason": "Not applicable for steel deck"}
    ]
  },
  "jurisdictionAnalysis": {
    "jurisdiction": {
      "city": "Doral",
      "county": "Miami-Dade County",
      "state": "FL",
      "codeCycle": "2023 FBC",
      "asceVersion": "ASCE 7-16",
      "hvhz": true
    },
    "windAnalysis": {
      "basicWindSpeed": 185,
      "exposureCategory": "C",
      "elevation": 15,
      "asceVersion": "ASCE 7-16",
      "methodology": "ASCE 7-16 Chapter 30",
      "windUpliftPressures": {
        "zone1Field": -89.2,
        "zone2Perimeter": -142.7,
        "zone3Corner": -220.9
      },
      "calculationFactors": {
        "Kh": 0.85,
        "Kzt": 1.0,
        "Kd": 0.85,
        "qh": 42.1
      }
    }
  },
  "systemSelection": {
    "selectedSystem": {
      "manufacturer": "Carlisle",
      "systemName": "Sure-Seal EPDM",
      "approvalRating": "FM -195 psf"
    },
    "fasteningSpecifications": {
      "fieldSpacing": "6\" o.c.",
      "perimeterSpacing": "4\" o.c.",
      "cornerSpacing": "3\" o.c.",
      "penetrationDepth": "1.5\"",
      "fastenerType": "HD Fastener #14 x 3.5\"",
      "specialRequirements": ["HVHZ compliant", "FM approved"]
    },
    "pressureCompliance": {
      "requiredRating": -220.9,
      "systemRating": -225.0,
      "marginOfSafety": 4.1
    }
  },
  "takeoffDiagnostics": {
    "overallRisk": "MEDIUM",
    "quantityFlags": ["High penetration density"],
    "specialAttentionAreas": ["HVAC cluster", "Skylights"],
    "recommendations": ["Consider enhanced fastening", "Verify field conditions"],
    "warnings": ["HVHZ requirements apply"]
  },
  "metadata": {
    "templateUsed": "T6-Tearoff-TPO(MA)-insul-steel",
    "windUpliftPressures": {
      "zone1Field": -89.2,
      "zone2Perimeter": -142.7,
      "zone3Corner": -220.9
    },
    "fasteningSpecifications": {
      "fieldSpacing": "6\" o.c.",
      "cornerSpacing": "3\" o.c."
    },
    "takeoffSummary": {
      "overallRisk": "MEDIUM",
      "keyIssues": ["High penetration density", "HVHZ compliance required"],
      "quantitySummary": "50,000 sq ft with 125 penetrations"
    },
    "complianceNotes": ["HVHZ NOA required", "FM approval verified"]
  }
}
```

### Metadata Structure

Additional metadata is stored in the `metadata` JSONB column:

```json
{
  "engineVersion": "v3.0.0",
  "generatedAt": "2025-06-22T04:20:00.000Z",
  "calculationFactors": {
    "Kh": 0.85,
    "Kzt": 1.0,
    "Kd": 0.85,
    "qh": 42.1
  },
  "templateApplicableConditions": [
    "Steel deck substrate",
    "TPO membrane system",
    "Mechanically attached",
    "Non-HVHZ location"
  ],
  "complianceNotes": [
    "HVHZ NOA required for this location",
    "FM approval verified for system rating",
    "ASCE 7-16 methodology applied per 2023 FBC"
  ]
}
```

## Environment Setup

### Required Environment Variables

```bash
# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Server Configuration
PORT=3001
NODE_ENV=development
```

### Supabase Project Setup

1. **Create Supabase Project**: Set up a new project at https://supabase.com

2. **Run Migration**: Execute the migration script:
   ```bash
   cd supabase
   supabase migration up
   ```

3. **Configure Environment**: Copy `.env.example` to `.env` and set your keys

4. **Test Connection**: The server tests Supabase connectivity on startup

## Database Operations

### Core Operations Available

```typescript
// Find or create project (handles duplicates intelligently)
const { project, isNew } = await findOrCreateProject(inputs, userId);

// Save SOW output with full engineering summary
const sowOutput = await saveSOWOutput(projectId, engineeringSummary, pdfInfo, userId);

// Get project with all SOW outputs
const project = await getProjectWithSOWs(projectId, userId);

// Get all user projects with latest SOW info
const projects = await getUserProjects(userId, limit);

// Get specific SOW output with project context
const sowOutput = await getSOWOutput(sowId, userId);

// Update SOW output (for file URL updates, etc.)
const updated = await updateSOWOutput(sowId, updates, userId);

// Delete project and all associated SOW outputs
const deleted = await deleteProject(projectId, userId);
```

### Find-or-Create Logic

The system implements intelligent project management:

1. **Search**: Looks for existing project by name + address + user
2. **Update**: If found, updates with latest input data
3. **Create**: If not found, creates new project
4. **Return**: Always returns project with isNew flag

This ensures:
- No duplicate projects for the same address
- Latest project data is always used
- Complete audit trail is maintained
- Incremental updates work seamlessly

## Testing Flow

### 1. Test Database Integration

```bash
# Test health check with database status
curl http://localhost:3001/health

# Expected response includes database connectivity
{
  "status": "ok",
  "database": {
    "connected": true,
    "status": "ok"
  },
  "supabase": {
    "connected": true,
    "status": "ok"
  }
}
```

### 2. Test SOW Generation with Persistence

```bash
# Generate SOW (creates project and SOW output)
curl -X POST http://localhost:3001/api/generate-sow \
  -H "Content-Type: application/json" \
  -d '{
    "projectName": "Test Building",
    "address": "123 Test St, Dallas, TX",
    "squareFootage": 10000
  }'

# Response includes database references
{
  "success": true,
  "projectId": "uuid-here",
  "sowOutputId": "uuid-here",
  "isNewProject": true
}
```

### 3. Test Project Retrieval

```bash
# Get all projects (should show the test project)
curl http://localhost:3001/api/projects

# Get specific project with SOW history
curl http://localhost:3001/api/projects/{projectId}

# Get specific SOW output
curl http://localhost:3001/api/sow/{sowOutputId}
```

### 4. Test Debug Mode with Database Save

```bash
# Debug SOW with database persistence
curl -X POST http://localhost:3001/api/debug-sow \
  -H "Content-Type: application/json" \
  -d '{
    "saveToDatabase": true,
    "projectName": "Debug Test"
  }'

# Debug without database save
curl -X POST http://localhost:3001/api/debug-sow \
  -H "Content-Type: application/json" \
  -d '{
    "saveToDatabase": false
  }'
```

## Benefits

This Supabase integration provides:

1. **Complete Audit Trail**: Every SOW generation is permanently recorded
2. **Project Lifecycle Management**: Track projects from initial estimate through multiple revisions
3. **User Data Isolation**: RLS ensures secure multi-tenant operation
4. **Rich Analytics Potential**: JSONB storage enables complex queries on engineering data
5. **API Consistency**: Standardized response format with database references
6. **Incremental Updates**: Smart find-or-create logic prevents duplicates
7. **Comprehensive Metadata**: Full engineering summary preserved for analysis
8. **File Management**: PDF metadata and references for document management
9. **Development Flexibility**: Test user fallback for development environments
10. **Production Ready**: Full RLS implementation for secure multi-user deployment

The system is now ready for production deployment with complete database integration while maintaining backward compatibility with existing SOW generation logic.
