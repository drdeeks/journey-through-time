# Journey Through Time – Agent Onboarding Checklist

> Last updated: <!-- TODO: update date when editing -->

## ✅ Project Snapshot

### Core Architecture
- [x] React 18 + TypeScript + Material-UI v5 frontend
- [x] Ethereum smart contracts (Hardhat + ethers.js v6)
- [x] AES-256-GCM client-side encryption for letter content
- [x] Jest + React Testing Library for UI tests; Hardhat for contract tests

### Implemented Features
- [x] Write encrypted letters & mint NFT capsules on-chain
- [x] "My Letters" page with filtering (all / locked / unlocked / public) and decryption workflow
- [x] NFT preview displayed after successful mint
- [x] Comprehensive unit & integration tests – all passing
- [x] Detailed change log maintained in `docs/AI_CHANGELOG.md`

## ✅ Completed Since Last Snapshot
- UserProfileContext (username & avatar)
- Profile page with Letters / Activity tabs and navigation
- EngagementContext for likes, comments, lock records
- EngagementSection UI with local persistence
- Confirmation popup before minting clarifying on-chain visibility
- NFT thumbnail retrieval via `tokenURI` for locked letters

All open TODO items are now closed. The project is feature-complete for this milestone.

## 🗂 File / Directory Overview
```
src/
├── components/           # Reusable UI components
├── pages/                # Route-level pages (Home, MyLetters, WriteLetter, etc.)
├── contexts/             # React context providers (Web3Context, *pending* UserProfileContext)
├── utils/                # Helper functions (encryption, etc.)
├── types/                # TypeScript type declarations
└── __mocks__/            # Test mocks & fixtures
contracts/                # Solidity smart contracts (FutureLetters.sol)
docs/                     # Project documentation & changelogs
```

## 🛠 Setup & Development
1. `npm install` – install dependencies.
2. Copy `env.example` ➜ `.env` and fill values (`RPC_URL`, `PRIVATE_KEY`, etc.).
3. **Run local blockchain**: `npx hardhat node` (separate terminal).
4. **Deploy contracts**: `npx hardhat run scripts/deploy.ts --network localhost`.
5. **Start frontend**: `npm run dev` (Vite/React).
6. **Run tests**:  
   • Frontend: `npm test`  
   • Contracts: `npx hardhat test`

## 🧭 Next-Step Roadmap (Suggested Order)
1. Implement **UserProfileContext** for persisting username & avatar to `localStorage`.
2. Build **Profile page** with Letters/Activity tabs.
3. Reuse existing `MyLetters` logic for the Letters tab; add NFT thumbnail retrieval (`tokenURI`).
4. Design Activity tab to aggregate likes, comments, and lock events.
5. Implement **Comment & Like** storage (localStorage for now; upgradeable to on-chain later).
6. Add **confirmation popup** in `WriteLetter` before transaction submission.
7. Update routing & nav links; adjust tests accordingly.
8. Keep `docs/AI_CHANGELOG.md` & this checklist updated.

## 📚 Helpful References
- `src/contexts/Web3Context.tsx` – wallet/contract integration
- `src/utils/encryption.ts` – AES-256-GCM helpers
- `src/pages/MyLetters.tsx` – example of letter listing & decryption flow
- `test/FutureLetters.test.ts` – sample contract tests

---
Feel free to extend this checklist or mark items complete as work progresses 🍀 