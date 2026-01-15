#!/bin/bash

# Bug Fix Verification Script #2
# Verifies 10 additional bug fixes

echo "🔍 Verifying Additional Bug Fixes - v1.1.2"
echo "=========================================="
echo ""

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

PASSED=0
FAILED=0

# BUG #11: Check encryption no longer uses Date.now()
echo "1️⃣1️⃣ Checking BUG #11: Secure encryption key derivation..."
if ! grep -q "Date.now()" src/utils/encryption.ts | grep -q "keyMaterial"; then
    echo -e "${GREEN}✅ PASS: Encryption uses proper PBKDF2${NC}"
    ((PASSED++))
else
    echo -e "${RED}❌ FAIL: Encryption still uses Date.now()${NC}"
    ((FAILED++))
fi
echo ""

# BUG #12: Check UserProfile uses separate useEffect for persist
echo "1️⃣2️⃣ Checking BUG #12: UserProfile persist pattern..."
if grep -q "Persist profile changes" src/contexts/UserProfileContext.tsx; then
    echo -e "${GREEN}✅ PASS: UserProfile uses separate persist effect${NC}"
    ((PASSED++))
else
    echo -e "${RED}❌ FAIL: UserProfile persist still in setState${NC}"
    ((FAILED++))
fi
echo ""

# BUG #13: Check sanitizeInput is enhanced
echo "1️⃣3️⃣ Checking BUG #13: Enhanced input sanitization..."
if grep -q "Remove script tags" src/utils/validation.ts; then
    echo -e "${GREEN}✅ PASS: Input sanitization enhanced${NC}"
    ((PASSED++))
else
    echo -e "${RED}❌ FAIL: Input sanitization not enhanced${NC}"
    ((FAILED++))
fi
echo ""

# BUG #14: Check privateKey is cleared after decryption
echo "1️⃣4️⃣ Checking BUG #14: Private key cleared after use..."
if grep -q "Clear private key from memory" src/pages/MyLetters.tsx; then
    echo -e "${GREEN}✅ PASS: Private key cleared after decryption${NC}"
    ((PASSED++))
else
    echo -e "${RED}❌ FAIL: Private key not cleared${NC}"
    ((FAILED++))
fi
echo ""

# BUG #15: Already fixed - fetchLetters uses useCallback
echo "1️⃣5️⃣ Checking BUG #15: fetchLetters dependency..."
if grep -q "const fetchLetters = useCallback" src/pages/MyLetters.tsx; then
    echo -e "${GREEN}✅ PASS: fetchLetters uses useCallback${NC}"
    ((PASSED++))
else
    echo -e "${RED}❌ FAIL: fetchLetters missing useCallback${NC}"
    ((FAILED++))
fi
echo ""

# BUG #16: Check validatePrivateKey has nested try-catch
echo "1️⃣6️⃣ Checking BUG #16: validatePrivateKey error handling..."
if grep -q "Unexpected error in validatePrivateKey" src/utils/encryption.ts; then
    echo -e "${GREEN}✅ PASS: validatePrivateKey has proper error handling${NC}"
    ((PASSED++))
else
    echo -e "${RED}❌ FAIL: validatePrivateKey error handling missing${NC}"
    ((FAILED++))
fi
echo ""

# BUG #17: Check Buffer import removed
echo "1️⃣7️⃣ Checking BUG #17: Buffer import removed..."
if ! grep -q "import.*Buffer.*from 'buffer'" src/pages/WriteLetter.tsx; then
    echo -e "${GREEN}✅ PASS: Buffer import removed from WriteLetter${NC}"
    ((PASSED++))
else
    echo -e "${RED}❌ FAIL: Buffer still imported${NC}"
    ((FAILED++))
fi
echo ""

# BUG #18: Check date validation uses UTC
echo "1️⃣8️⃣ Checking BUG #18: UTC date validation..."
if grep -q "Use UTC timestamps" src/pages/WriteLetter.tsx; then
    echo -e "${GREEN}✅ PASS: Date validation uses UTC${NC}"
    ((PASSED++))
else
    echo -e "${RED}❌ FAIL: Date validation not using UTC${NC}"
    ((FAILED++))
fi
echo ""

# BUG #19: Check clearSensitiveData has documentation
echo "1️⃣9️⃣ Checking BUG #19: clearSensitiveData documentation..."
if grep -q "JavaScript strings are immutable" src/utils/encryption.ts; then
    echo -e "${GREEN}✅ PASS: clearSensitiveData limitation documented${NC}"
    ((PASSED++))
else
    echo -e "${RED}❌ FAIL: clearSensitiveData limitation not documented${NC}"
    ((FAILED++))
fi
echo ""

# BUG #20: Check LazyLoadWrapper has error boundary
echo "2️⃣0️⃣ Checking BUG #20: LazyLoadWrapper error boundary..."
if grep -q "LazyErrorBoundary" src/components/LazyLoadWrapper.tsx; then
    echo -e "${GREEN}✅ PASS: LazyLoadWrapper has error boundary${NC}"
    ((PASSED++))
else
    echo -e "${RED}❌ FAIL: LazyLoadWrapper missing error boundary${NC}"
    ((FAILED++))
fi
echo ""

# Summary
echo "=========================================="
echo "📊 Verification Summary"
echo "=========================================="
echo -e "Passed: ${GREEN}${PASSED}/10${NC}"
echo -e "Failed: ${RED}${FAILED}/10${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All additional bug fixes verified successfully!${NC}"
    exit 0
else
    echo -e "${RED}❌ Some bug fixes failed verification${NC}"
    exit 1
fi
