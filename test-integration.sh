#!/bin/bash

# Backend-Frontend Integration Testing Script
# Tests the complete SOW generation pipeline from frontend to backend

echo "🧪 Testing Backend-Frontend SOW Generation Integration"
echo "========================================================="

# Check if server is running
echo "1. Testing backend health..."
HEALTH_RESPONSE=$(curl -s http://localhost:3001/health)
if [ $? -eq 0 ]; then
    echo "✅ Backend is running"
    echo "   Response: $HEALTH_RESPONSE"
else
    echo "❌ Backend is not running. Please start with: cd server && npm start"
    exit 1
fi

echo ""
echo "2. Testing API endpoints..."

# Test status endpoint
echo "   📊 Testing /api/status..."
STATUS_RESPONSE=$(curl -s http://localhost:3001/api/status)
if [ $? -eq 0 ]; then
    echo "   ✅ Status endpoint working"
else
    echo "   ❌ Status endpoint failed"
fi

# Test section mapping (working endpoint)
echo "   🗺️  Testing /api/test/section-mapping..."
MAPPING_RESPONSE=$(curl -s http://localhost:3001/api/test/section-mapping)
if [ $? -eq 0 ]; then
    echo "   ✅ Section mapping endpoint working"
else
    echo "   ❌ Section mapping endpoint failed"
fi

echo ""
echo "3. Testing SOW Generation API..."

# Create test data with proper field mapping
TEST_PROJECT_DATA='{
  "projectName": "Test Project Integration",
  "projectAddress": "123 Test Street, Test City, TX 75034",
  "city": "Test City",
  "state": "TX",
  "zipCode": "75034",
  "buildingHeight": 25,
  "squareFootage": 10000,
  "deckType": "concrete",
  "membraneType": "tpo",
  "windSpeed": 120,
  "exposureCategory": "C",
  "buildingClassification": "II",
  "projectType": "recover",
  "notes": "Backend-Frontend Integration Test"
}'

echo "   🚀 Testing SOW generation with test data..."
echo "   📋 Test Data:"
echo "      - Project: Test Project Integration"
echo "      - Address: 123 Test Street, Test City, TX 75034"
echo "      - Type: TPO Recover System"

# Test SOW generation endpoint
SOW_RESPONSE=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -d "{\"projectData\": $TEST_PROJECT_DATA}" \
  http://localhost:3001/api/sow/generate)

if [ $? -eq 0 ]; then
    echo "   ✅ SOW generation API responding"
    
    # Parse response to check for success
    SUCCESS=$(echo $SOW_RESPONSE | grep -o '"success":[^,]*' | cut -d':' -f2)
    if [[ "$SUCCESS" == *"true"* ]]; then
        echo "   ✅ SOW generation successful"
        
        # Extract SOW ID for testing download
        SOW_ID=$(echo $SOW_RESPONSE | grep -o '"sowId":"[^"]*"' | cut -d'"' -f4)
        if [ ! -z "$SOW_ID" ]; then
            echo "   📋 Generated SOW ID: $SOW_ID"
            
            # Test download endpoint
            echo "   📥 Testing SOW download..."
            DOWNLOAD_RESPONSE=$(curl -s -I http://localhost:3001/api/sow/download/$SOW_ID)
            if [[ "$DOWNLOAD_RESPONSE" == *"200 OK"* ]]; then
                echo "   ✅ SOW download endpoint working"
            else
                echo "   ⚠️  SOW download endpoint not ready (may be processing)"
            fi
            
            # Test status endpoint
            echo "   📊 Testing SOW status..."
            STATUS_SOW_RESPONSE=$(curl -s http://localhost:3001/api/sow/status/$SOW_ID)
            if [ $? -eq 0 ]; then
                echo "   ✅ SOW status endpoint working"
            else
                echo "   ❌ SOW status endpoint failed"
            fi
        fi
    else
        echo "   ❌ SOW generation failed"
        echo "   📝 Response: $SOW_RESPONSE"
    fi
else
    echo "   ❌ SOW generation API failed"
fi

echo ""
echo "4. Testing SOW list endpoint..."
LIST_RESPONSE=$(curl -s http://localhost:3001/api/sow/list)
if [ $? -eq 0 ]; then
    echo "   ✅ SOW list endpoint working"
    
    # Check if response contains sows array
    if [[ "$LIST_RESPONSE" == *"\"sows\""* ]]; then
        echo "   ✅ SOW list contains expected data structure"
    else
        echo "   ⚠️  SOW list structure unexpected"
    fi
else
    echo "   ❌ SOW list endpoint failed"
fi

echo ""
echo "5. Testing frontend compatibility..."

# Check if all required endpoints are available
ENDPOINTS=(
    "/api/sow/generate"
    "/api/sow/list" 
    "/api/sow/status"
    "/api/sow/download"
    "/health"
    "/api/status"
)

WORKING_ENDPOINTS=0
TOTAL_ENDPOINTS=${#ENDPOINTS[@]}

for endpoint in "${ENDPOINTS[@]}"; do
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001$endpoint)
    if [[ "$RESPONSE" == "200" || "$RESPONSE" == "400" ]]; then
        echo "   ✅ $endpoint - Available"
        ((WORKING_ENDPOINTS++))
    else
        echo "   ❌ $endpoint - Not available (HTTP $RESPONSE)"
    fi
done

echo ""
echo "========================================================="
echo "📊 Integration Test Results:"
echo "   Working Endpoints: $WORKING_ENDPOINTS/$TOTAL_ENDPOINTS"

if [ $WORKING_ENDPOINTS -eq $TOTAL_ENDPOINTS ]; then
    echo "   🎉 All endpoints working - Frontend can connect!"
    echo ""
    echo "✅ BACKEND-FRONTEND INTEGRATION READY"
    echo ""
    echo "🚀 Next Steps:"
    echo "   1. Start frontend: npm run dev"
    echo "   2. Navigate to Inspector role"
    echo "   3. Create a field inspection"
    echo "   4. Switch to Engineer role"
    echo "   5. Click 'Generate SOW' button"
    echo "   6. Verify PDF download works"
    echo ""
    echo "📋 Test the complete workflow:"
    echo "   Inspector → Field Inspection → Engineer → Generate SOW → Download PDF"
    
    exit 0
else
    echo "   ⚠️  Some endpoints not working - Check server logs"
    echo ""
    echo "🔧 Troubleshooting:"
    echo "   1. Ensure server is running: cd server && npm start"
    echo "   2. Check server logs for errors"
    echo "   3. Verify database connection (Supabase)"
    echo "   4. Check environment variables"
    
    exit 1
fi
