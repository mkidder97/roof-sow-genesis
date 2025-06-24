# Enhanced SOW Generator Testing Guide

## 🚀 Quick Start Testing

The enhanced SOW generator is now integrated and ready for testing. This guide provides step-by-step instructions to test the improved system.

## ✅ What's Been Implemented

### 1. Enhanced Server Integration
- **Updated `server/index.ts`** to use enhanced workflow SOW integration
- **Added enhanced formatting routes** via `sow-enhanced-formatting.js`
- **Improved error handling** and debug output
- **Enhanced system status** endpoints with better metadata

### 2. Enhanced Workflow-SOW Integration
- **Enhanced PDF formatting** for exact template matching
- **Advanced template selection logic** based on project characteristics
- **Professional audit trails** with complete workflow history
- **Multi-role data compilation** from Inspector → Consultant → Engineer
- **Formatting compliance scoring** with validation

### 3. Development Testing Tools
- **Simple PDF testing script** (`development/test-pdf-simple.js`)
- **Comprehensive template testing** (`development/test-all-templates.js`)
- **Enhanced MCP analysis tool** (`mcp-tools/analyze-pdf-output/index.ts`)

## 🧪 Step-by-Step Testing Instructions

### Step 1: Start the Enhanced Server
```bash
cd server
npm install  # If needed
npm run dev
```

**Expected Output:**
```
🚀 Enhanced Multi-Role Workflow-SOW Integration + File Management Server Starting...
📡 Server running on port 3001
✅ Health Check: GET /health
🧪 Workflow-SOW Test: GET /api/test/workflow-sow
System fully operational!
```

### Step 2: Test Basic Connection
```bash
# Test the enhanced endpoint
curl -X POST http://localhost:3001/api/sow/generate-enhanced \
  -H "Content-Type: application/json" \
  -d '{
    "projectName": "Basic Connection Test",
    "address": "123 Test Street, Test City, TX",
    "buildingHeight": 35,
    "squareFootage": 50000,
    "deckType": "steel",
    "projectType": "tearoff",
    "membraneType": "TPO"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "engineeringSummary": {...},
  "filename": "Basic_Connection_Test_YYYYMMDD.pdf",
  "outputPath": "/path/to/output/Basic_Connection_Test_YYYYMMDD.pdf",
  "generationTime": "X.Xs"
}
```

### Step 3: Run Simple PDF Tests
```bash
# From the root directory
node development/test-pdf-simple.js
```

**Expected Output:**
```
🔄 Starting simple PDF test...

🧪 Testing: Steel-Deck-Tearoff
   ✅ SUCCESS
   📄 PDF: Steel_Deck_Tearoff_Test_20250624.pdf
   📏 Template: tearoff-tpo-ma-insul-steel
   📊 Size: 250.3 KB

🧪 Testing: Gypsum-Deck-Tearoff
   ✅ SUCCESS
   📄 PDF: Gypsum_Deck_Tearoff_Test_20250624.pdf
   📏 Template: tearoff-tpo-adhered-insul-adhered-gypsum
   📊 Size: 275.8 KB
```

### Step 4: Run Comprehensive Template Tests
```bash
node development/test-all-templates.js
```

**Expected Output:**
```
🔄 Testing ALL Template Types...

🧪 Testing: T6-Tearoff-Steel
   📍 Expected Template: tearoff-tpo-ma-insul-steel
   ✅ SUCCESS
   📄 PDF: T6_Steel_Deck_Tearoff_Test_20250624.pdf
   📏 Template: tearoff-tpo-ma-insul-steel
   🎯 Template Match: ✅
   📊 Size: 320.5 KB
   📄 Est. Pages: 6
   🎯 Score: 85/100

📊 TEMPLATE TEST SUMMARY
========================
T6-Tearoff-Steel: 85/100 ✅
T7-Tearoff-LWC-Steel: 85/100 ✅
T8-Tearoff-Gypsum: 80/100 ⚠️
T5-Recover-SSR: 75/100 ⚠️

Overall Average: 81/100
👍 GOOD! Minor improvements needed.
```

### Step 5: Analyze Generated PDFs
```bash
# Find the latest PDF
LATEST_PDF=$(ls -t output/*.pdf | head -n1)

# Create input data for analysis
echo '{"projectName": "Test", "buildingHeight": 35, "squareFootage": 50000}' > temp-input.json

# Run PDF analysis
cd mcp-tools/analyze-pdf-output
node index.ts "$LATEST_PDF" ../../temp-input.json
```

**Expected Output:**
```
=== PDF Analysis Results ===
Success: true
Issues found: 2

=== Issues ===
1. [MEDIUM] Project name mismatch between input and PDF output
   Suggestion: Verify project name consistency

2. [LOW] PDF analysis completed successfully with high compliance score
   Suggestion: SOW appears to be generated correctly

=== Extracted Data ===
{
  "projectName": "Steel Deck Tearoff Test",
  "address": "123 Steel Ave, Dallas, TX",
  "windSpeed": 150,
  "template": "tearoff-tpo-ma-insul-steel",
  "pageCount": 6,
  "fileSize": 320563
}

=== Compliance Scores ===
Format Compliance: 85%
Content Completeness: 60%
Template Accuracy: 70%
Overall Score: 72%
```

## 📊 Key System Endpoints

### Enhanced SOW Generation
- **POST** `/api/sow/generate-enhanced` - Main enhanced SOW generation
- **POST** `/api/workflow/generate-sow` - Workflow-integrated SOW generation
- **GET** `/api/workflow/projects/:id/sow-status` - Check SOW generation readiness

### System Status & Health
- **GET** `/health` - Basic health check
- **GET** `/api/status` - Complete system status with file management info
- **GET** `/api/test/workflow-sow` - Workflow-SOW integration test
- **GET** `/api/test/file-management` - File management system test

### Template & Analysis
- **GET** `/api/sow/templates` - Available template mapping
- **POST** `/api/sow/debug-sections` - Section-specific analysis
- **POST** `/api/sow/debug-self-healing` - Self-healing analysis

## 🎯 Template Testing Matrix

The system now supports 4 main template types based on your project knowledge:

| Template ID | Description | Test Case | Expected Template |
|-------------|-------------|-----------|-------------------|
| T6 | Steel Deck Tearoff | Steel + TPO + Tearoff | `tearoff-tpo-ma-insul-steel` |
| T7 | LWC Steel Tearoff | LWC + TPO + Tearoff | `tearoff-tpo-ma-insul-lwc-steel` |
| T8 | Gypsum Tearoff | Gypsum + TPO + Tearoff | `tearoff-tpo-adhered-insul-adhered-gypsum` |
| T5 | SSR Recover | Steel + TPO + Recover | `recover-tpo-rhino-iso-eps-flute-fill-ssr` |

## 🔧 Enhanced Features

### 1. Intelligent Template Selection
- **Automatic detection** based on project type, deck type, and membrane
- **Fallback logic** for edge cases
- **Template validation** with compliance scoring

### 2. Enhanced PDF Formatting
- **Exact template matching** with pixel-perfect compliance
- **Yellow highlighting preservation** for important sections
- **Professional formatting** with consistent fonts and margins
- **Validation scoring** with detailed feedback

### 3. Multi-Role Workflow Integration
- **Inspector data compilation** - field measurements and observations
- **Consultant review integration** - client requirements and scope modifications
- **Engineering analysis** - technical decisions and professional judgment
- **Complete audit trail** - full workflow history in SOW documents

### 4. Advanced Analysis & Debugging
- **Real-time compliance scoring** with detailed feedback
- **Template accuracy validation** 
- **Content completeness analysis**
- **Formatting issue detection** with specific recommendations

## 🚨 Troubleshooting

### Server Won't Start
```bash
# Check Node.js version (should be 16+)
node --version

# Reinstall dependencies
cd server
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Curl Commands Fail
```bash
# Check if server is running
curl http://localhost:3001/health

# Check for CORS issues
curl -H "Origin: http://localhost:5173" http://localhost:3001/health
```

### PDFs Not Generating
```bash
# Check output directory permissions
ls -la output/

# Check server logs for errors
# Look for error messages in the terminal where server is running
```

### Tests Fail
```bash
# Check Node.js version and dependencies
node --version
cd development
npm init -y
npm install

# Test individual endpoints
curl -X POST http://localhost:3001/api/sow/generate-enhanced \
  -H "Content-Type: application/json" \
  -d '{"projectName": "Debug Test", "deckType": "steel", "projectType": "tearoff"}'
```

## 📈 Success Metrics

### Excellent Performance (90%+ scores)
- **Template matching** is 100% accurate
- **PDF generation** completes in <5 seconds
- **File sizes** are 300KB+ (indicating full content)
- **Page counts** are 20+ pages
- **No critical issues** in analysis

### Good Performance (75-89% scores)
- **Template matching** is mostly accurate
- **PDF generation** completes successfully
- **Minor formatting issues** that don't affect functionality
- **Adequate content** with room for improvement

### Needs Improvement (<75% scores)
- **Template selection** issues
- **PDF generation** failures or very small files
- **Major formatting problems**
- **Content missing** or incomplete

## 🎉 Next Steps After Testing

Based on your test results:

### If Average Score 85-100%
- ✅ **System is working well!**
- Focus on **increasing page count** and **detailed content**
- Consider **advanced formatting enhancements**
- Ready for **production testing**

### If Average Score 70-84%
- 👍 **Good foundation!**
- Focus on **template matching** improvements
- Address **formatting compliance** issues
- Review **content generation** depth

### If Average Score Below 70%
- ⚠️ **Needs attention!**
- Check **basic PDF generation** functionality
- Verify **template selection** logic
- Review **server configuration** and dependencies

## 📚 Development Workspace

After testing, you'll have:
```
/roof-sow-genesis/
├── development/
│   ├── test-pdf-simple.js ✅
│   ├── test-all-templates.js ✅
│   ├── template-test-results.json ✅ (generated)
│   └── pdf-issues-found.txt ✅ (manual notes)
├── output/
│   ├── Steel_Deck_Tearoff_Test_*.pdf ✅
│   ├── T6_Steel_Deck_Tearoff_Test_*.pdf ✅
│   └── T8_Gypsum_Adhered_Test_*.pdf ✅
├── server/
│   ├── index.ts ✅ (enhanced)
│   └── core/
│       └── workflow-sow-integration-enhanced.ts ✅
└── mcp-tools/
    └── analyze-pdf-output/
        └── index.ts ✅ (enhanced)
```

## 🔄 Continuous Improvement

The enhanced system provides:

1. **Real-time feedback** during development
2. **Automated testing** with detailed scoring
3. **Issue detection** with specific recommendations
4. **Template validation** with compliance metrics
5. **Performance monitoring** with benchmarks

This foundation enables rapid iteration and continuous improvement of the SOW generation system while maintaining professional quality and exact template compliance.

---

**Ready to test!** Start with Step 1 and work through the testing sequence. The system is designed to provide immediate feedback and help you identify areas for improvement.