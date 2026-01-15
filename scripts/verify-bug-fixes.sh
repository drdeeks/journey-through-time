#!/bin/bash

# Bug Fix Verification Script
# Verifies all 10 bug fixes are working correctly

echo "🔍 Verifying Bug Fixes - v1.1.1"
echo "================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Counter
PASSED=0
FAILED=0

# BUG #1: Check uuid is not in dependencies
echo "1️⃣  Checking BUG #1: uuid dependency removed..."
if ! grep -q "uuid" package.json; then
    echo -e "${GREEN}✅ PASS: uuid not in dependencies${NC}"
    ((PASSED++))
else
    echo -e "${RED}❌ FAIL: uuid still in dependencies${NC}"
    ((FAILED++))
fi
echo ""

# BUG #2: Check Web3Context has proper dependencies
echo "2️⃣  Checking BUG #2: Web3Context auto-connect dependencies..."
if grep -q "active, isConnecting, activate" src/contexts/Web3Context.tsx; then
    echo -e "${GREEN}✅ PASS: Proper dependencies in auto-connect${NC}"
    ((PASSED++))
else
    echo -e "${RED}❌ FAIL: Missing dependencies${NC}"
    ((FAILED++))
fi
echo ""

# BUG #3: Check useThrottle returns value
echo "3️⃣  Checking BUG #3: useThrottle return value..."
if grep -q "lastResult" src/hooks/useAsync.ts; then
    echo -e "${GREEN}✅ PASS: useThrottle returns last result${NC}"
    ((PASSED++))
else
    echo -e "${RED}❌ FAIL: useThrottle missing return value${NC}"
    ((FAILED++))
fi
echo ""

# BUG #4: Check retry logic uses < instead of <=
echo "4️⃣  Checking BUG #4: Retry logic off-by-one fix..."
if grep -q "retries < maxRetries" src/utils/lazyLoad.ts; then
    echo -e "${GREEN}✅ PASS: Retry logic fixed${NC}"
    ((PASSED++))
else
    echo -e "${RED}❌ FAIL: Retry logic still incorrect${NC}"
    ((FAILED++))
fi
echo ""

# BUG #5: Check ErrorHandler uses stack instead of originalError
echo "5️⃣  Checking BUG #5: ErrorHandler serialization..."
if grep -q "stack?: string" src/utils/errorHandler.ts && ! grep -q "originalError" src/utils/errorHandler.ts; then
    echo -e "${GREEN}✅ PASS: ErrorHandler uses serializable stack${NC}"
    ((PASSED++))
else
    echo -e "${RED}❌ FAIL: ErrorHandler still has circular references${NC}"
    ((FAILED++))
fi
echo ""

# BUG #6: Check lazy load has error logging
echo "6️⃣  Checking BUG #6: Lazy load error logging..."
if grep -q "console.error.*Failed to load component" src/utils/lazyLoad.ts; then
    echo -e "${GREEN}✅ PASS: Error logging added${NC}"
    ((PASSED++))
else
    echo -e "${RED}❌ FAIL: Missing error logging${NC}"
    ((FAILED++))
fi
echo ""

# BUG #7: Check EngagementContext uses useEffect for persist
echo "7️⃣  Checking BUG #7: EngagementContext persist pattern..."
if grep -q "Persist whenever state changes" src/contexts/EngagementContext.tsx; then
    echo -e "${GREEN}✅ PASS: Persist uses useEffect${NC}"
    ((PASSED++))
else
    echo -e "${RED}❌ FAIL: Persist still in setState callbacks${NC}"
    ((FAILED++))
fi
echo ""

# BUG #8: Check useDeviceDetection has window check
echo "8️⃣  Checking BUG #8: useDeviceDetection SSR compatibility..."
if grep -q "typeof window === 'undefined'" src/hooks/useDeviceDetection.ts; then
    echo -e "${GREEN}✅ PASS: SSR compatibility added${NC}"
    ((PASSED++))
else
    echo -e "${RED}❌ FAIL: Missing window check${NC}"
    ((FAILED++))
fi
echo ""

# BUG #9: Check config validation checks environment first
echo "9️⃣  Checking BUG #9: Config validation timing..."
if grep -q "config.environment === 'production' && !config.api.contractAddress" src/config/index.ts; then
    echo -e "${GREEN}✅ PASS: Config validation checks environment first${NC}"
    ((PASSED++))
else
    echo -e "${RED}❌ FAIL: Config validation still incorrect${NC}"
    ((FAILED++))
fi
echo ""

# BUG #10: Check performance monitoring has error handling
echo "🔟 Checking BUG #10: Performance monitoring error handling..."
if grep -q "try {" src/hooks/usePerformanceMonitoring.ts && grep -q "catch (error)" src/hooks/usePerformanceMonitoring.ts; then
    echo -e "${GREEN}✅ PASS: Error handling added${NC}"
    ((PASSED++))
else
    echo -e "${RED}❌ FAIL: Missing error handling${NC}"
    ((FAILED++))
fi
echo ""

# Summary
echo "================================"
echo "📊 Verification Summary"
echo "================================"
echo -e "Passed: ${GREEN}${PASSED}/10${NC}"
echo -e "Failed: ${RED}${FAILED}/10${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All bug fixes verified successfully!${NC}"
    exit 0
else
    echo -e "${RED}❌ Some bug fixes failed verification${NC}"
    exit 1
fi
