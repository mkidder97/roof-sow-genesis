#!/usr/bin/env node

const { exec } = require('child_process');
const fs = require('fs');

// Simple test configurations
const testConfigs = {
  'Steel-Deck-Tearoff': {
    projectName: 'Steel Deck Tearoff Test',
    address: '123 Steel Ave, Dallas, TX',
    projectType: 'tearoff',
    deckType: 'steel',
    membraneType: 'TPO',
    buildingHeight: 35,
    squareFootage: 50000
  },
  'Gypsum-Deck-Tearoff': {
    projectName: 'Gypsum Deck Tearoff Test',
    address: '456 Gypsum St, Houston, TX',
    projectType: 'tearoff',
    deckType: 'gypsum',
    membraneType: 'TPO',
    buildingHeight: 28,
    squareFootage: 35000
  }
};

async function runSimpleTest() {
  console.log('🔄 Starting simple PDF test...\n');
  
  for (const [testName, config] of Object.entries(testConfigs)) {
    console.log(`🧪 Testing: ${testName}`);
    
    try {
      const result = await generateSOW(config);
      
      if (result.success) {
        console.log(`   ✅ SUCCESS`);
        console.log(`   📄 PDF: ${result.outputPath}`);
        console.log(`   📏 Template: ${result.engineeringSummary?.templateSelection?.templateName || 'Unknown'}`);
        
        // Check if file exists
        if (fs.existsSync(result.outputPath)) {
          const stats = fs.statSync(result.outputPath);
          console.log(`   📊 Size: ${(stats.size / 1024).toFixed(1)} KB`);
        }
      } else {
        console.log(`   ❌ FAILED: ${result.error}`);
      }
    } catch (error) {
      console.log(`   ❌ ERROR: ${error.message}`);
    }
    
    console.log('');
  }
}

function generateSOW(config) {
  return new Promise((resolve, reject) => {
    const curlCommand = `curl -s -X POST http://localhost:3001/api/sow/generate-enhanced -H "Content-Type: application/json" -d '${JSON.stringify(config)}'`;
    
    exec(curlCommand, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(`Curl failed: ${error.message}`));
        return;
      }
      
      try {
        const result = JSON.parse(stdout);
        resolve(result);
      } catch (e) {
        reject(new Error(`Invalid JSON: ${stdout.slice(0, 100)}...`));
      }
    });
  });
}

// Run the test
runSimpleTest().catch(console.error);