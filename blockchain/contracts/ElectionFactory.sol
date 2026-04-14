// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./Election.sol";

/**
 * @title ElectionFactory
 * @dev Deployed once. Platform owner can add/remove platform admins.
 *      Any platform admin can create elections.
 *      Each election deploys a new Election.sol instance.
 */
contract ElectionFactory {

    // ─────────────────────────────────────────────
    // STATE
    // ─────────────────────────────────────────────

    address public platformOwner;

    address[] public deployedElections;

    mapping(address => bool)      public platformAdmins;
    mapping(address => address[]) private electionsByAdmin;

    // ─────────────────────────────────────────────
    // EVENTS
    // ─────────────────────────────────────────────

    event ElectionCreated(
        address indexed electionAddress,
        address indexed electionAdmin,
        string  title,
        uint256 startTime,
        uint256 endTime,
        uint256 timestamp
    );

    event AdminAdded(address indexed admin, uint256 timestamp);
    event AdminRemoved(address indexed admin, uint256 timestamp);

    // ─────────────────────────────────────────────
    // MODIFIERS
    // ─────────────────────────────────────────────

    modifier onlyPlatformOwner() {
        require(msg.sender == platformOwner, "Factory: caller is not platform owner");
        _;
    }

    modifier onlyPlatformAdmin() {
        require(
            platformAdmins[msg.sender] || msg.sender == platformOwner,
            "Factory: caller is not a platform admin"
        );
        _;
    }

    // ─────────────────────────────────────────────
    // CONSTRUCTOR
    // ─────────────────────────────────────────────

    constructor() {
        platformOwner = msg.sender;
        platformAdmins[msg.sender] = true;
    }

    // ─────────────────────────────────────────────
    // ADMIN MANAGEMENT (platform owner only)
    // ─────────────────────────────────────────────

    function addPlatformAdmin(address _admin) external onlyPlatformOwner {
        require(_admin != address(0),       "Factory: invalid address");
        require(!platformAdmins[_admin],    "Factory: already a platform admin");
        platformAdmins[_admin] = true;
        emit AdminAdded(_admin, block.timestamp);
    }

    function removePlatformAdmin(address _admin) external onlyPlatformOwner {
        require(_admin != platformOwner,    "Factory: cannot remove platform owner");
        require(platformAdmins[_admin],     "Factory: not a platform admin");
        platformAdmins[_admin] = false;
        emit AdminRemoved(_admin, block.timestamp);
    }

    // ─────────────────────────────────────────────
    // ELECTION CREATION
    // ─────────────────────────────────────────────

    /**
     * @dev Deploy a new Election contract.
     * @param _title       Election title
     * @param _description Election description
     * @param _startTime   Unix timestamp for voting start
     * @param _endTime     Unix timestamp for voting end
     * @param _adminAddress Wallet that will administer this election
     * @return electionAddress Address of the deployed Election contract
     */
    function createElection(
        string memory _title,
        string memory _description,
        uint256 _startTime,
        uint256 _endTime,
        address _adminAddress
    )
        external
        onlyPlatformAdmin
        returns (address electionAddress)
    {
        require(bytes(_title).length > 0,       "Factory: title cannot be empty");
        require(_adminAddress != address(0),    "Factory: invalid admin address");
        require(_startTime < _endTime,          "Factory: startTime must be before endTime");

        Election newElection = new Election(
            _adminAddress,
            _title,
            _description,
            _startTime,
            _endTime
        );

        electionAddress = address(newElection);

        deployedElections.push(electionAddress);
        electionsByAdmin[_adminAddress].push(electionAddress);

        emit ElectionCreated(
            electionAddress,
            _adminAddress,
            _title,
            _startTime,
            _endTime,
            block.timestamp
        );

        return electionAddress;
    }

    // ─────────────────────────────────────────────
    // READ FUNCTIONS
    // ─────────────────────────────────────────────

    function getAllElections() external view returns (address[] memory) {
        return deployedElections;
    }

    function getElectionsByAdmin(address _admin) external view returns (address[] memory) {
        return electionsByAdmin[_admin];
    }

    function getTotalElections() external view returns (uint256) {
        return deployedElections.length;
    }
}
