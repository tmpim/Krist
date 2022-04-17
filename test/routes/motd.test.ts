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

describe("v2 routes: motd", () => {
  before(seed);

  it("should return the motd", async () => {
    const res = await api().get("/motd");
    expect(res).to.have.status(200);
    expect(res).to.be.json;

    expect(res.body.ok).to.be.true;

    expect(res.body.motd).to.equal("Welcome to Krist!");
    expect(res.body.set).to.be.ok;
    expect(res.body.motd_set).to.be.ok;

    expect(res.body.public_url).to.equal(process.env.PUBLIC_URL || "localhost:8080");
    expect(res.body.mining_enabled).to.be.true;
    expect(res.body.debug_mode).to.be.true;

    expect(res.body.work).to.equal(100000);
    expect(res.body.last_block).to.be.an("object");
    expect(res.body.last_block.height).to.equal(1);

    expect(res.body.package).to.be.an("object");
    expect(res.body.package).to.deep.include({ name: "krist", author: "Lemmmy", licence: "GPL-3.0" });
    expect(res.body.package.version).to.be.ok;
    expect(res.body.package.repository).to.be.ok;

    expect(res.body.constants).to.be.an("object");
    expect(res.body.constants).to.deep.include({
      nonce_max_size: 24, name_cost: 500, min_work: 1, max_work: 100000,
      work_factor: 0.025, seconds_per_block: 300
    });
    expect(res.body.constants.wallet_version).to.be.ok;

    expect(res.body.currency).to.be.an("object");
    expect(res.body.currency).to.deep.equal({
      address_prefix: "k", name_suffix: "kst",
      currency_name: "Krist", currency_symbol: "KST"
    });

    expect(res.body.notice).to.equal("Krist was originally created by 3d6 and Lemmmy. It is now owned and operated by tmpim, and licensed under GPL-3.0.");
  });
});
