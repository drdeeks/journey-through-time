// ============================================
// Journey Through Time - Letter Generator Backend
// Main Entry Point
// ============================================

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import bodyParser from 'body-parser';
import { v4 as uuidv4 } from 'uuid';

import config, {
  API_CONFIG,
  FEATURES,
} from './config';
import {
  APIResponse,
  HealthCheckResponse,
  GenerateLetterRequest,
  GenerateLetterResponse,
} from './types';

import { templateManager } from './services/contentTemplates';
import { contentTruncator } from './utils/contentTruncator';
import { blockchainService } from './services/blockchainService';

// ========== APPLICATION SETUP ==========

const app = express();
const startTime = Date.now();

// Middleware
app.use(helmet());
app.use(cors({ origin: API_CONFIG.CORS_ORIGINS }));
app.use(morgan(config.LOG_LEVEL === 'debug' ? 'dev' : 'combined'));
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true }));

// Request context middleware
app.use((req, res, next) => {
  const requestId = req.headers['x-request-id'] as string || uuidv4();
  (req as any).context = {
    requestId,
    timestamp: Date.now(),
    userAgent: req.headers['user-agent'],
    ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
  };
  res.setHeader('X-Request-ID', requestId);
  next();
});

// ========== HEALTH CHECK ENDPOINT ==========

app.get('/health', async (req, res) => {
  const health: HealthCheckResponse = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    blockchain: {
      connected: false,
      chainId: config.MONAD_CHAIN_ID,
      contractAddress: config.CONTRACT_ADDRESS,
    },
    checks: {
      rpcConnection: false,
      contractDeployment: !!config.CONTRACT_ADDRESS,
      walletBalance: false,
    },
    uptime: Math.floor((Date.now() - startTime) / 1000),
  };

  try {
    // Check RPC connection
    health.blockchain.connected = await blockchainService.isConnected();
    health.checks.rpcConnection = health.blockchain.connected;

    if (health.blockchain.connected) {
      const blockchainInfo = await blockchainService.getBlockchainInfo();
      health.blockchain.latestBlock = blockchainInfo.blockNumber;

      // Check wallet balance
      try {
        const balance = await blockchainService.getContractBalance();
        health.checks.walletBalance = balance > 0n;
      } catch {
        health.checks.walletBalance = false;
      }
    }

    // Determine overall status
    if (!health.checks.rpcConnection || !health.blockchain.connected) {
      health.status = 'unhealthy';
    } else if (!health.checks.contractDeployment) {
      health.status = 'degraded';
    }
  } catch {
    health.status = 'unhealthy';
  }

  const response: APIResponse<HealthCheckResponse> = {
    success: health.status === 'healthy',
    data: health,
    meta: {
      requestId: (req as any).context.requestId,
      timestamp: new Date().toISOString(),
      processingTime: 0,
    },
  };

  if (health.status !== 'healthy') {
    response.warnings = [
      `Service status: ${health.status}. Some checks may have failed.`,
    ];
  }

  res.status(health.status === 'healthy' ? 200 : 503).json(response);
});

// ========== AGENT-FRIENDLY ENDPOINTS ==========

// Get available templates (for agents to choose from)
app.get('/api/v1/templates', (req, res) => {
  const templates = templateManager.getAllTemplates();
  const matrixTemplates = templateManager.getMatrixTemplates();

  const response: APIResponse<{
    allTemplates: Record<string, any>;
    matrixTemplates: Record<string, any>;
    templateIds: string[];
    tags: string[];
    moods: string[];
  }> = {
    success: true,
    data: {
      allTemplates: templates,
      matrixTemplates,
      templateIds: templateManager.getTemplateIds(),
      tags: Array.from(
        new Set(
          Object.values(templates).flatMap((t) => t.tags),
        ),
      ),
      moods: Array.from(
        new Set(
          Object.values(templates).map((t) => t.mood),
        ),
      ),
    },
    meta: getMeta(req),
  };

  res.json(response);
});

// Get specific template
app.get('/api/v1/templates/:id', (req, res) => {
  const { id } = req.params;
  const template = templateManager.getTemplate(id);

  if (!template) {
    const response: APIResponse<null> = {
      success: false,
      error: {
        code: 'TEMPLATE_NOT_FOUND',
        message: `Template with ID '${id}' not found`,
      },
      meta: getMeta(req, 404),
    };
    return res.status(404).json(response);
  }

  const response: APIResponse<Record<string, any>> = {
    success: true,
    data: template,
    meta: getMeta(req),
  };

  res.json(response);
});

// ========== LETTER GENERATION ENDPOINTS ==========

// Generate a letter
app.post('/api/v1/letters/generate', async (req, res) => {
  // Validate request body
  if (!req.body) {
    const response: APIResponse<null> = {
      success: false,
      error: {
        code: 'INVALID_REQUEST',
        message: 'Request body is required',
      },
      meta: getMeta(req, 400),
    };
    return res.status(400).json(response);
  }

  // Parse request (allow both JSON and form data)
  let request: GenerateLetterRequest;
  try {
    request = req.body;
    
    // Validate required fields or provide defaults
    if (!request.templateId && !request.customContent) {
      // Use a random template
      request = { ...request, templateId: 'matic_message' };
    }
  } catch (error) {
    const response: APIResponse<null> = {
      success: false,
      error: {
        code: 'INVALID_REQUEST',
        message: (error as Error).message,
      },
      meta: getMeta(req, 400),
    };
    return res.status(400).json(response);
  }

  try {
    const start = Date.now();
    const response = await blockchainService.generateLetter(request);
    const processingTime = Date.now() - start;

    const apiResponse: APIResponse<GenerateLetterResponse> = {
      success: response.success,
      data: response,
      meta: getMeta(req, undefined, processingTime),
    };

    if (response.warnings && response.warnings.length > 0) {
      apiResponse.warnings = response.warnings;
    }

    if (!response.success) {
      apiResponse.error = {
        code: 'GENERATION_FAILED',
        message: response.error || 'Letter generation failed',
      };
      return res.status(400).json(apiResponse);
    }

    res.json(apiResponse);
  } catch (error) {
    const response: APIResponse<null> = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: (error as Error).message,
        details: config.NODE_ENV === 'development' ? error : undefined,
      },
      meta: getMeta(req, 500),
    };
    res.status(500).json(response);
  }
});

// ========== UTILITY ENDPOINTS ==========

// Truncate content (for testing)
app.post('/api/v1/utils/truncate', (req, res) => {
  const { content, maxLength } = req.body;

  if (!content) {
    const response: APIResponse<null> = {
      success: false,
      error: {
        code: 'INVALID_REQUEST',
        message: 'Content is required',
      },
      meta: getMeta(req, 400),
    };
    return res.status(400).json(response);
  }

  const maxLen = maxLength || 5000;
  const result = contentTruncator.truncate(content, maxLen);

  const response: APIResponse<{
    content: string;
    wasTruncated: boolean;
    originalLength: number;
    truncatedLength: number;
  }> = {
    success: true,
    data: result,
    meta: getMeta(req),
  };

  if (result.wasTruncated) {
    response.warnings = [
      `Content was truncated from ${result.originalLength} to ${result.truncatedLength} characters`,
    ];
  }

  res.json(response);
});

// Validate content length
app.post('/api/v1/utils/validate-length', (req, res) => {
  const { content, maxLength } = req.body;

  if (!content) {
    const response: APIResponse<null> = {
      success: false,
      error: {
        code: 'INVALID_REQUEST',
        message: 'Content is required',
      },
      meta: getMeta(req, 400),
    };
    return res.status(400).json(response);
  }

  const maxLen = maxLength || 5000;
  const stats = contentTruncator.getStats(content);
  const isValid = stats.isValid;

  const response: APIResponse<{
    isValid: boolean;
    currentLength: number;
    maxLength: number;
    excess: number;
    truncationRatio: number;
    needsTruncation: boolean;
  }> = {
    success: true,
    data: {
      ...stats,
      maxLength: maxLen,
      needsTruncation: !isValid,
    },
    meta: getMeta(req),
  };

  if (!isValid) {
    response.warnings = [
      `Content exceeds maximum length by ${stats.excess} characters`,
    ];
  }

  res.json(response);
});

// Get blockchain info
app.get('/api/v1/blockchain/info', async (req, res) => {
  try {
    const info = await blockchainService.getBlockchainInfo();

    const response: APIResponse<typeof info> = {
      success: true,
      data: info,
      meta: getMeta(req),
    };

    res.json(response);
  } catch (error) {
    const response: APIResponse<null> = {
      success: false,
      error: {
        code: 'BLOCKCHAIN_ERROR',
        message: (error as Error).message,
      },
      meta: getMeta(req, 500),
    };
    res.status(500).json(response);
  }
});

// Get payment options
app.get('/api/v1/payments/options', async (req, res) => {
  try {
    const options = await blockchainService.getPaymentOptions();

    const response: APIResponse<typeof options> = {
      success: true,
      data: options,
      meta: getMeta(req),
    };

    res.json(response);
  } catch (error) {
    const response: APIResponse<null> = {
      success: false,
      error: {
        code: 'PAYMENT_ERROR',
        message: (error as Error).message,
      },
      meta: getMeta(req, 500),
    };
    res.status(500).json(response);
  }
});

// ========== AGENT-SPECIFIC ENDPOINTS ==========

// Get agent-friendly summary of available actions
app.get('/api/v1/agents/capabilities', (req, res) => {
  const capabilities = {
    name: 'Journey Through Time Letter Generator',
    version: '1.0.0',
    description: 
      'Backend service for generating and managing time-locked letters with optional NFT minting',
    capabilities: {
      letterGeneration: {
        description: 'Generate letters with Matthew\'s pre-written templates or custom content',
        endpoints: [
          { method: 'POST', path: '/api/v1/letters/generate' },
        ],
        parameters: [
          'templateId',
          'customContent',
          'title',
          'mood',
          'unlockTime',
          'isPublic',
          'mintWithPayment',
          'useX402',
          'paymentToken',
        ],
        payment: {
          requiredForMinting: true,
          amount: '$0.05 USD',
          methods: ['native', 'erc20', 'x402'],
          supportedTokens: Object.keys(FEATURES.ENABLE_ERC20_PAYMENTS ? {} : {}),
        },
      },
      templates: {
        description: 'Access to pre-written letter templates',
        endpoints: [
          { method: 'GET', path: '/api/v1/templates' },
          { method: 'GET', path: '/api/v1/templates/:id' },
        ],
        matrixTemplates: templateManager.getMatrixTemplates(),
      },
      utilities: {
        description: 'Content validation and truncation utilities',
        endpoints: [
          { method: 'POST', path: '/api/v1/utils/truncate' },
          { method: 'POST', path: '/api/v1/utils/validate-length' },
        ],
        maxContentLength: config.MAX_CONTENT_LENGTH,
        autoTruncationEnabled: FEATURES.ENABLE_CONTENT_TRUNCATION,
      },
      blockchain: {
        description: 'Blockchain information and status',
        endpoints: [
          { method: 'GET', path: '/health' },
          { method: 'GET', path: '/api/v1/blockchain/info' },
          { method: 'GET', path: '/api/v1/payments/options' },
        ],
        chainId: config.MONAD_CHAIN_ID,
        contractAddress: config.CONTRACT_ADDRESS,
      },
    },
    features: {
      monadMainnetSupport: config.MONAD_CHAIN_ID === 143,
      monadTestnetSupport: config.MONAD_CHAIN_ID === 10143,
      x402Payments: FEATURES.ENABLE_X402_PAYMENTS,
      erc20Payments: FEATURES.ENABLE_ERC20_PAYMENTS,
      autoGeneration: FEATURES.ENABLE_AUTO_GENERATION,
      contentTruncation: FEATURES.ENABLE_CONTENT_TRUNCATION,
    },
    examples: {
      generateLetter: {
        description: 'Generate a letter using Matthew\'s template',
        request: {
          templateId: 'matic_message',
          isPublic: true,
        },
        expectedResponse: {
          success: true,
          data: {
            letterId: 0,
            transactionHash: '0x...',
            content: 'I\'m writing this to you from the past...',
            wasTruncated: false,
          },
        },
      },
      generateWithMinting: {
        description: 'Generate and mint a letter with payment',
        request: {
          templateId: 'matic_celebration',
          mintWithPayment: true,
          useX402: false,
        },
        expectedResponse: {
          success: true,
          data: {
            letterId: 0,
            tokenId: 0,
            transactionHash: '0x...',
            content: 'STOP. Just stop for a moment...',
          },
        },
      },
    },
    documentation: {
      apiDocs: '/docs/api',
      developerGuide: '/docs/developer',
      templates: '/docs/templates',
    },
  };

  const response: APIResponse<typeof capabilities> = {
    success: true,
    data: capabilities,
    meta: getMeta(req),
  };

  res.json(response);
});

// ========== DOCUMENTATION ENDPOINTS ==========

// API documentation
app.get('/docs/api', (req, res) => {
  const docs = {
    title: 'Journey Through Time - Letter Generator API',
    version: '1.0.0',
    description: 'REST API for letter generation and management',
    baseUrl: `${req.protocol}://${req.get('host')}`,
    endpoints: {
      health: {
        method: 'GET',
        path: '/health',
        description: 'Health check endpoint',
      },
      generateLetter: {
        method: 'POST',
        path: '/api/v1/letters/generate',
        description: 'Generate a new letter',
        parameters: {
          templateId: 'string (optional) - Template ID to use',
          customContent: 'string (optional) - Custom content',
          title: 'string (optional) - Letter title',
          mood: 'string (optional) - Letter mood',
          unlockTime: 'string (optional) - ISO date or days from now',
          isPublic: 'boolean (optional) - Whether letter is public',
          recipientAddress: 'string (optional) - Recipient address',
          mintWithPayment: 'boolean (optional) - Whether to mint NFT',
          useX402: 'boolean (optional) - Use X402 payment',
          paymentToken: 'string (optional) - ERC-20 token address',
        },
      },
      getTemplates: {
        method: 'GET',
        path: '/api/v1/templates',
        description: 'Get all available templates',
      },
      getTemplate: {
        method: 'GET',
        path: '/api/v1/templates/:id',
        description: 'Get a specific template',
      },
      truncate: {
        method: 'POST',
        path: '/api/v1/utils/truncate',
        description: 'Truncate content',
      },
      validateLength: {
        method: 'POST',
        path: '/api/v1/utils/validate-length',
        description: 'Validate content length',
      },
      blockchainInfo: {
        method: 'GET',
        path: '/api/v1/blockchain/info',
        description: 'Get blockchain information',
      },
      paymentOptions: {
        method: 'GET',
        path: '/api/v1/payments/options',
        description: 'Get available payment options',
      },
      agentCapabilities: {
        method: 'GET',
        path: '/api/v1/agents/capabilities',
        description: 'Get agent-friendly capabilities summary',
      },
    },
    errorCodes: {
      INVALID_REQUEST: 'Request is missing required fields',
      TEMPLATE_NOT_FOUND: 'Template with specified ID not found',
      GENERATION_FAILED: 'Failed to generate letter',
      BLOCKCHAIN_ERROR: 'Blockchain interaction failed',
      PAYMENT_ERROR: 'Payment processing failed',
      INTERNAL_ERROR: 'Internal server error',
    },
  };

  const response: APIResponse<typeof docs> = {
    success: true,
    data: docs,
    meta: getMeta(req),
  };

  res.json(response);
});

// Developer guide
app.get('/docs/developer', (req, res) => {
  const guide = {
    title: 'Developer Guide - Letter Generator Service',
    sections: [
      {
        title: 'Overview',
        content: `This service provides a backend for generating time-locked letters with \noptional NFT minting. It supports multiple payment methods including native \ntoken, ERC-20 tokens, and X402 (ERC-402) signature-based payments.`,
      },
      {
        title: 'Quick Start',
        content: `1. Ensure Monad mainnet (chain 143) is configured
2. Deploy the FutureLettersV2 contract
3. Set CONTRACT_ADDRESS and PRIVATE_KEY environment variables
4. Start the service: npm run start
5. Generate a letter: POST /api/v1/letters/generate`,
      },
      {
        title: 'Configuration',
        content: `Required environment variables:
- MONAD_RPC_URL: Monad RPC endpoint (default: https://rpc.monad.xyz)
- MONAD_CHAIN_ID: Chain ID (143 for mainnet, 10143 for testnet)
- CONTRACT_ADDRESS: Deployed contract address
- PRIVATE_KEY: Backend wallet private key
- MATRIX_ADDRESS: Matthew's special address

Optional:
- PORT: Port number (default: 3001)
- MAX_CONTENT_LENGTH: Max characters for letters (default: 5000)
- ENABLE_X402_PAYMENTS: Enable X402 payments (default: true)
- ENABLE_ERC20_PAYMENTS: Enable ERC-20 payments (default: true)`,
      },
      {
        title: 'Payment Flow',
        content: `1. User selects to create a letter (gas-only) OR mint a letter ($0.05)
2. For minting:
   a. User chooses payment method (native, ERC-20, or X402)
   b. For X402: User provides EIP-712 signature
   c. For ERC-20: User approves token transfer OR backend handles it
   d. For native: User sends 0.05 MON with transaction
3. Contract validates payment and mints NFT
4. Letter is created with optional NFT`,
      },
      {
        title: 'Matthew Integration',
        content: `Matthew's account has special privileges:
- Auto-generation allowed by default
- Special templates with his wording
- Content is automatically truncated if too long
- Can create letters for other users

To use:
- Set MATRIX_ADDRESS to Matthew's wallet address
- Call with recipientAddress to create letters for others
- Use templateId starting with 'matic_' for his templates`,
      },
      {
        title: 'Agent Integration',
        content: `Agents can:
- List available templates: GET /api/v1/templates
- Generate letters: POST /api/v1/letters/generate
- Validate content: POST /api/v1/utils/validate-length
- Get capabilities: GET /api/v1/agents/capabilities

Agents should:
1. First call /api/v1/agents/capabilities to understand available actions
2. Use template-based generation for consistency
3. Validate content length before submission
4. Handle truncation warnings appropriately`,
      },
    ],
  };

  const response: APIResponse<typeof guide> = {
    success: true,
    data: guide,
    meta: getMeta(req),
  };

  res.json(response);
});

// ========== HELPER FUNCTIONS ==========

function getMeta(req: any, statusCode?: number, processingTime?: number) {
  const baseMeta = {
    requestId: req.context.requestId,
    timestamp: new Date().toISOString(),
    processingTime: processingTime || 0,
  };

  // Determine processing time if not provided
  if (processingTime === undefined && req.startTime) {
    baseMeta.processingTime = Date.now() - req.startTime;
  }

  return baseMeta;
}

// Request logging middleware
app.use((req, res, next) => {
  (req as any).startTime = Date.now();
  
  if (config.LOG_LEVEL === 'debug') {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  }
  
  next();
});

// 404 handler
app.use((req, res) => {
  const response: APIResponse<null> = {
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
    },
    meta: getMeta(req, 404),
  };
  res.status(404).json(response);
});

// Error handler
app.use((err: Error, req: any, res: express.Response, next: any) => {
  console.error('Unhandled error:', err);
  
  const response: APIResponse<null> = {
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: config.NODE_ENV === 'development' ? err.message : 'Internal server error',
      details: config.NODE_ENV === 'development' ? { stack: err.stack } : undefined,
    },
    meta: getMeta(req, 500),
  };
  
  res.status(500).json(response);
});

// ========== START SERVER ==========

const PORT = config.PORT || 3001;

app.listen(PORT, () => {
  console.log('============================================');
  console.log(' Journey Through Time - Letter Generator');
  console.log('============================================');
  console.log(` Environment: ${config.NODE_ENV}`);
  console.log(` Chain ID: ${config.MONAD_CHAIN_ID}`);
  console.log(` Contract: ${config.CONTRACT_ADDRESS || 'Not configured'}`);
  console.log(` Matrix: ${config.MATRIX_ADDRESS}`);
  console.log('--------------------------------------------');
  console.log(` X402 Payments: ${FEATURES.ENABLE_X402_PAYMENTS ? 'Enabled' : 'Disabled'}`);
  console.log(` ERC-20 Payments: ${FEATURES.ENABLE_ERC20_PAYMENTS ? 'Enabled' : 'Disabled'}`);
  console.log(` Auto-Generation: ${FEATURES.ENABLE_AUTO_GENERATION ? 'Enabled' : 'Disabled'}`);
  console.log(` Content Truncation: ${FEATURES.ENABLE_CONTENT_TRUNCATION ? 'Enabled' : 'Disabled'}`);
  console.log('--------------------------------------------');
  console.log(` Server running on http://localhost:${PORT}`);
  console.log(` Health check: http://localhost:${PORT}/health`);
  console.log(` API Docs: http://localhost:${PORT}/docs/api`);
  console.log('============================================');
});

export default app;
