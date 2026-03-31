// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title Voting
 * @dev Decentralized voting contract for eVoteFace
 */
contract Voting is Ownable {

    // ─────────────────────────────────────────────
    // ENUMS
    // ─────────────────────────────────────────────

    enum Phase {
        Registration,
        Voting,
        Completed
    }

    // ─────────────────────────────────────────────
    // STRUCTS
    // ─────────────────────────────────────────────

    struct Candidate {
        uint256 id;
        string name;
        string partyName;
        string partySymbol;
        uint256 voteCount;
        bool exists;
    }

    struct Voter {
        address walletAddress;
        bool isRegistered;
        bool hasVoted;
        uint256 votedFor;
        uint256 votedAt;
    }

    // ─────────────────────────────────────────────
    // STATE VARIABLES
    // ─────────────────────────────────────────────

    Phase public currentPhase;

    uint256 public totalCandidates;
    uint256 public totalRegisteredVoters;
    uint256 public totalVotesCast;

    string public electionTitle;
    string public electionDescription;

    mapping(uint256 => Candidate) private candidates;
    mapping(address => Voter) private voters;

    address[] private voterAddresses;
    uint256[] private candidateIds;

    // ─────────────────────────────────────────────
    // EVENTS
    // ─────────────────────────────────────────────

    event CandidateAdded(uint256 indexed candidateId, string name, string partyName, uint256 timestamp);
    event CandidateRemoved(uint256 indexed candidateId, uint256 timestamp);
    event VoterRegistered(address indexed voterAddress, uint256 timestamp);
    event VoteCast(address indexed voterAddress, uint256 indexed candidateId, uint256 timestamp);
    event PhaseChanged(Phase indexed previousPhase, Phase indexed newPhase, uint256 timestamp);
    event ElectionTitleSet(string title, uint256 timestamp);

    // ─────────────────────────────────────────────
    // MODIFIERS
    // ─────────────────────────────────────────────

    modifier onlyDuringPhase(Phase _phase) {
        require(currentPhase == _phase, "Voting: Action not allowed in current phase");
        _;
    }

    modifier onlyRegisteredVoter() {
        require(voters[msg.sender].isRegistered, "Voting: Caller is not a registered voter");
        _;
    }

    modifier hasNotVoted() {
        require(!voters[msg.sender].hasVoted, "Voting: Caller has already cast their vote");
        _;
    }

    // ─────────────────────────────────────────────
    // CONSTRUCTOR
    // ─────────────────────────────────────────────

    constructor(string memory _title, string memory _description) Ownable(msg.sender) {
        currentPhase = Phase.Registration;
        electionTitle = _title;
        electionDescription = _description;
        totalCandidates = 0;
        totalRegisteredVoters = 0;
        totalVotesCast = 0;
        emit ElectionTitleSet(_title, block.timestamp);
    }

    // ─────────────────────────────────────────────
    // ADMIN FUNCTIONS
    // ─────────────────────────────────────────────

    function addCandidate(string memory _name, string memory _partyName, string memory _partySymbol)
        external onlyOwner onlyDuringPhase(Phase.Registration)
    {
        require(bytes(_name).length > 0, "Voting: Candidate name cannot be empty");
        require(bytes(_partyName).length > 0, "Voting: Party name cannot be empty");

        totalCandidates++;
        uint256 newId = totalCandidates;

        candidates[newId] = Candidate({
            id: newId,
            name: _name,
            partyName: _partyName,
            partySymbol: _partySymbol,
            voteCount: 0,
            exists: true
        });

        candidateIds.push(newId);
        emit CandidateAdded(newId, _name, _partyName, block.timestamp);
    }

    function removeCandidate(uint256 _candidateId)
        external onlyOwner onlyDuringPhase(Phase.Registration)
    {
        require(candidates[_candidateId].exists, "Voting: Candidate does not exist");

        candidates[_candidateId].exists = false;

        for (uint256 i = 0; i < candidateIds.length; i++) {
            if (candidateIds[i] == _candidateId) {
                candidateIds[i] = candidateIds[candidateIds.length - 1];
                candidateIds.pop();
                break;
            }
        }

        emit CandidateRemoved(_candidateId, block.timestamp);
    }

    function registerVoter(address _voterAddress)
        external onlyOwner onlyDuringPhase(Phase.Registration)
    {
        require(_voterAddress != address(0), "Voting: Invalid wallet address");
        require(!voters[_voterAddress].isRegistered, "Voting: Voter already registered");
        require(_voterAddress != owner(), "Voting: Owner cannot be a voter");

        voters[_voterAddress] = Voter({
            walletAddress: _voterAddress,
            isRegistered: true,
            hasVoted: false,
            votedFor: 0,
            votedAt: 0
        });

        voterAddresses.push(_voterAddress);
        totalRegisteredVoters++;

        emit VoterRegistered(_voterAddress, block.timestamp);
    }

    function changePhase(Phase _newPhase) external onlyOwner {
        require(
            uint8(_newPhase) == uint8(currentPhase) + 1,
            "Voting: Can only advance to the next phase"
        );

        Phase previousPhase = currentPhase;
        currentPhase = _newPhase;

        emit PhaseChanged(previousPhase, _newPhase, block.timestamp);
    }

    // ─────────────────────────────────────────────
    // VOTER FUNCTIONS
    // ─────────────────────────────────────────────

    function castVote(uint256 _candidateId)
        external onlyDuringPhase(Phase.Voting) onlyRegisteredVoter hasNotVoted
    {
        require(candidates[_candidateId].exists, "Voting: Candidate does not exist");

        voters[msg.sender].hasVoted = true;
        voters[msg.sender].votedFor = _candidateId;
        voters[msg.sender].votedAt = block.timestamp;

        candidates[_candidateId].voteCount++;
        totalVotesCast++;

        emit VoteCast(msg.sender, _candidateId, block.timestamp);
    }

    // ─────────────────────────────────────────────
    // VIEW FUNCTIONS
    // ─────────────────────────────────────────────

    function getCandidate(uint256 _candidateId) external view returns (Candidate memory) {
        require(candidates[_candidateId].exists, "Voting: Candidate does not exist");
        return candidates[_candidateId];
    }

    function getAllCandidates() external view returns (Candidate[] memory) {
        Candidate[] memory result = new Candidate[](candidateIds.length);
        for (uint256 i = 0; i < candidateIds.length; i++) {
            result[i] = candidates[candidateIds[i]];
        }
        return result;
    }

    function getVoterStatus(address _voterAddress)
        external view
        returns (bool isRegistered, bool hasVoted, uint256 votedFor, uint256 votedAt)
    {
        Voter memory v = voters[_voterAddress];
        return (v.isRegistered, v.hasVoted, v.votedFor, v.votedAt);
    }

    function getCurrentPhaseString() external view returns (string memory) {
        if (currentPhase == Phase.Registration) return "Registration";
        if (currentPhase == Phase.Voting) return "Voting";
        return "Completed";
    }

    function getElectionStats()
        external view
        returns (
            string memory title,
            string memory description,
            string memory phase,
            uint256 numCandidates,
            uint256 numVoters,
            uint256 numVotes
        )
    {
        string memory phaseStr;
        if (currentPhase == Phase.Registration) phaseStr = "Registration";
        else if (currentPhase == Phase.Voting) phaseStr = "Voting";
        else phaseStr = "Completed";

        return (electionTitle, electionDescription, phaseStr, candidateIds.length, totalRegisteredVoters, totalVotesCast);
    }

    function getWinner() external view onlyDuringPhase(Phase.Completed) returns (Candidate memory) {
        require(candidateIds.length > 0, "Voting: No candidates exist");

        uint256 maxVotes = 0;
        uint256 winnerId = candidateIds[0];

        for (uint256 i = 0; i < candidateIds.length; i++) {
            uint256 cId = candidateIds[i];
            if (candidates[cId].voteCount > maxVotes) {
                maxVotes = candidates[cId].voteCount;
                winnerId = cId;
            }
        }

        return candidates[winnerId];
    }

    function getAllVoterAddresses() external view onlyOwner returns (address[] memory) {
        return voterAddresses;
    }
}
