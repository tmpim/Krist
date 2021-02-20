const { expect } = require("chai");

const { seed } = require("../seed");
const { newConnection } = require("../ws");

describe("websocket routes: addresses", () => {
  before(seed);
  
  describe("address", () => {
    it("should get an address", async () => {
      const ws = await newConnection();
      expect(ws).to.nested.include({ "wsp.isOpened": true });

      const data = await ws.sendAndWait({ type: "address", address: "k8juvewcui" });
      expect(data).to.deep.include({ ok: true });
      expect(data.address).to.be.an("object");
      expect(data.address).to.include.all.keys("address", "balance", "totalin", "totalout", "firstseen");
      expect(data.address).to.not.include.any.keys("id", "privatekey", "alert", "locked");
      expect(data.address).to.deep.include({ address: "k8juvewcui", balance: 10 });
    });
  });
});
