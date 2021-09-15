pragma solidity 0.8.5;

import "./WhitelistedWithGovernanceUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";


/// @notice Opium.Lib.WhitelistedWithGovernanceAndChangableTimelock contract implements Opium.Lib.WhitelistedWithGovernance and adds possibility for governor to change timelock interval within timelock interval
contract WhitelistedWithGovernanceAndChangableTimelockUpgradeable is Initializable, WhitelistedWithGovernanceUpgradeable {
    // Emitted when new timelock is proposed
    event ProposedWhitelistedWithGovernanceAndChangableTimelock(uint256 timelock);
    // Emitted when new timelock is committed (set)
    event CommittedWhitelistedWithGovernanceAndChangableTimelock(uint256 timelock);

    // Timestamp of last timelock proposal
    uint256 public timeLockProposalTime;
    // Proposed timelock
    uint256 public proposedTimeLock;

    function __WhitelistedWithGovernanceAndChangableTimelock__init(uint256 _timeLockInterval, address _governor) internal initializer {
        __WhitelistedWithGovernance__init(_timeLockInterval, _governor);
    }


    /// @notice Calling this function governor could propose new timelock
    /// @param _timelock uint256 New timelock value
    function proposeTimelock(uint256 _timelock) public onlyGovernor {
        timeLockProposalTime = block.timestamp;
        proposedTimeLock = _timelock;
        emit ProposedWhitelistedWithGovernanceAndChangableTimelock(_timelock);
    }

    /// @notice Calling this function governor could commit previously proposed new timelock if timelock interval of proposal was passed
    function commitTimelock() public onlyGovernor {
        // Check if proposal was made
        require(timeLockProposalTime != 0, "Didn't proposed yet");
        // Check if timelock interval was passed
        require((timeLockProposalTime + timeLockInterval) < block.timestamp, "Can't commit yet");
        
        // Set new timelock and emit event
        timeLockInterval = proposedTimeLock;
        emit CommittedWhitelistedWithGovernanceAndChangableTimelock(proposedTimeLock);

        // Reset timelock time lock
        timeLockProposalTime = 0;
    }
}
