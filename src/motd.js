const package = require("../package.json");
const krist = require("./krist");
const blocks = require("./blocks");
const constants = require("./constants");

async function getDetailedMOTD() {
  const { motd, motd_set, debug_mode } = await krist.getMOTD();
  const lastBlock = await blocks.getLastBlock();

  return {
    server_time: new Date(),

    motd,
    set: motd_set, // support for backwards compatibility
    motd_set,

    public_url: process.env.PUBLIC_URL || "localhost:8080",
    mining_enabled: await krist.isMiningEnabled(),
    debug_mode,

    work: await krist.getWork(),
    last_block: lastBlock ? blocks.blockToJSON(lastBlock) : null,

    package: {
      name: package.name,
      version: package.version,
      author: package.author,
      licence: package.license,
      repository: package.repository.url
    },

    constants: {
      wallet_version: constants.walletVersion,
      nonce_max_size: constants.nonceMaxSize,
      name_cost: constants.nameCost,
      min_work: constants.minWork,
      max_work: constants.maxWork,
      work_factor: constants.workFactor,
      seconds_per_block: constants.secondsPerBlock
    },

    currency: {
      address_prefix: "k",
      name_suffix: "kst",

      currency_name: "Krist",
      currency_symbol: "KST"
    },

    // NOTE: It is against the license to modify this string on a fork node
    notice: "Krist was originally created by 3d6 and Lemmmy. It is now owned"
          + " and operated by tmpim, and licensed under GPL-3.0."
  };
}

module.exports = { getDetailedMOTD };
