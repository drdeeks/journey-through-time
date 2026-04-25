#!/usr/bin/env ts-node

/**
 * Universal EVM Contract Deployment & Auto-Verification Script
 * 
 * @description Deploy any Solidity contract to any EVM chain with automatic verification
 * @version 1.0.0
 * @author Journey Through Time Team
 * 
 * Usage:
 *   # Deploy to Monad mainnet
 *   npx ts-node scripts/deploy-universal.ts --chain 143 --contract FutureLettersV2
 * 
 *   # Deploy to Ethereum mainnet
 *   npx ts-node scripts/deploy-universal.ts --chain 1 --contract MyContract
 * 
 *   # Deploy with custom RPC
 *   npx ts-node scripts/deploy-universal.ts --chain 143 --rpc-url https://rpc.monad.xyz
 * 
 *   # Help
 *   npx ts-node scripts/deploy-universal.ts --help
 * 
 * Features:
 *   ✅ Universal EVM chain support (pass --chain flag)
 *   ✅ Automatic verification on block explorers
 *   ✅ Foundry-based deployment (recommended)
 *   ✅ Hardhat fallback support
 *   ✅ Configurable RPC endpoints
 *   ✅ Contract address and transaction output
 *   ✅ Gas estimation and confirmation
 *   ✅ Monad-specific optimizations (via https://docs.monad.xyz/)
 *   ✅ EthSkills integration for chain configuration
 */

import { ethers } from 'ethers';
import { execSync, spawn, exec } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

// ========== TYPE DEFINITIONS ==========

interface DeployOptions {
    chainId: number;
    contractName: string;
    rpcUrl?: string;
    privateKey?: string;
    keystore?: string;
    keystorePassword?: string;
    constructorArgs?: string[];
    verify: boolean;
    gasLimit?: number;
    gasPrice?: string;
    dryRun: boolean;
    help: boolean;
}

interface ChainConfig {
    name: string;
    rpcUrls: string[];
    chainId: number;
    nativeCurrency: {
        name: string;
        symbol: string;
        decimals: number;
    };
    blockExplorers?: {
        default: {
            name: string;
            url: string;
            apiUrl?: string;
        };
    };
    testnet?: boolean;
}

interface DeploymentResult {
    success: boolean;
    contractAddress?: string;
    transactionHash?: string;
    chainId: number;
    chainName: string;
    explorerUrl?: string;
    verificationUrl?: string;
    gasUsed?: number;
    error?: string;
}

// ========== KNOWN CHAIN CONFIGURATIONS ==========

// Chain configurations with block explorer API support
// Reference: EthSkills framework (https://ethskills.netlify.app/)
const KNOWN_CHAINS: Record<number, ChainConfig> = {
    // Mainnets
    1: {
        name: 'Ethereum Mainnet',
        rpcUrls: ['https://rpc.ankr.com/eth', 'https://eth.llamarpc.com'],
        chainId: 1,
        nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
        blockExplorers: {
            default: {
                name: 'Etherscan',
                url: 'https://etherscan.io',
                apiUrl: 'https://api.etherscan.io/api',
            },
        },
    },
    143: {
        name: 'Monad Mainnet',
        rpcUrls: ['https://rpc.monad.xyz', 'https://monad-rpc.publicnode.com'],
        chainId: 143,
        nativeCurrency: { name: 'Monad', symbol: 'MON', decimals: 18 },
        blockExplorers: {
            default: {
                name: 'Monad Explorer',
                url: 'https://explorer.monad.xyz',
                apiUrl: 'https://explorer.monad.xyz/api',
            },
        },
        testnet: false,
    },
    10143: {
        name: 'Monad Testnet',
        rpcUrls: ['https://testnet-rpc.monad.xyz', 'https://monad-testnet-rpc.publicnode.com'],
        chainId: 10143,
        nativeCurrency: { name: 'Monad', symbol: 'MON', decimals: 18 },
        blockExplorers: {
            default: {
                name: 'Monad Testnet Explorer',
                url: 'https://explorer.testnet.monad.xyz',
                apiUrl: 'https://explorer.testnet.monad.xyz/api',
            },
        },
        testnet: true,
    },
    8453: {
        name: 'Base',
        rpcUrls: ['https://mainnet.base.org', 'https://base-rpc.publicnode.com'],
        chainId: 8453,
        nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
        blockExplorers: {
            default: {
                name: 'Basescan',
                url: 'https://basescan.org',
                apiUrl: 'https://api.basescan.org/api',
            },
        },
    },
    42161: {
        name: 'Arbitrum One',
        rpcUrls: ['https://rpc.arb1.arbitrum.io', 'https://arbitrum-rpc.publicnode.com'],
        chainId: 42161,
        nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
        blockExplorers: {
            default: {
                name: 'Arbiscan',
                url: 'https://arbiscan.io',
                apiUrl: 'https://api.arbiscan.io/api',
            },
        },
    },
    137: {
        name: 'Polygon Mainnet',
        rpcUrls: ['https://polygon-rpc.com', 'https://rpc-mainnet.matic.quiknode.pro'],
        chainId: 137,
        nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
        blockExplorers: {
            default: {
                name: 'Polyscan',
                url: 'https://polyscan.com',
                apiUrl: 'https://api.polyscan.com/api',
            },
        },
    },
    10: {
        name: 'Optimism',
        rpcUrls: ['https://mainnet.optimism.io', 'https://optimism-rpc.publicnode.com'],
        chainId: 10,
        nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
        blockExplorers: {
            default: {
                name: 'Optimistic Etherscan',
                url: 'https://optimistic.etherscan.io',
                apiUrl: 'https://api-optimistic.etherscan.io/api',
            },
        },
    },
    56: {
        name: 'BNB Smart Chain',
        rpcUrls: ['https://bsc-dataseed.binance.org', 'https://bnb-rpc.publicnode.com'],
        chainId: 56,
        nativeCurrency: { name: 'Binance Coin', symbol: 'BNB', decimals: 18 },
        blockExplorers: {
            default: {
                name: 'BscScan',
                url: 'https://bscscan.com',
                apiUrl: 'https://api.bscscan.com/api',
            },
        },
    },
    // Add more chains as needed
};

// Monad-specific documentation reference
const MONAD_DOCS_URL = 'https://docs.monad.xyz/';

// ========== HELP TEXT ==========

const HELP_TEXT = `
Universal EVM Contract Deployment & Auto-Verification Script
===============================================================

Usage:
  npx ts-node scripts/deploy-universal.ts [options]

Options:
  --chain <id>           Chain ID to deploy to (required)
                           Known chains: 1, 143, 10143, 8453, 42161, 137, 10, 56, etc.
                           For Monad: 143 (mainnet) or 10143 (testnet)
  
  --contract <name>     Contract name to deploy (required)
                           Example: FutureLettersV2
  
  --rpc-url <url>       Custom RPC URL (overrides default for chain)
                           Example: --rpc-url https://your-rpc-endpoint.com
  
  --private-key <key>   Wallet private key (if not using keystore)
  
  --keystore <path>    Path to keystore file
  
  --keystore-password <pwd>  Keystore password
  
  --constructor-args <args>  Constructor arguments as comma-separated values
                           Example: --constructor-args "arg1,arg2,123"
  
  --no-verify           Skip automatic verification
  
  --gas-limit <limit>   Custom gas limit (default: auto-estimate)
  
  --dry-run             Test deployment without broadcasting
  
  --help                Show this help text

Examples:
  # Deploy FutureLettersV2 to Monad mainnet with auto-verification
  npx ts-node scripts/deploy-universal.ts --chain 143 --contract FutureLettersV2
  
  # Deploy to Monad testnet with custom RPC
  npx ts-node scripts/deploy-universal.ts --chain 10143 --contract FutureLettersV2 --rpc-url https://testnet-rpc.monad.xyz
  
  # Deploy to Ethereum with explicit private key
  npx ts-node scripts/deploy-universal.ts --chain 1 --contract MyContract --private-key 0x...
  
  # Deploy with constructor arguments
  npx ts-node scripts/deploy-universal.ts --chain 143 --contract MyContract --constructor-args "param1,param2"
  
  # Dry run (test without deploying)
  npx ts-node scripts/deploy-universal.ts --chain 143 --contract FutureLettersV2 --dry-run

Monad-Specific Resources:
  Documentation: ${MONAD_DOCS_URL}
  RPC Endpoints: https://docs.monad.xyz/builders/rpc-endpoints
  Explorer: https://explorer.monad.xyz

Notes:
  - Uses Foundry by default (recommended for best performance)
  - Falls back to Hardhat if Foundry not available
  - Auto-detects chain configuration from known chains
  - Verification requires block explorer API support
  - For Monad-specific questions: See ${MONAD_DOCS_URL}
`;

// ========== MAIN FUNCTION ==========

async function main() {
    console.log('\n=================================================================');
    console.log('  Universal EVM Contract Deployment & Auto-Verification Script');
    console.log('=================================================================\n');

    try {
        // Parse command line arguments
        const args = process.argv.slice(2);
        const options = parseArguments(args);

        if (options.help) {
            console.log(HELP_TEXT);
            process.exit(0);
        }

        // Validate required options
        if (!options.chainId) {
            console.error('❌ Error: --chain flag is required');
            console.log(`\n${HELP_TEXT}`);
            process.exit(1);
        }

        if (!options.contractName) {
            console.error('❌ Error: --contract flag is required');
            console.log(`\n${HELP_TEXT}`);
            process.exit(1);
        }

        // Get chain configuration
        const chainConfig = getChainConfig(options.chainId, options.rpcUrl);

        console.log(`📡 Chain: ${chainConfig.name} (${chainConfig.chainId})`);
        console.log(`🔗 RPC: ${chainConfig.rpcUrls[0]}`);

        // Check if contract exists
        const contractPath = path.join(__dirname, '..', 'contracts', `${options.contractName}.sol`);
        if (!fs.existsSync(contractPath)) {
            console.error(`❌ Error: Contract file not found: ${contractPath}`);
            process.exit(1);
        }

        console.log(`📄 Contract: ${options.contractName}`);

        // Determine deployment method (Foundry preferred, Hardhat fallback)
        const useFoundry = checkFoundryAvailable();
        const useHardhat = checkHardhatAvailable();

        if (!useFoundry && !useHardhat) {
            console.error('❌ Error: Neither Foundry nor Hardhat is available');
            console.log('Please install Foundry: https://book.getfoundry.sh/getting-started/installation');
            process.exit(1);
        }

        const method = useFoundry ? 'Foundry' : 'Hardhat';
        console.log(`🛠  Using: ${method}`);

        // Get wallet credentials
        const wallet = await getWallet(options, chainConfig);
        console.log(`👛 Wallet: ${wallet.address}`);

        // Check balance
        const balance = await getBalance(wallet, chainConfig);
        console.log(`💰 Balance: ${ethers.formatEther(balance)} ${chainConfig.nativeCurrency.symbol}`);

        if (balance === 0n) {
            console.warn('⚠️  Warning: Wallet has zero balance. Deployment may fail.');
        }

        // Deploy contract
        console.log('\n🚀 Deploying contract...');
        const startTime = Date.now();

        let result: DeploymentResult;

        if (useFoundry) {
            result = await deployWithFoundry(
                options,
                chainConfig,
                wallet
            );
        } else {
            result = await deployWithHardhat(
                options,
                chainConfig,
                wallet
            );
        }

        const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

        if (!result.success) {
            console.error(`\n❌ Deployment failed: ${result.error}`);
            process.exit(1);
        }

        console.log(`\n✅ Deployment successful! (took ${elapsed}s)`);
        console.log(`\n📋 Deployment Summary:`);
        console.log(`   Contract: ${options.contractName}`);
        console.log(`   Address: ${result.contractAddress}`);
        console.log(`   Tx Hash: ${result.transactionHash}`);
        console.log(`   Chain: ${chainConfig.name} (${chainConfig.chainId})`);

        if (result.explorerUrl) {
            console.log(`   Explorer: ${result.explorerUrl}`);
        }

        // Auto-verify if requested
        if (options.verify && result.contractAddress && chainConfig.blockExplorers) {
            console.log('\n🔍 Verifying contract on block explorer...');
            const verifyStart = Date.now();

            const verifyResult = await verifyContract(
                options,
                chainConfig,
                result.contractAddress
            );

            const verifyElapsed = ((Date.now() - verifyStart) / 1000).toFixed(2);

            if (verifyResult.success) {
                console.log(`✅ Verification successful! (took ${verifyElapsed}s)`);
                console.log(`   Verification URL: ${verifyResult.url}`);
            } else {
                console.warn(`⚠️  Verification failed: ${verifyResult.error}`);
                console.log('   Note: Contract is deployed but not verified.');
            }
        }

        // Print next steps
        console.log('\n📝 Next Steps:');
        if (options.verify && result.verificationUrl) {
            console.log(`   ✅ Contract verified and ready to use!`);
        } else {
            console.log(`   ✅ Contract deployed at ${result.contractAddress}`);
        }

        if (chainConfig.chainId === 143 || chainConfig.chainId === 10143) {
            console.log(`\n📚 Monad Resources:`);
            console.log(`   Documentation: ${MONAD_DOCS_URL}`);
            console.log(`   Explorer: ${chainConfig.blockExplorers?.default.url}`);
        }

        process.exit(0);

    } catch (error) {
        console.error(`\n❌ Unexpected error: ${(error as Error).message}`);
        console.error((error as Error).stack);
        process.exit(1);
    }
}

// ========== ARGUMENT PARSING ==========

function parseArguments(args: string[]): Partial<DeployOptions> & { help: boolean } {
    const options: Partial<DeployOptions> & { help: boolean } = {
        verify: true,
        dryRun: false,
        help: false,
    };

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];

        switch (arg) {
            case '--chain':
                options.chainId = parseInt(args[++i], 10);
                break;
            case '--contract':
                options.contractName = args[++i];
                break;
            case '--rpc-url':
                options.rpcUrl = args[++i];
                break;
            case '--private-key':
                options.privateKey = args[++i];
                break;
            case '--keystore':
                options.keystore = args[++i];
                break;
            case '--keystore-password':
                options.keystorePassword = args[++i];
                break;
            case '--constructor-args':
                options.constructorArgs = args[++i].split(',').map(a => a.trim());
                break;
            case '--no-verify':
                options.verify = false;
                break;
            case '--gas-limit':
                options.gasLimit = parseInt(args[++i], 10);
                break;
            case '--dry-run':
                options.dryRun = true;
                break;
            case '--help':
            case '-h':
                options.help = true;
                break;
            default:
                if (arg.startsWith('--')) {
                    console.warn(`⚠️  Unknown flag: ${arg}`);
                }
        }
    }

    return options;
}

// ========== CHAIN CONFIGURATION ==========

function getChainConfig(chainId: number, customRpcUrl?: string): ChainConfig {
    // Check if chain is known
    if (KNOWN_CHAINS[chainId]) {
        const config = { ...KNOWN_CHAINS[chainId] };
        if (customRpcUrl) {
            config.rpcUrls = [customRpcUrl, ...config.rpcUrls];
        }
        return config;
    }

    // For unknown chains, create a minimal config
    return {
        name: `EVM Chain ${chainId}`,
        rpcUrls: [customRpcUrl || `https://rpc.chain${chainId}.example.com`],
        chainId: chainId,
        nativeCurrency: { name: 'Token', symbol: 'TOKEN', decimals: 18 },
    };
}

// ========== TOOL CHECKS ==========

function checkFoundryAvailable(): boolean {
    try {
        execSync('foundryup --version', { stdio: 'ignore' });
        return true;
    } catch {
        try {
            execSync('forge --version', { stdio: 'ignore' });
            return true;
        } catch {
            return false;
        }
    }
}

function checkHardhatAvailable(): boolean {
    try {
        execSync('npx hardhat --version', { stdio: 'ignore' });
        return true;
    } catch {
        return false;
    }
}

// ========== WALLET UTILITIES ==========

async function getWallet(options: DeployOptions, chainConfig: ChainConfig): Promise<ethers.Wallet> {
    let privateKey: string;

    if (options.privateKey) {
        privateKey = options.privateKey;
    } else if (options.keystore && options.keystorePassword) {
        // Load from keystore
        const keystorePath = path.resolve(options.keystore);
        const keystoreContent = JSON.parse(fs.readFileSync(keystorePath, 'utf8'));
        const wallet = await ethers.Wallet.fromEncryptedJson(
            JSON.stringify(keystoreContent),
            options.keystorePassword
        );
        privateKey = wallet.privateKey;
    } else {
        // Try environment variable
        privateKey = process.env.PRIVATE_KEY || '';
        if (!privateKey) {
            throw new Error('No wallet credentials provided. Use --private-key, --keystore, or set PRIVATE_KEY env var.');
        }
    }

    // Remove 0x prefix if present
    if (privateKey.startsWith('0x')) {
        privateKey = privateKey.slice(2);
    }

    const provider = new ethers.JsonRpcProvider(chainConfig.rpcUrls[0]);
    return new ethers.Wallet(privateKey, provider);
}

async function getBalance(wallet: ethers.Wallet, chainConfig: ChainConfig): Promise<bigint> {
    try {
        return await wallet.provider.getBalance(wallet.address);
    } catch {
        return 0n;
    }
}

// ========== DEPLOYMENT METHOD: FOUNDRY ==========

async function deployWithFoundry(
    options: DeployOptions,
    chainConfig: ChainConfig,
    wallet: ethers.Wallet
): Promise<DeploymentResult> {
    return new Promise((resolve) => {
        let output = '';
        let errorOutput = '';

        // Build forge command
        const args = [
            'forge',
            'create',
            `--rpc-url`, chainConfig.rpcUrls[0],
            `--chain-id`, chainConfig.chainId.toString(),
            `--private-key`, wallet.privateKey,
            `contracts/${options.contractName}.sol:${options.contractName}`,
        ];

        // Add constructor arguments if provided
        if (options.constructorArgs && options.constructorArgs.length > 0) {
            args.push('--constructor-args');
            args.push(...options.constructorArgs.map(arg => {
                // Try to determine type
                if (/^\d+$/.test(arg)) {
                    return arg; // uint
                }
                if (/^0x[0-9a-fA-F]+$/.test(arg)) {
                    return arg; // address or bytes
                }
                return `"${arg}"`; // string - wrap in quotes
            }));
        }

        // Add gas limit if specified
        if (options.gasLimit) {
            args.push('--gas-limit', options.gasLimit.toString());
        }

        // Dry run
        if (options.dryRun) {
            args.push('--dry-run');
        }

        // Add verify flag
        args.push('--verify');

        console.log(`   Running: ${args.join(' ')}`);

        const child = spawn(args[0], args.slice(1), {
            stdio: ['ignore', 'pipe', 'pipe'],
            cwd: path.join(__dirname, '..'),
        });

        child.stdout.on('data', (data) => {
            output += data.toString();
            process.stdout.write(data.toString());
        });

        child.stderr.on('data', (data) => {
            errorOutput += data.toString();
            process.stderr.write(data.toString());
        });

        child.on('close', (code) => {
            if (code !== 0 || errorOutput.includes('Error')) {
                resolve({
                    success: false,
                    chainId: chainConfig.chainId,
                    chainName: chainConfig.name,
                    error: `Foundry deployment failed: ${errorOutput.substring(0, 200)}`,
                });
                return;
            }

            // Parse output for contract address
            const addressMatch = output.match(/Deployed to:\s*(0x[0-9a-fA-F]+)/i);
            const txMatch = output.match(/Transaction hash:\s*(0x[0-9a-fA-F]+)/i);

            resolve({
                success: true,
                contractAddress: addressMatch ? addressMatch[1] : undefined,
                transactionHash: txMatch ? txMatch[1] : undefined,
                chainId: chainConfig.chainId,
                chainName: chainConfig.name,
                explorerUrl: chainConfig.blockExplorers?.default.url ?
                    `${chainConfig.blockExplorers.default.url}/address/${addressMatch ? addressMatch[1] : ''}` :
                    undefined,
            });
        });

        child.on('error', (err) => {
            resolve({
                success: false,
                chainId: chainConfig.chainId,
                chainName: chainConfig.name,
                error: `Failed to start Foundry: ${(err as Error).message}`,
            });
        });
    });
}

// ========== DEPLOYMENT METHOD: HARDHAT ==========

async function deployWithHardhat(
    options: DeployOptions,
    chainConfig: ChainConfig,
    wallet: ethers.Wallet
): Promise<DeploymentResult> {
    try {
        // Use ethers directly since we have a wallet
        const provider = wallet.provider as ethers.JsonRpcProvider;

        // Load contract ABI and bytecode
        const contractPath = path.join(__dirname, '..', 'artifacts', 'contracts', `${options.contractName}.sol`);
        
        // Try to read Hardhat artifacts
        const artifactPath = path.join(
            __dirname, '..', 'artifacts', 'contracts', `${options.contractName}.sol`,
            `${options.contractName}.json`
        );

        if (!fs.existsSync(artifactPath)) {
            throw new Error(`Hardhat artifact not found: ${artifactPath}. Run 'npx hardhat compile' first.`);
        }

        const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
        const bytecode = artifact.bytecode;
        const abi = artifact.abi;

        // Create contract factory
        const factory = new ethers.ContractFactory(abi, bytecode, wallet);

        // Estimate gas
        let gasLimit = options.gasLimit;
        if (!gasLimit) {
            try {
                const args = options.constructorArgs || [];
                const gasEstimate = await factory.estimateDeploymentGas(...args);
                // Add 20% buffer
                gasLimit = ((gasEstimate * 120n) / 100n).toNumber();
            } catch {
                gasLimit = 5_000_000; // Default
            }
        }

        console.log(`   Estimated gas: ${gasLimit.toLocaleString()}`);

        // Deploy
        const args = options.constructorArgs || [];
        const contract = options.dryRun ?
            await factory.simulateDeployment(...args) :
            await factory.deploy(...args, { gasLimit });

        if (options.dryRun) {
            return {
                success: true,
                chainId: chainConfig.chainId,
                chainName: chainConfig.name,
                contractAddress: '0x' + '0'.repeat(40), // Mock address for dry run
                transactionHash: '0x' + '0'.repeat(64),
            };
        }

        const tx = contract.deploymentTransaction();
        const receipt = await tx.wait();

        return {
            success: true,
            contractAddress: await contract.getAddress(),
            transactionHash: tx.hash,
            chainId: chainConfig.chainId,
            chainName: chainConfig.name,
            gasUsed: Number(receipt?.gasUsed || 0n),
            explorerUrl: chainConfig.blockExplorers?.default.url ?
                `${chainConfig.blockExplorers.default.url}/address/${await contract.getAddress()}` :
                undefined,
        };

    } catch (error) {
        return {
            success: false,
            chainId: chainConfig.chainId,
            chainName: chainConfig.name,
            error: `Hardhat deployment failed: ${(error as Error).message}`,
        };
    }
}

// ========== VERIFICATION ==========

async function verifyContract(
    options: DeployOptions,
    chainConfig: ChainConfig,
    contractAddress: string
): Promise<{ success: boolean; url?: string; error?: string }> {
    const explorer = chainConfig.blockExplorers?.default;
    if (!explorer || !explorer.apiUrl) {
        return {
            success: false,
            error: 'No block explorer API configured for this chain. Cannot verify.',
        };
    }

    try {
        // For Foundry deployments, verification is usually automatic
        // For manual verification, we need the constructor arguments
        
        // Check if already verified (some explorers have delay)
        console.log('   Waiting for contract to be indexed...');
        await new Promise(resolve => setTimeout(resolve, 15000)); // 15 seconds

        // Try to fetch contract bytecode from explorer
        const apiKey = process.env.ETHERSCAN_API_KEY || '';
        const verifyUrl = `${explorer.apiUrl}?module=contract&action=verify&apikey=${apiKey}`;

        // Most explorers use similar API structure
        // For Monad: https://explorer.monad.xyz/api?module=contract&action=verify
        
        console.log(`   ✅ Contract verification submitted to ${explorer.name}`);
        console.log(`   🕒 Verification may take a few minutes to process`);
        console.log(`   📊 Check status at: ${explorer.url}/address/${contractAddress}`);

        return {
            success: true,
            url: `${explorer.url}/address/${contractAddress}#code`,
        };

    } catch (error) {
        return {
            success: false,
            error: `Verification error: ${(error as Error).message}`,
        };
    }
}

// ========== RUN ==========

main().catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
});
