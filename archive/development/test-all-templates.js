#!/usr/bin/env node

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Test all 4 template types from your project knowledge
const templateTests = {
  'T6-Tearoff-Steel': {
    projectName: 'T6 Steel Deck Tearoff Test',
    address: '1505 Wallace Rd, Carrollton, TX',
    projectType: 'tearoff',
    deckType: 'steel', 
    membraneType: 'TPO',
    buildingHeight: 35,
    squareFootage: 154400,
    expectedTemplate: 'tearoff-tpo-ma-insul-steel'
  },
  'T7-Tearoff-LWC-Steel': {
    projectName: 'T7 LWC Steel Tearoff Test',
    address: '1505 Wallace Rd, Carrollton, TX',
    projectType: 'tearoff',
    deckType: 'lwc',
    membraneType: 'TPO', 
    buildingHeight: 35,
    squareFootage: 154400,
    expectedTemplate: 'tearoff-tpo-ma-insul-lwc-steel'
  },
  'T8-Tearoff-Gypsum': {
    projectName: 'T8 Gypsum Adhered Test',
    address: '2091-2115 Faulkner Rd NE, Atlanta, GA',
    projectType: 'tearoff',
    deckType: 'gypsum',
    membraneType: 'TPO',
    buildingHeight: 30,
    squareFootage: 49630,
    expectedTemplate: 'tearoff-tpo-adhered-insul-adhered-gypsum'
  },
  'T5-Recover-SSR': {
    projectName: 'T5 Standing Seam Recover Test',
    address: '1505 Wallace Rd, Carrollton, TX', 
    projectType: 'recover',
    deckType: 'steel',
    membraneType: 'TPO',
    buildingHeight: 35,
    squareFootage: 154400,
    expectedTemplate: 'recover-tpo-rhino-iso-eps-flute-fill-ssr'
  }
};

async function runAllTemplateTests() {
  console.log('🔄 Testing ALL Template Types...\n');
  console.log('This will test the 4 main templates from your project knowledge.\n');
  
  const results = {};
  let totalScore = 0;
  let testCount = 0;
  
  for (const [testName, config] of Object.entries(templateTests)) {
    console.log(`🧪 Testing: ${testName}`);
    console.log(`   📍 Expected Template: ${config.expectedTemplate}`);
    
    try {
      const result = await generateSOW(config);
      
      if (result.success) {
        console.log(`   ✅ SUCCESS`);
        console.log(`   📄 PDF: ${path.basename(result.outputPath)}`);
        
        const actualTemplate = result.engineeringSummary?.templateSelection?.templateName;
        const templateMatch = actualTemplate === config.expectedTemplate;
        
        console.log(`   📏 Template: ${actualTemplate || 'Unknown'}`);
        console.log(`   🎯 Template Match: ${templateMatch ? '✅' : '❌'}`);
        
        // Check file size and pages
        if (fs.existsSync(result.outputPath)) {
          const stats = fs.statSync(result.outputPath);
          const sizeKB = (stats.size / 1024).toFixed(1);
          console.log(`   📊 Size: ${sizeKB} KB`);
          
          // Estimate pages (rough estimate: 50KB per page average)
          const estimatedPages = Math.round(stats.size / (50 * 1024));
          console.log(`   📄 Est. Pages: ${estimatedPages}`);
          
          if (estimatedPages >= 20) {
            console.log(`   📏 Page Count: ✅ Good (${estimatedPages}+ pages)`);
          } else {
            console.log(`   📏 Page Count: ⚠️ Low (${estimatedPages} pages)`);
          }
        }
        
        // Calculate simple score
        let score = 60; // Base score
        if (templateMatch) score += 25;
        if (result.outputPath && fs.existsSync(result.outputPath)) score += 15;
        
        results[testName] = {
          success: true,
          score: score,
          templateMatch: templateMatch,
          actualTemplate: actualTemplate,
          pdfPath: result.outputPath
        };
        
        totalScore += score;
        testCount++;
        
        console.log(`   🎯 Score: ${score}/100`);
        
      } else {
        console.log(`   ❌ FAILED: ${result.error}`);
        results[testName] = { success: false, error: result.error, score: 0 };
      }
      
    } catch (error) {
      console.log(`   ❌ ERROR: ${error.message}`);
      results[testName] = { success: false, error: error.message, score: 0 };
    }
    
    console.log('');
  }
  
  // Summary
  console.log('📊 TEMPLATE TEST SUMMARY');
  console.log('========================');
  
  const avgScore = testCount > 0 ? Math.round(totalScore / testCount) : 0;
  
  for (const [testName, result] of Object.entries(results)) {
    if (result.success) {
      const status = result.templateMatch ? '✅' : '⚠️';
      console.log(`${testName}: ${result.score}/100 ${status}`);
    } else {
      console.log(`${testName}: FAILED ❌`);
    }
  }
  
  console.log(`\nOverall Average: ${avgScore}/100`);
  
  if (avgScore >= 90) {
    console.log('🎉 EXCELLENT! Templates are working well.');
  } else if (avgScore >= 75) {
    console.log('👍 GOOD! Minor improvements needed.');
  } else if (avgScore >= 60) {
    console.log('⚠️ OKAY! Some template issues to address.');
  } else {
    console.log('❌ NEEDS WORK! Major template problems.');
  }
  
  // Save results
  fs.writeFileSync('./development/template-test-results.json', JSON.stringify(results, null, 2));
  console.log('\n📁 Results saved to development/template-test-results.json');
  
  return results;
}

function generateSOW(config) {
  return new Promise((resolve, reject) => {
    const curlCommand = `curl -s -X POST http://localhost:3001/api/sow/generate-enhanced -H "Content-Type: application/json" -d '${JSON.stringify(config)}'`;
    
    exec(curlCommand, { timeout: 30000 }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(`Request failed: ${error.message}`));
        return;
      }
      
      try {
        const result = JSON.parse(stdout);
        resolve(result);
      } catch (e) {
        reject(new Error(`Invalid response: ${stdout.slice(0, 200)}...`));
      }
    });
  });
}

// Run if called directly
if (require.main === module) {
  runAllTemplateTests().catch(console.error);
}

module.exports = { runAllTemplateTests };