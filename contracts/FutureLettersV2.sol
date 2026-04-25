// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Base64.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/introspection/ERC165Checker.sol";

/// @title FutureLetters V2 - Time-Locked Letters with Dual Payment System
/// @notice Enhanced version supporting:
/// - Gas-only letter creation (writeLetter)
/// - Optional NFT minting with $0.05 USD fee (mintLetter)
/// - X402 (ERC-402) payment detection and support
/// - Standard ERC-20 payment support
/// - Auto-generated letters for special accounts (Matthew)
/// - Content truncation for long letters
/// 
/// @dev Payment Flow:
/// 1. writeLetter() - Creates letter with gas only, no minting
/// 2. mintLetter() - Creates letter AND mints NFT for $0.05 USD
///    - Accepts payment via: native token, ERC-20, or X402 signatures
///    - X402 detection via ERC-165 interface check
contract FutureLettersV2 is ERC721URIStorage, Ownable {
    using Strings for uint256;
    using SafeMath for uint256;

    string private constant _baseJsonPrefix = "data:application/json;base64,";

    // ========== CONSTANTS ==========
    
    // Minting fee: $0.05 USD (5 cents)
    // This is a target USD amount, actual token amount depends on price feed
    uint256 public constant MINT_FEE_USD_CENTS = 5; // 5 cents = $0.05
    
    // Maximum content length for auto-generated letters (to prevent gas issues)
    uint256 public constant MAX_AUTO_CONTENT_LENGTH = 5000;
    
    // Chain-specific constants
    uint256 public constant MONAD_MAINNET_CHAIN_ID = 143;
    uint256 public constant MONAD_TESTNET_CHAIN_ID = 10143;
    
    // Journey ecosystem URL for NFT metadata (live URL to view full public letters)
    string private constant JOURNEY_BASE_URL = "https://journey-thru-time.com/letters/";
    
    // ERC-165 interface IDs
    bytes4 private constant INTERFACE_ID_ERC165 = 0x01ffc9a7;
    bytes4 private constant INTERFACE_ID_ERC721 = 0x80ac58cd;
    bytes4 private constant INTERFACE_ID_ERC20 = 0x36372b07;
    bytes4 private constant INTERFACE_ID_ERC402 = 0x4e3e3310; // X402 Payment Detector
    
    // ========== STRUCTS ==========
    
    struct Letter {
        bytes encryptedContent;
        uint256 unlockTime;
        uint256 createdAt;
        bool isRead;
        string publicKey; // For encryption/decryption
        bool isPublic; // Whether letter becomes public after unlock
        string title; // Required title for letters
        string mood; // Required mood for categorization
        bool isMinted; // Whether this letter has an NFT
        address minter; // Who minted it (if different from author for auto-generated)
    }
    
    struct UserProfile {
        uint256 letterCount;
        uint256 mintedCount;
        uint256 lastLetterTime;
        bool reminderEnabled;
        uint256 preferredReminderDays; // Days before unlock to send reminder
    }
    
    // Payment tracking
    struct PaymentInfo {
        bool paidWithX402;
        address tokenContract;
        uint256 amount;
        bytes signature; // X402 signature data
        uint256 paymentTime;
    }

    // Efficient public letter tracking
    struct PublicLetter {
        address author;
        uint256 letterId;
        string title;
        string mood;
        uint256 createdAt;
        uint256 unlockedAt;
        bool isActive;
        bool isMinted;
    }

    // ========== STATE VARIABLES ==========
    
    // Letters storage
    mapping(address => Letter[]) private userLetters;
    mapping(address => UserProfile) public userProfiles;
    
    // Public letters
    PublicLetter[] private publicLetters;
    mapping(address => mapping(uint256 => uint256)) private publicLetterIndex; // author => letterId => publicLetterIndex
    mapping(address => uint256[]) private userPublicLetterIds; // author => array of public letter IDs
    
    // Payment tracking
    mapping(address => PaymentInfo[]) private userPayments;
    
    // Accepted ERC-20 tokens for payment (address => isAccepted)
    mapping(address => bool) public acceptedTokens;
    
    // Price feed contract for USD conversion
    address public priceFeedContract;
    
    // Special accounts with auto-generation privileges
    mapping(address => bool) public autoGenAllowed;
    
    // Matthew's special address (can have auto-generated content)
    address public matrixAccount;
    
    // Content truncation settings
    uint256 public autoContentMaxLength = MAX_AUTO_CONTENT_LENGTH;
    
    // X402 Registry (optional - can use ERC-165 detection instead)
    mapping(address => bool) public x402Tokens;

    // ========== EVENTS ==========
    
    event LetterCreated(
        address indexed user,
        uint256 indexed letterId,
        uint256 unlockTime,
        uint256 createdAt,
        bool isPublic,
        string mood,
        bool isMinted
    );
    
    event LetterMinted(
        address indexed user,
        uint256 indexed letterId,
        uint256 indexed tokenId,
        uint256 amountPaid,
        bool paidWithX402,
        address paymentToken
    );
    
    event PaymentReceived(
        address indexed user,
        uint256 amount,
        address paymentToken,
        bool isX402Payment
    );

    event ReminderDue(
        address indexed user,
        uint256 indexed letterId,
        uint256 unlockTime,
        string reminderType // "unlock_soon" or "write_new"
    );
    
    event LetterUnlocked(
        address indexed user,
        uint256 indexed letterId,
        uint256 unlockedAt,
        bool isPublic,
        string mood
    );
    
    event PublicLetterAvailable(
        address indexed author,
        uint256 indexed letterId,
        string title,
        string mood,
        uint256 unlockedAt
    );
    
    event PublicLetterRemoved(
        address indexed author,
        uint256 indexed letterId
    );
    
    event ContentTruncated(
        address indexed user,
        uint256 indexed letterId,
        uint256 originalLength,
        uint256 truncatedLength
    );

    // ========== MODIFIERS ==========
    
    modifier validLockTime(uint256 _unlockTime) {
        require(
            _unlockTime >= block.timestamp + MIN_LOCK_TIME,
            "Unlock time must be at least 3 days in the future"
        );
        require(
            _unlockTime <= block.timestamp + MAX_LOCK_TIME,
            "Unlock time cannot exceed 50 years"
        );
        _;
    }
    
    modifier onlyLetterOwner(uint256 _letterId) {
        require(_letterId < userLetters[msg.sender].length, "Letter does not exist");
        _;
    }
    
    modifier validMood(string calldata _mood) {
        require(validMoods[_mood], "Invalid mood. Use getValidMoods() to see options");
        _;
    }
    
    modifier onlyAutoGenAllowed() {
        require(autoGenAllowed[msg.sender] || msg.sender == matrixAccount, "Auto-generation not allowed for this account");
        _;
    }

    // ========== CONSTANTS (Continued) ==========
    
    uint256 public constant MIN_LOCK_TIME = 3 days;
    uint256 public constant MAX_LOCK_TIME = 50 * 365 days; // 50 years
    uint256 public constant BI_MONTHLY_INTERVAL = 60 days;
    uint256 public constant DEFAULT_REMINDER_DAYS = 7;
    
    // Valid mood options for categorization
    mapping(string => bool) public validMoods;
    string[] public moodOptions;

    // ========== CONSTRUCTOR ==========
    
    constructor() ERC721("Time Capsule", "CAPS") {
        // Initialize valid mood options
        string[15] memory moods = [
            "happy",
            "sad", 
            "angry",
            "lost",
            "confused",
            "worried",
            "melancholy",
            "depressed",
            "joyful",
            "irate",
            "excited",
            "anxious",
            "grateful",
            "hopeful",
            "nostalgic"
        ];
        
        for (uint256 i = 0; i < moods.length; i++) {
            validMoods[moods[i]] = true;
            moodOptions.push(moods[i]);
        }
    }

    // ========== CORE FUNCTIONS ==========

    /**
     * @dev Create a new time-locked letter - GAS ONLY, no minting
     * @notice This is the primary function for creating letters without NFT minting
     * @param _encryptedContent The encrypted letter content
     * @param _unlockTime Unix timestamp when letter can be read
     * @param _publicKey Public key used for encryption
     * @param _isPublic Whether letter becomes publicly readable after unlock
     * @param _title Required title for the letter
     * @param _mood Required mood for categorization
     */
    function writeLetter(
        bytes calldata _encryptedContent,
        uint256 _unlockTime,
        string calldata _publicKey,
        bool _isPublic,
        string calldata _title,
        string calldata _mood
    ) external validLockTime(_unlockTime) validMood(_mood) {
        require(_encryptedContent.length > 0, "Letter content cannot be empty");
        require(bytes(_publicKey).length > 0, "Public key required");
        require(bytes(_title).length > 0, "Title is required");
        
        // Check content length for auto-generated letters
        if (msg.sender == matrixAccount || autoGenAllowed[msg.sender]) {
            _embeddedEnforceContentLength(_encryptedContent, _title);
        }
        
        Letter memory newLetter = Letter({
            encryptedContent: _encryptedContent,
            unlockTime: _unlockTime,
            createdAt: block.timestamp,
            isRead: false,
            publicKey: _publicKey,
            isPublic: _isPublic,
            title: _title,
            mood: _mood,
            isMinted: false,
            minter: address(0)
        });
        
        userLetters[msg.sender].push(newLetter);
        uint256 letterId = userLetters[msg.sender].length - 1;
        
        // Update user profile
        UserProfile storage profile = userProfiles[msg.sender];
        profile.letterCount++;
        profile.lastLetterTime = block.timestamp;
        
        // Set default reminder preference if first letter
        if (profile.letterCount == 1) {
            profile.reminderEnabled = true;
            profile.preferredReminderDays = DEFAULT_REMINDER_DAYS;
        }
        
        emit LetterCreated(msg.sender, letterId, _unlockTime, block.timestamp, _isPublic, _mood, false);
    }

    /**
     * @dev Create a letter AND mint NFT with payment
     * @notice This function requires payment of $0.05 USD (or equivalent)
     * @param _encryptedContent The encrypted letter content
     * @param _unlockTime Unix timestamp when letter can be read
     * @param _publicKey Public key used for encryption
     * @param _isPublic Whether letter becomes publicly readable after unlock
     * @param _title Required title for the letter
     * @param _mood Required mood for categorization
     * @param _paymentToken Address of ERC-20 token to pay with (address(0) for native token)
     * @param _x402Signature X402 signature data (empty if not using X402)
     */
    function mintLetter(
        bytes calldata _encryptedContent,
        uint256 _unlockTime,
        string calldata _publicKey,
        bool _isPublic,
        string calldata _title,
        string calldata _mood,
        address _paymentToken,
        bytes calldata _x402Signature
    ) external payable validLockTime(_unlockTime) validMood(_mood) {
        require(_encryptedContent.length > 0, "Letter content cannot be empty");
        require(bytes(_publicKey).length > 0, "Public key required");
        require(bytes(_title).length > 0, "Title is required");
        
        // Check content length for auto-generated letters
        if (msg.sender == matrixAccount || autoGenAllowed[msg.sender]) {
            _embeddedEnforceContentLength(_encryptedContent, _title);
        }
        
        // Handle payment
        bool isX402 = _x402Signature.length > 0;
        uint256 requiredAmount;
        
        if (isX402) {
            // Validate X402 payment
            require(_paymentToken != address(0), "X402 requires ERC-20 token");
            require(_isValidX402Payment(_paymentToken, msg.sender, MINT_FEE_USD_CENTS, _x402Signature), 
                "Invalid X402 payment");
            requiredAmount = _getTokenAmountForUSD(_paymentToken, MINT_FEE_USD_CENTS);
        } else if (_paymentToken == address(0)) {
            // Native token payment
            requiredAmount = _getNativeAmountForUSD(MINT_FEE_USD_CENTS);
            require(msg.value >= requiredAmount, "Insufficient native token payment");
        } else {
            // ERC-20 token payment
            require(acceptedTokens[_paymentToken], "Token not accepted for payment");
            require(IERC20(_paymentToken).transferFrom(msg.sender, address(this), 
                _getTokenAmountForUSD(_paymentToken, MINT_FEE_USD_CENTS)), 
                "ERC-20 transfer failed");
        }
        
        // Create letter
        Letter memory newLetter = Letter({
            encryptedContent: _encryptedContent,
            unlockTime: _unlockTime,
            createdAt: block.timestamp,
            isRead: false,
            publicKey: _publicKey,
            isPublic: _isPublic,
            title: _title,
            mood: _mood,
            isMinted: true,
            minter: msg.sender
        });
        
        userLetters[msg.sender].push(newLetter);
        uint256 letterId = userLetters[msg.sender].length - 1;
        
        // Mint NFT
        uint256 tokenId = _getNextTokenId();
        _safeMint(msg.sender, tokenId);
        
        // Build on-chain token URI with metadata (includes live URL for public letters)
        string memory json = _buildTokenJSON(letterId, block.timestamp, _unlockTime, _title, _mood, _isPublic);
        _setTokenURI(tokenId, string.concat(_baseJsonPrefix, Base64.encode(bytes(json))));
        
        // Update user profile
        UserProfile storage profile = userProfiles[msg.sender];
        profile.letterCount++;
        profile.mintedCount++;
        profile.lastLetterTime = block.timestamp;
        
        if (profile.letterCount == 1) {
            profile.reminderEnabled = true;
            profile.preferredReminderDays = DEFAULT_REMINDER_DAYS;
        }
        
        // Record payment
        _recordPayment(msg.sender, _paymentToken, isX402, _x402Signature, requiredAmount);
        
        emit LetterCreated(msg.sender, letterId, _unlockTime, block.timestamp, _isPublic, _mood, true);
        emit LetterMinted(msg.sender, letterId, tokenId, requiredAmount, isX402, _paymentToken);
        emit PaymentReceived(msg.sender, requiredAmount, _paymentToken, isX402);
    }

    /**
     * @dev Create an auto-generated letter for Matthew or authorized accounts
     * @notice Special function for pre-generated content with truncation
     */
    function createAutoLetter(
        bytes calldata _encryptedContent,
        uint256 _unlockTime,
        string calldata _publicKey,
        bool _isPublic,
        string calldata _title,
        string calldata _mood,
        string calldata _fullText,
        bool _mintWithPayment
    ) external onlyAutoGenAllowed validLockTime(_unlockTime) validMood(_mood) {
        require(_encryptedContent.length > 0, "Letter content cannot be empty");
        require(bytes(_publicKey).length > 0, "Public key required");
        require(bytes(_title).length > 0, "Title is required");
        
        // Enforce content length and truncate if needed
        (bytes memory finalContent, bool wasTruncated) = _enforceContentLength(_encryptedContent, _title, _fullText);
        
        if (_mintWithPayment) {
            // Requires payment
            address paymentToken = address(0); // Native for simplicity in auto-gen
            uint256 requiredAmount = _getNativeAmountForUSD(MINT_FEE_USD_CENTS);
            require(msg.value >= requiredAmount, "Insufficient payment for minting");
            
            Letter memory newLetter = Letter({
                encryptedContent: finalContent,
                unlockTime: _unlockTime,
                createdAt: block.timestamp,
                isRead: false,
                publicKey: _publicKey,
                isPublic: _isPublic,
                title: _title,
                mood: _mood,
                isMinted: true,
                minter: msg.sender
            });
            
            userLetters[msg.sender].push(newLetter);
            uint256 letterId = userLetters[msg.sender].length - 1;
            
            // Mint NFT
            uint256 tokenId = _getNextTokenId();
            _safeMint(msg.sender, tokenId);
            
            string memory json = _buildTokenJSON(letterId, block.timestamp, _unlockTime, _title, _mood, _isPublic);
            _setTokenURI(tokenId, string.concat(_baseJsonPrefix, Base64.encode(bytes(json))));
            
            UserProfile storage profile = userProfiles[msg.sender];
            profile.letterCount++;
            profile.mintedCount++;
            profile.lastLetterTime = block.timestamp;
            
            if (wasTruncated) {
                emit ContentTruncated(msg.sender, letterId, _encryptedContent.length, finalContent.length);
            }
            
            emit LetterCreated(msg.sender, letterId, _unlockTime, block.timestamp, _isPublic, _mood, true);
            emit LetterMinted(msg.sender, letterId, tokenId, requiredAmount, false, paymentToken);
        } else {
            // Gas only, no minting
            Letter memory newLetter = Letter({
                encryptedContent: finalContent,
                unlockTime: _unlockTime,
                createdAt: block.timestamp,
                isRead: false,
                publicKey: _publicKey,
                isPublic: _isPublic,
                title: _title,
                mood: _mood,
                isMinted: false,
                minter: address(0)
            });
            
            userLetters[msg.sender].push(newLetter);
            uint256 letterId = userLetters[msg.sender].length - 1;
            
            UserProfile storage profile = userProfiles[msg.sender];
            profile.letterCount++;
            profile.lastLetterTime = block.timestamp;
            
            if (wasTruncated) {
                emit ContentTruncated(msg.sender, letterId, _encryptedContent.length, finalContent.length);
            }
            
            emit LetterCreated(msg.sender, letterId, _unlockTime, block.timestamp, _isPublic, _mood, false);
        }
    }

    // ========== READ & LETTER MANAGEMENT ==========

    /**
     * @dev Read a letter if unlock time has passed
     * @param _letterId The ID of the letter to read
     */
    function readLetter(uint256 _letterId) 
        external 
        onlyLetterOwner(_letterId) 
        returns (bytes memory content, string memory publicKey, bool wasTruncated) 
    {
        Letter storage letter = userLetters[msg.sender][_letterId];
        require(block.timestamp >= letter.unlockTime, "Letter is still locked");
        
        letter.isRead = true;
        
        // If this is a public letter, add it to public letters tracking
        if (letter.isPublic) {
            _addToPublicLetters(msg.sender, _letterId, letter.title, letter.mood, letter.createdAt, block.timestamp);
            emit PublicLetterAvailable(msg.sender, _letterId, letter.title, letter.mood, block.timestamp);
        }
        
        emit LetterUnlocked(msg.sender, _letterId, block.timestamp, letter.isPublic, letter.mood);
        
        return (letter.encryptedContent, letter.publicKey, false);
    }

    /**
     * @dev Internal function to enforce content length for auto-generated letters
     */
    function _embeddedEnforceContentLength(bytes calldata _encryptedContent, string calldata _title) internal view {
        // This is a simplified check - actual truncation happens in createAutoLetter
        require(_encryptedContent.length <= autoContentMaxLength * 2, 
            "Auto-generated content too long");
    }

    /**
     * @dev Enforce content length and truncate if needed
     * @return finalContent The content (possibly truncated)
     * @return wasTruncated Whether truncation occurred
     */
    function _enforceContentLength(
        bytes calldata _encryptedContent,
        string calldata _title,
        string calldata _fullText
    ) internal pure returns (bytes memory, bool) {
        // For now, we just check the encrypted content length
        // In a real implementation, you might truncate the fullText before encryption
        if (_encryptedContent.length <= autoContentMaxLength) {
            return (_encryptedContent, false);
        }
        
        // Truncate encrypted content (this is a simplified approach)
        // In production, you'd truncate the original text, then re-encrypt
        bytes memory truncated = new bytes(autoContentMaxLength);
        for (uint256 i = 0; i < autoContentMaxLength && i < _encryptedContent.length; i++) {
            truncated[i] = _encryptedContent[i];
        }
        
        return (truncated, true);
    }

    /**
     * @dev Add letter to public letters tracking
     */
    function _addToPublicLetters(
        address _author,
        uint256 _letterId,
        string memory _title,
        string memory _mood,
        uint256 _createdAt,
        uint256 _unlockedAt
    ) private {
        Letter storage letter = userLetters[_author][_letterId];
        
        PublicLetter memory newPublicLetter = PublicLetter({
            author: _author,
            letterId: _letterId,
            title: _title,
            mood: _mood,
            createdAt: _createdAt,
            unlockedAt: _unlockedAt,
            isActive: true,
            isMinted: letter.isMinted
        });
        
        uint256 publicIndex = publicLetters.length;
        publicLetters.push(newPublicLetter);
        
        // Track the mapping
        publicLetterIndex[_author][_letterId] = publicIndex;
        userPublicLetterIds[_author].push(_letterId);
    }

    /**
     * @dev Remove letter from public letters (author only)
     */
    function removeFromPublicLetters(uint256 _letterId) external onlyLetterOwner(_letterId) {
        Letter storage letter = userLetters[msg.sender][_letterId];
        require(letter.isPublic, "Letter is not public");
        require(letter.isRead, "Letter must be unlocked first");
        
        uint256 publicIndex = publicLetterIndex[msg.sender][_letterId];
        require(publicIndex < publicLetters.length, "Public letter not found");
        
        // Mark as inactive instead of removing to maintain indexing
        publicLetters[publicIndex].isActive = false;
        
        emit PublicLetterRemoved(msg.sender, _letterId);
    }

    /**
     * @dev Get letter info
     */
    function getLetterInfo(uint256 _letterId) 
        external 
        view 
        onlyLetterOwner(_letterId) 
        returns (
            uint256 unlockTime,
            uint256 createdAt,
            bool isRead,
            bool isUnlocked,
            bool isPublic,
            bool isMinted,
            string memory title,
            string memory mood
        ) 
    {
        Letter storage letter = userLetters[msg.sender][_letterId];
        return (
            letter.unlockTime,
            letter.createdAt,
            letter.isRead,
            block.timestamp >= letter.unlockTime,
            letter.isPublic,
            letter.isMinted,
            letter.title,
            letter.mood
        );
    }

    // ========== PAYMENT HELPERS ==========

    /**
     * @dev Get the native token amount equivalent to USD cents
     * @notice This is a placeholder - in production, use a price feed
     */
    function _getNativeAmountForUSD(uint256 _usdCents) internal view returns (uint256) {
        // Placeholder: Assume 1 ETH = $2000 (adjust based on actual price feed)
        // So $0.05 = 0.05 / 2000 = 0.000025 ETH = 25000000000 wei
        // This is just an example - use Chainlink or similar in production
        return (_usdCents * 1000000000000) / 40000; // Approx 0.000025 ETH per cent at $2000/ETH
    }

    /**
     * @dev Get the ERC-20 token amount equivalent to USD cents
     * @notice This is a placeholder - in production, use a price feed
     */
    function _getTokenAmountForUSD(address _token, uint256 _usdCents) internal view returns (uint256) {
        // For USDC (6 decimals): 1 USDC = $1.00, so $0.05 = 50000 units (50000 / 10^6 = 0.05)
        // For other tokens, we'd need a price feed
        
        // Check if it's a known stablecoin
        if (_isStableCoin(_token)) {
            // Assume 1:1 with USD for stablecoins
            IERC20 token = IERC20(_token);
            uint8 decimals = token.decimals();
            return _usdCents * (10 ** decimals) / 100; // Convert cents to token units
        }
        
        // For non-stablecoins, use the native calculation (placeholder)
        return _getNativeAmountForUSD(_usdCents);
    }

    /**
     * @dev Check if a token is a stablecoin (simplified)
     */
    function _isStableCoin(address _token) internal view returns (bool) {
        // In production, this would check against a list of known stablecoin addresses
        // For now, we'll use ERC-165 to check if it supports ERC-20 interface
        try IERC20(_token).decimals() {
            return true; // Simplified - assume all ERC-20 tokens can be used
        } catch {
            return false;
        }
    }

    /**
     * @dev Validate X402 payment signature
     * @notice This is a simplified version - full implementation requires EIP-712 support
     */
    function _isValidX402Payment(
        address _token,
        address _payer,
        uint256 _amountUSD,
        bytes calldata _signature
    ) internal view returns (bool) {
        // Check if token supports X402 interface
        if (!_supportsInterface(_token, INTERFACE_ID_ERC402)) {
            return false;
        }
        
        // In a full implementation, we'd verify the EIP-712 signature
        // This is a placeholder that always returns true for registered X402 tokens
        // Production implementation would:
        // 1. Verify the signature against the token contract
        // 2. Check the amount and expiration
        // 3. Validate the nonce hasn't been used
        
        return x402Tokens[_token] && _signature.length > 0;
    }

    /**
     * @dev Check if a contract supports a specific interface
     */
    function _supportsInterface(address _contract, bytes4 _interfaceId) internal view returns (bool) {
        try IERC165(_contract).supportsInterface(_interfaceId) {
            return true;
        } catch {
            return false;
        }
    }

    /**
     * @dev Record payment information
     */
    function _recordPayment(
        address _user,
        address _token,
        bool _isX402,
        bytes calldata _signature,
        uint256 _amount
    ) internal {
        PaymentInfo memory payment = PaymentInfo({
            paidWithX402: _isX402,
            tokenContract: _token,
            amount: _amount,
            signature: _signature,
            paymentTime: block.timestamp
        });
        
        userPayments[_user].push(payment);
    }

    /**
     * @dev Get next token ID for NFT minting
     */
    function _getNextTokenId() internal returns (uint256) {
        return totalSupply();
    }

    /**
     * @dev Truncate string to max length for metadata (gas-efficient)
     * @param str The string to truncate
     * @param maxLen Maximum length in bytes
     * @return Truncated string
     */
    function _truncateString(string memory str, uint256 maxLen) internal pure returns (string memory) {
        bytes memory strBytes = bytes(str);
        if (strBytes.length <= maxLen) {
            return str;
        }
        // Truncate without ellipsis to save bytes
        return string(strBytes[0:maxLen]);
    }

    /**
     * @dev Build token JSON metadata with truncated preview and live URL for public letters
     * @param _letterId The letter ID / NFT token ID
     * @param _createdAt Unix timestamp of creation
     * @param _unlockTime Unix timestamp when letter unlocks
     * @param _title Letter title
     * @param _mood Letter mood
     * @param _isPublic Whether letter is public (adds external_url if true)
     */
    function _buildTokenJSON(
        uint256 _letterId,
        uint256 _createdAt,
        uint256 _unlockTime,
        string memory _title,
        string memory _mood,
        bool _isPublic
    ) internal pure returns (string memory) {
        // Truncate for metadata to keep it small and gas-efficient
        string memory shortTitle = _truncateString(_title, 40);
        string memory shortMood = _truncateString(_mood, 15);
        
        // Build description with truncated preview
        string memory description = string.concat(
            "Journey Capsule #",
            _uint2str(_letterId),
            ": ",
            shortTitle,
            " | Mood: ",
            shortMood
        );
        description = _truncateString(description, 100); // Max 100 char description
        
        string memory json = string.concat(
            '{"name":"Capsule #', _uint2str(_letterId), '",',
            '"description":"', description, '",'
        );
        
        // Add live URL ONLY if letter is public (points to Journey's social component)
        if (_isPublic) {
            json = string.concat(
                json,
                ',"external_url":"',
                JOURNEY_BASE_URL,
                _uint2str(_letterId),
                '",'
            );
        }
        
        // Add attributes
        json = string.concat(
            json,
            '"attributes":[',
                '{"trait_type":"Created","value":', _uint2str(_createdAt), '}',
                ',"{"trait_type":"Unlocks","display_type":"date","value":', _uint2str(_unlockTime), '}',
                ',"{"trait_type":"Title","value":"', shortTitle, '"}',
                ',"{"trait_type":"Mood","value":"', shortMood, '"}',
                ',"{"trait_type":"Public","value":', _isPublic ? '"true"' : '"false"', '}'
            ']}'
        );
        
        return json;
    }

    /**
     * @dev Convert uint to string
     */
    function _uint2str(uint256 _i) internal pure returns (string memory) {
        if (_i == 0) {
            return "0";
        }
        uint256 j = _i;
        uint256 len;
        while (j != 0) {
            len++;
            j /= 10;
        }
        bytes memory bstr = new bytes(len);
        while (_i != 0) {
            len--;
            uint8 temp = (48 + uint8(_i - _i / 10 * 10));
            bytes1 b1 = bytes1(temp);
            bstr[len] = b1;
            _i /= 10;
        }
        return string(bstr);
    }

    // ========== OWNER FUNCTIONS ==========

    /**
     * @dev Set address as allowed for auto-generation
     */
    function setAutoGenAllowed(address _account, bool _allowed) external onlyOwner {
        autoGenAllowed[_account] = _allowed;
        if (_allowed) {
            emit AutoGenPermissionGranted(_account);
        } else {
            emit AutoGenPermissionRevoked(_account);
        }
    }

    /**
     * @dev Set Matthew's special account
     */
    function setMatrixAccount(address _account) external onlyOwner {
        matrixAccount = _account;
        autoGenAllowed[_account] = true;
    }

    /**
     * @dev Add accepted ERC-20 token for payments
     */
    function addAcceptedToken(address _token) external onlyOwner {
        acceptedTokens[_token] = true;
    }

    /**
     * @dev Remove accepted ERC-20 token
     */
    function removeAcceptedToken(address _token) external onlyOwner {
        acceptedTokens[_token] = false;
    }

    /**
     * @dev Add X402 token
     */
    function addX402Token(address _token) external onlyOwner {
        require(_supportsInterface(_token, INTERFACE_ID_ERC402), "Contract does not support ERC-402");
        x402Tokens[_token] = true;
    }

    /**
     * @dev Set price feed contract
     */
    function setPriceFeed(address _feed) external onlyOwner {
        priceFeedContract = _feed;
    }

    /**
     * @dev Set auto-content max length
     */
    function setAutoContentMaxLength(uint256 _length) external onlyOwner {
        autoContentMaxLength = _length;
    }

    /**
     * @dev Withdraw accumulated payments (owner only)
     */
    function withdrawPayments(address _token, uint256 _amount) external onlyOwner {
        if (_token == address(0)) {
            payable(owner()).transfer(_amount);
        } else {
            IERC20(_token).transfer(owner(), _amount);
        }
    }

    // ========== VIEW FUNCTIONS ==========

    /**
     * @dev Get contract balance of a specific token
     */
    function getContractBalance(address _token) external view returns (uint256) {
        if (_token == address(0)) {
            return address(this).balance;
        }
        return IERC20(_token).balanceOf(address(this));
    }

    /**
     * @dev Check if contract supports X402
     */
    function isX402Token(address _token) external view returns (bool) {
        return x402Tokens[_token] || _supportsInterface(_token, INTERFACE_ID_ERC402);
    }

    /**
     * @dev Get valid moods
     */
    function getValidMoods() external view returns (string[] memory) {
        return moodOptions;
    }

    /**
     * @dev Get user statistics
     */
    function getUserStats() 
        external 
        view 
        returns (
            uint256 totalLetters,
            uint256 mintedLetters,
            uint256 unreadLetters,
            uint256 lastLetterTime,
            bool reminderEnabled,
            uint256 reminderDays
        ) 
    {
        UserProfile storage profile = userProfiles[msg.sender];
        Letter[] storage letters = userLetters[msg.sender];
        
        uint256 unread = 0;
        for (uint256 i = 0; i < letters.length; i++) {
            if (!letters[i].isRead && block.timestamp >= letters[i].unlockTime) {
                unread++;
            }
        }
        
        return (
            profile.letterCount,
            profile.mintedCount,
            unread,
            profile.lastLetterTime,
            profile.reminderEnabled,
            profile.preferredReminderDays
        );
    }

    // ========== ADDITIONAL EVENTS ==========
    
    event AutoGenPermissionGranted(address indexed account);
    event AutoGenPermissionRevoked(address indexed account);

    // ========== INTERFACES ==========
    
    interface IERC165 {
        function supportsInterface(bytes4 interfaceId) external view returns (bool);
    }
}
