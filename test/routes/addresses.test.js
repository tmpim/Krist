const { expect } = require("chai");

const { seed } = require("../seed");
const { api } = require("../api");

describe("v1 routes: addresses", () => {
  before(seed);

  describe("GET /?getbalance", () => {
    it("should return the balance", async () => {
      const res = await api().get("/?getbalance=k8juvewcui");
      expect(res).to.have.status(200);
      expect(res).to.be.text;
      expect(res.text).to.equal("10");
    });
    
    it("should return the balance", async () => {
      const res = await api().get("/?getbalance=k7oax47quv");
      expect(res).to.have.status(200);
      expect(res).to.be.text;
      expect(res.text).to.equal("0");
    });
    
    it("should return 0 for a non-existent address", async () => {
      const res = await api().get("/?getbalance=knotfound0");
      expect(res).to.have.status(200);
      expect(res).to.be.text;
      expect(res.text).to.equal("0");
    });
  });

  describe("GET /?alert", () => {
    it("should return an alert", async () => {
      const res = await api().get("/?alert=c");
      expect(res).to.have.status(200);
      expect(res).to.be.text;
      expect(res.text).to.equal("Test alert");
    });

    it("should return nothing for addresses with no alert", async () => {
      const res = await api().get("/?alert=a");
      expect(res).to.have.status(200);
      expect(res).to.be.text;
      expect(res.text).to.equal("");
    });
  });

  // TODO: GET /?richapi
  // TODO: GET /?listtx
});

describe("v2 routes: addresses", () => {
  // TODO: GET /addresses

  describe("POST /addresses/alert", () => {
    it("should return an alert", async () => {
      const res = await api()
        .post("/addresses/alert")
        .send({ privatekey: "c" });

      expect(res).to.have.status(200);
      expect(res).to.be.json;
      expect(res.body).to.deep.equal({ ok: true, alert: "Test alert" });
    });

    it("should return null for addresses with no alert", async () => {
      const res = await api()
        .post("/addresses/alert")
        .send({ privatekey: "a" });

      expect(res).to.have.status(200);
      expect(res).to.be.json;
      expect(res.body).to.deep.equal({ ok: true, alert: null });
    });

    it("should return an error for addresses that doesn't exist", async () => {
      const res = await api()
        .post("/addresses/alert")
        .send({ privatekey: "notfound" });

      expect(res).to.be.json;
      expect(res.body).to.deep.equal({ ok: false, error: "address_not_found" });
    });
  });

  // TODO: GET /addresses/rich

  describe("GET /addresses/:address", () => {
    it("should get an address", async () => {
      const res = await api().get("/addresses/k8juvewcui");
      expect(res).to.have.status(200);
      expect(res).to.be.json;
      expect(res.body).to.include({ ok: true });
      expect(res.body.address).to.be.an("object");
      expect(res.body.address).to.include.all.keys("address", "balance", "totalin", "totalout", "firstseen");
    });

    it("should not contain private parts", async () => {
      const res = await api().get("/addresses/kwsgj3x184");
      expect(res).to.have.status(200);
      expect(res).to.be.json;
      expect(res.body.address).to.be.an("object");
      expect(res.body.address).to.not.include.any.keys("id", "privatekey", "alert", "locked");
    });

    it("should return an error for addresses that doesn't exist", async () => {
      const res = await api().get("/addresses/knotfound0");
      expect(res).to.be.json;
      expect(res.body).to.deep.equal({ ok: false, error: "address_not_found" });
    });
  });
  
  // TODO: GET /addresses/:address/names
  // TODO: GET /addresses/:address/transactions
});
