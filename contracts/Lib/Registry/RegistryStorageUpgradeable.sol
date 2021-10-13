pragma solidity 0.8.5;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "./RegistryEntities.sol";
import "../../Errors/RegistryErrors.sol";
import "hardhat/console.sol";

contract RegistryStorageUpgradeable is AccessControlUpgradeable, RegistryErrors {
    bytes32 public constant LONG_EXECUTOR = keccak256("LONG_EXECUTOR");
    bytes32 public constant SHORT_EXECUTOR = keccak256("SHORT_EXECUTOR");

    RegistryEntities.ProtocolCommissionArgs internal protocolCommissionArgs;
    RegistryEntities.ProtocolAddressesArgs internal protocolAddressesArgs;

    mapping(address => bool) internal whitelist;

    function __RegistryStorage__init(
        address _governor,
        address[] memory _longExecutors, 
        address[] memory _shortExecutors
    ) internal initializer {
        for(uint256 i = 0; i < _longExecutors.length; i++) {
            _setupRole(LONG_EXECUTOR, _longExecutors[i]);
        }
        for(uint256 k = 0; k < _shortExecutors.length; k++) {
            _setupRole(SHORT_EXECUTOR, _shortExecutors[k]);
        }
        _setupRole(DEFAULT_ADMIN_ROLE, _governor);  
        protocolCommissionArgs = RegistryEntities.ProtocolCommissionArgs({
            derivativeAuthorCommissionBase: 10000,
            protocolFeeCommissionBase: 10,
            protocolCommissionPart: 1,
            noDataCancellationPeriod: 2 weeks
        });
    }

    modifier onlyGovernor() {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), NOT_GOVERNOR);
        _;
    }

    modifier onlyLongExecutor() {
        require(hasRole(LONG_EXECUTOR, msg.sender) || hasRole(DEFAULT_ADMIN_ROLE, msg.sender), NOT_LONG_EXECUTOR);
        _;
    }

    modifier onlyShortExecutor() {
        require(hasRole(SHORT_EXECUTOR, msg.sender) || hasRole(DEFAULT_ADMIN_ROLE, msg.sender), NOT_SHORT_EXECUTOR);
        _;
    }    
}