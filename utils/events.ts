import { Result } from "@ethersproject/abi";
import { Log } from "@ethersproject/providers";
import { Contract, ContractReceipt, Event } from "ethers";

export const filterEvents = (blockEvents: ContractReceipt, name: string): Array<Event> => {
  return blockEvents.events?.filter(event => event.event === name) || [];
};

export const decodeEvent = <T extends Contract>(contract: T, events: Array<Event>): Array<Result> => {
  const decodedEvents = [];
  for (const event of events) {
    const getEventInterface = contract.interface.getEvent(event.event || "");

    decodedEvents.push(contract.interface.decodeEventLog(getEventInterface, event.data, event.topics));
  }
  return decodedEvents;
};

export const decodeLogs = <T extends Contract>(contract: T, eventName: string, receipt: ContractReceipt): Log[] => {
  const topic = contract.interface.getEventTopic(eventName);
  return receipt.logs.filter(log => log.topics.indexOf(topic) >= 0);
};
