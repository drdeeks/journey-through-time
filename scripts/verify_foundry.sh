#!/usr/bin/env bash
# -----------------------------------------------------------------------------
# Verify FutureLetters.sol on Monad Explorer using Foundry (forge)
# -----------------------------------------------------------------------------
# Usage: ./scripts/verify_foundry.sh <contract_address>
# -----------------------------------------------------------------------------

set -euo pipefail

if [ "$#" -ne 1 ]; then
  echo "Usage: $0 <contract_address>"
  exit 1
fi

CONTRACT_ADDRESS=$1

forge verify-contract \
  "$CONTRACT_ADDRESS" \
  ./contracts/FutureLetters.sol:FutureLetters \
  --chain 10143 \
  --verifier sourcify \
  --verifier-url https://sourcify-api-monad.blockvision.org

# On success, a link to the verified contract will be printed. 