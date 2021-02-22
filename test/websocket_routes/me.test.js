const { expect } = require("chai");

const { seed } = require("../seed");
const { newConnection } = require("../ws");

describe("websocket routes: me", function() {
  before(seed);
  this.retries(4);
  
  describe("me", () => {
    it("should work for guests", async () => {
      const ws = await newConnection();
      expect(ws).to.nested.include({ "wsp.isOpened": true });

      const data = await ws.sendAndWait({ type: "me" });
      expect(data).to.deep.include({ ok: true, isGuest: true });
    });

    it("should work for authed users", async () => {
      const ws = await newConnection("a");
      expect(ws).to.nested.include({ "wsp.isOpened": true });

      const data = await ws.sendAndWait({ type: "me" });
      expect(data).to.deep.include({ ok: true, isGuest: false });
      expect(data.address).to.be.an("object");
      expect(data.address).to.include.all.keys("address", "balance", "totalin", "totalout", "firstseen");
      expect(data.address).to.not.include.any.keys("id", "privatekey", "alert", "locked");
      expect(data.address).to.deep.include({ address: "k8juvewcui", balance: 10 });
    });
  });
});
