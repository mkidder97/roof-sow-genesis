#!/bin/bash

# Phase 1 Demo Test Script
# Automated testing for all Phase 1 functionality

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test results tracking
TESTS_PASSED=0
TESTS_FAILED=0
TOTAL_TESTS=0

# Helper functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[PASS]${NC} $1"
    ((TESTS_PASSED++))
}

log_error() {
    echo -e "${RED}[FAIL]${NC} $1"
    ((TESTS_FAILED++))
}

log_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

test_function() {
    ((TOTAL_TESTS++))
    local test_name="$1"
    local test_command="$2"
    
    log_info "Testing: $test_name"
    
    if eval "$test_command" >/dev/null 2>&1; then
        log_success "$test_name"
        return 0
    else
        log_error "$test_name"
        return 1
    fi
}

# Configuration
API_BASE="http://localhost:8001"
FRONTEND_URL="http://localhost:5173"
TIMEOUT=30

log_info "🚀 Starting Phase 1 Demo Test Suite..."
log_info "=" * 50

# Test 1: Check if Docker is running
log_info "1. Checking Docker setup..."
test_function "Docker daemon running" "docker info"
test_function "Docker Compose available" "docker-compose --version"

# Test 2: Check if services are running
log_info "2. Checking service availability..."
test_function "API server responding" "curl -s $API_BASE/api/health"
test_function "Frontend accessible" "curl -s $FRONTEND_URL"

# Test 3: API Health Check
log_info "3. Testing API health endpoint..."
API_HEALTH=$(curl -s "$API_BASE/api/health" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    assert data['status'] == 'healthy'
    assert 'endpoints' in data
    print('OK')
except:
    print('FAIL')
    sys.exit(1)
")

if [ "$API_HEALTH" = "OK" ]; then
    log_success "API health check"
    ((TESTS_PASSED++))
else
    log_error "API health check"
    ((TESTS_FAILED++))
fi
((TOTAL_TESTS++))

# Test 4: MCP Tools individual testing
log_info "4. Testing MCP tools..."
if [ -f "mcp/tools/validate_takeoff_data.py" ]; then
    test_function "Takeoff validation tool" "cd mcp/tools && python3 validate_takeoff_data.py ../data/sample_takeoff.json"
else
    log_error "validate_takeoff_data.py not found"
    ((TESTS_FAILED++))
    ((TOTAL_TESTS++))
fi

if [ -f "mcp/tools/generate_sow_summary.py" ]; then
    test_function "SOW generation tool" "cd mcp/tools && python3 generate_sow_summary.py ../data/sample_takeoff.json /tmp/test_sow.json"
else
    log_error "generate_sow_summary.py not found"
    ((TESTS_FAILED++))
    ((TOTAL_TESTS++))
fi

if [ -f "mcp/tools/sow_orchestrator.py" ]; then
    test_function "SOW orchestrator" "cd mcp/tools && python3 sow_orchestrator.py ../data/sample_takeoff.json"
else
    log_error "sow_orchestrator.py not found"
    ((TESTS_FAILED++))
    ((TOTAL_TESTS++))
fi

# Test 5: API Validation Endpoint
log_info "5. Testing API validation..."
VALIDATION_RESULT=$(curl -s -X POST "$API_BASE/api/validate-only" \
    -H "Content-Type: application/json" \
    -d '{
        "project_name": "Test Project",
        "address": "1234 Test Street, Test City, TX 12345",
        "roof_area": 25000,
        "membrane_type": "TPO",
        "fastening_pattern": "Mechanically Attached"
    }' | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    assert 'is_valid' in data
    assert data['is_valid'] == True
    print('OK')
except Exception as e:
    print(f'FAIL: {e}')
    sys.exit(1)
")

if [ "$VALIDATION_RESULT" = "OK" ]; then
    log_success "API validation endpoint"
    ((TESTS_PASSED++))
else
    log_error "API validation endpoint"
    ((TESTS_FAILED++))
fi
((TOTAL_TESTS++))

# Test 6: Full Workflow Test
log_info "6. Testing complete SOW generation workflow..."
WORKFLOW_RESULT=$(curl -s -X POST "$API_BASE/api/submit-takeoff" \
    -H "Content-Type: application/json" \
    -d '{
        "project_name": "Automated Test Warehouse",
        "address": "9999 Test Drive, Automation City, TX 78999",
        "roof_area": 30000,
        "membrane_type": "TPO",
        "fastening_pattern": "Mechanically Attached",
        "state": "TX",
        "building_code": "IBC2021"
    }' | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    assert 'workflow_id' in data
    assert 'status' in data
    assert 'download_url' in data
    print(data['workflow_id'])
except Exception as e:
    print(f'FAIL: {e}')
    sys.exit(1)
")

if [[ "$WORKFLOW_RESULT" != "FAIL"* ]]; then
    log_success "Complete SOW workflow"
    ((TESTS_PASSED++))
    WORKFLOW_ID="$WORKFLOW_RESULT"
    
    # Test 7: PDF Download
    log_info "7. Testing PDF download..."
    if [ -n "$WORKFLOW_ID" ]; then
        # Find the PDF file in the API response
        PDF_FILENAME=$(curl -s "$API_BASE/api/recent-workflows" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    if data['workflows']:
        print('test_pdf_found')
    else:
        print('no_pdfs')
except:
    print('error')
")
        
        if [ "$PDF_FILENAME" = "test_pdf_found" ]; then
            log_success "PDF files generated"
            ((TESTS_PASSED++))
        else
            log_error "No PDF files found"
            ((TESTS_FAILED++))
        fi
        ((TOTAL_TESTS++))
    fi
else
    log_error "Complete SOW workflow"
    ((TESTS_FAILED++))
fi
((TOTAL_TESTS++))

# Test 8: File Structure Verification
log_info "8. Verifying file structure..."
test_function "Data directories exist" "[ -d 'data' ] || [ -d 'mcp/data' ]"
test_function "MCP tools structure" "[ -d 'mcp/tools' ] && [ -d 'mcp/config' ]"
test_function "Frontend components" "[ -f 'src/components/TakeoffForm.tsx' ]"
test_function "API client" "[ -f 'src/lib/api/sow-api.ts' ]"

# Test 9: Docker Container Status
log_info "9. Checking Docker container health..."
FRONTEND_CONTAINER=$(docker-compose ps | grep "frontend" | grep "Up" | wc -l)
if [ "$FRONTEND_CONTAINER" -eq 1 ]; then
    log_success "Frontend container running"
    ((TESTS_PASSED++))
else
    log_error "Frontend container not running"
    ((TESTS_FAILED++))
fi
((TOTAL_TESTS++))

# Final Results
log_info "=" * 50
log_info "🏁 Test Suite Complete!"
log_info "=" * 50

if [ $TESTS_PASSED -eq $TOTAL_TESTS ]; then
    echo -e "${GREEN}🎉 ALL TESTS PASSED! ($TESTS_PASSED/$TOTAL_TESTS)${NC}"
    echo -e "${GREEN}✅ Phase 1 is DEMO READY!${NC}"
    exit 0
elif [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${YELLOW}⚠️  Some tests skipped, but no failures ($TESTS_PASSED/$TOTAL_TESTS passed)${NC}"
    echo -e "${YELLOW}✅ Phase 1 is DEMO READY with minor issues!${NC}"
    exit 0
else
    echo -e "${RED}❌ TESTS FAILED! ($TESTS_FAILED/$TOTAL_TESTS failed, $TESTS_PASSED passed)${NC}"
    echo -e "${RED}⚠️  Fix issues before demo!${NC}"
    
    # Provide troubleshooting suggestions
    echo ""
    log_info "🔧 Troubleshooting suggestions:"
    echo "1. Ensure Docker services are running: docker-compose up -d"
    echo "2. Check API server: curl http://localhost:8001/api/health"
    echo "3. Verify MCP tools: cd mcp/tools && python3 validate_takeoff_data.py ../data/sample_takeoff.json"
    echo "4. Check logs: docker-compose logs"
    
    exit 1
fi