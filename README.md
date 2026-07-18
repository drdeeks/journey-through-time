# Journey Through Time - Future Letters dApp

A production-ready decentralized application that allows users to write encrypted letters to their future selves, with time-locked visibility and optional public sharing. Built with React 18, TypeScript, Material-UI v5, and Ethereum smart contracts using ethers.js v6.

🔐 **Enhanced Security** | ⚡ **Performance Optimized** | ♿ **Accessibility Compliant** | 📱 **Mobile First** | 👤 **User Profiles & Activity**

---

## 📁 Project Structure

```
.
├── contracts/              # Solidity smart contracts
│   └── FutureLetters.sol   # Main contract with v0.8.19+ features
├── scripts/                # Deployment and utility scripts
│   ├── deploy_foundry.sh   # Foundry deployment (recommended)
│   ├── verify_foundry.sh   # Foundry verification (recommended)
│   ├── deploy.ts           # Hardhat deployment script (legacy)
│   └── verify.ts           # Hardhat verification (legacy)
├── test/                   # Comprehensive test suite
│   ├── FutureLetters.test.ts # Smart contract tests (16/16 passing)
│   └── helpers.ts          # Test utilities
├── src/                    # Frontend source code
│   ├── App.tsx             # Main application with routing
│   ├── components/         # Reusable UI components
│   │   ├── Layout.tsx      # Enhanced layout with accessibility
│   │   └── Layout.test.tsx # Component tests
│   ├── pages/              # Route-level page components
│   │   ├── Home.tsx        # Landing page with onboarding
│   │   ├── WriteLetter.tsx # Letter composition with validation
│   │   ├── MyLetters.tsx   # Letter management dashboard
│   │   ├── PublicLetters.tsx # Community letter discovery
│   │   ├── Settings.tsx    # User preferences and account
│   │   └── *.test.tsx      # Comprehensive page tests
│   ├── contexts/           # React context providers
│   │   └── Web3Context.tsx # Ethers.js v6 integration
│   ├── utils/              # Utility functions
│   │   └── encryption.ts   # AES-256-GCM encryption
│   ├── types/              # TypeScript type definitions
│   │   ├── index.ts        # Centralized type definitions
│   │   └── global.d.ts     # Global and Jest types
│   ├── __mocks__/          # Test mocks and fixtures
│   │   └── Web3Context.tsx # Comprehensive Web3 mocks
│   └── setupTests.ts       # Jest test configuration
├── typechain-types/        # Auto-generated contract types
├── .cursor/                # Cursor IDE rules and configuration
│   └── rules/              # Comprehensive development guidelines
├── hardhat.config.ts       # Hardhat configuration with gas reporting
├── tsconfig.json           # Strict TypeScript configuration
├── .prettierrc             # Code formatting standards
├── .eslintignore           # ESLint exclusions
├── .solhint.json           # Solidity linting rules
├── commitlint.config.js    # Git commit message standards
└── env.example             # Comprehensive environment template
```

### Folder & File Descriptions
- **contracts/**: Contains all Solidity smart contracts for the dApp.
- **scripts/**: Automation scripts for deploying, verifying, and managing keys.
  - `deploy.ts`: Deploys the smart contract to Monad testnet.
  - `verify.ts`: Verifies the contract on Monad explorer.
  - `import-key.ts`: Imports an existing private key into a keystore.
  - `generate-keystore.ts`: Generates a new keystore file from a private key.
- **test/**: Contains automated tests for the smart contracts.
- **src/**: All frontend source code, organized by components, pages, contexts, utils, and types.
- **keystore.ts**: Script to generate an encrypted keystore file from your private key.
- **hardhat.config.ts**: Main configuration for Hardhat, including Monad testnet settings.
- **package.json**: Lists dependencies and npm scripts.
- **tsconfig.json**: TypeScript compiler options.
- **.gitignore**: Specifies files/folders to exclude from git.
- **README.md**: This documentation file.
- **package-lock.json**: Ensures consistent installs across environments.

---

## 🔑 Keystore Generation & Usage

### What is a Keystore?
A keystore is an encrypted file that securely stores your private key, protected by a password. It is used for secure deployments and automation.

### How to Generate a Keystore File

1. **Set your private key as an environment variable:**
   ```sh
   set PRIVATE_KEY=your_private_key_here  # Windows
   export PRIVATE_KEY=your_private_key_here  # macOS/Linux
   ```
2. **Run the keystore script:**
   ```sh
   npx ts-node keystore.ts
   ```
   - You will be prompted to enter a password to encrypt your keystore.
   - The script will generate a `keystore.json` file in the root directory.

### How to Use the Keystore for Deployment
- Use the `import-key.ts` or update your deployment scripts to load and decrypt the keystore file using your password.
- Never commit your keystore file or password to version control.
- Store your password securely (e.g., in a password manager).

---

## 🌟 Features

### 🔐 Security & Encryption
- **AES-256-GCM Encryption**: Military-grade client-side encryption
- **Secure Key Management**: PBKDF2 key derivation with 100,000 iterations
- **Input Validation**: Comprehensive sanitization and validation
- **Private Key Protection**: Secure memory handling and cleanup
- **Smart Contract Security**: ReentrancyGuard and access controls

### 📱 User Experience & Social Features
- **WCAG 2.1 AA Compliant**: Full accessibility with screen reader support
- **Mobile-First Design**: Responsive layout optimized for all devices
- **Progressive Loading**: Skeleton screens and optimistic updates
- **Performance Optimized**: React.memo, useMemo, and useCallback throughout
- **Profile Page**: Custom username & avatar with quick editing
- **Letters / Activity Tabs**: Manage personal letters and view engagement history (likes, comments, locks)
- **Likes & Comments**: Social interactions persisted locally with instant feedback
- **NFT Thumbnails**: Locked letters display capsule NFT artwork via `tokenURI`
- **Error Boundaries**: Graceful error handling with user-friendly messages

### 🏗 Technical Excellence
- **Type-Safe**: Comprehensive TypeScript with strict mode enabled
- **Ethers.js v6**: Latest blockchain interaction patterns (upgraded from v5)
- **Material-UI v5**: Modern design system with consistent theming
- **Testing**: 16/16 passing smart contract tests, comprehensive frontend coverage
- **Development Tools**: ESLint, Prettier, Solhint, and commit linting

## 🏗 Architecture

### Smart Contract (`FutureLetters.sol`)
**Solidity v0.8.19** with advanced security features:

#### Core Functions
```solidity
// Write encrypted letter to future self
function writeLetter(
    string memory _encryptedContent,
    uint256 _unlockTime,
    bool _isPublic
) external nonReentrant

// Retrieve user's letters with comprehensive metadata
function getMyLetters() external view returns (
    uint256[] memory ids,
    uint256[] memory unlockTimes,
    uint256[] memory createdAt,
    bool[] memory isPublic,
    string[] memory encryptedContent
)

// Get public letters for community discovery
function getPublicLetters() external view returns (Letter[] memory)

// Get total letter count for pagination
function getLetterCount() external view returns (uint256)
```

#### Security Features
- **ReentrancyGuard**: Protection against reentrancy attacks
- **Access Controls**: Proper function visibility and authorization
- **Input Validation**: Comprehensive parameter checking
- **Gas Optimization**: Efficient storage patterns and operations

### Frontend Architecture

#### Type System (`src/types/index.ts`)
```typescript
interface Letter {
  id: string;
  recipient: string;
  content: string;
  unlockTime: bigint;
  isPublic: boolean;
  encryptedContent?: string;
  sender?: string;
  createdAt?: bigint;
}

interface FutureLettersContract extends BaseContract {
  writeLetter: (content: string, unlockTime: bigint, isPublic: boolean) => Promise<ContractTransactionResponse>;
  getMyLetters: () => Promise<Letter[]>;
  getPublicLetters: () => Promise<Letter[]>;
}
```

#### Performance Patterns
- **React.memo**: All components optimized for re-render prevention
- **useMemo**: Expensive calculations cached
- **useCallback**: Event handlers optimized
- **Code Splitting**: Route-level lazy loading
- **Bundle Analysis**: Optimized import sizes

#### Accessibility Features
- **ARIA Labels**: Comprehensive screen reader support
- **Keyboard Navigation**: Full keyboard accessibility
- **Focus Management**: Proper focus handling for dialogs
- **Semantic HTML**: Proper heading hierarchy and landmarks
- **Color Contrast**: WCAG AA compliant color schemes

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MetaMask or compatible Web3 wallet
- Monad testnet configured in your wallet

### Quick Start

1. **Clone and Install**:
   ```bash
   git clone https://github.com/yourusername/journey-through-time-app.git
   cd journey-through-time-app
   npm install
   ```

2. **Environment Setup**:
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

3. **Development**:
   ```bash
   # Start local blockchain and frontend
   npm run dev
   
   # Or run separately
   npm run node    # Start Hardhat node
   npm start       # Start React frontend
   ```

4. **Testing**:
   ```bash
   npm test                    # Smart contract tests
   npm run test:frontend       # Frontend tests
   npm run test:frontend:coverage # Coverage report
   ```

### Development Scripts

```bash
# Development
npm run dev                 # Start both blockchain and frontend
npm start                   # Frontend only
npm run node               # Local blockchain node

# Testing
npm test                   # Smart contract tests (16/16 passing)
npm run test:frontend      # React component tests
npm run gas-report         # Gas usage analysis

# Code Quality
npm run lint               # Solidity linting
npm run lint:ts           # TypeScript linting
npm run format            # Code formatting
npm run type-check        # TypeScript validation

# Build & Deploy
npm run build                 # Production build
npm run deploy:foundry        # Deploy via Foundry (recommended)
npm run verify:foundry        # Verify via Foundry (recommended)
npm run deploy                # Deploy via Hardhat (legacy)
npm run verify                # Verify via Hardhat (legacy)
```

### Smart Contract Deployment (Foundry)
1. Ensure you have a keystore named `monad-deployer` (see **Keystore Generation & Usage**).
2. Deploy the contract to Monad Testnet:
   ```bash
   npm run deploy:foundry
   ```
   This runs `scripts/deploy_foundry.sh`, broadcasting and auto-verifying on Sourcify.
3. Copy the deployed address from the output and update `REACT_APP_CONTRACT_ADDRESS` in your `.env`.

#### Verification Only
If you need to verify an already-deployed contract:
```bash
npm run verify:foundry -- <contract_address>
```

## 🚀 Deployment Guide

### Prerequisites
- Node.js (v16 or higher)
- MetaMask or compatible Web3 wallet
- Monad testnet configured in your wallet
- Testnet tokens for deployment

### Deployment Checklist

1. Environment Setup
   - [ ] Create `.env` file with required variables:
     ```
     PRIVATE_KEY=your_wallet_private_key
     ETH_RPC_URL=https://rpc.testnet.monad.xyz
     ETHERSCAN_API_KEY=your_etherscan_api_key
     ```
   - [ ] Install dependencies: `npm install`
   - [ ] Configure wallet with Monad testnet
   - [ ] Ensure sufficient testnet tokens for deployment

2. Pre-deployment
   - [ ] Run contract tests: `npm test`
   - [ ] Check contract coverage: `npm run coverage`
   - [ ] Verify network configuration in `hardhat.config.js`
   - [ ] Compile contracts: `npm run compile`
   - [ ] Run linter: `npm run lint`

3. Deployment Steps
   - [ ] Deploy contract: `npm run deploy:foundry`
   - [ ] Save contract address from deployment output
   - [ ] Update frontend environment variables with new contract address
   - [ ] Verify contract: `npm run verify`
   - [ ] Test contract interaction on testnet

4. Post-deployment Verification
   - [ ] Test letter creation
   - [ ] Verify time-lock functionality
   - [ ] Check public/private visibility settings
   - [ ] Test letter reading and decryption
   - [ ] Verify frontend integration

### Available Scripts

- `npm start` - Start the development server
- `npm run build` - Build the frontend for production
- `npm test` - Run contract tests
- `npm run test:frontend` - Run frontend tests
- `npm run deploy` - Deploy contract to Monad testnet
- `npm run verify` - Verify contract on block explorer
- `npm run coverage` - Generate contract coverage report
- `npm run compile` - Compile smart contracts
- `npm run clean` - Clean build artifacts
- `npm run lint` - Run Solidity linter
- `npm run lint:fix` - Fix linting issues automatically

### Troubleshooting

1. Deployment Issues
   - Ensure sufficient testnet tokens
   - Verify network configuration
   - Check private key format
   - Confirm RPC URL accessibility

2. Contract Verification
   - Verify compiler settings match deployment
   - Check contract address
   - Ensure network is supported by explorer

3. Frontend Integration
   - Verify contract address in environment variables
   - Check network connection
   - Ensure wallet is connected to correct network

## 💻 Usage Guide

### Writing a Letter
1. Connect your Web3 wallet
2. Navigate to "Write Letter"
3. Follow the multi-step process:
   - Enter letter title and content
   - Select unlock date
   - Choose visibility (public/private)
   - Select mood
   - Generate or enter encryption keys
4. Submit the letter (requires transaction confirmation)

### Reading Letters
1. Go to "My Letters"
2. Filter letters using the category tabs
3. For unlocked letters:
   - Click "Read" on the letter card
   - Enter your private key
   - View decrypted content
4. Use the export options to save or share letters

### Managing Letters
- View all your letters in the "My Letters" section
- Filter by status (Locked/Unlocked/Public)
- Track letter status with visual indicators
- Export letters as JSON files
- Copy letter content to clipboard

## 🔧 Technical Stack

### Frontend
- React 18
- TypeScript (strict mode)
- Material-UI v5
- Ethers.js v6
- Web3-React 6
- Date-fns
- Buffer polyfill for browser (`buffer` pkg)

### Smart Contract
- Solidity ^0.8.0
- Hardhat
- OpenZeppelin Contracts

### Development Tools
- TypeScript
- ESLint
- Prettier
- Hardhat
- MetaMask

## 🔐 Security Considerations

### Encryption
- Letters are encrypted client-side before storage
- Private keys are never stored on-chain
- Public keys are stored for recipient access
- End-to-end encryption ensures only intended recipients can read letters

### Access Control
- Time-locked visibility enforced by smart contract
- Public/private visibility settings
- Owner-only access to private letters
- Immutable letter content after creation

### Best Practices
- Never share your private keys
- Keep your wallet secure
- Verify contract address before transactions
- Use strong encryption keys
- Regularly backup your keys

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Monad testnet for blockchain infrastructure
- OpenZeppelin for secure smart contract libraries
- Material-UI for the component library
- Ethers.js for Ethereum interaction
- Web3-React for wallet integration 

### New Modules
- `UserProfileContext` – manages username & avatar (localStorage)
- `EngagementContext` – stores likes, comments, and lock events
- `EngagementSection` – reusable UI for likes & comments 