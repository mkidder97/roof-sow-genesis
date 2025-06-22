# 🏭 Manufacturer Scraping System

## **Overview**

This directory contains the comprehensive manufacturer scraping system for the roof-sow-genesis project. The system provides **live manufacturer data** to enhance SOW generation with real-time product specifications, approvals, and wind ratings.

## **🎯 Key Features**

- **✅ Live Scraping**: Real-time data from manufacturer websites
- **✅ Multi-Manufacturer Support**: Carlisle, GAF, Johns Manville, Holcim, Sika
- **✅ Approval Validation**: FM, UL, and NOA verification
- **✅ Static + Live Hybrid**: Fallback to static data when scraping fails
- **✅ Intelligent Caching**: 24-hour cache for performance
- **✅ Rate Limiting**: Respectful scraping with delays

## **📁 File Structure**

```
server/scrapers/
├── manufacturer-scraping-service.js     # Main orchestration service
├── carlisle-real-scraper.js            # Carlisle-specific scraper
├── johns-manville-scraper.js           # Johns Manville scraper  
├── automated-approvals-service.js       # FM/UL/NOA validation
└── README.md                           # This file
```

## **🔧 Integration Points**

### **1. Enhanced Manufacturer Analysis Engine**
```javascript
// Located: server/manufacturer/EnhancedManufacturerAnalysisEngine.js
import { selectManufacturerPattern } from './EnhancedManufacturerAnalysisEngine.js';

const result = await selectManufacturerPattern({
  membraneType: 'TPO',
  windUpliftPressures: { zone3Corner: -45 },
  hvhz: true,
  projectType: 'recover'
});
```

### **2. Direct Scraper Usage**
```javascript
// Carlisle-specific data
import { CarlisleRealScraper } from './scrapers/carlisle-real-scraper.js';
const carlisle = new CarlisleRealScraper();
const codes = await carlisle.getCodeData({ systemType: 'TPO' });

// Multi-manufacturer data
import { ManufacturerScrapingService } from './scrapers/manufacturer-scraping-service.js';
const scraper = new ManufacturerScrapingService();
const allData = await scraper.getAllManufacturerData('TPO');
```

## **🏭 Supported Manufacturers**

| Manufacturer | Status | Data Sources | Approvals |
|-------------|--------|--------------|-----------|
| **Carlisle SynTec** | ✅ Live + Static | Code database, product specs | FM I-90, UL 580, NOA |
| **GAF** | ✅ Static + Template | Product pages, technical specs | FM, UL, Miami-Dade |
| **Johns Manville** | ✅ Live + Static | TPO membrane pages | FM, UL |
| **Holcim/Elevate** | ✅ Static + Template | System specifications | FM, UL, Florida #10264.1-R19 |
| **Sika** | ⚠️ Template Only | Basic product info | FM, European approvals |

## **📊 Data Output Format**

### **Enhanced Analysis Result**
```javascript
{
  selectedPattern: "GAF_TPO_HVHZ",
  manufacturer: "GAF",
  system: "EverGuard TPO Fleece-Back",
  fasteningSpecifications: {
    fieldSpacing: "9\" o.c.",
    perimeterSpacing: "6\" o.c.", 
    cornerSpacing: "4\" o.c.",
    penetrationDepth: "1 inch min"
  },
  approvals: ["FM I-175", "UL 580", "NOA 22-0208.03"],
  hasApprovals: true,
  metadata: {
    pressureCapacity: { zone3Corner: -90 },
    dataSource: "static_plus_live",
    liveDataSources: ["carlisle", "johnsManville"],
    enhancedAnalysis: true,
    approvalValidated: true
  },
  liveDataEnhancements: {
    newSystemsFound: 3,
    updatedSpecifications: [/*...*/],
    recommendations: [/*...*/]
  },
  approvalValidation: {
    windCompliance: { compliant: true, details: [/*...*/] },
    approvalData: { /*...complete approval info...*/ }
  }
}
```

## **🔄 Workflow Integration**

### **In SOW Generation Pipeline**
```javascript
// server/routes/sow-enhanced.js
import { EnhancedManufacturerAnalysisEngine } from '../manufacturer/EnhancedManufacturerAnalysisEngine.js';

export async function debugSOWEnhanced(req, res) {
  const engine = new EnhancedManufacturerAnalysisEngine();
  
  // Get enhanced manufacturer analysis with live data
  const manufacturerAnalysis = await engine.selectManufacturerSystemEnhanced({
    membraneType: payload.membraneType,
    windUpliftPressures: windAnalysis.pressures,
    hvhz: jurisdictionData.hvhz,
    projectType: payload.projectType
  });
  
  // Use in SOW generation...
}
```

## **⚡ Performance & Caching**

### **Cache Strategy**
- **Manufacturer Data**: 24 hours (daily updates)
- **Approval Data**: 7 days (weekly validation)
- **Code Documents**: 24 hours (occasional updates)

### **Rate Limiting**
- **2 seconds** between requests per manufacturer
- **Puppeteer instances** properly closed to prevent memory leaks
- **Graceful fallbacks** when scraping fails

## **🛠️ Configuration**

### **Environment Variables**
```bash
# Optional: Enhanced scraping capabilities
SCRAPING_ENABLED=true
SCRAPING_RATE_LIMIT_MS=2000
SCRAPING_CACHE_HOURS=24

# Puppeteer configuration
PUPPETEER_HEADLESS=true
PUPPETEER_TIMEOUT=30000
```

### **Error Handling**
```javascript
// Automatic fallback to static data
try {
  const liveData = await scraper.getLiveData();
  return enhanceWithLiveData(staticData, liveData);
} catch (error) {
  console.warn('Live scraping failed, using static data:', error.message);
  return staticData;
}
```

## **📈 Testing & Debugging**

### **Test Individual Scrapers**
```bash
# Test Carlisle scraper
cd server && npm run scrape:carlisle

# Test all manufacturers
cd server && npm run scrape:test

# Test approval validation
cd server && npm run scrape:approvals
```

### **Debug Live Data Integration**
```javascript
// Enable debug mode in SOW generation
const payload = {
  projectName: 'Test Project',
  membraneType: 'TPO',
  debugMode: true  // Shows live data sources
};
```

## **🔮 Future Enhancements**

### **Phase 1: Additional Manufacturers**
- **Tremco**: Liquid-applied systems
- **IKO**: Modified bitumen + single-ply
- **CertainTeed**: TPO and EPDM systems
- **Polyglass**: Self-adhered systems

### **Phase 2: Enhanced Data Sources**
- **Miami-Dade NOA Database**: Real-time NOA validation
- **ICC-ES ESR Database**: Evaluation service reports
- **FM Approvals Database**: Live approval status

### **Phase 3: Advanced Features**
- **NOA Expiration Monitoring**: Alert when approvals expire
- **Pressure Testing Database**: Historical uplift test results
- **Custom Fastening Calculators**: Manufacturer-specific tools

## **⚠️ Important Notes**

1. **Respect Website Terms**: All scraping follows robots.txt and rate limits
2. **Fallback Strategy**: Static data ensures system always works
3. **Professional Disclaimer**: Live data supplements but doesn't replace engineering review
4. **Cache Management**: Monitor cache hit rates for performance optimization

## **🎯 Integration with Main SOW System**

The scraper system integrates seamlessly with the existing manufacturer analysis:

1. **Static Analysis**: Baseline selection using `manufacturer-patterns.json`
2. **Live Enhancement**: Real-time data overlay from scrapers
3. **Approval Validation**: Cross-verification of certifications
4. **Intelligent Merging**: Best-of-both approach for reliability

This hybrid approach ensures **maximum reliability** with **enhanced accuracy** from live data sources.
