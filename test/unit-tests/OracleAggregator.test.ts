import { ethers } from "hardhat";
import { expect } from "../chai-setup";
import setup from "../__fixtures__";
import { TNamedSigners } from "../../types";
import { pickError } from "../../utils/misc";
import { semanticErrors } from "../../utils/constants";

describe("OracleAggregator", () => {
  const timestamp = Math.floor(Date.now() / 1000);
  const mockDataOne = 123456789;
  const mockDataTwo = 987654321;

  it("should accept data from oracle", async () => {
    const {
      contracts: { oracleAggregator },
      users: { oracle },
    } = await setup();

    await oracleAggregator.connect(oracle).__callback(timestamp, mockDataOne);
    const result = await oracleAggregator.getData(oracle.address, timestamp);

    expect(result).to.be.equal(mockDataOne);
  });

  it("should reject attempt to push data twice", async () => {
    const {
      contracts: { oracleAggregator },
      users: { oracle },
    } = await setup();

    await oracleAggregator.connect(oracle).__callback(timestamp, mockDataOne);
    await oracleAggregator.getData(oracle.address, timestamp);

    await expect(oracleAggregator.connect(oracle).__callback(timestamp, mockDataOne)).to.be.revertedWith(
      pickError(semanticErrors.ERROR_ORACLE_AGGREGATOR_DATA_ALREADY_EXIST),
    );
  });

  it("should query and receive data using getData", async () => {
    const {
      contracts: { oracleAggregator, oracleIdMock },
    } = await setup();
    await oracleIdMock.triggerCallback(timestamp, mockDataTwo);
    const result = await oracleAggregator.getData(oracleIdMock.address, timestamp);

    expect(result).to.be.equal(mockDataTwo);
  });

  it("should query OracleAggregator before data being pushed for the given timpestamp and revert with ERROR_ORACLE_AGGREGATOR_DATA_DOESNT_EXIST error message", async () => {
    const {
      contracts: { oracleAggregator, oracleIdMock },
    } = await setup();
    await expect(oracleAggregator.getData(oracleIdMock.address, timestamp)).to.be.revertedWith(
      pickError(semanticErrors.ERROR_ORACLE_AGGREGATOR_DATA_DOESNT_EXIST),
    );
  });

  it("should push data twice for the same timestamp and revert with ORACLE_AGGREGATOR:DATA_ALREADY_EXIST error message", async () => {
    const {
      contracts: { oracleIdMock },
    } = await setup();

    await oracleIdMock.triggerCallback(timestamp, mockDataTwo);
    await expect(oracleIdMock.triggerCallback(timestamp, mockDataTwo)).to.be.revertedWith(
      pickError(semanticErrors.ERROR_ORACLE_AGGREGATOR_DATA_ALREADY_EXIST),
    );
  });

  it("should push data twice for the same timestamp and should revert with ORACLE_AGGREGATOR:DATA_ALREADY_EXIST error message", async () => {
    const {
      contracts: { oracleAggregator },
    } = await setup();

    await oracleAggregator.__callback(timestamp, mockDataTwo);
    await expect(oracleAggregator.__callback(timestamp, mockDataTwo)).to.be.revertedWith(
      pickError(semanticErrors.ERROR_ORACLE_AGGREGATOR_DATA_ALREADY_EXIST),
    );
  });
});
