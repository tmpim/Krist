const { expect } = require("chai");

const { seed } = require("../seed");
const { api } = require("../api");

describe("v2 routes: login", () => {
  before(seed);

  describe("POST /login", () => {
    it("should error with a missing privatekey", async () => {
      const res = await api().post("/login");
      expect(res).to.be.json;
      expect(res.body).to.deep.equal({ ok: false, error: "missing_parameter", parameter: "privatekey" });
    });

    it("should error with a blank privatekey", async () => {
      const res = await api().post("/login").send({ privatekey: "" });
      expect(res).to.be.json;
      expect(res.body).to.deep.equal({ ok: false, error: "missing_parameter", parameter: "privatekey" });
    });

    it("should error for v1", async () => {
      const res = await api().post("/login").query({ v: "1" }).send({ privatekey: "a" });
      expect(res).to.be.json;
      expect(res.body).to.deep.equal({ ok: false, error: "invalid_parameter", parameter: "v" });
    });

    it("should return with failed auth", async () => {
      const res = await api().post("/login").send({ privatekey: "c" });
      expect(res).to.be.json;
      expect(res.body).to.deep.equal({ ok: true, authed: false });
    });

    it("should auth v2 addresses successfully", async () => {
      const res = await api().post("/login").send({ privatekey: "a" });
      expect(res).to.be.json;
      expect(res.body).to.deep.include({ ok: true, authed: true, address: "k8juvewcui" });
    });
  });
});
