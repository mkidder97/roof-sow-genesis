import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../index';

// Mock environment variables
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';
process.env.NODE_ENV = 'test';

let server: any;

describe('Server API Tests', () => {
  beforeAll(() => {
    // Start the server
    const PORT = process.env.PORT || 3001;
    server = app.listen(PORT + 1000, () => {
      console.log(`Test server running on port ${PORT + 1000}`);
    });
  });

  afterAll(() => {
    // Close the server after tests
    if (server) {
      server.close();
    }
  });

  describe('Health Endpoints', () => {
    it('should respond to health check', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toMatchObject({
        status: expect.any(String),
        timestamp: expect.any(String)
      });
    });

    it('should provide system status', async () => {
      const response = await request(app)
        .get('/api/status')
        .expect(200);

      expect(response.body).toMatchObject({
        phase: expect.any(String),
        version: expect.any(String),
        serverStatus: 'running',
        timestamp: expect.any(String),
        endpoints: expect.any(Object)
      });

      // Check that essential endpoints are documented
      expect(response.body.endpoints.sowGenerationAPI).toBeDefined();
      expect(response.body.endpoints.draftManagement).toBeDefined();
      expect(response.body.endpoints.fileManagement).toBeDefined();
    });
  });

  describe('API Validation', () => {
    it('should handle 404 for non-existent endpoints', async () => {
      const response = await request(app)
        .get('/api/non-existent-endpoint')
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Endpoint not found',
        requestedPath: '/api/non-existent-endpoint',
        availableEndpoints: expect.any(Array)
      });
    });

    it('should have CORS headers configured', async () => {
      const response = await request(app)
        .options('/health')
        .expect(204);

      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });
  });

  describe('SOW Test Endpoints', () => {
    it('should return section mapping data', async () => {
      const response = await request(app)
        .get('/api/test/section-mapping')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        mappings: expect.any(Array),
        mappingCount: expect.any(Number)
      });

      // Verify mapping structure
      if (response.body.mappings.length > 0) {
        const firstMapping = response.body.mappings[0];
        expect(firstMapping).toMatchObject({
          section: expect.any(String),
          inputs: expect.any(Array)
        });
      }
    });

    it('should return SOW mappings overview', async () => {
      const response = await request(app)
        .get('/api/sow/mappings')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        overview: expect.any(Object),
        sectionCount: expect.any(Number),
        totalInputMappings: expect.any(Number)
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed JSON gracefully', async () => {
      const response = await request(app)
        .post('/api/test/section-mapping')
        .send('{ invalid json }')
        .set('Content-Type', 'application/json')
        .expect(400);

      // Should not crash the server
      expect(response.body || response.text).toBeDefined();
    });

    it('should handle requests with no content-type', async () => {
      const response = await request(app)
        .get('/health');

      expect(response.status).toBe(200);
    });
  });
});
