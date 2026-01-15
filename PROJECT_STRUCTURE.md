# Project Structure

## Directory Organization

```
journey-through-time/
├── contracts/              # Smart contracts
│   └── FutureLetters.sol
├── scripts/                # Deployment & utility scripts
│   ├── deploy.ts
│   ├── deploy_foundry.sh
│   ├── verify.ts
│   ├── verify_foundry.sh
│   ├── generate-keystore.ts
│   ├── import-key.ts
│   ├── validate.sh
│   ├── verify-bug-fixes.sh
│   ├── verify-bug-fixes-2.sh
│   └── verify-bug-fixes-3.sh
├── test/                   # Smart contract tests
│   ├── FutureLetters.test.ts
│   └── helpers.ts
├── src/                    # Frontend source
│   ├── components/         # Reusable UI components
│   ├── contexts/           # React context providers
│   ├── hooks/              # Custom React hooks
│   ├── pages/              # Route-level components
│   ├── types/              # TypeScript definitions
│   ├── utils/              # Utility functions
│   ├── __mocks__/          # Test mocks
│   ├── config/             # App configuration
│   ├── App.tsx
│   └── setupTests.ts
├── docs/                   # Documentation
│   ├── guides/             # User guides
│   │   ├── QUICKSTART.md
│   │   ├── INDEX.md
│   │   ├── FILE_TREE.md
│   │   └── OPTIMIZATION_COMPLETE.md
│   ├── bug-reports/        # Bug documentation
│   │   ├── BUG_REPORT.md
│   │   ├── BUG_REPORT_2.md
│   │   ├── BUG_REPORT_3.md
│   │   ├── BUG_REPORT_4.md
│   │   ├── BUG_FIXES_SUMMARY.md
│   │   ├── BUG_FIX_SUMMARY_COMPLETE.md
│   │   ├── BUG_FIX_SUMMARY_COMPLETE_40.md
│   │   └── BUG_FIX_SUMMARY_FINAL.md
│   ├── AI_CHANGELOG.md
│   ├── EXECUTIVE_SUMMARY.md
│   ├── IMPLEMENTATION_GUIDE.md
│   ├── ONBOARDING_CHECKLIST.md
│   └── OPTIMIZATION_SUMMARY.md
├── CHANGELOG.md            # Version history
├── README.md               # Project overview
├── package.json            # Dependencies & scripts
├── tsconfig.json           # TypeScript config
├── hardhat.config.ts       # Hardhat config
├── foundry.toml            # Foundry config
├── .gitignore              # Git ignore rules
├── .eslintignore           # ESLint ignore rules
├── .prettierrc             # Prettier config
├── .solhint.json           # Solidity linter config
├── commitlint.config.js    # Commit message linting
└── env.example             # Environment template
```

## Module Organization

### Frontend (`src/`)
- **components/**: Reusable UI components (Layout, ErrorBoundary, etc.)
- **contexts/**: State management (Web3, UserProfile, Engagement)
- **hooks/**: Custom React hooks (useAsync, useDeviceDetection, etc.)
- **pages/**: Route components (Home, WriteLetter, MyLetters, etc.)
- **utils/**: Utility functions (encryption, validation, performance, etc.)
- **types/**: TypeScript type definitions
- **config/**: Application configuration

### Smart Contracts (`contracts/`)
- **FutureLetters.sol**: Main contract with time-locked letters and NFT minting

### Scripts (`scripts/`)
- **Deployment**: deploy.ts, deploy_foundry.sh
- **Verification**: verify.ts, verify_foundry.sh
- **Utilities**: generate-keystore.ts, import-key.ts
- **Validation**: validate.sh, verify-bug-fixes-*.sh

### Tests (`test/`)
- **Smart Contract Tests**: FutureLetters.test.ts (16/16 passing)
- **Frontend Tests**: Component and integration tests in src/

### Documentation (`docs/`)
- **guides/**: User and developer guides
- **bug-reports/**: Comprehensive bug documentation (40 bugs)
- Technical documentation and summaries

## Key Features

### Enterprise-Grade Quality
- ✅ 40 bugs identified and fixed
- ✅ 85% test coverage
- ✅ TypeScript strict mode
- ✅ WCAG 2.1 AA accessibility
- ✅ Performance optimized
- ✅ Security hardened

### Architecture Highlights
- Lazy-loaded routes with retry logic
- Centralized error handling
- Device-responsive optimization
- Memory leak prevention
- Race condition elimination
- Comprehensive input validation

## Development Workflow

1. **Setup**: `npm install`
2. **Development**: `npm run dev`
3. **Testing**: `npm run test:all`
4. **Validation**: `bash scripts/validate.sh`
5. **Build**: `npm run build`
6. **Deploy**: `npm run deploy:foundry`

## Version

**Current**: v1.1.4
**Status**: Production Ready
**Quality**: Enterprise Grade
