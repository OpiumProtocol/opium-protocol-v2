import { artifacts, ethers } from "hardhat";
import { expect } from "chai";
import setup from "../utils/setup";
import { deployMockContract } from "ethereum-waffle";
import { toBN } from "../utils/bn";
import { TNamedSigners } from "../hardhat.config";

describe("OracleAggregator", () => {
  const timestamp = Math.floor(Date.now() / 1000);
  const data = 123456789;
  const returnDataOne = 987654321;
  const returnDataTwo = 329876321;
  const returnDataThree = 11976541;

  const timestampMinusOne = timestamp - 60; // - 1 minute
  const timestampPlusOne = timestamp + 60; // + 1 minute
  const timestampPlusTwo = timestamp + 120; // + 2 minute
  const timestampPlusThree = timestamp + 180; // + 3 minute

  const fetchPrice = toBN("0.1");
  const lessMoney = toBN("0.01");
  const moreButNotEnoughMoney = toBN("0.11");
  const moreMoney = toBN("0.3");

  const period = 60; // 2 minutes
  const times = 3;

  let namedSigners: TNamedSigners

  before(async() => {
    namedSigners = await ethers.getNamedSigners() as TNamedSigners;
  })

  it("should accept data from oracle", async () => {
    const { oracle } = namedSigners;

    const { oracleAggregator } = await setup();
    await oracleAggregator.connect(oracle).__callback(timestamp, data);
    const result = await oracleAggregator.getData(oracle.address, timestamp);

    expect(+result.toString()).to.be.equal(data);
  });

  it("should reject attempt to push data twice", async () => {
    try {
      const { oracleAggregator } = await setup();
      const { oracle } = namedSigners;

      await oracleAggregator.connect(oracle).__callback(timestamp, data);
      await oracleAggregator.getData(oracle.address, timestamp);

      await oracleAggregator.connect(oracle).__callback(timestamp, data);
    } catch (error) {
      const { message } = error as Error
      expect(message).to.include("ORACLE_AGGREGATOR:DATA_ALREADY_EXIST");
    }
  });

  it("should correctly return fetchPrice from oracle", async () => {
    const { oracleAggregator } = await setup();
    const { deployer } = namedSigners;

    const oracleIdMock = await deployMockContract(deployer, (await artifacts.readArtifact("OracleIdMock")).abi);
    await oracleIdMock.mock.calculateFetchPrice.returns(fetchPrice);

    const result = await oracleAggregator.callStatic.calculateFetchPrice(oracleIdMock.address);

    expect(result).to.be.equal(fetchPrice);
  });

  it("should revert fetchData with ORACLE_AGGREGATOR:NOT_ENOUGH_ETHER with 0 ether", async () => {
    try {
      const { oracleAggregator } = await setup();
      const { deployer, author } = namedSigners;

      const oracleIdMock = await deployMockContract(deployer, (await artifacts.readArtifact("OracleIdMock")).abi);
      await oracleIdMock.mock.calculateFetchPrice.returns(fetchPrice);

      await oracleAggregator.connect(author).fetchData(oracleIdMock.address, timestamp);
    } catch (error) {
      const { message } = error as Error
      expect(message).to.include("ORACLE_AGGREGATOR:NOT_ENOUGH_ETHER");
    }
  });

  it("should revert fetchData with ORACLE_AGGREGATOR:NOT_ENOUGH_ETHER with 0 ether", async () => {
    try {
      const { oracleAggregator } = await setup();
      const { deployer, author } = namedSigners;

      const oracleIdMock = await deployMockContract(deployer, (await artifacts.readArtifact("OracleIdMock")).abi);
      await oracleIdMock.mock.calculateFetchPrice.returns(fetchPrice);

      await oracleAggregator.connect(author).fetchData(oracleIdMock.address, timestamp);
    } catch (error) {
      const { message } = error as Error
      expect(message).to.include("ORACLE_AGGREGATOR:NOT_ENOUGH_ETHER");
    }
  });

  it("should revert fetchData with ORACLE_AGGREGATOR:NOT_ENOUGH_ETHER with less ether", async () => {
    try {
      const { oracleAggregator, oracleIdMock } = await setup();
      const { author } = namedSigners;

      await oracleAggregator.connect(author).fetchData(oracleIdMock.address, timestamp, { value: lessMoney });
    } catch (error) {
      const { message } = error as Error
      expect(message).to.include("ORACLE_AGGREGATOR:NOT_ENOUGH_ETHER");
    }
  });

  it("should query and receive data using fetchData", async () => {
    const { oracleAggregator, oracleIdMock } = await setup();
    const { author } = namedSigners;

    await oracleAggregator.connect(author).fetchData(oracleIdMock.address, timestamp, { value: fetchPrice });
    await oracleIdMock.triggerCallback(timestamp, returnDataThree);

    const result = await oracleAggregator.getData(oracleIdMock.address, timestamp);

    expect(result).to.be.equal(returnDataThree);
  });

  it("should revert fetchData with ORACLE_AGGREGATOR:QUERY_WAS_ALREADY_MADE for already existing data", async () => {
    try {
      const { oracleAggregator, oracleIdMock } = await setup();
      const { author } = namedSigners;

      await oracleAggregator.connect(author).fetchData(oracleIdMock.address, timestamp, { value: moreMoney });
      await oracleIdMock.triggerCallback(timestamp, returnDataThree);

      await oracleAggregator.connect(author).fetchData(oracleIdMock.address, timestamp, { value: moreMoney });
    } catch (error) {
      const { message } = error as Error
      expect(message).to.include("ORACLE_AGGREGATOR:QUERY_WAS_ALREADY_MADE");
    }
  });

  it("should revert recursivelyFetchData with ORACLE_AGGREGATOR:QUERY_WAS_ALREADY_MADE for already existing data", async () => {
    try {
      const { oracleAggregator, oracleIdMock } = await setup();
      const { author } = namedSigners;

      await oracleAggregator.connect(author).fetchData(oracleIdMock.address, timestamp, { value: moreMoney });
      await oracleIdMock.triggerCallback(timestamp, returnDataThree);

      await oracleAggregator
        .connect(author)
        .recursivelyFetchData(oracleIdMock.address, timestampMinusOne, period, times, { value: moreMoney });
    } catch (error) {
      const { message } = error as Error
      expect(message).to.include("ORACLE_AGGREGATOR:QUERY_WAS_ALREADY_MADE");
    }
  });

  it("should query and receive data using recursivelyFetchData", async () => {
    const { oracleAggregator, oracleIdMock } = await setup();

    await oracleAggregator.recursivelyFetchData(oracleIdMock.address, timestampPlusOne, period, times, {
      value: moreMoney,
    });

    await oracleIdMock.triggerCallback(timestampPlusOne, returnDataOne);
    await oracleIdMock.triggerCallback(timestampPlusTwo, returnDataTwo);
    await oracleIdMock.triggerCallback(timestampPlusThree, returnDataThree);

    const resultOne = await oracleAggregator.getData(oracleIdMock.address, timestampPlusOne);
    const resultTwo = await oracleAggregator.getData(oracleIdMock.address, timestampPlusTwo);
    const resultThree = await oracleAggregator.getData(oracleIdMock.address, timestampPlusThree);

    expect(resultOne).to.be.equal(returnDataOne);
    expect(resultTwo).to.be.equal(returnDataTwo);
    expect(resultThree).to.be.equal(returnDataThree);
  });
});
