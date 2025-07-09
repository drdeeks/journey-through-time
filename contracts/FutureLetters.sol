// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Base64.sol";

/// @title FutureLetters with Capsule NFT minting
/// Each letter creation mints an ERC-721 "Capsule" NFT to the author. The tokenURI
/// is on-chain JSON containing `createdAt` and `unlockTime` so front-end can render
/// a preview without external storage.
contract FutureLetters is ERC721URIStorage {
    using Strings for uint256;

    string private constant _baseJsonPrefix = "data:application/json;base64,";

    struct Letter {
        bytes encryptedContent;
        uint256 unlockTime;
        uint256 createdAt;
        bool isRead;
        string publicKey; // For encryption/decryption
        bool isPublic; // Whether letter becomes public after unlock
        string title; // Required title for letters
        string mood; // Required mood for categorization
    }
    
    struct UserProfile {
        uint256 letterCount;
        uint256 lastLetterTime;
        bool reminderEnabled;
        uint256 preferredReminderDays; // Days before unlock to send reminder
    }
    
    mapping(address => Letter[]) private userLetters;
    mapping(address => UserProfile) public userProfiles;
    
    // Events for off-chain reminder system
    event LetterCreated(
        address indexed user,
        uint256 indexed letterId,
        uint256 unlockTime,
        uint256 createdAt,
        bool isPublic,
        string mood
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
    
    uint256 public constant MIN_LOCK_TIME = 3 days;
    uint256 public constant MAX_LOCK_TIME = 50 * 365 days; // 50 years
    uint256 public constant BI_MONTHLY_INTERVAL = 60 days;
    uint256 public constant DEFAULT_REMINDER_DAYS = 7;
    
    // Valid mood options for categorization
    mapping(string => bool) public validMoods;
    string[] public moodOptions;
    
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
    
    /**
     * @dev Create a new time-locked letter (IMMUTABLE once submitted - NO GOING BACK)
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
        
        Letter memory newLetter = Letter({
            encryptedContent: _encryptedContent,
            unlockTime: _unlockTime,
            createdAt: block.timestamp,
            isRead: false,
            publicKey: _publicKey,
            isPublic: _isPublic,
            title: _title,
            mood: _mood
        });
        
        userLetters[msg.sender].push(newLetter);
        uint256 letterId = userLetters[msg.sender].length - 1;

        // Mint Capsule NFT to author where tokenId == letterId
        _safeMint(msg.sender, letterId);

        // Build on-chain token URI with metadata
        string memory json = string.concat(
            '{"name":"Capsule #', letterId.toString(), '\",',
            '"description":"Time-locked letter capsule",',
            '"attributes":[',
                '{"trait_type":"Created At","value":', block.timestamp.toString(), '},',
                '{"trait_type":"Unlock Time","display_type":"date","value":', _unlockTime.toString(), '}',
            ']}'
        );
        _setTokenURI(letterId, string.concat(_baseJsonPrefix, Base64.encode(bytes(json))));
        
        // Update user profile
        UserProfile storage profile = userProfiles[msg.sender];
        profile.letterCount++;
        profile.lastLetterTime = block.timestamp;
        
        // Set default reminder preference if first letter
        if (profile.letterCount == 1) {
            profile.reminderEnabled = true;
            profile.preferredReminderDays = DEFAULT_REMINDER_DAYS;
        }
        
        emit LetterCreated(msg.sender, letterId, _unlockTime, block.timestamp, _isPublic, _mood);
    }
    
    /**
     * @dev Read a letter if unlock time has passed (IMMUTABLE - can only be read, never edited)
     * @param _letterId The ID of the letter to read
     */
    function readLetter(uint256 _letterId) 
        external 
        onlyLetterOwner(_letterId) 
        returns (bytes memory content, string memory publicKey) 
    {
        Letter storage letter = userLetters[msg.sender][_letterId];
        require(block.timestamp >= letter.unlockTime, "Letter is still locked");
        
        letter.isRead = true;
        
        // If this is a public letter, emit event for community visibility
        if (letter.isPublic) {
            emit PublicLetterAvailable(msg.sender, _letterId, letter.title, letter.mood, block.timestamp);
        }
        
        emit LetterUnlocked(msg.sender, _letterId, block.timestamp, letter.isPublic, letter.mood);
        
        return (letter.encryptedContent, letter.publicKey);
    }
    
    /**
     * @dev Get letter metadata (without content - IMMUTABLE once created)
     * @param _letterId The ID of the letter
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
            letter.title,
            letter.mood
        );
    }
    
    /**
     * @dev Get all letter IDs and basic info for the user
     */
    function getMyLetters() 
        external 
        view 
        returns (
            uint256[] memory letterIds,
            uint256[] memory unlockTimes,
            uint256[] memory createdAts,
            bool[] memory isReadArray,
            bool[] memory isUnlockedArray,
            bool[] memory isPublicArray,
            string[] memory titles,
            string[] memory moods
        ) 
    {
        uint256 length = userLetters[msg.sender].length;
        letterIds = new uint256[](length);
        unlockTimes = new uint256[](length);
        createdAts = new uint256[](length);
        isReadArray = new bool[](length);
        isUnlockedArray = new bool[](length);
        isPublicArray = new bool[](length);
        titles = new string[](length);
        moods = new string[](length);
        
        for (uint256 i = 0; i < length; i++) {
            Letter storage letter = userLetters[msg.sender][i];
            letterIds[i] = i;
            unlockTimes[i] = letter.unlockTime;
            createdAts[i] = letter.createdAt;
            isReadArray[i] = letter.isRead;
            isUnlockedArray[i] = block.timestamp >= letter.unlockTime;
            isPublicArray[i] = letter.isPublic;
            titles[i] = letter.title;
            moods[i] = letter.mood;
        }
    }
    
    /**
     * @dev Update reminder preferences
     * @param _enabled Whether to enable reminders
     * @param _reminderDays Days before unlock to send reminder
     */
    function updateReminderSettings(bool _enabled, uint256 _reminderDays) external {
        require(_reminderDays > 0 && _reminderDays <= 30, "Reminder days must be 1-30");
        
        UserProfile storage profile = userProfiles[msg.sender];
        profile.reminderEnabled = _enabled;
        profile.preferredReminderDays = _reminderDays;
    }
    
    /**
     * @dev Check if user needs reminders (for off-chain services)
     * This function helps off-chain services identify users who need reminders
     */
    function checkReminders(address _user) 
        external 
        view 
        returns (
            bool needsUnlockReminder,
            bool needsWriteReminder,
            uint256[] memory upcomingLetterIds,
            uint256[] memory upcomingUnlockTimes
        ) 
    {
        UserProfile storage profile = userProfiles[_user];
        
        if (!profile.reminderEnabled) {
            return (false, false, new uint256[](0), new uint256[](0));
        }
        
        // Check for upcoming unlocks
        Letter[] storage letters = userLetters[_user];
        uint256 reminderThreshold = block.timestamp + (profile.preferredReminderDays * 1 days);
        
        // Count upcoming unlocks
        uint256 upcomingCount = 0;
        for (uint256 i = 0; i < letters.length; i++) {
            if (!letters[i].isRead && 
                letters[i].unlockTime <= reminderThreshold && 
                letters[i].unlockTime > block.timestamp) {
                upcomingCount++;
            }
        }
        
        // Populate upcoming arrays
        upcomingLetterIds = new uint256[](upcomingCount);
        upcomingUnlockTimes = new uint256[](upcomingCount);
        uint256 index = 0;
        
        for (uint256 i = 0; i < letters.length; i++) {
            if (!letters[i].isRead && 
                letters[i].unlockTime <= reminderThreshold && 
                letters[i].unlockTime > block.timestamp) {
                upcomingLetterIds[index] = i;
                upcomingUnlockTimes[index] = letters[i].unlockTime;
                index++;
            }
        }
        
        // Check if user needs bi-monthly write reminder
        bool needsWrite = (block.timestamp >= profile.lastLetterTime + BI_MONTHLY_INTERVAL);
        
        return (upcomingCount > 0, needsWrite, upcomingLetterIds, upcomingUnlockTimes);
    }
    
    /**
     * @dev Read a public letter from any user (only after unlock)
     * @param _author The author of the letter
     * @param _letterId The ID of the letter
     */
    function readPublicLetter(address _author, uint256 _letterId) 
        external 
        view 
        returns (
            bytes memory content, 
            string memory publicKey, 
            string memory title,
            string memory mood,
            uint256 createdAt,
            uint256 unlockedAt
        ) 
    {
        require(_letterId < userLetters[_author].length, "Letter does not exist");
        Letter storage letter = userLetters[_author][_letterId];
        
        require(letter.isPublic, "Letter is private");
        require(block.timestamp >= letter.unlockTime, "Letter is still locked");
        require(letter.isRead, "Letter hasn't been unlocked by author yet");
        
        return (
            letter.encryptedContent, 
            letter.publicKey, 
            letter.title,
            letter.mood,
            letter.createdAt,
            letter.unlockTime
        );
    }
    function getPublicLetters(/*uint256 _offset, uint256 _limit*/) 
        external 
        pure 
        returns (
            address[] memory authors,
            uint256[] memory letterIds,
            string[] memory titles,
            uint256[] memory createdAts,
            uint256[] memory unlockedAts
        ) 
    {
        // This is a simplified version - in production, you'd want to use a mapping
        // to efficiently track public letters rather than scanning all users
        
        // For now, returning empty arrays as this would require additional storage
        // structure to efficiently track all public letters across users
        authors = new address[](0);
        letterIds = new uint256[](0);
        titles = new string[](0);
        createdAts = new uint256[](0);
        unlockedAts = new uint256[](0);
        
        // TODO: Implement efficient public letter tracking
        // This would require additional mappings to track public letters globally
    }
    
    /**
     * @dev Utility function to convert uint to string
     */
    function uint2str(uint256 _i) internal pure returns (string memory) {
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
        uint256 k = len;
        while (_i != 0) {
            k = k - 1;
            uint8 temp = (48 + uint8(_i - _i / 10 * 10));
            bytes1 b1 = bytes1(temp);
            bstr[k] = b1;
            _i /= 10;
        }
        return string(bstr);
    }
    function getUserStats() 
        external 
        view 
        returns (
            uint256 totalLetters,
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
            unread,
            profile.lastLetterTime,
            profile.reminderEnabled,
            profile.preferredReminderDays
        );
    }
}