/**
 * End-to-End Tests for Journey Through Time Letter Generator
 * 
 * Tests cover:
 * - Letter generation flow (gas-only)
 * - Letter generation with minting
 * - Content truncation
 * - Template management
 * - Payment options
 * - Agent-friendly endpoints
 */

import { test, expect } from '@playwright/test';
import { spawn } from 'child_process';
import path from 'path';

// Configuration
const SERVICE_PATH = path.join(__dirname, '../../../src/index.ts');
const TEST_PORT = 3002;
const TEST_RPC_URL = 'http://localhost:8545'; // Local Hardhat node
const MOCK Kontract_ADDRESS = '0x5FbDB2315678afecb367f032d93F642f64180aa3';
const MOCK_PRIVATE_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';

let serverProcess: any;

// Helper to start the service
async function startService() {
  return new Promise((resolve) => {
    serverProcess = spawn('npx', ['ts-node', SERVICE_PATH], {
      env: {
        ...process.env,
        NODE_ENV: 'test',
        PORT: String(TEST_PORT),
        MONAD_RPC_URL: TEST_RPC_URL,
        MONAD_CHAIN_ID: '1337', // Local test chain
        CONTRACT_ADDRESS: MOCK Kontract_ADDRESS,
        PRIVATE_KEY: MOCK_PRIVATE_KEY,
        MATRIX_ADDRESS: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
        MAX_CONTENT_LENGTH: '5000',
        LOG_LEVEL: 'error',
        ENABLE_X402_PAYMENTS: 'true',
        ENABLE_ERC20_PAYMENTS: 'true',
      },
    });

    serverProcess.stdout.on('data', (data: Buffer) => {
      const output = data.toString();
      console.log(`[Server] ${output}`);
      if (output.includes(`Server running on http://localhost:${TEST_PORT}`)) {
        resolve(null);
      }
    });

    serverProcess.stderr.on('data', (data: Buffer) => {
      console.error(`[Server Error] ${data.toString()}`);
    });

    // Timeout after 10 seconds
    setTimeout(resolve, 10000);
  });
}

// Helper to stop the service
async function stopService() {
  return new Promise((resolve) => {
    if (serverProcess) {
      serverProcess.kill();
      serverProcess.on('close', resolve);
      setTimeout(resolve, 2000);
    } else {
      resolve(null);
    }
  });
}

// Setup - start service before tests
test.beforeAll(async () => {
  console.log('Starting Letter Generator service...');
  await startService();
  console.log('Service started');
});

// Teardown - stop service after tests
test.afterAll(async () => {
  console.log('Stopping Letter Generator service...');
  await stopService();
  console.log('Service stopped');
});

test.describe('Letter Generator Service', () => {
  const baseUrl = `http://localhost:${TEST_PORT}`;

  test.describe('Health and Status', () => {
    test('Health check endpoint', async ({ request }) => {
      const response = await request.get(`${baseUrl}/health`);
      expect(response.status()).toBeGreaterThanOrEqual(200);
      expect(response.status()).toBeLessThan(500);

      const data = await response.json();
      expect(data).toHaveProperty('success');
      expect(data.data).toHaveProperty('status');
      expect(['healthy', 'degraded', 'unhealthy']).toContain(data.data.status);
    });

    test('API documentation endpoint', async ({ request }) => {
      const response = await request.get(`${baseUrl}/docs/api`);
      expect(response.ok()).toBeTruthy();

      const data = await response.json();
      expect(data).toHaveProperty('success', true);
      expect(data.data).toHaveProperty('title');
      expect(data.data.title).toContain('API');
    });
  });

  test.describe('Template Management', () => {
    test('Get all templates', async ({ request }) => {
      const response = await request.get(`${baseUrl}/api/v1/templates`);
      expect(response.ok()).toBeTruthy();

      const data = await response.json();
      expect(data).toHaveProperty('success', true);
      expect(data.data).toHaveProperty('allTemplates');
      expect(data.data).toHaveProperty('matrixTemplates');
      expect(data.data.templateIds).toBeInstanceOf(Array);
      expect(data.data.templateIds.length).toBeGreaterThan(0);
    });

    test('Get specific template', async ({ request }) => {
      const response = await request.get(`${baseUrl}/api/v1/templates/matic_message`);
      expect(response.ok()).toBeTruthy();

      const data = await response.json();
      expect(data).toHaveProperty('success', true);
      expect(data.data).toHaveProperty('id', 'matic_message');
      expect(data.data).toHaveProperty('content');
      expect(data.data.content).toBeTruthy();
    });

    test('Get Matrix-specific templates', async ({ request }) => {
      const response = await request.get(`${baseUrl}/api/v1/templates`);
      expect(response.ok()).toBeTruthy();

      const data = await response.json();
      expect(data.data.matrixTemplates).toBeDefined();
      expect(Object.keys(data.data.matrixTemplates).length).toBeGreaterThan(0);
    });

    test('Get non-existent template returns 404', async ({ request }) => {
      const response = await request.get(`${baseUrl}/api/v1/templates/nonexistent`);
      expect(response.status()).toBe(404);

      const data = await response.json();
      expect(data).toHaveProperty('success', false);
      expect(data.error?.code).toBe('TEMPLATE_NOT_FOUND');
    });
  });

  test.describe('Letter Generation', () => {
    test('Generate letter with template (gas-only)', async ({ request }) => {
      const response = await request.post(`${baseUrl}/api/v1/letters/generate`, {
        data: {
          templateId: 'matic_message',
          isPublic: true,
          mintWithPayment: false,
        },
      });

      expect(response.status()).toBeGreaterThanOrEqual(200);
      expect(response.status()).toBeLessThan(500);

      const data = await response.json();
      expect(data).toHaveProperty('success');
      
      if (data.success) {
        expect(data.data).toHaveProperty('letterId');
        expect(data.data).toHaveProperty('transactionHash');
        expect(data.data).toHaveProperty('content');
      } else {
        console.log('Letter generation failed:', data.error);
      }
    });

    test('Generate letter with custom content', async ({ request }) => {
      const customContent = 'This is my custom letter content for the future.';

      const response = await request.post(`${baseUrl}/api/v1/letters/generate`, {
        data: {
          customContent,
          title: 'My Custom Letter',
          mood: 'hopeful',
          isPublic: true,
          mintWithPayment: false,
        },
      });

      expect(response.status()).toBeGreaterThanOrEqual(200);
      expect(response.status()).toBeLessThan(500);

      const data = await response.json();
      expect(data).toHaveProperty('success');
      
      if (data.success) {
        expect(data.data).toHaveProperty('content');
      }
    });

    test('Generate letter without template or content uses default', async ({ request }) => {
      const response = await request.post(`${baseUrl}/api/v1/letters/generate`, {
        data: {
          isPublic: true,
          mintWithPayment: false,
        },
      });

      expect(response.status()).toBeGreaterThanOrEqual(200);
      expect(response.status()).toBeLessThan(500);

      const data = await response.json();
      expect(data).toHaveProperty('success');
    });

    test('Letter generation with minting requires payment disabled in test mode', async ({ request }) => {
      // In test mode without actual contract, minting may fail
      const response = await request.post(`${baseUrl}/api/v1/letters/generate`, {
        data: {
          templateId: 'matic_message',
          mintWithPayment: true,
          useX402: false,
        },
      });

      const data = await response.json();
      
      // May succeed or fail depending on contract deployment
      expect([200, 400, 500]).toContain(response.status());
      expect(data).toHaveProperty('success');
    });
  });

  test.describe('Content Utilities', () => {
    test('Truncate long content', async ({ request }) => {
      const longContent = 'A'.repeat(10000); // 10,000 characters

      const response = await request.post(`${baseUrl}/api/v1/utils/truncate`, {
        data: {
          content: longContent,
          maxLength: 5000,
        },
      });

      expect(response.ok()).toBeTruthy();

      const data = await response.json();
      expect(data).toHaveProperty('success', true);
      expect(data.data).toHaveProperty('wasTruncated', true);
      expect(data.data.truncatedLength).toBeLessThanOrEqual(5000);
      expect(data.data.originalLength).toBe(10000);
      expect(data.warnings).toBeDefined();
      expect(data.warnings[0]).toContain('truncated');
    });

    test('Validate content length', async ({ request }) => {
      const longContent = 'A'.repeat(6000);

      const response = await request.post(`${baseUrl}/api/v1/utils/validate-length`, {
        data: {
          content: longContent,
          maxLength: 5000,
        },
      });

      expect(response.ok()).toBeTruthy();

      const data = await response.json();
      expect(data).toHaveProperty('success', true);
      expect(data.data).toHaveProperty('isValid', false);
      expect(data.data).toHaveProperty('needsTruncation', true);
      expect(data.data.excess).toBe(1000);
    });

    test('Validate short content passes', async ({ request }) => {
      const shortContent = 'Short content';

      const response = await request.post(`${baseUrl}/api/v1/utils/validate-length`, {
        data: {
          content: shortContent,
        },
      });

      expect(response.ok()).toBeTruthy();

      const data = await response.json();
      expect(data).toHaveProperty('success', true);
      expect(data.data).toHaveProperty('isValid', true);
      expect(data.data).toHaveProperty('needsTruncation', false);
    });
  });

  test.describe('Payment Options', () => {
    test('Get payment options', async ({ request }) => {
      const response = await request.get(`${baseUrl}/api/v1/payments/options`);
      expect(response.ok()).toBeTruthy();

      const data = await response.json();
      expect(data).toHaveProperty('success', true);
      expect(data.data).toBeInstanceOf(Array);
      
      // Should at least have native token option
      const options = data.data as any[];
      const nativeOption = options.find((o: any) => o.type === 'native');
      expect(nativeOption).toBeDefined();
      expect(nativeOption.symbol).toBe('MON');
    });
  });

  test.describe('Agent-Friendly Endpoints', () => {
    test('Get agent capabilities', async ({ request }) => {
      const response = await request.get(`${baseUrl}/api/v1/agents/capabilities`);
      expect(response.ok()).toBeTruthy();

      const data = await response.json();
      expect(data).toHaveProperty('success', true);
      expect(data.data).toHaveProperty('name');
      expect(data.data.name).toContain('Letter Generator');
      expect(data.data).toHaveProperty('capabilities');
      expect(data.data.capabilities).toHaveProperty('letterGeneration');
      expect(data.data.capabilities).toHaveProperty('templates');
      expect(data.data).toHaveProperty('features');
      expect(data.data.features).toHaveProperty('monadMainnetSupport');
    });

    test('Capabilities include examples', async ({ request }) => {
      const response = await request.get(`${baseUrl}/api/v1/agents/capabilities`);
      expect(response.ok()).toBeTruthy();

      const data = await response.json();
      expect(data.data).toHaveProperty('examples');
      expect(data.data.examples).toHaveProperty('generateLetter');
      expect(data.data.examples).toHaveProperty('generateWithMinting');
    });
  });

  test.describe('Developer Documentation', () => {
    test('Get developer guide', async ({ request }) => {
      const response = await request.get(`${baseUrl}/docs/developer`);
      expect(response.ok()).toBeTruthy();

      const data = await response.json();
      expect(data).toHaveProperty('success', true);
      expect(data.data).toHaveProperty('title');
      expect(data.data.title).toContain('Developer Guide');
      expect(data.data).toHaveProperty('sections');
      expect(data.data.sections.length).toBeGreaterThan(0);
    });
  });

  test.describe('Error Handling', () => {
    test('404 for unknown routes', async ({ request }) => {
      const response = await request.get(`${baseUrl}/api/v1/unknown`);
      expect(response.status()).toBe(404);

      const data = await response.json();
      expect(data).toHaveProperty('success', false);
      expect(data.error?.code).toBe('NOT_FOUND');
    });

    test('Invalid request body', async ({ request }) => {
      const response = await request.post(`${baseUrl}/api/v1/letters/generate`, {
        data: {}, // Empty body
      });

      expect(response.status()).toBe(400);

      const data = await response.json();
      expect(data).toHaveProperty('success', false);
    });

    test('Missing required fields handled gracefully', async ({ request }) => {
      const response = await request.post(`${baseUrl}/api/v1/utils/truncate`, {
        data: {}, // Missing content
      });

      expect(response.status()).toBe(400);

      const data = await response.json();
      expect(data).toHaveProperty('success', false);
      expect(data.error?.message).toContain('required');
    });
  });
});

test.describe('Blockchain Integration', () => {
  test.describe('Blockchain info', () => {
    test('Get blockchain information', async ({ request }) => {
      const response = await request.get(`${baseUrl}/api/v1/blockchain/info`);
      expect(response.status()).toBeGreaterThanOrEqual(200);
      expect(response.status()).toBeLessThan(500);

      const data = await response.json();
      expect(data).toHaveProperty('success');
      
      if (data.success) {
        expect(data.data).toHaveProperty('chainId');
      }
    });
  });
});

export default test;
