// Simple development server entry point
// This file is needed for the dev script in package.json

export * from './index-production.js';

// Re-export everything from the production index
import './index-production.js';
