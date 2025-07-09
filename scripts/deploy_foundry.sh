#!/usr/bin/env bash
# -----------------------------------------------------------------------------
# Deploy FutureLetters.sol to Monad Testnet using Foundry (forge)
# -----------------------------------------------------------------------------
# Prerequisites:
#   1. Foundry installed (https://github.com/foundry-rs/foundry)
#   2. A keystore account named `monad-deployer` (see README for creation steps)
#   3. ETH_RPC_URL environment variable set (defaults to Monad testnet)
#   4. MONAD chain id 10143
# -----------------------------------------------------------------------------

set -euo pipefail

# Default RPC URL if not provided
: "${ETH_RPC_URL:=https://testnet-rpc.monad.xyz}"

# Deploy contract with broadcast enabled
forge create ./contracts/FutureLetters.sol:FutureLetters \
  --account monad-deployer \
  --broadcast \
  --chain 10143 \
  --verify \
  --verifier sourcify \
  --verifier-url https://sourcify-api-monad.blockvision.org

# The command outputs the deployed address and transaction hash on success.
# Copy the contract address and update your .env file:
#   REACT_APP_CONTRACT_ADDRESS=<deployed_address> 