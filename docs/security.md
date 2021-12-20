## Security measures

#### Derivative data cache

Since all syntheticId’s (derivative logic contracts) are third party contracts that are being consumed by the protocol, protocol MUST consider them as potentially malicious and act accordingly. This is why all data consumption calls (except derivative parameters validation) are only made once and are stored in cache thereafter.

#### P2P Vaults

As an additional security measure there was introduced a so-called “P2P Vault”, which’s only purpose is a bookkeeping of cash flows for each particular derivative (ticker). It’s being increased on every incoming cash flow and deceased on every outcoming cash flow. It’s decreasing by greater value that it counts at the moment will result in transaction’s reverting.

This bookkeeping helps to prevent any potentially (not yet known) malicious derivatives from stealing funds withheld for other derivatives settlement.
