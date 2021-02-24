const { expect } = require("chai");

const { seed } = require("../seed");
const { api } = require("../api");
const { newConnection } = require("../ws");

describe("websocket connection", () => {
  before(seed);

  describe("POST /ws/start", () => {
    it("should return a guest token", async () => {
      const res = await api().post("/ws/start");
      expect(res).to.have.status(200);
      expect(res).to.be.json;
      expect(res.body).to.deep.include({ ok: true, expires: 30 });
      expect(res.body).to.have.any.key("url");
      expect(res.body.url).to.be.a("string");
      expect(res.body.url).to.match(/ws:\/\/localhost:8080\/[0-9a-f]{18}/);
    });

    it("should return an authed token", async () => {
      const res = await api().post("/ws/start").send({ privatekey: "a" });
      expect(res).to.have.status(200);
      expect(res).to.be.json;
      expect(res.body).to.deep.include({ ok: true, expires: 30 });
      expect(res.body).to.have.any.key("url");
      expect(res.body.url).to.be.a("string");
      expect(res.body.url).to.match(/ws:\/\/localhost:8080\/[0-9a-f]{18}/);
    });

    it("should return an error if auth fails", async () => {
      const res = await api().post("/ws/start").send({ privatekey: "c" });
      expect(res).to.be.json;
      expect(res.body).to.deep.equal({ ok: false, error: "auth_failed" });
      expect(res.body).to.not.have.any.key("url");
    });
  });

  describe("connection", () => {
    it("should connect to the server", async () => {
      const ws = await newConnection();
      expect(ws).to.exist;
      expect(ws.wsp).to.exist;
      expect(ws.wsp.isOpened).to.be.true;
    });

    it("should receive the hello message", async () => {
      let resolveHello, helloData;
      const helloPromise = new Promise(resolve => { resolveHello = resolve; });

      const ws = await newConnection(undefined, (_, wsp) => {
        wsp.onUnpackedMessage.addListener(data => {
          if (data.type === "hello") {
            helloData = data;
            resolveHello();
          }
        });
      });

      expect(ws).to.exist;
      expect(ws.wsp).to.exist;
      expect(ws.wsp.isOpened).to.be.true;

      await helloPromise; // wait for the 'hello' message

      expect(helloData).to.exist;
      expect(helloData.ok).to.be.true;

      expect(helloData.motd).to.equal("Welcome to Krist!");
      expect(helloData.set).to.be.ok; // backwards compat for the HTTP API
      expect(helloData.motd_set).to.be.ok;

      expect(helloData.public_url).to.equal("localhost:8080");
      expect(helloData.mining_enabled).to.be.true;
      expect(helloData.debug_mode).to.be.true;

      expect(helloData.work).to.equal(100000);
      expect(helloData.last_block).to.be.an("object");
      expect(helloData.last_block.height).to.equal(1);

      expect(helloData.package).to.be.an("object");
      expect(helloData.package).to.deep.include({ name: "krist", author: "Lemmmy", licence: "GPL-3.0" });
      expect(helloData.package.version).to.be.ok;
      expect(helloData.package.repository).to.be.ok;

      expect(helloData.constants).to.be.an("object");
      expect(helloData.constants).to.deep.include({
        nonce_max_size: 24, name_cost: 500, min_work: 100, max_work: 100000,
        work_factor: 0.025, seconds_per_block: 60
      });
      expect(helloData.constants.wallet_version).to.be.ok;

      expect(helloData.currency).to.be.an("object");
      expect(helloData.currency).to.deep.equal({
        address_prefix: "k", name_suffix: "kst",
        currency_name: "Krist", currency_symbol: "KST"
      });

      expect(helloData.notice).to.equal("Krist was originally created by 3d6 and Lemmmy. It is now owned and operated by tmpim, and licensed under GPL-3.0.");
    });
  });
});
