#!/usr/bin/env node

/**
 * Smoke Test Script
 * 
 * This script starts both the frontend and backend servers,
 * then runs basic health checks to ensure they're working correctly.
 */

import { spawn } from 'child_process';
import fetch from 'node-fetch';
import { setTimeout } from 'timers/promises';

const FRONTEND_PORT = 8080;
const BACKEND_PORT = 3001;
const TIMEOUT = 30000; // 30 seconds

let frontendProcess;
let backendProcess;
let testsPassed = 0;
let testsTotal = 0;

function log(message, type = 'info') {
  const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
  const symbols = {
    info: '🔍',
    success: '✅',
    error: '❌',
    warning: '⚠️'
  };
  console.log(`${symbols[type]} [${timestamp}] ${message}`);
}

function runTest(name, testFn) {
  testsTotal++;
  return testFn()
    .then(() => {
      testsPassed++;
      log(`${name} - PASSED`, 'success');
      return true;
    })
    .catch((error) => {
      log(`${name} - FAILED: ${error.message}`, 'error');
      return false;
    });
}

async function startServer(command, args, name, port) {
  log(`Starting ${name}...`);
  
  const process = spawn(command, args, {
    stdio: ['pipe', 'pipe', 'pipe'],
    env: { ...process.env, NODE_ENV: 'test' }
  });

  // Log server output for debugging
  process.stdout.on('data', (data) => {
    const output = data.toString().trim();
    if (output) {
      console.log(`[${name}] ${output}`);
    }
  });

  process.stderr.on('data', (data) => {
    const output = data.toString().trim();
    if (output && !output.includes('ExperimentalWarning')) {
      console.log(`[${name} ERROR] ${output}`);
    }
  });

  return process;
}

async function waitForServer(url, name, timeout = TIMEOUT) {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    try {
      const response = await fetch(url, { 
        timeout: 5000,
        headers: { 'User-Agent': 'smoke-test' }
      });
      
      if (response.ok) {
        log(`${name} is ready at ${url}`, 'success');
        return true;
      }
    } catch (error) {
      // Server not ready yet, keep trying
    }
    
    await setTimeout(1000); // Wait 1 second before retrying
  }
  
  throw new Error(`${name} failed to start within ${timeout}ms`);
}

async function testHealthEndpoint() {
  const response = await fetch(`http://localhost:${BACKEND_PORT}/health`, {
    timeout: 10000
  });
  
  if (!response.ok) {
    throw new Error(`Health check failed with status: ${response.status}`);
  }
  
  const data = await response.json();
  
  if (!data.status) {
    throw new Error('Health check response missing status field');
  }
  
  return data;
}

async function testFrontendAccess() {
  const response = await fetch(`http://localhost:${FRONTEND_PORT}`, {
    timeout: 10000
  });
  
  if (!response.ok) {
    throw new Error(`Frontend access failed with status: ${response.status}`);
  }
  
  const html = await response.text();
  
  if (!html.includes('DOCTYPE') && !html.includes('<html')) {
    throw new Error('Frontend did not return valid HTML');
  }
  
  return true;
}

async function testAPIEndpoint() {
  const response = await fetch(`http://localhost:${BACKEND_PORT}/api/status`, {
    timeout: 10000
  });
  
  if (!response.ok) {
    throw new Error(`API status check failed with status: ${response.status}`);
  }
  
  const data = await response.json();
  
  if (!data.serverStatus || data.serverStatus !== 'running') {
    throw new Error('API status check indicates server is not running properly');
  }
  
  return data;
}

async function cleanup() {
  log('Cleaning up processes...');
  
  if (frontendProcess) {
    frontendProcess.kill('SIGTERM');
    // Give it a moment to shutdown gracefully
    await setTimeout(2000);
    if (!frontendProcess.killed) {
      frontendProcess.kill('SIGKILL');
    }
  }
  
  if (backendProcess) {
    backendProcess.kill('SIGTERM');
    await setTimeout(2000);
    if (!backendProcess.killed) {
      backendProcess.kill('SIGKILL');
    }
  }
}

async function runSmokeTests() {
  try {
    log('🧪 Starting Smoke Tests...', 'info');
    log('=' .repeat(60));
    
    // Start backend server
    backendProcess = await startServer('npm', ['run', 'dev'], 'Backend Server', BACKEND_PORT);
    
    // Wait for backend to be ready
    await waitForServer(`http://localhost:${BACKEND_PORT}/health`, 'Backend Server');
    
    // Start frontend server (in background)
    log('Starting frontend server...');
    frontendProcess = await startServer('npm', ['run', 'dev'], 'Frontend Server', FRONTEND_PORT);
    
    // Wait for frontend to be ready  
    await waitForServer(`http://localhost:${FRONTEND_PORT}`, 'Frontend Server');
    
    log('=' .repeat(60));
    log('🧪 Running Tests...');
    
    // Run health check tests
    await runTest('Backend Health Check', testHealthEndpoint);
    await runTest('Frontend Access Check', testFrontendAccess);
    await runTest('API Status Check', testAPIEndpoint);
    
    // Additional integration test - check if backend responds to requests
    await runTest('Backend Integration Test', async () => {
      const response = await fetch(`http://localhost:${BACKEND_PORT}/api/test/section-mapping`, {
        timeout: 10000
      });
      
      if (!response.ok) {
        throw new Error(`Section mapping test failed with status: ${response.status}`);
      }
      
      const data = await response.json();
      if (!data.success) {
        throw new Error('Section mapping test returned unsuccessful response');
      }
      
      return true;
    });
    
    log('=' .repeat(60));
    log(`🏁 Smoke Tests Complete!`, 'info');
    log(`📊 Results: ${testsPassed}/${testsTotal} tests passed`, testsPassed === testsTotal ? 'success' : 'warning');
    
    if (testsPassed === testsTotal) {
      log('🎉 All smoke tests PASSED! System is healthy.', 'success');
      process.exit(0);
    } else {
      log('💥 Some smoke tests FAILED! Check the logs above.', 'error');
      process.exit(1);
    }
    
  } catch (error) {
    log(`Fatal error during smoke tests: ${error.message}`, 'error');
    process.exit(1);
  } finally {
    await cleanup();
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  log('Received SIGINT, shutting down gracefully...', 'warning');
  await cleanup();
  process.exit(1);
});

process.on('SIGTERM', async () => {
  log('Received SIGTERM, shutting down gracefully...', 'warning');
  await cleanup();
  process.exit(1);
});

// Run the smoke tests
runSmokeTests().catch(async (error) => {
  log(`Unhandled error: ${error.message}`, 'error');
  await cleanup();
  process.exit(1);
});
