// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title YieldExplainer
 * @notice Stores strategy explanations on-chain as hashes, with risk scores
 * @dev Only stores contentHash (32 bytes) to minimize gas costs.
 *      Full explanation text is stored off-chain (IPFS or database).
 *      Anyone can verify: keccak256(explanation) == storedHash
 *
 * Architecture Decision: See /docs/ai-dialogue/02-contract-design.md
 */
contract YieldExplainer {
    struct StrategyRecord {
        address strategy;       // Strategy contract address
        bytes32 contentHash;    // keccak256 of the explanation text
        uint256 riskScore;      // Risk score (0-100)
        uint256 timestamp;      // When this explanation was submitted
        address analyst;        // Who submitted this explanation
        bool verified;          // Has this been reviewed by a trusted analyst?
    }

    // Mapping: strategy address => record
    mapping(address => StrategyRecord) public records;

    // Mapping: strategy address => list of analysts who submitted
    mapping(address => address[]) public contributors;

    // Trusted verifiers (can mark explanations as verified)
    mapping(address => bool) public verifiers;
    address public owner;

    // Events
    event ExplanationSubmitted(
        address indexed strategy,
        address indexed analyst,
        bytes32 contentHash,
        uint256 riskScore
    );
    event ExplanationVerified(
        address indexed strategy,
        address indexed verifier
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier onlyVerifier() {
        require(verifiers[msg.sender], "Not verifier");
        _;
    }

    constructor() {
        owner = msg.sender;
        verifiers[msg.sender] = true;
    }

    /**
     * @notice Submit a strategy explanation
     * @param strategy The strategy contract address
     * @param contentHash keccak256 hash of the explanation text
     * @param riskScore Risk score 0-100
     */
    function submitExplanation(
        address strategy,
        bytes32 contentHash,
        uint256 riskScore
    ) external {
        require(strategy != address(0), "Invalid strategy");
        require(riskScore <= 100, "Risk score must be 0-100");
        require(contentHash != bytes32(0), "Invalid hash");

        records[strategy] = StrategyRecord({
            strategy: strategy,
            contentHash: contentHash,
            riskScore: riskScore,
            timestamp: block.timestamp,
            analyst: msg.sender,
            verified: false
        });

        contributors[strategy].push(msg.sender);

        emit ExplanationSubmitted(strategy, msg.sender, contentHash, riskScore);
    }

    /**
     * @notice Verify an explanation (mark as reviewed)
     * @param strategy The strategy contract address to verify
     */
    function verifyExplanation(address strategy) external onlyVerifier {
        require(records[strategy].strategy != address(0), "No record");
        records[strategy].verified = true;
        emit ExplanationVerified(strategy, msg.sender);
    }

    /**
     * @notice Get explanation record
     */
    function getRecord(address strategy) external view returns (StrategyRecord memory) {
        return records[strategy];
    }

    /**
     * @notice Verify that an explanation matches the stored hash
     * @param strategy The strategy contract address
     * @param explanation The explanation text to verify
     */
    function verifyHash(
        address strategy,
        string calldata explanation
    ) external view returns (bool) {
        return keccak256(bytes(explanation)) == records[strategy].contentHash;
    }

    /**
     * @notice Add a trusted verifier
     */
    function addVerifier(address account) external onlyOwner {
        verifiers[account] = true;
    }

    /**
     * @notice Remove a verifier
     */
    function removeVerifier(address account) external onlyOwner {
        verifiers[account] = false;
    }
}
