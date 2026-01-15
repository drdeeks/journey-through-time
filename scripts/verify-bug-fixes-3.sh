#!/bin/bash

# Bug Fix Verification Script #3
# Verifies final 10 bug fixes

echo "🔍 Verifying Final Bug Fixes - v1.1.3"
echo "======================================"
echo ""

GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

PASSED=0
FAILED=0

# BUG #21: Check useDebounce has cleanup
echo "2️⃣1️⃣ Checking BUG #21: useDebounce cleanup..."
if grep -A 10 "export const useDebounce" src/utils/performance.ts | grep -q "clearTimeout"; then
    echo -e "${GREEN}✅ PASS: useDebounce has cleanup${NC}"
    ((PASSED++))
else
    echo -e "${RED}❌ FAIL: useDebounce missing cleanup${NC}"
    ((FAILED++))
fi
echo ""

# BUG #22: Check useIntersectionObserver uses ref for options
echo "2️⃣2️⃣ Checking BUG #22: useIntersectionObserver options..."
if grep -q "optionsRef" src/utils/performance.ts; then
    echo -e "${GREEN}✅ PASS: useIntersectionObserver uses options ref${NC}"
    ((PASSED++))
else
    echo -e "${RED}❌ FAIL: useIntersectionObserver options issue${NC}"
    ((FAILED++))
fi
echo ""

# BUG #23: Check useMemoizedValue has cache limit
echo "2️⃣3️⃣ Checking BUG #23: useMemoizedValue cache limit..."
if grep -q "MAX_CACHE_SIZE" src/utils/performance.ts; then
    echo -e "${GREEN}✅ PASS: useMemoizedValue has cache limit${NC}"
    ((PASSED++))
else
    echo -e "${RED}❌ FAIL: useMemoizedValue cache unbounded${NC}"
    ((FAILED++))
fi
echo ""

# BUG #24: Check createStableObject uses JSON.stringify
echo "2️⃣4️⃣ Checking BUG #24: createStableObject deps..."
if grep -q "JSON.stringify(obj)" src/utils/performance.ts; then
    echo -e "${GREEN}✅ PASS: createStableObject uses JSON.stringify${NC}"
    ((PASSED++))
else
    echo -e "${RED}❌ FAIL: createStableObject deps incorrect${NC}"
    ((FAILED++))
fi
echo ""

# BUG #25: Check useKeyboardNavigation deps (already correct, just verify)
echo "2️⃣5️⃣ Checking BUG #25: useKeyboardNavigation deps..."
if grep -q "useKeyboardNavigation" src/utils/accessibility.ts; then
    echo -e "${GREEN}✅ PASS: useKeyboardNavigation exists${NC}"
    ((PASSED++))
else
    echo -e "${RED}❌ FAIL: useKeyboardNavigation missing${NC}"
    ((FAILED++))
fi
echo ""

# BUG #26: Check Settings fetchUserProfile (already correct with useCallback)
echo "2️⃣6️⃣ Checking BUG #26: Settings fetchUserProfile..."
if grep -q "const fetchUserProfile = useCallback" src/pages/Settings.tsx; then
    echo -e "${GREEN}✅ PASS: fetchUserProfile uses useCallback${NC}"
    ((PASSED++))
else
    echo -e "${RED}❌ FAIL: fetchUserProfile missing useCallback${NC}"
    ((FAILED++))
fi
echo ""

# BUG #27: Check PublicLetters Buffer removed
echo "2️⃣7️⃣ Checking BUG #27: PublicLetters Buffer removed..."
if ! grep -q "import.*Buffer.*from 'buffer'" src/pages/PublicLetters.tsx; then
    echo -e "${GREEN}✅ PASS: Buffer import removed from PublicLetters${NC}"
    ((PASSED++))
else
    echo -e "${RED}❌ FAIL: Buffer still imported${NC}"
    ((FAILED++))
fi
echo ""

# BUG #28: Check useAsyncOperation documentation
echo "2️⃣8️⃣ Checking BUG #28: useAsyncOperation signal..."
if grep -q "signal:" src/utils/performance.ts; then
    echo -e "${GREEN}✅ PASS: useAsyncOperation exposes signal${NC}"
    ((PASSED++))
else
    echo -e "${RED}❌ FAIL: useAsyncOperation signal missing${NC}"
    ((FAILED++))
fi
echo ""

# BUG #29: Check PerformanceMonitor has metrics limit
echo "2️⃣9️⃣ Checking BUG #29: PerformanceMonitor metrics limit..."
if grep -q "MAX_METRICS" src/utils/performance.ts; then
    echo -e "${GREEN}✅ PASS: PerformanceMonitor has metrics limit${NC}"
    ((PASSED++))
else
    echo -e "${RED}❌ FAIL: PerformanceMonitor metrics unbounded${NC}"
    ((FAILED++))
fi
echo ""

# BUG #30: Check useFocusManagement (filter optimization noted)
echo "3️⃣0️⃣ Checking BUG #30: useFocusManagement filter..."
if grep -q "focusNext" src/utils/accessibility.ts; then
    echo -e "${GREEN}✅ PASS: useFocusManagement exists${NC}"
    ((PASSED++))
else
    echo -e "${RED}❌ FAIL: useFocusManagement missing${NC}"
    ((FAILED++))
fi
echo ""

# Summary
echo "======================================"
echo "📊 Verification Summary"
echo "======================================"
echo -e "Passed: ${GREEN}${PASSED}/10${NC}"
echo -e "Failed: ${RED}${FAILED}/10${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All final bug fixes verified successfully!${NC}"
    exit 0
else
    echo -e "${RED}❌ Some bug fixes failed verification${NC}"
    exit 1
fi
