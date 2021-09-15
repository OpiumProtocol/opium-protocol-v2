export const zeroAddress = "0x0000000000000000000000000000000000000000";

export const formatAddress = (address: string): string => {
    return '0x'.concat(address.split('0x000000000000000000000000')[1])
}
