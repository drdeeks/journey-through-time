// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Mock the FutureLetters artifact to prevent import errors during testing
jest.mock(
  '../artifacts/contracts/FutureLetters.sol/FutureLetters.json',
  () => ({
    abi: [], // Mock ABI - empty array is fine for testing
    default: {
      abi: [],
    },
  }),
  { virtual: true }
);

// Mock Web3React to prevent web3 connection issues during testing
jest.mock('@web3-react/core', () => ({
  useWeb3React: () => ({
    activate: jest.fn(),
    deactivate: jest.fn(),
    account: null,
    chainId: null,
    library: null,
    active: false,
    error: null,
  }),
}));

// Mock the injected connector
jest.mock('@web3-react/injected-connector', () => ({
  InjectedConnector: jest.fn().mockImplementation(() => ({})),
}));
