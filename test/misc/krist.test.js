const { expect } = require("chai");

const Krist = () => require("../../src/krist");

describe("krist functions", () => {  
  describe("isValidName", () => {
    it("should work for a valid name", async () =>
      expect(Krist().isValidName("test")).to.be.true);
    it("should not allow symbols", async () =>
      expect(Krist().isValidName("test[")).to.be.false);
    it("should not allow spaces", async () =>
      expect(Krist().isValidName("te st")).to.be.false);
    it("should not trim", async () =>
      expect(Krist().isValidName(" test ")).to.be.false);
    it("should not allow empty names", async () =>
      expect(Krist().isValidName("")).to.be.false);
    it("should not allow long names", async () =>
      expect(Krist().isValidName("a".repeat(65))).to.be.false);
    it("should error with undefined", async () =>
      expect(() => Krist().isValidName()).to.throw(TypeError));
  });

  describe("stripNameSuffix", () => {
    it("should strip a .kst suffix", async () =>
      expect(Krist().stripNameSuffix("test.kst")).to.equal("test"));
    it("not alter a name without a suffix", async () => 
      expect(Krist().stripNameSuffix("test")).to.equal("test"));
    it("should only strip the last suffix", async () =>
      expect(Krist().stripNameSuffix("test.kst.kst")).to.equal("test.kst"));
    it("should not error with an undefined input", async () =>
      expect(Krist().stripNameSuffix()).to.equal(""));
  });
});
