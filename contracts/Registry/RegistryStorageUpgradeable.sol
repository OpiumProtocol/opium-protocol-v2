pragma solidity 0.8.5;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";

import "../Lib/LibRoles.sol";
import "./RegistryEntities.sol";
import "../Errors/RegistryErrors.sol";

contract RegistryStorageUpgradeable is AccessControlUpgradeable, RegistryErrors {
    RegistryEntities.ProtocolCommissionArgs internal protocolCommissionArgs;
    RegistryEntities.ProtocolAddressesArgs internal protocolAddressesArgs;

    mapping(address => bool) internal whitelist;
    bool internal paused;

    function __RegistryStorage__init(
        address _governor,
        address _guardian,
        address[] memory _longExecutors,
        address[] memory _shortExecutors
    ) internal initializer {
        __AccessControl_init();
        for (uint256 i = 0; i < _longExecutors.length; i++) {
            _setupRole(LibRoles.LONG_EXECUTOR, _longExecutors[i]);
        }
        for (uint256 k = 0; k < _shortExecutors.length; k++) {
            _setupRole(LibRoles.SHORT_EXECUTOR, _shortExecutors[k]);
        }
        _setupRole(DEFAULT_ADMIN_ROLE, _governor);
        _setupRole(LibRoles.GUARDIAN, _guardian);

        paused = false;
        protocolCommissionArgs = RegistryEntities.ProtocolCommissionArgs({
            derivativeAuthorCommissionBase: 10000,
            noDataCancellationPeriod: 2 weeks,
            protocolFeeCommissionBase: 10,
            protocolCommissionPart: 1,
            precisionFactor: 18
        });
    }

    function isRole(bytes32 _role, address _address) public view returns (bool) {
        return hasRole(_role, _address);
    }
}
