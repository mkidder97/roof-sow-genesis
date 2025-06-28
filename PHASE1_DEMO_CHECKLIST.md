# 🎯 Phase 1 Demo Test Checklist

## ✅ **Pre-Demo Setup**

### **1. Local Environment Setup**
```bash
# Clone and sync
git clone https://github.com/mkidder97/roof-sow-genesis.git
cd roof-sow-genesis
git checkout phase-1-demo
git pull origin phase-1-demo

# Verify Docker setup
docker --version
docker-compose --version
```

### **2. MCP Tools Verification**
```bash
# Test individual tools
cd mcp/tools
python3 validate_takeoff_data.py ../data/sample_takeoff.json
python3 generate_sow_summary.py ../data/sample_takeoff.json test_output.json

# Test orchestrator
python3 sow_orchestrator.py ../data/sample_takeoff.json
```

### **3. Docker Build Test**
```bash
# Build containers
docker-compose build

# Start services
docker-compose up -d

# Verify ports
curl http://localhost:5173  # Frontend
curl http://localhost:8001/api/health  # API
```

## 🧪 **Demo Test Scenarios**

### **Test 1: API Health Check**
```bash
curl -X GET http://localhost:8001/api/health
```
**Expected Result:**
```json
{
  "status": "healthy",
  "service": "sow-generation-api",
  "version": "1.0.0",
  "endpoints": {
    "submit_takeoff": "/api/submit-takeoff",
    "validate_only": "/api/validate-only",
    "workflow_status": "/api/workflow/{workflow_id}",
    "download_pdf": "/api/download/pdf/{filename}",
    "recent_workflows": "/api/recent-workflows"
  }
}
```

### **Test 2: Takeoff Form Submission**
```bash
curl -X POST http://localhost:8001/api/submit-takeoff \
  -H "Content-Type: application/json" \
  -d '{
    "project_name": "Demo Warehouse",
    "address": "123 Demo Street, Austin, TX 78701",
    "roof_area": 25000,
    "membrane_type": "TPO",
    "fastening_pattern": "Mechanically Attached",
    "state": "TX",
    "building_code": "IBC2021"
  }'
```
**Expected Result:**
```json
{
  "workflow_id": "abc12345",
  "status": "success",
  "timestamp": "20250627_140000",
  "validation_passed": true,
  "download_url": "/api/download/pdf/sow_document_abc12345_20250627_140000.pdf",
  "validation_errors": [],
  "validation_warnings": []
}
```

### **Test 3: PDF Download**
```bash
# Use workflow_id from previous response
curl -X GET http://localhost:8001/api/download/pdf/sow_document_{workflow_id}_{timestamp}.pdf \
  -o demo_sow.pdf
```
**Expected Result:** PDF file downloaded successfully

### **Test 4: Validation Only**
```bash
curl -X POST http://localhost:8001/api/validate-only \
  -H "Content-Type: application/json" \
  -d '{
    "project_name": "Test Project",
    "address": "Invalid",
    "roof_area": -100,
    "membrane_type": "INVALID",
    "fastening_pattern": "INVALID"
  }'
```
**Expected Result:**
```json
{
  "is_valid": false,
  "errors": [
    "address: Minimum length is 10, got 7",
    "roof_area: Minimum value is 100, got -100",
    "membrane_type: Must be one of ['TPO', 'EPDM', 'PVC', 'Modified Bitumen', 'Built-Up'], got 'INVALID'",
    "fastening_pattern: Must be one of ['Mechanically Attached', 'Fully Adhered', 'Ballasted'], got 'INVALID'"
  ],
  "warnings": [],
  "error_count": 4,
  "warning_count": 0
}
```

### **Test 5: Frontend Integration**
1. **Navigate to:** http://localhost:5173
2. **Fill out form** with valid data
3. **Submit form** and verify API call
4. **Check response** for workflow ID and download URL
5. **Click download** and verify PDF retrieval

## 🎬 **Demo Script**

### **Demo Flow (5-7 minutes)**

1. **Introduction** (30 seconds)
   - "This is Phase 1 of our SOW automation system"
   - "Complete workflow from takeoff data to PDF generation"

2. **Show Architecture** (1 minute)
   - Frontend: React form on port 5173
   - API: FastAPI server on port 8001
   - MCP Tools: Python validation and generation
   - Docker: Containerized for consistent deployment

3. **Live Form Demo** (2 minutes)
   - Open http://localhost:5173
   - Fill out sample project:
     - Project: "Austin Distribution Center"
     - Address: "1234 Industrial Pkwy, Austin, TX 78744"
     - Roof Area: 35,000 sq ft
     - Membrane: TPO
     - Fastening: Mechanically Attached
   - Show real-time validation
   - Submit and show workflow response

4. **API Demonstration** (2 minutes)
   - Show API docs at http://localhost:8001/docs
   - Demonstrate direct API calls with curl
   - Show file structure in data/ directories

5. **Generated Output** (1 minute)
   - Download and open the PDF
   - Show structured SOW sections
   - Highlight calculated materials

6. **Technical Deep Dive** (1 minute)
   - Show MCP tools structure
   - Demonstrate CLI tools individually
   - Explain orchestration workflow

## ⚠️ **Common Issues & Solutions**

### **Issue: Port Already in Use**
```bash
# Check what's using the port
lsof -i :5173
lsof -i :8001

# Kill processes if needed
pkill -f "port 5173"
pkill -f "port 8001"
```

### **Issue: Docker Build Fails**
```bash
# Clear Docker cache
docker system prune -a

# Rebuild from scratch
docker-compose build --no-cache
```

### **Issue: Python Import Errors**
```bash
# Install dependencies manually
cd mcp/tools
pip3 install -r requirements.txt
```

### **Issue: API CORS Errors**
- Verify CORS settings in api_server.py include your frontend URL
- Check browser developer console for specific CORS errors

## 📊 **Success Metrics**

### ✅ **Demo Success Criteria:**
- [ ] All services start without errors
- [ ] Frontend loads and renders form correctly
- [ ] Form submission creates workflow successfully  
- [ ] Validation works (both success and error cases)
- [ ] PDF generation completes
- [ ] Download functionality works
- [ ] File structure shows organized data storage

### 📈 **Performance Benchmarks:**
- Form submission response: < 3 seconds
- PDF generation: < 5 seconds
- File validation: < 1 second
- Frontend load time: < 2 seconds

## 🔒 **Demo Security Notes**

- Demo uses mock PDF generation (not production-ready)
- No authentication required (development only)
- File storage is local (not production scalable)
- API allows all origins (development CORS)

---

**🎉 Phase 1 Demo Ready!**

This checklist ensures a smooth, professional demonstration of the SOW automation MVP. All core functionality is working and ready for stakeholder review.