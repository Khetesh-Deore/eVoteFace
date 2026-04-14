// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title Election
 * @dev Single election contract deployed by ElectionFactory.
 *      electionAdmin is passed at construction — NOT msg.sender.
 *      Admin wallet CAN be a voter (no global restriction).
 *      Phase can be reset Voting → Registration if zero votes cast.
 */
contract Election {

    // ─────────────────────────────────────────────
    // ENUMS
    // ─────────────────────────────────────────────

    enum Phase { Registration, Voting, Completed }

    // ─────────────────────────────────────────────
    // STRUCTS
    // ─────────────────────────────────────────────

    struct Candidate {
        uint256 id;
        string  name;
        string  partyName;
        string  partySymbol;   // Cloudinary URL
        uint256 voteCount;
        bool    exists;
    }

    struct Voter {
        address walletAddress;
        bool    isRegistered;
        bool    hasVoted;
        uint256 votedFor;      // 0 = not voted
        uint256 votedAt;
    }

    // ─────────────────────────────────────────────
    // STATE
    // ─────────────────────────────────────────────

    address public factory;
    address public electionAdmin;

    string  public title;
    string  public description;
    uint256 public startTime;
    uint256 public endTime;
    Phase   public currentPhase;

    uint256 public totalCandidates;
    uint256 public totalRegisteredVoters;
    uint256 public totalVotesCast;

    mapping(uint256 => Candidate) private candidates;
    mapping(address => Voter)     private voters;

    uint256[] private candidateIds;
    address[] private voterAddresses;

    // ─────────────────────────────────────────────
    // EVENTS
    // ─────────────────────────────────────────────

    event CandidateAdded(uint256 indexed id, string name, string partyName, uint256 timestamp);
    event CandidateRemoved(uint256 indexed id, uint256 timestamp);
    event VoterRegistered(address indexed voter, uint256 timestamp);
    event VoteCast(address indexed voter, uint256 indexed candidateId, uint256 timestamp);
    event PhaseChanged(Phase indexed previous, Phase indexed next, uint256 timestamp);

    // ─────────────────────────────────────────────
    // MODIFIERS
    // ─────────────────────────────────────────────

    modifier onlyAdmin() {
        require(msg.sender == electionAdmin, "Election: caller is not admin");
        _;
    }

    modifier onlyDuringPhase(Phase _phase) {
        require(currentPhase == _phase, "Election: action not allowed in current phase");
        _;
    }

    // ─────────────────────────────────────────────
    // CONSTRUCTOR
    // ─────────────────────────────────────────────

    /**
     * @param _admin       Address of the election administrator (set by factory)
     * @param _title       Election title
     * @param _description Election description
     * @param _startTime   Unix timestamp for voting start
     * @param _endTime     Unix timestamp for voting end
     */
    constructor(
        address _admin,
        string memory _title,
        string memory _description,
        uint256 _startTime,
        uint256 _endTime
    ) {
        require(_admin != address(0), "Election: invalid admin address");
        require(_startTime < _endTime, "Election: startTime must be before endTime");

        factory       = msg.sender;   // ElectionFactory address
        electionAdmin = _admin;
        title         = _title;
        description   = _description;
        startTime     = _startTime;
        endTime       = _endTime;
        currentPhase  = Phase.Registration;
    }

    // ─────────────────────────────────────────────
    // ADMIN FUNCTIONS
    // ─────────────────────────────────────────────

    function addCandidate(
        string memory _name,
        string memory _partyName,
        string memory _partySymbol
    )
        external
        onlyAdmin
        onlyDuringPhase(Phase.Registration)
    {
        require(bytes(_name).length > 0,      "Election: name cannot be empty");
        require(bytes(_partyName).length > 0, "Election: partyName cannot be empty");

        totalCandidates++;
        uint256 newId = totalCandidates;

        candidates[newId] = Candidate({
            id:          newId,
            name:        _name,
            partyName:   _partyName,
            partySymbol: _partySymbol,
            voteCount:   0,
            exists:      true
        });

        candidateIds.push(newId);
        emit CandidateAdded(newId, _name, _partyName, block.timestamp);
    }

    function removeCandidate(uint256 _candidateId)
        external
        onlyAdmin
        onlyDuringPhase(Phase.Registration)
    {
        require(candidates[_candidateId].exists, "Election: candidate does not exist");

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

    /**
     * @dev Register a voter wallet.
     *      Admin wallet CAN be registered as a voter — no global restriction.
     *      Only restriction: admin cannot register themselves
     *      (msg.sender == electionAdmin registering electionAdmin's own address).
     */
    function registerVoter(address _voterAddress)
        external
        onlyAdmin
        onlyDuringPhase(Phase.Registration)
    {
        require(_voterAddress != address(0),          "Election: invalid address");
        require(!voters[_voterAddress].isRegistered,  "Election: voter already registered");
        require(_voterAddress != electionAdmin,       "Election: admin cannot be a voter in their own election");

        voters[_voterAddress] = Voter({
            walletAddress: _voterAddress,
            isRegistered:  true,
            hasVoted:      false,
            votedFor:      0,
            votedAt:       0
        });

        voterAddresses.push(_voterAddress);
        totalRegisteredVoters++;

        emit VoterRegistered(_voterAddress, block.timestamp);
    }

    /**
     * @dev Change election phase.
     *      Forward: Registration → Voting → Completed (always allowed by admin).
     *      Backward: Voting → Registration ONLY if totalVotesCast == 0.
     */
    function changePhase(Phase _newPhase) external onlyAdmin {
        if (uint8(_newPhase) == uint8(currentPhase) + 1) {
            // Normal forward transition
            Phase previous = currentPhase;
            currentPhase = _newPhase;
            emit PhaseChanged(previous, _newPhase, block.timestamp);
        } else if (currentPhase == Phase.Voting && _newPhase == Phase.Registration) {
            // Backward reset — only if no votes cast yet
            require(totalVotesCast == 0, "Election: cannot reset phase after votes have been cast");
            Phase previous = currentPhase;
            currentPhase = Phase.Registration;
            emit PhaseChanged(previous, Phase.Registration, block.timestamp);
        } else {
            revert("Election: invalid phase transition");
        }
    }

    // ─────────────────────────────────────────────
    // VOTER FUNCTIONS
    // ─────────────────────────────────────────────

    function castVote(uint256 _candidateId)
        external
        onlyDuringPhase(Phase.Voting)
    {
        require(voters[msg.sender].isRegistered, "Election: caller is not a registered voter");
        require(!voters[msg.sender].hasVoted,    "Election: caller has already voted");
        require(candidates[_candidateId].exists, "Election: candidate does not exist");

        voters[msg.sender].hasVoted  = true;
        voters[msg.sender].votedFor  = _candidateId;
        voters[msg.sender].votedAt   = block.timestamp;

        candidates[_candidateId].voteCount++;
        totalVotesCast++;

        emit VoteCast(msg.sender, _candidateId, block.timestamp);
    }

    // ─────────────────────────────────────────────
    // READ FUNCTIONS
    // ─────────────────────────────────────────────

    function getCandidate(uint256 _id) external view returns (Candidate memory) {
        require(candidates[_id].exists, "Election: candidate does not exist");
        return candidates[_id];
    }

    function getAllCandidates() external view returns (Candidate[] memory) {
        Candidate[] memory result = new Candidate[](candidateIds.length);
        for (uint256 i = 0; i < candidateIds.length; i++) {
            result[i] = candidates[candidateIds[i]];
        }
        return result;
    }

    function getVoterStatus(address _voter)
        external
        view
        returns (bool isRegistered, bool hasVoted, uint256 votedFor, uint256 votedAt)
    {
        Voter memory v = voters[_voter];
        return (v.isRegistered, v.hasVoted, v.votedFor, v.votedAt);
    }

    function getWinner() external view returns (Candidate memory) {
        require(currentPhase == Phase.Completed, "Election: election not completed");
        require(candidateIds.length > 0,         "Election: no candidates");

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

    function getElectionStats()
        external
        view
        returns (
            string memory _title,
            string memory _description,
            string memory _phase,
            uint256 _numCandidates,
            uint256 _numVoters,
            uint256 _numVotes,
            uint256 _startTime,
            uint256 _endTime
        )
    {
        string memory phaseStr;
        if (currentPhase == Phase.Registration) phaseStr = "Registration";
        else if (currentPhase == Phase.Voting)  phaseStr = "Voting";
        else                                    phaseStr = "Completed";

        return (
            title,
            description,
            phaseStr,
            candidateIds.length,
            totalRegisteredVoters,
            totalVotesCast,
            startTime,
            endTime
        );
    }

    function getCurrentPhaseString() external view returns (string memory) {
        if (currentPhase == Phase.Registration) return "Registration";
        if (currentPhase == Phase.Voting)       return "Voting";
        return "Completed";
    }

    function getAllVoterAddresses() external view returns (address[] memory) {
        require(msg.sender == electionAdmin || msg.sender == factory, "Election: not authorized");
        return voterAddresses;
    }
}
