import { jest } from '@jest/globals';

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgres://test:test@localhost:5432/botc_test';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.JWT_SECRET = 'test-secret';

// Increase timeout for integration tests
jest.setTimeout(10000);

// Global test setup
beforeAll(async () => {
  // Setup test database, clear caches, etc.
});

afterAll(async () => {
  // Cleanup
});

beforeEach(() => {
  // Reset mocks
  jest.clearAllMocks();
});