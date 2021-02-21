const { expect } = require("chai");

const { seed } = require("../seed");

describe("schema to json", () => {  
  before(seed);

  describe("transactionToJSON", () => {
    it("should convert a transaction to json", async () => {
      const Transactions = require("../../src/transactions");
      const time = new Date();
      const out = Transactions.transactionToJSON({
        id: 1, from: "k8juvewcui", to: "k7oax47quv", value: 1,
        time, name: null, op: null
      });
      
      expect(out).to.be.an("object");
      expect(out).to.deep.include({
        id: 1, from: "k8juvewcui", to: "k7oax47quv", value: 1,
        time, type: "transfer"
      });
    });

    it("should convert a database transaction to json", async () => {
      const Transactions = require("../../src/transactions");
      const schemas = require("../../src/schemas");
      
      const time = new Date();
      const tx = await schemas.transaction.create({
        id: 1, from: "k8juvewcui", to: "k7oax47quv", value: 1,
        time, name: null, op: null
      });

      const out = Transactions.transactionToJSON(tx);
      
      expect(out).to.be.an("object");
      expect(out).to.deep.include({
        id: 1, from: "k8juvewcui", to: "k7oax47quv", value: 1,
        time, type: "transfer"
      });
    });
  });
});
