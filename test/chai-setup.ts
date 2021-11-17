import chai from "chai";
import { chaiEthers } from "chai-ethers";
chai.use(chaiEthers);

chai.use(function (chai, utils) {
  const Assertion = chai.Assertion;

  Assertion.addMethod("matchDerivative", function (expected, idKey) {
    const obj = this._obj;

    Object.keys(expected).forEach(function (key) {
      new Assertion(obj).to.have.property(key, expected[key]);
    });
  });
});

chai.use(function (chai, utils) {
  const Assertion = chai.Assertion;

  Assertion.addMethod("matchDerivative", function (expected, idKey) {
    const obj = this._obj;

    Object.keys(expected).forEach(function (key) {
      if (Array.isArray(obj[key])) {
        new Assertion(obj[key]).to.deep.eq(expected[key]);
      } else {
        new Assertion(obj[key]).to.eq(expected[key]);
      }
    });
  });
});

export = chai;
