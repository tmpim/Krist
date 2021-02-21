const { expect } = require("chai");

const { seed } = require("../seed");
const { api } = require("../api");

describe("v1 routes: blocks", () => {
  before(seed);

  // TODO: /?lastblock
  // TODO: /?getbaseblockvalue
  // TODO: /?getblockvalue
  // TODO: /?blocks
});

describe("v2 routes: blocks", () => {
  before(seed);

  // TODO: GET /blocks
  // TODO: GET /blocks/latest
  // TODO: GET /blocks/lowest
  // TODO: GET /blocks/last
  // TODO: GET /blocks/basevalue
  // TODO: GET /blocks/value
  // TODO: GET /blocks/:height
});
