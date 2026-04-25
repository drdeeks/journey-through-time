import { getChainLabel, getChainInfo, getContractAddressForChain } from './chains';

describe('chains config', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('returns chain metadata when known', () => {
    const chain = getChainInfo(8453);
    expect(chain?.name).toBe('Base');
  });

  it('returns Unknown for unsupported chain IDs', () => {
    expect(getChainLabel(99999)).toBe('Unknown');
  });

  it('falls back to default contract address when no mapping provided', () => {
    process.env['REACT_APP_CONTRACT_ADDRESS'] = '0xdefault';
    process.env['REACT_APP_CHAIN_ADDRESSES'] = '';
    expect(getContractAddressForChain(8453)).toBe('0xdefault');
  });
});
