## Derivative author fees and protocol reserves
#### Execution
Derivatives authors can set a fee (limited) on the profit that trades make from execution. Part of this fee goes to protocol execution reserves and the rest goes to the derivative author.

| [input] Execution profit                | 100 ETH |
|-----------------------------------------|---------|
| [input] Derivative author fee           | 5%      |
| [input] Protocol execution reserve part | 10%     |
| [output] Total reserve                  | 5 ETH   |
| [output] Protocol execution reserve     | 0.5 ETH |
| [output] Derivative author reserve      | 4.5 ETH |


#### Redemption
During the redemption of the market neutral positions, protocol may withhold a portion of the initial margin for the derivative author, which is then distributed to protocol redemption reserves and the rest goes to the derivative author.

| [input] Initial margin                    | 1000 ETH |
|-------------------------------------------|----------|
| [input] Derivative author redemption part | 0.1%     |
| [input] Protocol redemption reserve part  | 10%      |
| [output] Total reserve                    | 1 ETH    |
| [output] Protocol redemption reserve      | 0.1 ETH  |
| [output] Derivative author reserve        | 0.9 ETH  |


