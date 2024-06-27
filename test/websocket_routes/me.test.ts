/*
 * Copyright 2016 - 2024 Drew Edwards, tmpim
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
import { seed } from "../seed.js";
import { newConnection } from "../ws.js";

describe("websocket routes: me", function() {
  before(seed);
  this.retries(4);

  describe("me", function() {
    it("should work for guests", async function() {
      const ws = await newConnection();
      expect(ws).to.nested.include({ "wsp.isOpened": true });

      const data = await ws.sendAndWait({ type: "me" });
      expect(data).to.deep.include({ ok: true, isGuest: true });

      ws.close();
    });

    it("should work for authed users", async function() {
      const ws = await newConnection("a");
      expect(ws).to.nested.include({ "wsp.isOpened": true });

      const data = await ws.sendAndWait({ type: "me" });
      expect(data).to.deep.include({ ok: true, isGuest: false });
      expect(data.address).to.be.an("object");
      expect(data.address).to.include.all.keys("address", "balance", "totalin", "totalout", "firstseen");
      expect(data.address).to.not.include.any.keys("id", "privatekey", "alert", "locked");
      expect(data.address).to.deep.include({ address: "k8juvewcui", balance: 10 });

      ws.close();
    });
  });
});
