const { expect } = require("chai");

const { seed } = require("../seed");
const { api } = require("../api");

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

    expect(res.body.public_url).to.equal("localhost:8080");
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
      nonce_max_size: 24, name_cost: 500, min_work: 100, max_work: 100000,
      work_factor: 0.025, seconds_per_block: 60
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
