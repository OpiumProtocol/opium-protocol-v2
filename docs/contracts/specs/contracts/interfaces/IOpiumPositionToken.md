# IOpiumPositionToken

contracts/interfaces/IOpiumPositionToken.sol

## *event* Approval

***IOpiumPositionToken.Approval(owner, spender, value) ***

Arguments

| **name** | **type** | **description** |
|-|-|-|
| owner | address | indexed |
| spender | address | indexed |
| value | uint256 | not indexed |



## *event* Transfer

***IOpiumPositionToken.Transfer(from, to, value) ***

Arguments

| **name** | **type** | **description** |
|-|-|-|
| from | address | indexed |
| to | address | indexed |
| value | uint256 | not indexed |



## *function* DOMAIN_SEPARATOR

***IOpiumPositionToken.DOMAIN_SEPARATOR() view***

> Details: Returns the domain separator used in the encoding of the signature for {permit}, as defined by {EIP712}.

Outputs

| **name** | **type** | **description** |
|-|-|-|
|  | bytes32 |  |



## *function* allowance

***IOpiumPositionToken.allowance(owner, spender) view***

> Details: Returns the remaining number of tokens that `spender` will be allowed to spend on behalf of `owner` through {transferFrom}. This is zero by default. This value changes when {approve} or {transferFrom} are called.

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

***IOpiumPositionToken.approve(spender, amount) ***

> Details: Sets `amount` as the allowance of `spender` over the caller's tokens. Returns a boolean value indicating whether the operation succeeded. IMPORTANT: Beware that changing an allowance with this method brings the risk that someone may use both the old and the new allowance by unfortunate transaction ordering. One possible solution to mitigate this race condition is to first reduce the spender's allowance to 0 and set the desired value afterwards: https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729 Emits an {Approval} event.

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

***IOpiumPositionToken.balanceOf(account) view***

> Details: Returns the amount of tokens owned by `account`.

Arguments

| **name** | **type** | **description** |
|-|-|-|
| account | address |  |

Outputs

| **name** | **type** | **description** |
|-|-|-|
|  | uint256 |  |



## *function* burn

***IOpiumPositionToken.burn(_positionOwner, _amount) ***

Arguments

| **name** | **type** | **description** |
|-|-|-|
| _positionOwner | address |  |
| _amount | uint256 |  |



## *function* getFactoryAddress

***IOpiumPositionToken.getFactoryAddress() view***

Outputs

| **name** | **type** | **description** |
|-|-|-|
|  | address |  |



## *function* getPositionTokenData

***IOpiumPositionToken.getPositionTokenData() view***

Outputs

| **name** | **type** | **description** |
|-|-|-|
| opiumPositionTokenParams | tuple |  |



## *function* initialize

***IOpiumPositionToken.initialize(_derivativeHash, _positionType, _derivative) ***

Arguments

| **name** | **type** | **description** |
|-|-|-|
| _derivativeHash | bytes32 |  |
| _positionType | uint8 |  |
| _derivative | tuple |  |



## *function* mint

***IOpiumPositionToken.mint(_positionOwner, _amount) ***

Arguments

| **name** | **type** | **description** |
|-|-|-|
| _positionOwner | address |  |
| _amount | uint256 |  |



## *function* nonces

***IOpiumPositionToken.nonces(owner) view***

> Details: Returns the current nonce for `owner`. This value must be included whenever a signature is generated for {permit}. Every successful call to {permit} increases ``owner``'s nonce by one. This prevents a signature from being used multiple times.

Arguments

| **name** | **type** | **description** |
|-|-|-|
| owner | address |  |

Outputs

| **name** | **type** | **description** |
|-|-|-|
|  | uint256 |  |



## *function* permit

***IOpiumPositionToken.permit(owner, spender, value, deadline, v, r, s) ***

> Details: Sets `value` as the allowance of `spender` over ``owner``'s tokens, given ``owner``'s signed approval. IMPORTANT: The same issues {IERC20-approve} has related to transaction ordering also apply here. Emits an {Approval} event. Requirements: - `spender` cannot be the zero address. - `deadline` must be a timestamp in the future. - `v`, `r` and `s` must be a valid `secp256k1` signature from `owner` over the EIP712-formatted function arguments. - the signature must use ``owner``'s current nonce (see {nonces}). For more information on the signature format, see the https://eips.ethereum.org/EIPS/eip-2612#specification[relevant EIP section].

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



## *function* safeTransfer

***IOpiumPositionToken.safeTransfer(token, to, value) ***

Arguments

| **name** | **type** | **description** |
|-|-|-|
| token | address |  |
| to | address |  |
| value | uint256 |  |



## *function* safeTransferFrom

***IOpiumPositionToken.safeTransferFrom(token, from, to, value) ***

Arguments

| **name** | **type** | **description** |
|-|-|-|
| token | address |  |
| from | address |  |
| to | address |  |
| value | uint256 |  |



## *function* totalSupply

***IOpiumPositionToken.totalSupply() view***

> Details: Returns the amount of tokens in existence.

Outputs

| **name** | **type** | **description** |
|-|-|-|
|  | uint256 |  |



## *function* transfer

***IOpiumPositionToken.transfer(recipient, amount) ***

> Details: Moves `amount` tokens from the caller's account to `recipient`. Returns a boolean value indicating whether the operation succeeded. Emits a {Transfer} event.

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

***IOpiumPositionToken.transferFrom(sender, recipient, amount) ***

> Details: Moves `amount` tokens from `sender` to `recipient` using the allowance mechanism. `amount` is then deducted from the caller's allowance. Returns a boolean value indicating whether the operation succeeded. Emits a {Transfer} event.

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


