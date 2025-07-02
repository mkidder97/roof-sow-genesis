# Testing Setup Documentation

This document describes the comprehensive testing framework implemented for the Roof SOW Genesis project.

## Overview

The project now includes a complete testing setup with:
- **Unit Tests** for React components and utility functions  
- **API Tests** for Express server endpoints
- **Smoke Tests** for end-to-end system validation
- **Wind Analysis Tests** for critical business logic

## Test Structure

```
roof-sow-genesis/
├── src/test/                     # Frontend tests
│   ├── setup.ts                  # Vitest test setup
│   ├── App.test.tsx             # React component tests
│   └── utils.test.ts            # Utility function tests
├── server/tests/                 # Backend tests
│   ├── wind-analysis.test.ts    # Wind analysis logic tests
│   └── server.test.ts           # Express API tests
├── server/vitest.config.ts      # Server test configuration
├── vite.config.ts              # Updated with test config
└── smoke-test.mjs              # End-to-end smoke tests
```

## Test Scripts

### Frontend Tests
```bash
npm run test:unit           # Run all unit tests
npm run test:unit:watch     # Run tests in watch mode
```

### Backend Tests
```bash
npm run test:server         # Run server tests
cd server && npm test       # Alternative server test command
cd server && npm run test:watch    # Server tests in watch mode
cd server && npm run test:coverage # Server tests with coverage
```

### Smoke Tests
```bash
npm run test:smoke          # Run end-to-end smoke tests
```

### All Tests
```bash
npm run test:all           # Run unit tests + smoke tests
```

## Test Coverage

### Frontend Tests

#### React Component Tests (`src/test/App.test.tsx`)
- ✅ App component renders without crashing
- ✅ Router and providers are properly configured
- ✅ Supabase integration is mocked correctly

#### Utility Function Tests (`src/test/utils.test.ts`)
- ✅ `cn()` function class name merging
- ✅ Conditional class handling
- ✅ Tailwind merge conflict resolution
- ✅ Edge cases (empty, null, undefined values)

### Backend Tests

#### Wind Analysis Tests (`server/tests/wind-analysis.test.ts`)
- ✅ `determineExposureCategory()` function
  - Coastal areas (Exposure D)
  - Urban areas (Exposure B) 
  - Open terrain (Exposure C)
  - Default fallbacks
- ✅ `createWindAnalysisSummary()` function
  - ASCE 7-22 calculations
  - Different ASCE versions (7-16, 7-22)
  - High elevation calculations
  - Factor validation (Kh, Kzt, Kd, qh)

#### Express Server Tests (`server/tests/server.test.ts`)
- ✅ Health endpoint (`/health`)
- ✅ System status endpoint (`/api/status`)
- ✅ 404 handling for non-existent endpoints
- ✅ CORS headers validation
- ✅ Section mapping endpoint (`/api/test/section-mapping`)
- ✅ SOW mappings overview (`/api/sow/mappings`)
- ✅ Error handling for malformed requests

### Smoke Tests (`smoke-test.mjs`)
- ✅ Backend server startup and health check
- ✅ Frontend server startup and accessibility
- ✅ API status validation
- ✅ Backend integration test
- ✅ Graceful shutdown handling

## Test Configuration

### Frontend (Vitest)
```typescript
// vite.config.ts
test: {
  globals: true,
  environment: 'jsdom',
  setupFiles: ['./src/test/setup.ts'],
  css: true,
}
```

### Backend (Vitest)
```typescript
// server/vitest.config.ts
test: {
  globals: true,
  environment: 'node',
  coverage: {
    reporter: ['text', 'json', 'html'],
  }
}
```

## Mocking Strategy

### Frontend Mocks
- **Supabase**: Mocked authentication and session management
- **Window APIs**: matchMedia, ResizeObserver for testing compatibility
- **Global fetch**: Mocked for API calls

### Backend Mocks
- **Environment Variables**: Test-specific values
- **External Dependencies**: Jurisdiction mapping service mocked
- **Database**: Isolated test database connections

## Running Tests in CI/CD

The tests are designed to run in continuous integration environments:

```bash
# Install dependencies
npm install
cd server && npm install

# Run all tests
npm run test:all

# Run tests with coverage
npm run test:unit
cd server && npm run test:coverage
```

## Test Performance

### Expected Test Times
- **Unit Tests**: ~2-5 seconds
- **Server Tests**: ~5-10 seconds  
- **Smoke Tests**: ~30-60 seconds (includes server startup)

### Parallel Execution
- Frontend and backend tests can run simultaneously
- Smoke tests should run after unit tests pass
- Use `npm run test:all` for sequential execution

## Debugging Tests

### Frontend Tests
```bash
npm run test:unit:watch     # Watch mode for development
# Tests will re-run on file changes
```

### Backend Tests
```bash
cd server
npm run test:watch          # Watch mode for server tests
npm run test:coverage       # Generate coverage reports
```

### Smoke Test Debugging
```bash
npm run test:smoke          # Verbose output shows server logs
# Check console output for detailed error messages
```

## Adding New Tests

### Frontend Test Template
```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import YourComponent from '../YourComponent';

describe('YourComponent', () => {
  it('should render correctly', () => {
    render(<YourComponent />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });
});
```

### Backend Test Template
```typescript
import { describe, it, expect } from 'vitest';
import { yourFunction } from '../lib/your-module';

describe('YourModule', () => {
  it('should return expected result', () => {
    const result = yourFunction('input');
    expect(result).toBe('expected-output');
  });
});
```

### API Test Template
```typescript
import request from 'supertest';
import app from '../index';

describe('API Endpoint', () => {
  it('should return 200', async () => {
    const response = await request(app)
      .get('/api/your-endpoint')
      .expect(200);
      
    expect(response.body.success).toBe(true);
  });
});
```

## Best Practices

1. **Test Isolation**: Each test should be independent
2. **Descriptive Names**: Use clear, descriptive test names
3. **Arrange-Act-Assert**: Structure tests clearly
4. **Mock External Dependencies**: Don't rely on external services
5. **Test Edge Cases**: Include boundary conditions and error cases
6. **Performance**: Keep tests fast and focused

## Troubleshooting

### Common Issues

#### Port Conflicts in Smoke Tests
```bash
# If ports 3001 or 8080 are in use:
lsof -ti:3001 | xargs kill
lsof -ti:8080 | xargs kill
```

#### Module Resolution Issues
```bash
# Clear node_modules and reinstall:
rm -rf node_modules server/node_modules
npm install
cd server && npm install
```

#### Test Timeouts
- Increase timeout in test files for slow operations
- Check server startup time in smoke tests
- Verify database connections in integration tests

### Getting Help

1. Check test output for specific error messages
2. Run tests individually to isolate issues
3. Use watch mode for debugging
4. Check the GitHub Actions logs for CI/CD issues

## Integration with Development Workflow

The testing setup integrates with:
- **ESLint**: Code quality checks before tests
- **Husky**: Pre-commit hooks (if configured)
- **CI/CD**: Automated testing on pull requests
- **Development**: Watch modes for rapid feedback

## Future Enhancements

Planned testing improvements:
- **E2E Tests**: Playwright or Cypress integration
- **Visual Regression**: Screenshot comparison tests
- **Performance Tests**: Load testing for API endpoints
- **Database Tests**: Comprehensive database integration tests
- **Security Tests**: Automated security scanning
