import { DataTypes, IndexDescription, Sequelize } from "@sequelize/core";
import type { MigrationFn } from "umzug";
import { NONCE_MAX_SIZE } from "../../utils/vars.js";

const showIndexOptional = (sq: Sequelize, tableName: string): Promise<IndexDescription[] | null> =>
  sq.queryInterface.showIndex(tableName).catch(() => null);

const hasIndex = (indexes: IndexDescription[] | null, name: string): boolean =>
  indexes?.some((index) => index.name === name) ?? false;

const up: MigrationFn<Sequelize> = async ({ context: sq }) => {
  // Original schema as of 2024-06-27, just before requestId was added
  // In case there's already data, describe the existing tables to check we don't need to add any indexes
  const addresses    = await showIndexOptional(sq, "addresses");
  const blocks       = await showIndexOptional(sq, "blocks");
  const names        = await showIndexOptional(sq, "names");
  const transactions = await showIndexOptional(sq, "transactions");
  const authlogs     = await showIndexOptional(sq, "authlogs");

  // Addresses table
  await sq.queryInterface.createTable("addresses", {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true
    },
    address: {
      type: DataTypes.STRING(10),
      allowNull: true, // set to false later
    },
    balance: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false
    },
    totalin: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false
    },
    totalout: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false
    },
    firstseen: {
      type: DataTypes.DATE,
      allowNull: false
    },
    privatekey: {
      type: DataTypes.STRING(64),
      allowNull: true
    },
    alert: {
      type: DataTypes.STRING(1024),
      allowNull: true
    },
    locked: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    }
  }, {
    charset: "utf8mb4",
    collate: "utf8mb4_unicode_ci",
  });

  // Add address indexes
  if (!hasIndex(addresses, "addresses_address_unique")) {
    await sq.queryInterface.addIndex("addresses", ["address"], { unique: true });
  }

  // Blocks table
  await sq.queryInterface.createTable("blocks", {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true
    },
    address: {
      type: DataTypes.STRING(10),
      allowNull: true
    },
    value: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false
    },
    hash: {
      type: DataTypes.STRING(64),
      allowNull: false
    },
    nonce: {
      type: DataTypes.STRING(NONCE_MAX_SIZE * 2),
      allowNull: true // shouldn't be, but there is a large segment of blocks that were reconstructed from missing data
    },
    difficulty: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false
    },
    time: {
      type: DataTypes.DATE,
      allowNull: false
    },
    useragent: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    library_agent: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    origin: {
      type: DataTypes.STRING(255),
      allowNull: true
    }
  }, {
    charset: "utf8mb4",
    collate: "utf8mb4_unicode_ci",
  });

  // Add block indexes
  if (!hasIndex(blocks, "blocks_hash_unique")) await sq.queryInterface.addIndex("blocks", ["hash"], { unique: true });
  if (!hasIndex(blocks, "blocks_address"))     await sq.queryInterface.addIndex("blocks", ["address"]);

  // Names table
  await sq.queryInterface.createTable("names", {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(64),
      allowNull: false
    },
    owner: {
      type: DataTypes.STRING(10),
      allowNull: false
    },
    original_owner: {
      type: DataTypes.STRING(10),
      allowNull: true
    },
    registered: {
      type: DataTypes.DATE,
      allowNull: false
    },
    updated: {
      type: DataTypes.DATE,
      allowNull: true
    },
    transferred: {
      type: DataTypes.DATE,
      allowNull: true
    },
    a: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    unpaid: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false
    }
  }, {
    charset: "utf8mb4",
    collate: "utf8mb4_unicode_ci",
  });

  // Add name indexes
  if (!hasIndex(names, "names_name_unique"))    await sq.queryInterface.addIndex("names", ["name"], { unique: true });
  if (!hasIndex(names, "names_owner"))          await sq.queryInterface.addIndex("names", ["owner"]);
  if (!hasIndex(names, "names_original_owner")) await sq.queryInterface.addIndex("names", ["original_owner"]);
  if (!hasIndex(names, "names_unpaid"))         await sq.queryInterface.addIndex("names", ["unpaid"]);

  // Transactions table
  await sq.queryInterface.createTable("transactions", {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true
    },
    from: {
      type: DataTypes.STRING(10),
      allowNull: true
    },
    to: {
      type: DataTypes.STRING(10),
      allowNull: true
    },
    value: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false
    },
    time: {
      type: DataTypes.DATE,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING(128),
      allowNull: true
    },
    op: {
      type: DataTypes.STRING(512),
      allowNull: true
    },
    origin: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    useragent: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    library_agent: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    sent_metaname: {
      type: DataTypes.STRING(32),
      allowNull: true
    },
    sent_name: {
      type: DataTypes.STRING(32),
      allowNull: true
    },
  }, {
    charset: "utf8mb4",
    collate: "utf8mb4_unicode_ci",
  });

  // Add transaction indexes
  if (!hasIndex(transactions, "transactions_from")) await sq.queryInterface.addIndex("transactions", ["from"]);
  if (!hasIndex(transactions, "transactions_to"))   await sq.queryInterface.addIndex("transactions", ["to"]);
  if (!hasIndex(transactions, "transactions_name")) await sq.queryInterface.addIndex("transactions", ["time"]);
  if (!hasIndex(transactions, "transactions_op"))   await sq.queryInterface.addIndex("transactions", ["name"]);
  if (!hasIndex(transactions, "transactions_name")) await sq.queryInterface.addIndex("transactions", ["op"]);
  if (!hasIndex(transactions, "transactions_sent_metaname")) {
    await sq.queryInterface.addIndex("transactions", ["sent_metaname"]);
  }
  if (!hasIndex(transactions, "transactions_sent_name")) {
    await sq.queryInterface.addIndex("transactions", ["sent_name"]);
  }
  if (!hasIndex(transactions, "transactions_sent_metaname_sent_name")) {
    await sq.queryInterface.addIndex("transactions", ["sent_metaname", "sent_name"],
      { name: "transactions_sent_metaname_sent_name" });
  }

  // Authlogs table
  await sq.queryInterface.createTable("authlogs", {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true
    },
    address: {
      type: DataTypes.STRING(10),
      allowNull: false
    },
    ip: {
      type: DataTypes.STRING(47),
      allowNull: true
    },
    time: {
      type: DataTypes.DATE,
      allowNull: false
    },
    type: {
      type: DataTypes.ENUM("auth", "mining"),
      allowNull: false
    },
    origin: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    useragent: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    library_agent: {
      type: DataTypes.STRING(255),
      allowNull: true
    }
  }, {
    charset: "utf8mb4",
    collate: "utf8mb4_unicode_ci",
  });

  // Add authlog indexes
  if (!hasIndex(authlogs, "authlogs_address")) await sq.queryInterface.addIndex("authlogs", ["address"]);
  if (!hasIndex(authlogs, "authlogs_ip"))      await sq.queryInterface.addIndex("authlogs", ["ip"]);
  if (!hasIndex(authlogs, "authlogs_time"))    await sq.queryInterface.addIndex("authlogs", ["time"]);
  if (!hasIndex(authlogs, "authlogs_address_ip")) {
    await sq.queryInterface.addIndex("authlogs", ["address", "ip"], { name: "authlogs_address_ip" });
  }
};

const down: MigrationFn<Sequelize> = async ({ context: sq }) => {
  console.log("Refusing to down init");
  // await sq.queryInterface.dropTable("addresses");
  // await sq.queryInterface.dropTable("blocks");
  // await sq.queryInterface.dropTable("names");
  // await sq.queryInterface.dropTable("transactions");
  // await sq.queryInterface.dropTable("authlogs");
};

export default { up, down };
