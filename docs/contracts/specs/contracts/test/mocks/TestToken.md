# TestToken

contracts/test/mocks/TestToken.sol

## *constructor*

***constructor(_name, _symbol, _decimals)***

Arguments

| **name** | **type** | **description** |
|-|-|-|
| _name | string |  |
| _symbol | string |  |
| _decimals | uint8 |  |



## *event* Approval

***TestToken.Approval(owner, spender, value) ***

Arguments

| **name** | **type** | **description** |
|-|-|-|
| owner | address | indexed |
| spender | address | indexed |
| value | uint256 | not indexed |



## *event* Transfer

***TestToken.Transfer(from, to, value) ***

Arguments

| **name** | **type** | **description** |
|-|-|-|
| from | address | indexed |
| to | address | indexed |
| value | uint256 | not indexed |



## *function* allowance

***TestToken.allowance(owner, spender) view***

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

***TestToken.approve(spender, amount) ***

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

***TestToken.balanceOf(account) view***

> Details: See {IERC20-balanceOf}.

Arguments

| **name** | **type** | **description** |
|-|-|-|
| account | address |  |

Outputs

| **name** | **type** | **description** |
|-|-|-|
|  | uint256 |  |



## *function* decimals

***TestToken.decimals() view***

> Details: Returns the number of decimals used to get its user representation. For example, if `decimals` equals `2`, a balance of `505` tokens should be displayed to a user as `5.05` (`505 / 10 ** 2`). Tokens usually opt for a value of 18, imitating the relationship between Ether and Wei. This is the value {ERC20} uses, unless this function is overridden; NOTE: This information is only used for _display_ purposes: it in no way affects any of the arithmetic of the contract, including {IERC20-balanceOf} and {IERC20-transfer}.

Outputs

| **name** | **type** | **description** |
|-|-|-|
|  | uint8 |  |



## *function* decreaseAllowance

***TestToken.decreaseAllowance(spender, subtractedValue) ***

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



## *function* increaseAllowance

***TestToken.increaseAllowance(spender, addedValue) ***

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



## *function* mint

***TestToken.mint(_to, _amount) ***

Arguments

| **name** | **type** | **description** |
|-|-|-|
| _to | address |  |
| _amount | uint256 |  |



## *function* name

***TestToken.name() view***

> Details: Returns the name of the token.

Outputs

| **name** | **type** | **description** |
|-|-|-|
|  | string |  |



## *function* owner

***TestToken.owner() view***

Outputs

| **name** | **type** | **description** |
|-|-|-|
|  | address |  |



## *function* symbol

***TestToken.symbol() view***

> Details: Returns the symbol of the token, usually a shorter version of the name.

Outputs

| **name** | **type** | **description** |
|-|-|-|
|  | string |  |



## *function* totalSupply

***TestToken.totalSupply() view***

> Details: See {IERC20-totalSupply}.

Outputs

| **name** | **type** | **description** |
|-|-|-|
|  | uint256 |  |



## *function* transfer

***TestToken.transfer(recipient, amount) ***

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

***TestToken.transferFrom(sender, recipient, amount) ***

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


