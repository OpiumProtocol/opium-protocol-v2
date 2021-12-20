# ExecutableByThirdParty

contracts/helpers/ExecutableByThirdParty.sol

> Title: Opium.Helpers.ExecutableByThirdParty contract helps to syntheticId development and responsible for getting and setting thirdparty execution settings

## *function* allowThirdpartyExecution

***ExecutableByThirdParty.allowThirdpartyExecution(allow) ***

> Notice: Sets third party execution settings for `msg.sender`

Arguments

| **name** | **type** | **description** |
|-|-|-|
| allow | bool | Indicates whether thirdparty execution should be allowed or not |



## *function* thirdpartyExecutionAllowed

***ExecutableByThirdParty.thirdpartyExecutionAllowed(derivativeOwner) view***

> Notice: Getter for thirdparty execution allowance

Arguments

| **name** | **type** | **description** |
|-|-|-|
| derivativeOwner | address | Address of position holder that's going to be executed |

Outputs

| **name** | **type** | **description** |
|-|-|-|
|  | bool | bool Returns whether thirdparty execution is allowed by derivativeOwner |


