const { expect } = require("chai");

const { seed } = require("../seed");

const utils = require("../../src/utils");

describe("schema to json", () => {
  before(seed);

  describe("sanitiseLimit", () => {
    it("should return the default with undefined", async () =>
      expect(utils.sanitiseLimit()).to.equal(50));
    it("should return the default with null", async () =>
      expect(utils.sanitiseLimit(null)).to.equal(50));
    it("should return the default with an empty string", async () =>
      expect(utils.sanitiseLimit("")).to.equal(50));
    it("should return the default with whitespace", async () =>
      expect(utils.sanitiseLimit(" ")).to.equal(50));
    it("should return the default with negative", async () =>
      expect(utils.sanitiseLimit(-1)).to.equal(50));
    it("should return the default with NaN", async () =>
      expect(utils.sanitiseLimit(NaN)).to.equal(50));

    it("should return the given default with undefined", async () =>
      expect(utils.sanitiseLimit(undefined, 5)).to.equal(5));
    it("should return the given default with null", async () =>
      expect(utils.sanitiseLimit(null, 5)).to.equal(5));
    it("should return the given default with an empty string", async () =>
      expect(utils.sanitiseLimit("", 5)).to.equal(5));
    it("should return the given default with whitespace", async () =>
      expect(utils.sanitiseLimit(" ", 5)).to.equal(5));
    it("should return the given default with negative", async () =>
      expect(utils.sanitiseLimit(-1, 5)).to.equal(5));
    it("should return the given default with NaN", async () =>
      expect(utils.sanitiseLimit(NaN, 5)).to.equal(5));

    it("should parse integers", async () =>
      expect(utils.sanitiseLimit("1")).to.equal(1));
    it("should ignore decimals", async () =>
      expect(utils.sanitiseLimit("1.1")).to.equal(1));

    it("should allow valid limits", async () => {
      for (let i = 0; i <= 1000; i++)
        expect(utils.sanitiseLimit(i)).to.equal(i);
    });

    it("should not exceed the maximum", async () =>
      expect(utils.sanitiseLimit(1001)).to.equal(1000));
    it("should not exceed a custom maximum", async () =>
      expect(utils.sanitiseLimit(51, undefined, 50)).to.equal(50));
  });

  describe("sanitiseOffset", () => {
    it("should return null for undefined", async () =>
      expect(utils.sanitiseOffset()).to.be.null);
    it("should parse integers", async () =>
      expect(utils.sanitiseOffset("1")).to.equal(1));
    it("should ignore decimals", async () =>
      expect(utils.sanitiseOffset("1.1")).to.equal(1));
    it("should allow valid offsets", async () =>
      expect(utils.sanitiseOffset(1)).to.equal(1));
  });

  describe("sanitiseLike", () => {
    it("should error with undefined", async () =>
      expect(() => utils.sanitiseLike()).to.throw(Error));
    it("should pass through a regular string", async () =>
      expect(utils.sanitiseLike("foobar")).to.deep.equal({ val: "'%foobar%'" }));
    it("should escape single quotes", async () =>
      expect(utils.sanitiseLike("foo'bar")).to.deep.equal({ val: "'%foo\\'bar%'" }));
    it("should escape two single quotes", async () =>
      expect(utils.sanitiseLike("foo''bar")).to.deep.equal({ val: "'%foo\\'\\'bar%'" }));
    it("should escape double quotes", async () =>
      expect(utils.sanitiseLike("foo\"bar")).to.deep.equal({ val: "'%foo\\\"bar%'" }));
    it("should ignore backticks", async () =>
      expect(utils.sanitiseLike("foo`bar")).to.deep.equal({ val: "'%foo`bar%'" }));
    it("should escape backslashes", async () =>
      expect(utils.sanitiseLike("foo\\bar")).to.deep.equal({ val: "'%foo\\\\\\\\bar%'" }));
    it("should escape underscores", async () =>
      expect(utils.sanitiseLike("foo_bar")).to.deep.equal({ val: "'%foo\\\\_bar%'" }));
    it("should escape percent", async () =>
      expect(utils.sanitiseLike("foo%bar")).to.deep.equal({ val: "'%foo\\\\%bar%'" }));
  });
});
