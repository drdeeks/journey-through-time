# Journey Through Time - Future Letters dApp

A decentralized application that allows users to write encrypted letters to their future selves or others, with time-locked visibility and optional public sharing. Built on the Monad testnet using React, TypeScript, and Solidity.

---

## 📁 Project Structure

```
.
├── contracts/              # Solidity smart contracts
│   └── journey-through-time.sol
├── scripts/                # Deployment, verification, and utility scripts
│   ├── deploy.ts
│   ├── verify.ts
│   ├── import-key.ts
│   └── generate-keystore.ts
├── test/                   # Smart contract tests
│   ├── FutureLetters.test.ts
│   └── helpers.ts
├── src/                    # Frontend source code
│   ├── App.tsx
│   ├── types.ts
│   ├── components/         # React UI components (e.g., Layout)
│   ├── pages/              # Main pages (WriteLetter, MyLetters)
│   ├── contexts/           # React context providers (Web3Context)
│   ├── utils/              # Utility functions (encryption)
│   └── types/              # TypeScript type definitions
├── keystore.ts             # Script to generate an encrypted keystore file
├── hardhat.config.ts       # Hardhat configuration (TypeScript)
├── package.json            # Project dependencies and scripts
├── tsconfig.json           # TypeScript configuration
├── .gitignore              # Files and folders to ignore in git
├── README.md               # Project documentation
└── package-lock.json       # Dependency lock file
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

### Smart Contract Features
- **Time-Locked Letters**: Write letters that become readable only after a specified date
- **Encryption**: End-to-end encryption using public/private key pairs
- **Visibility Control**: Choose between public and private letters
- **Mood Tracking**: Tag letters with emotional states for better context
- **Letter Management**: View, read, and manage all your letters in one place

### Frontend Features
- **Modern UI**: Clean, intuitive interface built with Material-UI
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Multi-step Letter Writing**: Guided process for creating time-locked letters
- **Letter Categories**: Filter letters by status (All, Locked, Unlocked, Public)
- **Export & Share**: Download letters as JSON files or copy content to clipboard

## 🏗 Architecture

### Smart Contract (`FutureLetters.sol`)
The core contract manages letter storage and access control:

#### Key Functions
- `writeLetter(title, content, unlockTime, isPublic, mood, publicKey)`: Creates a new encrypted letter
  - `title`: Letter title (string)
  - `content`: Encrypted letter content (string)
  - `unlockTime`: Unix timestamp when letter becomes readable (uint256)
  - `isPublic`: Whether letter is publicly visible after unlocking (bool)
  - `mood`: Emotional state tag (string)
  - `publicKey`: Recipient's public key for encryption (string)

- `readLetter(letterId)`: Retrieves an unlocked letter's content
  - Returns: `(encryptedContent, publicKey)`
  - Only accessible if letter is unlocked and user has permission

- `getMyLetters()`: Retrieves all letters owned by the caller
  - Returns: `(ids, unlockTimes, createdAts, isRead, isUnlocked, isPublic, titles, moods)`

### Frontend Components

#### WriteLetter Component
- Multi-step form for letter creation
- Date picker for unlock time selection
- Encryption key generation and management
- Mood selection
- Visibility settings

#### MyLetters Component
- Tabbed interface for letter categories
- Letter cards with status indicators
- Decryption interface for reading letters
- Export and sharing options
- Responsive grid layout

### Security Features
- End-to-end encryption using public/private key pairs
- On-chain storage of encrypted content only
- Time-locked access control
- Optional public/private visibility
- Secure key management

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MetaMask or compatible Web3 wallet
- Monad testnet configured in your wallet

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/journey-through-time-app.git
   cd journey-through-time-app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   Create a `.env` file in the root directory:
   ```
   REACT_APP_CONTRACT_ADDRESS=your_contract_address
   REACT_APP_NETWORK_ID=your_network_id
   PRIVATE_KEY=your_wallet_private_key
   ETH_RPC_URL=https://rpc.testnet.monad.xyz
   ```

4. Start the development server:
   ```bash
   npm start
   ```

### Smart Contract Deployment
1. Configure Hardhat network settings in `hardhat.config.ts`
2. Deploy the contract:
   ```bash
   npx hardhat run scripts/deploy.ts --network monad-testnet
   ```
3. Update the contract address in your `.env` file

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
   - [ ] Deploy contract: `npm run deploy`
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
- TypeScript
- Material-UI v5
- Ethers.js v5
- Web3-React
- Date-fns

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