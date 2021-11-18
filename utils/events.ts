import { Result } from "@ethersproject/abi";
import { Log } from "@ethersproject/providers";
import { Contract, ContractReceipt, Event } from "ethers";
import { OpiumProxyFactory } from "../typechain";
import { formatAddress } from "./misc";

export const filterEvents = (events: Array<Event> | undefined, eventName: string): Array<Event> => {
  return events ? events.filter(event => event.event === eventName) : [];
};

export const decodeEvents = <T extends Contract>(
  contract: T,
  eventName: string,
  events: Array<Event> | undefined,
): Array<Result> => {
  const filteredEvents = filterEvents(events, eventName);
  if (filteredEvents.length === 0) {
    return [];
  }
  const decodedEvents = [];
  for (const event of filteredEvents) {
    if (event.event) {
      const getEventInterface = contract.interface.getEvent(event.event);
      decodedEvents.push(contract.interface.decodeEventLog(getEventInterface, event.data, event.topics));
    }
  }
  return decodedEvents;
};

export const decodeLogs = <T extends Contract>(contract: T, eventName: string, receipt: ContractReceipt): Log[] => {
  const topic = contract.interface.getEventTopic(eventName);
  return receipt.logs.filter(log => log.topics.indexOf(topic) >= 0);
};

export const retrievePositionTokensAddresses = (
  opiumProxyFactory: OpiumProxyFactory,
  receipt: ContractReceipt,
): [string, string] => {
  const longPostionLog = decodeLogs<OpiumProxyFactory>(opiumProxyFactory, "LogLongPositionTokenAddress", receipt);
  const shortPostionLog = decodeLogs<OpiumProxyFactory>(opiumProxyFactory, "LogShortPositionTokenAddress", receipt);

  const longPositionAddress = formatAddress(longPostionLog[0].topics[2]);
  const shortPositionAddress = formatAddress(shortPostionLog[0].topics[2]);
  return [longPositionAddress, shortPositionAddress];
};
