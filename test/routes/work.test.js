const { expect } = require("chai");

const { seed } = require("../seed");
const { api } = require("../api");

describe("v1 routes: work", () => {
  before(seed);

  describe("GET /?getwork", () => {
    it("should return the work", async () => {
      const res = await api().get("/?getwork");
      expect(res).to.have.status(200);
      expect(res).to.be.text;
      expect(res.text).to.equal("100000");
    });
  });
});

describe("v2 routes: work", () => {
  before(seed);

  describe("GET /work", () => {
    it("should return the work", async () => {
      const res = await api().get("/work");
      expect(res).to.have.status(200);
      expect(res).to.be.json;
      expect(res.body).to.deep.equal({ ok: true, work: 100000 });
    });

    it("should return the work when it changes", async () => {
      const Krist = require("../../src/krist");
      await Krist.setWork(5000);

      const res = await api().get("/work");
      expect(res).to.have.status(200);
      expect(res).to.be.json;
      expect(res.body).to.deep.equal({ ok: true, work: 5000 });
    });
  });

  describe("GET /work/day", () => {
    it("should return the work over time", async () => {
      const res = await api().get("/work/day");
      expect(res).to.have.status(200);
      expect(res).to.be.json;
      expect(res.body.work).to.be.an("array");
    });
  });

  describe("GET /work/detailed", () => {
    it("should return basic detailed work info", async () => {
      const res = await api().get("/work/detailed");
      expect(res).to.have.status(200);
      expect(res).to.be.json;
      expect(res.body).to.be.deep.equal({
        ok: true,
        work: 5000, unpaid: 0,
        base_value: 25, block_value: 25,
        decrease: { value: 0, blocks: 0, reset: 0 }
      });
    });

    // TODO: more tests here with names
  });
});
