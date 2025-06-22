# Phase 1: Immediate Integration Fixes

## 1A: Connect Manufacturer Analysis Preview (3-4 hours)

### Problem
ManufacturerAnalysisPreview.tsx calls `/api/enhanced-intelligence` but this endpoint doesn't exist. The actual endpoint is `/api/sow/debug-sow` which returns manufacturer data.

### Solution
```typescript
// Update ManufacturerAnalysisPreview.tsx
const fetchAnalysisData = async () => {
  try {
    const response = await fetch('/api/sow/debug-sow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(projectData || {
        projectName: 'Analysis Preview',
        address: projectData?.address || 'Test Address',
        squareFootage: projectData?.squareFootage || 25000,
        buildingHeight: projectData?.buildingHeight || 35,
        projectType: projectData?.projectType || 'recover'
      })
    });
    
    const result = await response.json();
    
    if (result.success && result.engineeringSummary) {
      // Map the actual response to component format
      const manufacturerResults = extractManufacturerData(result.engineeringSummary);
      const windPressures = extractWindData(result.engineeringSummary);
      setAnalysisData({ manufacturerResults, windPressures });
    }
  } catch (error) {
    console.error('Error fetching analysis:', error);
  }
};
```

### Implementation Steps
1. Update API endpoint in ManufacturerAnalysisPreview.tsx
2. Add data mapping functions to transform debug-sow response
3. Test with real backend data
4. Verify manufacturer selection and wind pressure display

## 1B: Fix Takeoff Form Parsing Connection (2-3 hours)

### Problem
DocumentUploadSection.tsx uploads files but they're not processed by takeoff-engine.ts for real data extraction.

### Solution
```typescript
// Update server/routes/sow-enhanced.ts to process uploaded files
export async function processUploadedTakeoff(file: Express.Multer.File) {
  if (file) {
    const takeoffFile = {
      filename: file.originalname,
      buffer: file.buffer,
      mimetype: file.mimetype
    };
    
    const extractedData = await parseTakeoffFile(takeoffFile);
    return extractedData;
  }
  return null;
}

// Update debugSOWEnhanced to accept file uploads
app.post('/api/sow/debug-sow', upload.single('file'), debugSOWEnhanced);
```

### Implementation Steps
1. Add file processing to sow-enhanced.ts
2. Connect takeoff-engine.ts parsing to uploaded files
3. Return extracted data in API response
4. Update frontend to send files with project data

## 1C: Connect NOA Data Display (1-2 hours)

### Problem
Backend has manufacturer scrapers and NOA data but frontend doesn't display real approval information.

### Solution
```typescript
// Update ManufacturerAnalysisPreview.tsx to show real NOA data
const ManufacturerCard = ({ manufacturer, approvals }) => (
  // Display real NOA data from backend response
  {approvals && (
    <div className="space-y-2">
      <p className="font-medium text-gray-600">NOA Status</p>
      <div className="space-y-1 text-sm">
        <p><strong>NOA Number:</strong> {approvals.noaNumber || 'Checking...'}</p>
        <p><strong>HVHZ Approved:</strong> {approvals.hvhzApproved ? 'Yes' : 'No'}</p>
        <p><strong>Wind Rating:</strong> {approvals.windRating || 'N/A'} psf</p>
        {approvals.documents?.map((doc, index) => (
          <a key={index} href={doc.url} target="_blank" className="text-blue-600">
            {doc.title}
          </a>
        ))}
      </div>
    </div>
  )}
);
```

### Implementation Steps
1. Map NOA data from debug-sow response
2. Display real approval status in ManufacturerCard
3. Show document links and expiration dates
4. Add HVHZ compliance indicators

## Expected Outcome
After Phase 1, users will see:
- Real manufacturer analysis with actual approvals
- Uploaded takeoff forms processed for data extraction
- Live NOA status and document links
- Connected workflow from upload to analysis