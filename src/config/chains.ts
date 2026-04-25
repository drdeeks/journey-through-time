export type ChainKey = 'local' | 'ethereum' | 'base' | 'arbitrum' | 'monad';

export interface ChainInfo {
  id: number;
  key: ChainKey;
  name: string;
  shortName: string;
}

const CHAIN_DEFINITIONS: ChainInfo[] = [
  { id: 1337, key: 'local', name: 'Local', shortName: 'Local' },
  { id: 1, key: 'ethereum', name: 'Ethereum', shortName: 'Ethereum' },
  { id: 8453, key: 'base', name: 'Base', shortName: 'Base' },
  { id: 42161, key: 'arbitrum', name: 'Arbitrum', shortName: 'Arbitrum' },
  { id: 10143, key: 'monad', name: 'Monad Testnet', shortName: 'Monad' },
];

const parseChainAddresses = (value: string | undefined): Record<ChainKey, string> => {
  const addressMap = {} as Record<ChainKey, string>;
  if (!value) {
    return addressMap;
  }

  value.split(',').forEach((entry) => {
    const [rawKey, rawAddress] = entry.split(':').map((part) => part.trim());
    if (!rawKey || !rawAddress) return;
    const key = rawKey.toLowerCase() as ChainKey;
    if (CHAIN_DEFINITIONS.some((chain) => chain.key === key)) {
      addressMap[key] = rawAddress;
    }
  });

  return addressMap;
};

const chainAddresses = parseChainAddresses(process.env['REACT_APP_CHAIN_ADDRESSES']);

export const supportedChainIds = CHAIN_DEFINITIONS.map((chain) => chain.id);

export const getChainInfo = (chainId: number | null | undefined): ChainInfo | null => {
  if (!chainId) return null;
  return CHAIN_DEFINITIONS.find((chain) => chain.id === chainId) ?? null;
};

export const getChainLabel = (chainId: number | null | undefined): string => {
  return getChainInfo(chainId)?.name ?? 'Unknown';
};

export const getContractAddressForChain = (chainId: number | null | undefined): string => {
  const chain = getChainInfo(chainId);
  if (!chain) {
    return process.env['REACT_APP_CONTRACT_ADDRESS'] || '';
  }

  return chainAddresses[chain.key] || process.env['REACT_APP_CONTRACT_ADDRESS'] || '';
};

export const isMonadChain = (chainId: number | null | undefined): boolean => {
  return chainId === 10143;
};
