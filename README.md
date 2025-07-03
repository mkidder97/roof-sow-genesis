# 🏗️ TPO Roof SOW Genesis

> **Professional Scope of Work Generator with Complete Engineering Transparency**

A comprehensive, Tesla-inspired web application that generates professional TPO roofing Scopes of Work with intelligent wind analysis, jurisdiction mapping, and complete engineering decision transparency.

## 🎯 CI Pipeline Status

✅ **FIXED**: Complete testing infrastructure deployed
- Added vitest dependencies to all packages  
- Created working test suites for api-server and web-client
- Resolved conflicts and closed obsolete PRs (#18, #19)
- Clean CI run triggered after fixes

## ✨ Features

### 🧠 **Engineering Summary Metadata** ⭐ *NEW*
Complete audit trail of every engineering decision:
- **Jurisdiction Analysis**: Building code mapping, ASCE version selection, HVHZ determination
- **Wind Load Analysis**: ASCE 7 compliant pressure calculations with zone-specific results
- **System Selection Logic**: Template selection rationale with manufacturer approval filtering
- **Attachment Specifications**: Engineering-driven fastening patterns with detailed notes

### 🎯 **Intelligent Automation**
- **Smart Geocoding**: Address → coordinates → jurisdiction → building code
- **Wind Analysis**: Real-time ASCE 7 pressure calculations with exposure category detection
- **Template Selection**: AI-driven system selection based on project parameters and wind loads
- **Manufacturer Filtering**: Automatic NOA/ESR compliance checking for HVHZ and high-wind applications

### 🎨 **Tesla-Style UI/UX**
- **Glass Morphism**: Modern translucent design with backdrop blur effects
- **Progressive Disclosure**: Collapsible form sections with completion tracking
- **Real-time Feedback**: Live connection status, generation progress, and validation
- **Engineering Summary Panel**: Collapsible audit trail with professional formatting

### 📄 **Professional PDF Generation**
- **Structured Layout**: Multi-page SOW with consistent formatting
- **Engineering Data**: Complete wind analysis, system specifications, and installation requirements
- **Compliance Information**: Jurisdiction-specific codes, warranties, and quality assurance protocols

## 🚀 Quick Start

### Prerequisites
- Node.js 18.0.0 or higher
- npm or yarn package manager

### Installation & Development

```bash
# Clone the repository
git clone https://github.com/mkidder97/roof-sow-genesis.git
cd roof-sow-genesis

# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install

# Start development servers
# Terminal 1: Frontend (http://localhost:5173)
npm run dev

# Terminal 2: Backend (http://localhost:3001)
cd server
npm run dev
```

### Environment Setup
Create `.env` file in the server directory:
```bash
# Optional: Enhanced geocoding (free tier: 2,500 requests/day)
OPENCAGE_API_KEY=your_opencage_api_key_here

# Server configuration
PORT=3001
NODE_ENV=development
```

## 🏗️ System Architecture

### Frontend Stack
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** with custom Tesla-style design system
- **Radix UI** components for accessibility
- **React Hook Form** with Zod validation

### Backend Stack
- **Express.js** with TypeScript
- **PDFKit** for professional document generation
- **Node-fetch** for external API integration
- **Multer** for file upload handling

### Key Services
```
📍 Geocoding Service     → Address to coordinates + elevation
🌪️ Wind Analysis        → ASCE 7 compliant pressure calculations  
🏛️ Jurisdiction Mapping → Building code and HVHZ determination
🏗️ Template Selection   → Intelligent system selection with rationale
🔧 Attachment Specs     → Engineering-driven fastening calculations
📄 PDF Generation       → Professional SOW document creation
```

## 📋 Engineering Summary Example

The system provides complete transparency into every decision:

```json
{
  "engineeringSummary": {
    "jurisdiction": {
      "city": "Dallas",
      "county": "Dallas County", 
      "state": "TX",
      "codeCycle": "2021 IBC",
      "asceVersion": "7-16",
      "hvhz": false
    },
    "windAnalysis": {
      "windSpeed": "115 mph",
      "exposure": "B", 
      "elevation": "430 ft",
      "zonePressures": {
        "zone1Field": "-18.2 psf",
        "zone1Perimeter": "-28.0 psf", 
        "zone2Perimeter": "-40.0 psf",
        "zone3Corner": "-56.0 psf"
      }
    },
    "systemSelection": {
      "selectedTemplate": "T4 - Standard TPO Recover",
      "rationale": "Standard TPO recover system suitable for moderate wind loads with mechanically attached method",
      "rejectedManufacturers": [],
      "approvalSource": ["FM I-175", "UL 580", "ICC-ES ESR-1289"]
    },
    "attachmentSpec": {
      "fieldSpacing": "10\" o.c.",
      "perimeterSpacing": "5\" o.c.", 
      "cornerSpacing": "3\" o.c.",
      "penetrationDepth": "1.25\" minimum into deck",
      "notes": "Fastening pattern designed for maximum zone pressure of 56.0 psf. All fasteners must achieve minimum 448 lbf pullout resistance per ASTM D1761."
    }
  }
}
```

## 🔧 API Endpoints

### Health Check
```http
GET /health
```

### SOW Generation  
```http
POST /api/generate-sow
Content-Type: application/json

{
  "projectName": "Sample Commercial Project",
  "address": "123 Main Street, Dallas, TX 75201",
  "companyName": "ABC Roofing Company",
  "squareFootage": 75000,
  "buildingHeight": 35,
  "projectType": "recover",
  "membraneThickness": "60",
  "membraneColor": "White",
  "deckType": "Steel"
}
```

## 🧠 Engineering Logic Overview

### Wind Pressure Calculation (ASCE 7)
```typescript
// Velocity pressure calculation
const qh = 0.00256 * Kh * Kzt * Kd * I * V²

// Zone pressure coefficients (uplift/suction)
const GCp = {
  zone1Field: -0.9,      // Field areas
  zone1Perimeter: -1.4,  // Inner perimeter
  zone2Perimeter: -2.0,  // Outer perimeter  
  zone3Corner: -2.8      // Critical corner zones
}
```

### Template Selection Decision Tree
```
IF project_type == "recover"
  IF membrane_thickness >= 80mil OR wind_pressure > 35psf
    → T5 Recover Fleeceback (Induction Welded)
  ELSE  
    → T4 Standard Recover (Mechanically Attached)

IF hvhz == true
  → Add NOA requirements
  → Enhanced fastening patterns
  → Third-party inspection protocols
```

### Fastening Pattern Optimization
```typescript
// Base patterns adjusted by wind pressure and template
if (maxPressure > 50) {
  fieldSpacing = "8\" o.c.";
  perimeterSpacing = "3\" o.c."; 
  cornerSpacing = "2\" o.c.";
}

// HVHZ enhancements
if (hvhz) {
  fieldSpacing = reduceSpacing(fieldSpacing, 1);
  // Additional requirements per TAS 105
}
```

## 🗺️ Supported Jurisdictions

### Building Code Mapping
- **Florida**: 2023 FBC with HVHZ designations for coastal counties
- **Texas**: 2021 IBC statewide with local amendments
- **California**: 2022 CBC with seismic considerations
- **New York**: 2020 IBC with NYC-specific codes
- **Others**: Default 2021 IBC with ASCE 7-16

### HVHZ Compliance
Automatically triggered for:
- Miami-Dade County, FL
- Broward County, FL
- Monroe County, FL  
- Palm Beach County, FL

## 📱 UI/UX Features

### Tesla-Inspired Design
- **Glass Cards**: Translucent components with backdrop blur
- **Smooth Animations**: Page transitions and micro-interactions
- **Progress Indicators**: Real-time completion tracking
- **Status System**: Live connection and generation status

### Engineering Summary Panel
- **Collapsible Design**: Starts collapsed, expands for detailed view
- **Visual Hierarchy**: Clear organization with icons and badges
- **Color Coding**: HVHZ status, wind severity indicators
- **Professional Typography**: Clean, scannable information layout

### Responsive Design
- **Mobile-First**: Optimized for smartphones and tablets
- **Progressive Enhancement**: Core functionality on all devices
- **Touch-Friendly**: Large tap targets and gesture support

## 🔮 Roadmap & Future Enhancements

### Phase 2 (Planned)
- **PDF OCR Integration**: Automatic takeoff form parsing
- **3D Visualization**: Interactive roof model with pressure zones
- **Advanced Manufacturer DB**: Real-time NOA/ESR lookup
- **Mobile App**: Native iOS/Android applications

### Phase 3 (Proposed)
- **AI Optimization**: Machine learning for template recommendations
- **CAD Integration**: Import/export to AutoCAD, Revit
- **Multi-Language**: Spanish and other language support
- **Weather Integration**: Historical wind data validation

## ⚠️ Important Notes

### Engineering Disclaimer
This system provides engineering guidance and calculations but does not replace:
- Licensed professional engineer review and stamping
- Local building department plan review and approval
- Manufacturer-specific installation requirements
- Third-party inspection and testing requirements

### Production Considerations
- **Geocoding**: Sign up for OpenCage API for production use
- **Wind Data**: Consider NOAA/ASCE integration for enhanced accuracy
- **File Storage**: Configure persistent storage for generated PDFs
- **Security**: Implement authentication and rate limiting for production

## 📞 Support

### Development
- **Frontend Issues**: React, TypeScript, UI/UX
- **Backend Issues**: Express.js, PDF generation, calculations
- **Integration**: API connectivity, geocoding, wind analysis

### Documentation
- **Implementation Guide**: `/IMPLEMENTATION.md`
- **API Documentation**: Available at `/health` endpoint
- **Engineering Calculations**: Detailed methodology in source code

---

## 🏆 Key Achievement

✅ **Complete Engineering Transparency**: The engineering summary metadata provides a full audit trail of every decision made during SOW generation, from jurisdiction mapping through wind analysis to fastening specifications. This addresses the core requirement for auditability while maintaining user-friendly operation.

The system successfully bridges complex engineering calculations with intuitive user experience, making professional SOW generation accessible to roofing contractors while maintaining the technical rigor required for commercial projects.

**Built with ❤️ for the roofing industry**
