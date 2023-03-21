/*
 * Copyright 2016 - 2022 Drew Edwards, tmpim
 *
 * This file is part of Krist.
 *
 * Krist is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Krist is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Krist. If not, see <http://www.gnu.org/licenses/>.
 *
 * For more project information, see <https://github.com/tmpim/krist>.
 */

import { expect } from "chai";

import { seed } from "../seed";
import { api } from "../api";
import { newConnection } from "../ws";

describe("websocket connection", () => {
  before(seed);

  describe("POST /ws/start", () => {
    const wsRe = new RegExp("ws:\\/\\/"
      + (process.env.PUBLIC_URL || "localhost:8080") + "\\/[0-9a-f]{18}");

    it("should return a guest token", async () => {
      const res = await api().post("/ws/start");
      expect(res).to.have.status(200);
      expect(res).to.be.json;
      expect(res.body).to.deep.include({ ok: true, expires: 30 });
      expect(res.body.url).to.be.a("string");
      expect(res.body.url).to.match(wsRe);
    });

    it("should return an authed token", async () => {
      const res = await api().post("/ws/start").send({ privatekey: "a" });
      expect(res).to.have.status(200);
      expect(res).to.be.json;
      expect(res.body).to.deep.include({ ok: true, expires: 30 });
      expect(res.body.url).to.be.a("string");
      expect(res.body.url).to.match(wsRe);
    });

    it("should return an error if auth fails", async () => {
      const res = await api().post("/ws/start").send({ privatekey: "c" });
      expect(res).to.be.json;
      expect(res.body).to.deep.include({ ok: false, error: "auth_failed" });
      expect(res.body).to.not.have.key("url");
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
      let resolveHello: any, helloData: any;
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
      if (!helloData) throw new Error("a");
      expect(helloData.ok).to.be.true;

      expect(helloData.motd).to.equal("Welcome to Krist!");
      expect(helloData.set).to.be.ok; // backwards compat for the HTTP API
      expect(helloData.motd_set).to.be.ok;

      expect(helloData.public_url).to.equal(process.env.PUBLIC_URL || "localhost:8080");
      expect(helloData.mining_enabled).to.be.false;
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
        nonce_max_size: 24, name_cost: 500, min_work: 1, max_work: 100000,
        work_factor: 0.025, seconds_per_block: 300
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
