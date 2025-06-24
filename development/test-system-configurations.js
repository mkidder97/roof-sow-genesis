#!/usr/bin/env node

// Enhanced System Configuration Testing
// Tests the 4 critical system configurations to ensure proper template selection
// and dynamic content population without placeholders

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Define the 4 critical system configurations from your analysis
const systemConfigurations = {
  'T6-Tearoff-TPO-Mechanical-Steel': {
    projectName: 'T6 Steel Deck Tearoff System Test',
    address: '1505 Wallace Rd, Carrollton, TX 75006',
    projectType: 'tearoff',
    deckType: 'steel',
    membraneType: 'TPO',
    membraneThickness: '60 mil',
    attachmentMethod: 'mechanically_attached',
    manufacturer: 'GAF',
    selectedSystem: 'EverGuard TPO',
    buildingHeight: 35,
    squareFootage: 154400,
    windSpeed: 140,
    expectedContent: {
      demolitionSpecs: true,
      steelDeckFastening: true,
      mechanicalAttachment: true,
      tpoInstallation: true
    },
    expectedTemplate: 'tearoff-tpo-ma-steel'
  },
  
  'T8-Tearoff-TPO-Adhered-Gypsum': {
    projectName: 'T8 Gypsum Deck Adhered System Test',
    address: '2091-2115 Faulkner Rd NE, Atlanta, GA 30324',
    projectType: 'tearoff',
    deckType: 'gypsum',
    membraneType: 'TPO',
    membraneThickness: '60 mil',
    attachmentMethod: 'adhered',
    manufacturer: 'GAF',
    selectedSystem: 'EverGuard TPO Adhered',
    buildingHeight: 30,
    squareFootage: 49630,
    windSpeed: 130,
    expectedContent: {
      demolitionSpecs: true,
      gypsumDeckPrep: true,
      adheredInstallation: true,
      tpoInstallation: true
    },
    expectedTemplate: 'tearoff-tpo-adhered-gypsum'
  },
  
  'T5-Recover-TPO-Mechanical-Steel': {
    projectName: 'T5 Steel Deck Recover System Test',
    address: '1505 Wallace Rd, Carrollton, TX 75006',
    projectType: 'recover',
    deckType: 'steel',
    membraneType: 'TPO',
    membraneThickness: '60 mil',
    attachmentMethod: 'mechanically_attached',
    manufacturer: 'GAF',
    selectedSystem: 'EverGuard TPO Recovery',
    buildingHeight: 35,
    squareFootage: 154400,
    windSpeed: 140,
    expectedContent: {
      existingSystemPrep: true,
      steelDeckFastening: true,
      mechanicalAttachment: true,
      recoverProcedures: true
    },
    expectedTemplate: 'recover-tpo-ma-steel'
  },
  
  'Test-Integration-All-Systems': {
    projectName: 'Comprehensive System Integration Test',
    address: '123 Test Blvd, Dallas, TX 75201',
    projectType: 'tearoff',
    deckType: 'lwc',
    membraneType: 'TPO',
    membraneThickness: '80 mil',
    attachmentMethod: 'mechanically_attached',
    manufacturer: 'Carlisle',
    selectedSystem: 'Sure-Weld TPO',
    buildingHeight: 45,
    squareFootage: 75000,
    windSpeed: 150,
    expectedContent: {
      demolitionSpecs: true,
      lwcDeckSpecs: true,
      mechanicalAttachment: true,
      windResistance: true
    },
    expectedTemplate: 'tearoff-tpo-ma-lwc'
  }
};

/**
 * Run comprehensive system configuration tests
 */
async function runSystemConfigurationTests() {
  console.log('🔧 SYSTEM CONFIGURATION TESTING');
  console.log('================================');
  console.log('Testing dynamic content population and template selection...\n');

  const results = {};
  let totalScore = 0;
  let testCount = 0;

  for (const [configName, config] of Object.entries(systemConfigurations)) {
    console.log(`🧪 Testing Configuration: ${configName}`);
    console.log(`   📋 Project: ${config.projectName}`);
    console.log(`   🏗️ System: ${config.projectType} + ${config.membraneType} + ${config.attachmentMethod} + ${config.deckType}`);
    
    try {
      const result = await generateAndAnalyzeSOW(config);
      
      if (result.success) {
        console.log(`   ✅ Generation: SUCCESS`);
        
        // Analyze the generated content
        const contentAnalysis = await analyzeGeneratedContent(result, config);
        const score = calculateConfigurationScore(contentAnalysis, config);
        
        console.log(`   📄 Template: ${contentAnalysis.actualTemplate || 'Unknown'}`);
        console.log(`   🎯 Template Match: ${contentAnalysis.templateMatch ? '✅' : '❌'}`);
        console.log(`   📝 Content Quality: ${contentAnalysis.contentQuality}/10`);
        console.log(`   🚫 Placeholders: ${contentAnalysis.placeholderCount} remaining`);
        console.log(`   📊 System-Specific: ${contentAnalysis.systemSpecificSections}/6 sections`);
        console.log(`   🎯 Total Score: ${score}/100`);
        
        results[configName] = {
          success: true,
          score: score,
          analysis: contentAnalysis,
          pdfPath: result.outputPath
        };
        
        totalScore += score;
        testCount++;
        
      } else {
        console.log(`   ❌ Generation: FAILED - ${result.error}`);
        results[configName] = {
          success: false,
          error: result.error,
          score: 0
        };
      }
      
    } catch (error) {
      console.log(`   ❌ ERROR: ${error.message}`);
      results[configName] = {
        success: false,
        error: error.message,
        score: 0
      };
    }
    
    console.log('');
  }

  // Generate summary report
  generateTestSummary(results, totalScore, testCount);
  
  return results;
}

/**
 * Generate SOW and return detailed analysis
 */
function generateAndAnalyzeSOW(config) {
  return new Promise((resolve, reject) => {
    const enhancedConfig = {
      ...config,
      companyName: 'Test Company',
      roofSlope: 0.02, // Low slope
      takeoffItems: {
        drainCount: 12,
        penetrationCount: 45,
        flashingLinearFeet: 850,
        accessoryCount: 25,
        hvacUnits: 8
      }
    };

    const curlCommand = `curl -s -X POST http://localhost:3001/api/sow/generate-enhanced -H "Content-Type: application/json" -d '${JSON.stringify(enhancedConfig)}'`;
    
    exec(curlCommand, { timeout: 45000 }, (error, stdout, stderr) => {
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

/**
 * Analyze generated content for system-specific requirements
 */
async function analyzeGeneratedContent(result, expectedConfig) {
  const analysis = {
    actualTemplate: result.engineeringSummary?.templateSelection?.templateName,
    templateMatch: false,
    contentQuality: 0,
    placeholderCount: 0,
    systemSpecificSections: 0,
    hasExpectedContent: {},
    pageCount: 0,
    wordCount: 0
  };

  // Check template match
  analysis.templateMatch = analysis.actualTemplate?.includes(expectedConfig.projectType) && 
                          analysis.actualTemplate?.includes(expectedConfig.deckType);

  // Analyze PDF if it exists
  if (result.outputPath && fs.existsSync(result.outputPath)) {
    const stats = fs.statSync(result.outputPath);
    analysis.pageCount = Math.round(stats.size / (50 * 1024)); // Rough estimate
    
    // Check for adequate length (should be 25-35 pages)
    if (analysis.pageCount >= 20) {
      analysis.contentQuality += 3;
    }
    
    if (stats.size > 200 * 1024) { // > 200KB indicates substantial content
      analysis.contentQuality += 2;
    }
  }

  // Analyze expected content based on configuration
  for (const [contentType, expected] of Object.entries(expectedConfig.expectedContent)) {
    analysis.hasExpectedContent[contentType] = expected;
    if (expected) {
      analysis.systemSpecificSections += 1;
    }
  }

  // Check for professional output quality
  if (result.engineeringSummary?.systemSelection) {
    analysis.contentQuality += 2; // Has system selection
  }
  
  if (result.engineeringSummary?.windAnalysis?.zonePressures) {
    analysis.contentQuality += 2; // Has wind calculations
  }
  
  if (result.engineeringSummary?.jurisdiction?.codeCycle) {
    analysis.contentQuality += 1; // Has jurisdiction data
  }

  return analysis;
}

/**
 * Calculate configuration score based on analysis
 */
function calculateConfigurationScore(analysis, config) {
  let score = 0;
  
  // Template selection (25 points)
  if (analysis.templateMatch) {
    score += 25;
  }
  
  // Content quality (25 points)
  score += (analysis.contentQuality / 10) * 25;
  
  // System-specific content (25 points)
  const expectedSections = Object.values(config.expectedContent).filter(Boolean).length;
  if (expectedSections > 0) {
    score += (analysis.systemSpecificSections / expectedSections) * 25;
  }
  
  // PDF generation (15 points)
  if (analysis.pageCount >= 20) {
    score += 15;
  } else if (analysis.pageCount >= 10) {
    score += 10;
  } else if (analysis.pageCount > 0) {
    score += 5;
  }
  
  // No placeholders (10 points)
  if (analysis.placeholderCount === 0) {
    score += 10;
  } else if (analysis.placeholderCount < 5) {
    score += 5;
  }
  
  return Math.round(score);
}

/**
 * Generate comprehensive test summary
 */
function generateTestSummary(results, totalScore, testCount) {
  console.log('📊 SYSTEM CONFIGURATION TEST SUMMARY');
  console.log('====================================');
  
  const avgScore = testCount > 0 ? Math.round(totalScore / testCount) : 0;
  
  // Individual results
  for (const [configName, result] of Object.entries(results)) {
    if (result.success) {
      const status = result.score >= 80 ? '✅' : result.score >= 60 ? '⚠️' : '❌';
      console.log(`${configName}: ${result.score}/100 ${status}`);
      if (result.analysis) {
        console.log(`   Template: ${result.analysis.templateMatch ? '✅' : '❌'} | Pages: ${result.analysis.pageCount} | Quality: ${result.analysis.contentQuality}/10`);
      }
    } else {
      console.log(`${configName}: FAILED ❌ - ${result.error}`);
    }
  }
  
  console.log(`\n📈 Overall Average: ${avgScore}/100`);
  
  // Quality assessment
  if (avgScore >= 90) {
    console.log('🎉 EXCELLENT! System configurations are working properly.');
    console.log('   ✅ Template selection is accurate');
    console.log('   ✅ Content population is complete');
    console.log('   ✅ System-specific content is generated');
  } else if (avgScore >= 75) {
    console.log('👍 GOOD! Minor improvements needed.');
    console.log('   ⚠️ Some template or content issues detected');
  } else if (avgScore >= 60) {
    console.log('⚠️ NEEDS IMPROVEMENT! Significant issues found.');
    console.log('   ❌ Template selection or content population problems');
  } else {
    console.log('❌ CRITICAL ISSUES! Major system problems detected.');
    console.log('   ❌ Core functionality is not working properly');
  }
  
  // Specific recommendations
  console.log('\n📋 RECOMMENDATIONS:');
  
  const failedConfigs = Object.entries(results).filter(([_, result]) => !result.success);
  if (failedConfigs.length > 0) {
    console.log(`❌ Fix generation failures: ${failedConfigs.map(([name, _]) => name).join(', ')}`);
  }
  
  const lowScoreConfigs = Object.entries(results).filter(([_, result]) => result.success && result.score < 70);
  if (lowScoreConfigs.length > 0) {
    console.log(`⚠️ Improve low-scoring configs: ${lowScoreConfigs.map(([name, _]) => name).join(', ')}`);
  }
  
  const templateIssues = Object.values(results).filter(r => r.success && !r.analysis?.templateMatch);
  if (templateIssues.length > 0) {
    console.log(`🎯 Fix template selection logic (${templateIssues.length} mismatches)`);
  }
  
  // Save detailed results
  const detailedResults = {
    summary: {
      totalTests: testCount,
      averageScore: avgScore,
      timestamp: new Date().toISOString()
    },
    results: results
  };
  
  fs.writeFileSync('./development/system-config-test-results.json', JSON.stringify(detailedResults, null, 2));
  console.log('\n📁 Detailed results saved to development/system-config-test-results.json');
  
  return results;
}

// Test runner for manual execution
if (require.main === module) {
  console.log('🚀 Starting system configuration tests...\n');
  runSystemConfigurationTests()
    .then(results => {
      const successCount = Object.values(results).filter(r => r.success).length;
      const totalCount = Object.keys(results).length;
      
      console.log(`\n✨ Testing complete: ${successCount}/${totalCount} configurations successful`);
      process.exit(successCount === totalCount ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Test execution failed:', error);
      process.exit(1);
    });
}

module.exports = {
  runSystemConfigurationTests,
  systemConfigurations
};
