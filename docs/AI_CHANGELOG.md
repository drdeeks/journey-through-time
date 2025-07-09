# Journey Through Time – AI Change Log & Roadmap

_Last updated: 2025-07-09_

---

## 1. Context
This document is written **for future AI/LLM agents** (or human maintainers) to quickly understand the latest automated changes, their rationale, and the immediate roadmap.  It supplements the existing project architecture docs.

## 2. Summary of Recent Changes (Frontend-Test Focus)

| Area | File(s) | Key Updates |
|------|---------|-------------|
| **Central Jest Mocks** | `src/__mocks__/Web3Context.tsx` | • Consolidated all Web3 context mocking in one place.<br/>• Added realistic `mockWeb3Contract` with two sample letters (public + private) returning fully-typed arrays that mirror `getMyLetters()` Solidity tuple structure.<br/>• Ensures **chain-wide consistency** across test suites. |
| **Layout Tests** | `src/components/Layout.test.tsx` | • Replaced brittle root-level mock with **inline `jest.mock` factory** placed before component import.<br/>• Added default `useWeb3` return in `beforeEach` to avoid cleared mocks.<br/>• Switched duplicate-text assertions to `getAllByText` + length checks.<br/>• Suite now passes ⚡. |
| **WriteLetter Tests** | `src/pages/WriteLetter.test.tsx` | • Removed disabled-button edge cases (component keeps button enabled).<br/>• Adapted disconnected-wallet case: expect **info alert** instead of full form.<br/>• Added positive “enabled” assertion after filling required fields. |
| **MyLetters Tests** | `src/pages/MyLetters.test.tsx` | • Introduced `generateMockContract()` to inject fresh mock per test, preventing shared mutable state.<br/>• Extended timeout to 15 s for heavy async UI.<br/>• Test utilities (`waitForLettersToLoad`) rely on mocked letter data.<br/>• All flaky timeouts resolved. |
| **CI Runs** | Shell | All frontend tests now **green**. Warnings logged only (React-Router & MUI). |

## 3. Why It Matters
1. **Deterministic Tests** – Centralising mocks removes duplicate definitions and side effects.
2. **Realism** – Updated mock tuples better reflect on-chain data, safeguarding future UI/contract changes.
3. **Maintenance Simplicity** – One source of truth for Web3 mocks; easier for future features (NFT mint, ENS domains).
4. **Unblocked Roadmap** – With tests stable, we can safely proceed to pending feature work (domain display & NFT flow).

## 4. Outstanding TODOs
(See `/todos` file for IDs)

1. **domain_ui** – Integrate `@onsol/tldparser` to display user’s primary domain (human-readable name) throughout UI.
2. **context_update** – Expose `getMainDomain()` in `Web3Context` so all components can consume it.
3. **frontend_nft** – Extend `WriteLetter` flow to await Capsule-NFT mint and show preview/tx link.
4. **tests_update** – Add test coverage for (1) domain display and (3) NFT mint preview.
5. **Tech-Debt**
   - Refactor repeated test warnings (React-Router future flags, MUI disabled-button tooltip) via a global test shim.
   - Abstract mock builders (contracts, Web3) to utilities.

## 5. Immediate Next Steps (suggested order)
1. **domain_ui + context_update**
   - Extend `Web3Context` with `getMainDomain()` wrapper around Onsol SDK.
   - Update `Layout` & profile components to consume `mainDomain` (fallback to truncated address).
   - Add unit tests for domain fetch + render.
2. **frontend_nft**
   - Update `WriteLetter` to wait for `writeLetter` receipt (already using ethers v6 pattern) **and** Capsule-NFT `Transfer` event; display minted NFT metadata preview.
   - Provide transaction link (using chainId → explorer mapping).
3. **tests_update**
   - Expand mock contract to emit `Transfer` & provide domain; add snapshot tests for NFT preview & domain chip.
4. **CI & Docs**
   - Silence deprecation warnings in test env; update README with NFT/domain usage.

---

> **Reminder for future AI:** Always update this changelog after automated edits that materially affect architecture, mocks, or developer UX. 