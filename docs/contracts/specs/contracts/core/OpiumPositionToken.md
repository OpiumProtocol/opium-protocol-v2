# OpiumPositionToken

contracts/core/OpiumPositionToken.sol

> Title: Opium.OpiumPositionToken is an ERC20PermitUpgradeable child contract created by the Opium.OpiumProxyFactory. It represents a specific position (either LONG or SHORT) for a given `LibDerivative.Derivative` derivative

## *event* Approval

***OpiumPositionToken.Approval(owner, spender, value) ***

Arguments

| **name** | **type** | **description** |
|-|-|-|
| owner | address | indexed |
| spender | address | indexed |
| value | uint256 | not indexed |



## *event* Transfer

***OpiumPositionToken.Transfer(from, to, value) ***

Arguments

| **name** | **type** | **description** |
|-|-|-|
| from | address | indexed |
| to | address | indexed |
| value | uint256 | not indexed |



## *function* DOMAIN_SEPARATOR

***OpiumPositionToken.DOMAIN_SEPARATOR() view***

> Details: See {IERC20Permit-DOMAIN_SEPARATOR}.

Outputs

| **name** | **type** | **description** |
|-|-|-|
|  | bytes32 |  |



## *function* allowance

***OpiumPositionToken.allowance(owner, spender) view***

> Details: See {IERC20-allowance}.

Arguments

| **name** | **type** | **description** |
|-|-|-|
| owner | address |  |
| spender | address |  |

Outputs

| **name** | **type** | **description** |
|-|-|-|
|  | uint256 |  |



## *function* approve

***OpiumPositionToken.approve(spender, amount) ***

> Details: See {IERC20-approve}. Requirements: - `spender` cannot be the zero address.

Arguments

| **name** | **type** | **description** |
|-|-|-|
| spender | address |  |
| amount | uint256 |  |

Outputs

| **name** | **type** | **description** |
|-|-|-|
|  | bool |  |



## *function* balanceOf

***OpiumPositionToken.balanceOf(account) view***

> Details: See {IERC20-balanceOf}.

Arguments

| **name** | **type** | **description** |
|-|-|-|
| account | address |  |

Outputs

| **name** | **type** | **description** |
|-|-|-|
|  | uint256 |  |



## *function* burn

***OpiumPositionToken.burn(_positionOwner, _amount) ***

> Notice: it burns a specified amount of tokens owned by the given address

> Details: can only be called by the factory contract set in the `initialize` function

Arguments

| **name** | **type** | **description** |
|-|-|-|
| _positionOwner | address | address of the owner of the position tokens |
| _amount | uint256 | amount of position tokens to be burnt |



## *function* decimals

***OpiumPositionToken.decimals() view***

> Details: Returns the number of decimals used to get its user representation. For example, if `decimals` equals `2`, a balance of `505` tokens should be displayed to a user as `5.05` (`505 / 10 ** 2`). Tokens usually opt for a value of 18, imitating the relationship between Ether and Wei. This is the value {ERC20} uses, unless this function is overridden; NOTE: This information is only used for _display_ purposes: it in no way affects any of the arithmetic of the contract, including {IERC20-balanceOf} and {IERC20-transfer}.

Outputs

| **name** | **type** | **description** |
|-|-|-|
|  | uint8 |  |



## *function* decreaseAllowance

***OpiumPositionToken.decreaseAllowance(spender, subtractedValue) ***

> Details: Atomically decreases the allowance granted to `spender` by the caller. This is an alternative to {approve} that can be used as a mitigation for problems described in {IERC20-approve}. Emits an {Approval} event indicating the updated allowance. Requirements: - `spender` cannot be the zero address. - `spender` must have allowance for the caller of at least `subtractedValue`.

Arguments

| **name** | **type** | **description** |
|-|-|-|
| spender | address |  |
| subtractedValue | uint256 |  |

Outputs

| **name** | **type** | **description** |
|-|-|-|
|  | bool |  |



## *function* getFactoryAddress

***OpiumPositionToken.getFactoryAddress() view***

> Notice: It retrieves the address of the factory contract set in the `initialize` function

Outputs

| **name** | **type** | **description** |
|-|-|-|
|  | address | address of the factory contract (OpiumProxyFactory) |



## *function* getPositionTokenData

***OpiumPositionToken.getPositionTokenData() view***

> Notice: It retrieves all the stored information about the underlying derivative

Outputs

| **name** | **type** | **description** |
|-|-|-|
| _opiumPositionTokenParams | tuple | OpiumPositionTokenParams struct which contains `LibDerivative.Derivative` schema of the derivative, the `LibDerivative.PositionType` of the present ERC20 token and the bytes32 hash `derivativeHash` of the `LibDerivative.Derivative` derivative |



## *function* increaseAllowance

***OpiumPositionToken.increaseAllowance(spender, addedValue) ***

> Details: Atomically increases the allowance granted to `spender` by the caller. This is an alternative to {approve} that can be used as a mitigation for problems described in {IERC20-approve}. Emits an {Approval} event indicating the updated allowance. Requirements: - `spender` cannot be the zero address.

Arguments

| **name** | **type** | **description** |
|-|-|-|
| spender | address |  |
| addedValue | uint256 |  |

Outputs

| **name** | **type** | **description** |
|-|-|-|
|  | bool |  |



## *function* initialize

***OpiumPositionToken.initialize(_derivativeHash, _positionType, _derivative) ***

> Notice: `it is called only once upon deployment of the contract

> Details: it sets the state variables that are meant to be read-only and should be consumed by other contracts to retrieve information about the derivative

Arguments

| **name** | **type** | **description** |
|-|-|-|
| _derivativeHash | bytes32 | bytes32 hash of `LibDerivative.Derivative` |
| _positionType | uint8 | LibDerivative.PositionType _positionType describes whether the present ERC20 token is LONG or SHORT |
| _derivative | tuple | LibDerivative.Derivative Derivative definition |



## *function* mint

***OpiumPositionToken.mint(_positionOwner, _amount) ***

> Notice: it mints a specified amount of tokens to the given address

> Details: can only be called by the factory contract set in the `initialize` function

Arguments

| **name** | **type** | **description** |
|-|-|-|
| _positionOwner | address | address of the recipient of the position tokens |
| _amount | uint256 | amount of position tokens to be minted to the _positionOwner |



## *function* name

***OpiumPositionToken.name() view***

> Notice: It overrides the OpenZeppelin name() getter and returns a custom erc20 name which is derived from the endTime of the erc20 token's associated derivative's maturity, the custom derivative name chosen by the derivative author and the derivative hash

Outputs

| **name** | **type** | **description** |
|-|-|-|
|  | string |  |



## *function* nonces

***OpiumPositionToken.nonces(owner) view***

> Details: See {IERC20Permit-nonces}.

Arguments

| **name** | **type** | **description** |
|-|-|-|
| owner | address |  |

Outputs

| **name** | **type** | **description** |
|-|-|-|
|  | uint256 |  |



## *function* permit

***OpiumPositionToken.permit(owner, spender, value, deadline, v, r, s) ***

> Details: See {IERC20Permit-permit}.

Arguments

| **name** | **type** | **description** |
|-|-|-|
| owner | address |  |
| spender | address |  |
| value | uint256 |  |
| deadline | uint256 |  |
| v | uint8 |  |
| r | bytes32 |  |
| s | bytes32 |  |



## *function* symbol

***OpiumPositionToken.symbol() view***

> Notice: It overrides the OpenZeppelin symbol() getter and returns a custom erc20 symbol which is derived from the endTime of the erc20 token's associated derivative's maturity, the custom derivative name chosen by the derivative author and the derivative hash

Outputs

| **name** | **type** | **description** |
|-|-|-|
|  | string |  |



## *function* totalSupply

***OpiumPositionToken.totalSupply() view***

> Details: See {IERC20-totalSupply}.

Outputs

| **name** | **type** | **description** |
|-|-|-|
|  | uint256 |  |



## *function* transfer

***OpiumPositionToken.transfer(recipient, amount) ***

> Details: See {IERC20-transfer}. Requirements: - `recipient` cannot be the zero address. - the caller must have a balance of at least `amount`.

Arguments

| **name** | **type** | **description** |
|-|-|-|
| recipient | address |  |
| amount | uint256 |  |

Outputs

| **name** | **type** | **description** |
|-|-|-|
|  | bool |  |



## *function* transferFrom

***OpiumPositionToken.transferFrom(sender, recipient, amount) ***

> Details: See {IERC20-transferFrom}. Emits an {Approval} event indicating the updated allowance. This is not required by the EIP. See the note at the beginning of {ERC20}. Requirements: - `sender` and `recipient` cannot be the zero address. - `sender` must have a balance of at least `amount`. - the caller must have allowance for ``sender``'s tokens of at least `amount`.

Arguments

| **name** | **type** | **description** |
|-|-|-|
| sender | address |  |
| recipient | address |  |
| amount | uint256 |  |

Outputs

| **name** | **type** | **description** |
|-|-|-|
|  | bool |  |


