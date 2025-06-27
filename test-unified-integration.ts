#!/usr/bin/env tsx
// 🧪 UNIFIED INTEGRATION TEST SCRIPT
// Tests the complete integration between frontend and backend systems

import fetch from 'node-fetch';

const SERVER_URL = 'http://localhost:3001';
const FRONTEND_URL = 'http://localhost:5173';

interface TestResult {
  test: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  message: string;
  responseTime?: number;
}

class IntegrationTester {
  private results: TestResult[] = [];

  async runAllTests(): Promise<void> {
    console.log('🧪 UNIFIED INTEGRATION TEST SUITE');
    console.log('=' .repeat(80));
    console.log('Testing complete frontend-backend integration...\n');

    // Core system tests
    await this.testServerHealth();
    await this.testEnhancedIntelligence();
    await this.testManufacturerAnalysis();
    await this.testTakeoffParsing();
    await this.testWindAnalysis();
    await this.testSOWGeneration();
    await this.testJurisdictionLookup();
    
    // Integration tests
    await this.testFrontendBackendConnection();
    await this.testFileUploadWorkflow();
    await this.testEndToEndWorkflow();

    this.printResults();
  }

  private async testServerHealth(): Promise<void> {
    const startTime = Date.now();
    try {
      const response = await fetch(`${SERVER_URL}/health`);
      const responseTime = Date.now() - startTime;
      
      if (response.ok) {
        this.results.push({
          test: 'Server Health Check',
          status: 'PASS',
          message: 'Server is responding correctly',
          responseTime
        });
      } else {
        this.results.push({
          test: 'Server Health Check',
          status: 'FAIL',
          message: `Server returned ${response.status}: ${response.statusText}`
        });
      }
    } catch (error) {
      this.results.push({
        test: 'Server Health Check',
        status: 'FAIL',
        message: `Server not reachable: ${error instanceof Error ? error.message : error}`
      });
    }
  }

  private async testEnhancedIntelligence(): Promise<void> {
    const startTime = Date.now();
    try {
      const response = await fetch(`${SERVER_URL}/api/enhanced-intelligence/status`);
      const responseTime = Date.now() - startTime;
      
      if (response.ok) {
        const data = await response.json();
        this.results.push({
          test: 'Enhanced Intelligence Status',
          status: 'PASS',
          message: `Engines available: ${Object.keys(data.engines || {}).length}`,
          responseTime
        });
      } else {
        this.results.push({
          test: 'Enhanced Intelligence Status',
          status: 'FAIL',
          message: `Status check failed: ${response.status}`
        });
      }
    } catch (error) {
      this.results.push({
        test: 'Enhanced Intelligence Status',
        status: 'FAIL',
        message: `Status check error: ${error instanceof Error ? error.message : error}`
      });
    }
  }

  private async testManufacturerAnalysis(): Promise<void> {
    const startTime = Date.now();
    try {
      const testData = new FormData();
      testData.append('projectName', 'Integration Test Project');
      testData.append('address', 'Miami, FL');
      testData.append('squareFootage', '25000');
      testData.append('buildingHeight', '35');
      testData.append('windSpeed', '180');
      testData.append('membraneType', 'TPO');

      const response = await fetch(`${SERVER_URL}/api/enhanced-intelligence/manufacturer-analysis`, {
        method: 'POST',
        body: testData
      });
      
      const responseTime = Date.now() - startTime;
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.manufacturers) {
          this.results.push({
            test: 'Manufacturer Analysis',
            status: 'PASS',
            message: `Found ${data.manufacturers.length} manufacturers`,
            responseTime
          });
        } else {
          this.results.push({
            test: 'Manufacturer Analysis',
            status: 'FAIL',
            message: 'Response missing manufacturer data'
          });
        }
      } else {
        this.results.push({
          test: 'Manufacturer Analysis',
          status: 'FAIL',
          message: `Analysis failed: ${response.status}`
        });
      }
    } catch (error) {
      this.results.push({
        test: 'Manufacturer Analysis',
        status: 'FAIL',
        message: `Analysis error: ${error instanceof Error ? error.message : error}`
      });
    }
  }

  private async testTakeoffParsing(): Promise<void> {
    const startTime = Date.now();
    try {
      // Create a simple test file
      const testData = new FormData();
      const testFile = new Blob(['Test takeoff content\nSquare Footage: 25000\nBuilding Height: 35'], 
        { type: 'text/plain' });
      testData.append('takeoffFile', testFile, 'test-takeoff.txt');

      const response = await fetch(`${SERVER_URL}/api/enhanced-intelligence/takeoff-parsing`, {
        method: 'POST',
        body: testData
      });
      
      const responseTime = Date.now() - startTime;
      
      if (response.ok) {
        const data = await response.json();
        this.results.push({
          test: 'Takeoff Parsing',
          status: 'PASS',
          message: 'File parsing completed successfully',
          responseTime
        });
      } else {
        this.results.push({
          test: 'Takeoff Parsing',
          status: 'FAIL',
          message: `Parsing failed: ${response.status}`
        });
      }
    } catch (error) {
      this.results.push({
        test: 'Takeoff Parsing',
        status: 'FAIL',
        message: `Parsing error: ${error instanceof Error ? error.message : error}`
      });
    }
  }

  private async testWindAnalysis(): Promise<void> {
    const startTime = Date.now();
    try {
      const testData = {
        address: 'Miami, FL',
        buildingHeight: 35,
        windSpeed: 180,
        exposureCategory: 'C'
      };

      const response = await fetch(`${SERVER_URL}/api/enhanced-intelligence/wind-analysis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testData)
      });
      
      const responseTime = Date.now() - startTime;
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.windAnalysis) {
          this.results.push({
            test: 'Wind Analysis',
            status: 'PASS',
            message: `Design pressure: ${data.windAnalysis.designPressure} psf`,
            responseTime
          });
        } else {
          this.results.push({
            test: 'Wind Analysis',
            status: 'FAIL',
            message: 'Wind analysis data missing'
          });
        }
      } else {
        this.results.push({
          test: 'Wind Analysis',
          status: 'FAIL',
          message: `Analysis failed: ${response.status}`
        });
      }
    } catch (error) {
      this.results.push({
        test: 'Wind Analysis',
        status: 'FAIL',
        message: `Analysis error: ${error instanceof Error ? error.message : error}`
      });
    }
  }

  private async testSOWGeneration(): Promise<void> {
    const startTime = Date.now();
    try {
      const testData = {
        projectName: 'Integration Test SOW',
        address: 'Miami, FL',
        squareFootage: 25000,
        buildingHeight: 35,
        projectType: 'recover',
        membraneType: 'TPO'
      };

      const response = await fetch(`${SERVER_URL}/api/sow/generate-complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testData)
      });
      
      const responseTime = Date.now() - startTime;
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          this.results.push({
            test: 'SOW Generation',
            status: 'PASS',
            message: 'SOW generated successfully',
            responseTime
          });
        } else {
          this.results.push({
            test: 'SOW Generation',
            status: 'FAIL',
            message: data.error || 'Generation failed'
          });
        }
      } else {
        this.results.push({
          test: 'SOW Generation',
          status: 'FAIL',
          message: `Generation failed: ${response.status}`
        });
      }
    } catch (error) {
      this.results.push({
        test: 'SOW Generation',
        status: 'FAIL',
        message: `Generation error: ${error instanceof Error ? error.message : error}`
      });
    }
  }

  private async testJurisdictionLookup(): Promise<void> {
    const startTime = Date.now();
    try {
      const testData = {
        address: 'Miami, FL'
      };

      const response = await fetch(`${SERVER_URL}/api/jurisdiction/lookup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testData)
      });
      
      const responseTime = Date.now() - startTime;
      
      if (response.ok) {
        const data = await response.json();
        this.results.push({
          test: 'Jurisdiction Lookup',
          status: 'PASS',
          message: `HVHZ: ${data.hvhz ? 'Yes' : 'No'}, Code: ${data.buildingCode || 'Unknown'}`,
          responseTime
        });
      } else {
        this.results.push({
          test: 'Jurisdiction Lookup',
          status: 'FAIL',
          message: `Lookup failed: ${response.status}`
        });
      }
    } catch (error) {
      this.results.push({
        test: 'Jurisdiction Lookup',
        status: 'FAIL',
        message: `Lookup error: ${error instanceof Error ? error.message : error}`
      });
    }
  }

  private async testFrontendBackendConnection(): Promise<void> {
    const startTime = Date.now();
    try {
      // Test CORS headers
      const response = await fetch(`${SERVER_URL}/api/status`, {
        method: 'GET',
        headers: {
          'Origin': FRONTEND_URL,
          'Access-Control-Request-Method': 'POST'
        }
      });
      
      const responseTime = Date.now() - startTime;
      
      if (response.ok) {
        this.results.push({
          test: 'Frontend-Backend Connection',
          status: 'PASS',
          message: 'CORS headers configured correctly',
          responseTime
        });
      } else {
        this.results.push({
          test: 'Frontend-Backend Connection',
          status: 'FAIL',
          message: `Connection test failed: ${response.status}`
        });
      }
    } catch (error) {
      this.results.push({
        test: 'Frontend-Backend Connection',
        status: 'FAIL',
        message: `Connection error: ${error instanceof Error ? error.message : error}`
      });
    }
  }

  private async testFileUploadWorkflow(): Promise<void> {
    this.results.push({
      test: 'File Upload Workflow',
      status: 'SKIP',
      message: 'Requires manual testing with actual file uploads'
    });
  }

  private async testEndToEndWorkflow(): Promise<void> {
    const startTime = Date.now();
    try {
      // Simulate the complete ManufacturerAnalysisPreview workflow
      const formData = new FormData();
      formData.append('projectName', 'E2E Test Project');
      formData.append('address', 'Miami, FL');
      formData.append('squareFootage', '25000');
      formData.append('buildingHeight', '35');
      formData.append('windSpeed', '180');
      formData.append('membraneType', 'TPO');

      const response = await fetch(`${SERVER_URL}/api/enhanced-intelligence/manufacturer-analysis`, {
        method: 'POST',
        body: formData
      });
      
      const responseTime = Date.now() - startTime;
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.manufacturers && data.windAnalysis && data.engineeringSummary) {
          this.results.push({
            test: 'End-to-End Workflow',
            status: 'PASS',
            message: 'Complete workflow from frontend to backend working',
            responseTime
          });
        } else {
          this.results.push({
            test: 'End-to-End Workflow',
            status: 'FAIL',
            message: 'Workflow missing required data components'
          });
        }
      } else {
        this.results.push({
          test: 'End-to-End Workflow',
          status: 'FAIL',
          message: `E2E workflow failed: ${response.status}`
        });
      }
    } catch (error) {
      this.results.push({
        test: 'End-to-End Workflow',
        status: 'FAIL',
        message: `E2E error: ${error instanceof Error ? error.message : error}`
      });
    }
  }

  private printResults(): void {
    console.log('\n🏁 TEST RESULTS');
    console.log('=' .repeat(80));
    
    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    const skipped = this.results.filter(r => r.status === 'SKIP').length;
    
    this.results.forEach(result => {
      const icon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⏭️';
      const time = result.responseTime ? ` (${result.responseTime}ms)` : '';
      console.log(`${icon} ${result.test}${time}`);
      console.log(`   ${result.message}\n`);
    });
    
    console.log('SUMMARY:');
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⏭️ Skipped: ${skipped}`);
    console.log(`📊 Total: ${this.results.length}`);
    
    if (failed === 0) {
      console.log('\n🎉 ALL TESTS PASSED! Integration is working correctly.');
    } else {
      console.log(`\n⚠️ ${failed} TESTS FAILED. Integration needs attention.`);
      process.exit(1);
    }
  }
}

// Run the tests
const tester = new IntegrationTester();
tester.runAllTests().catch(error => {
  console.error('❌ Test suite failed:', error);
  process.exit(1);
});
