const { expect } = require("chai");

const Krist = () => require("../../src/krist");

describe("krist functions", () => {
  describe("isValidKristAddress", () => {
    it("should work for a valid v1 address", async () =>
      expect(Krist().isValidKristAddress("a5dfb396d3")).to.be.true);
    it("should work for a valid v2 address", async () =>
      expect(Krist().isValidKristAddress("k8juvewcui")).to.be.true);
    it("should fail for an invalid address", async () =>
      expect(Krist().isValidKristAddress("kfartoolong")).to.be.false);
    it("should fail for a valid v1 address when v2Only", async () =>
      expect(Krist().isValidKristAddress("a5dfb396d3", true)).to.be.false);
    it("should work for a valid v2 address when v2Only", async () =>
      expect(Krist().isValidKristAddress("k8juvewcui", true)).to.be.true);
    it("should fail for an invalid address when v2Only", async () =>
      expect(Krist().isValidKristAddress("kfartoolong", true)).to.be.false);
  });

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
    it("should not allow punycode prefixes", async () =>
      expect(Krist().isValidName("xn--test")).to.be.false);
    it("should allow punycode prefixes with fetching=true", async () =>
      expect(Krist().isValidName("xn--test", true)).to.be.true);
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
