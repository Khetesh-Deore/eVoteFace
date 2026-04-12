// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./Voting.sol";

/**
 * @title ElectionFactory
 * @dev Factory contract to deploy and manage multiple elections
 */
contract ElectionFactory {

    // ─────────────────────────────────────────────
    // STRUCTS
    // ─────────────────────────────────────────────

    struct ElectionRecord {
        uint256 electionId;
        address contractAddress;
        string title;
        address admin;
        uint256 createdAt;
    }

    // ─────────────────────────────────────────────
    // STATE VARIABLES
    // ─────────────────────────────────────────────

    mapping(uint256 => ElectionRecord) public elections;
    uint256 public electionCounter;

    // ─────────────────────────────────────────────
    // EVENTS
    // ─────────────────────────────────────────────

    event ElectionCreated(
        uint256 indexed electionId,
        address indexed contractAddress,
        string title,
        address indexed admin,
        uint256 timestamp
    );

    // ─────────────────────────────────────────────
    // CONSTRUCTOR
    // ─────────────────────────────────────────────

    constructor() {
        electionCounter = 0;
    }

    // ─────────────────────────────────────────────
    // FUNCTIONS
    // ─────────────────────────────────────────────

    /**
     * @dev Creates a new election by deploying a new Voting contract
     * @param _title Title of the election
     * @param _description Description of the election
     * @return Address of the newly deployed Voting contract
     */
    function createElection(string memory _title, string memory _description) 
        external 
        returns (address) 
    {
        require(bytes(_title).length > 0, "ElectionFactory: Title cannot be empty");

        electionCounter++;
        uint256 newElectionId = electionCounter;

        // Deploy new Voting contract
        Voting newElection = new Voting(newElectionId, _title, _description);
        address electionAddress = address(newElection);

        // Transfer ownership to the caller
        newElection.transferOwnership(msg.sender);

        // Store election record
        elections[newElectionId] = ElectionRecord({
            electionId: newElectionId,
            contractAddress: electionAddress,
            title: _title,
            admin: msg.sender,
            createdAt: block.timestamp
        });

        emit ElectionCreated(newElectionId, electionAddress, _title, msg.sender, block.timestamp);

        return electionAddress;
    }

    /**
     * @dev Get the contract address of a specific election
     * @param _electionId ID of the election
     * @return Address of the election contract
     */
    function getElectionAddress(uint256 _electionId) 
        external 
        view 
        returns (address) 
    {
        require(_electionId > 0 && _electionId <= electionCounter, "ElectionFactory: Invalid election ID");
        return elections[_electionId].contractAddress;
    }

    /**
     * @dev Get all elections created by this factory
     * @return Array of all election records
     */
    function getAllElections() 
        external 
        view 
        returns (ElectionRecord[] memory) 
    {
        ElectionRecord[] memory allElections = new ElectionRecord[](electionCounter);
        
        for (uint256 i = 1; i <= electionCounter; i++) {
            allElections[i - 1] = elections[i];
        }
        
        return allElections;
    }

    /**
     * @dev Get elections created by a specific admin
     * @param _admin Address of the admin
     * @return Array of election records created by the admin
     */
    function getElectionsByAdmin(address _admin) 
        external 
        view 
        returns (ElectionRecord[] memory) 
    {
        // First pass: count matching elections
        uint256 count = 0;
        for (uint256 i = 1; i <= electionCounter; i++) {
            if (elections[i].admin == _admin) {
                count++;
            }
        }

        // Allocate exact size array
        ElectionRecord[] memory adminElections = new ElectionRecord[](count);
        
        // Second pass: populate array
        uint256 index = 0;
        for (uint256 i = 1; i <= electionCounter; i++) {
            if (elections[i].admin == _admin) {
                adminElections[index] = elections[i];
                index++;
                if (index == count) break; // Early exit optimization
            }
        }
        
        return adminElections;
    }

    /**
     * @dev Get a specific election record
     * @param _electionId ID of the election
     * @return Election record
     */
    function getElection(uint256 _electionId) 
        external 
        view 
        returns (ElectionRecord memory) 
    {
        require(_electionId > 0 && _electionId <= electionCounter, "ElectionFactory: Invalid election ID");
        return elections[_electionId];
    }
}
