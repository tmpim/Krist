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
      expect(helloData.work).to.equal(100000);
      expect(helloData.last_block).to.be.an("object");
      expect(helloData.last_block.height).to.equal(1);
    });
  });
});
