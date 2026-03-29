// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract VoteRecord {
    struct Vote {
        bytes32 voterHash;
        uint256 candidateId;
        uint256 timestamp;
    }

    Vote[] public votes;
    mapping(bytes32 => bool) public voterExists;
    address public owner;

    event VoteRecorded(
        bytes32 indexed voterHash,
        uint256 indexed candidateId,
        uint256 timestamp
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function recordVote(bytes32 _voterHash, uint256 _candidateId) public onlyOwner {
        require(_voterHash != bytes32(0), "Invalid voter hash");
        require(!voterExists[_voterHash], "Voter already voted");

        votes.push(
            Vote({
                voterHash: _voterHash,
                candidateId: _candidateId,
                timestamp: block.timestamp
            })
        );

        voterExists[_voterHash] = true;

        emit VoteRecorded(_voterHash, _candidateId, block.timestamp);
    }

    function getVoteCount() public view returns (uint256) {
        return votes.length;
    }

    function getVote(uint256 _index)
        public
        view
        returns (
            bytes32,
            uint256,
            uint256
        )
    {
        require(_index < votes.length, "Vote index out of bounds");
        Vote memory vote = votes[_index];
        return (vote.voterHash, vote.candidateId, vote.timestamp);
    }

    function verifyVote(bytes32 _voterHash) public view returns (bool) {
        return voterExists[_voterHash];
    }

    function getAllVotes()
        public
        view
        returns (
            bytes32[] memory,
            uint256[] memory,
            uint256[] memory
        )
    {
        bytes32[] memory voterHashes = new bytes32[](votes.length);
        uint256[] memory candidateIds = new uint256[](votes.length);
        uint256[] memory timestamps = new uint256[](votes.length);

        for (uint256 i = 0; i < votes.length; i++) {
            voterHashes[i] = votes[i].voterHash;
            candidateIds[i] = votes[i].candidateId;
            timestamps[i] = votes[i].timestamp;
        }

        return (voterHashes, candidateIds, timestamps);
    }
}
