import type { MigrationFn } from "umzug";
import { DataTypes, Sequelize, sql } from "@sequelize/core";

const up: MigrationFn<Sequelize> = async ({ context: sq }) => {
  // Fix some issues with the original schema
  await sq.queryInterface.changeColumn("addresses", "address", {
    type: DataTypes.CHAR(10), // change from VARCHAR to CHAR
    allowNull: false
  });
  await sq.queryInterface.changeColumn("addresses", "balance", {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  });
  await sq.queryInterface.changeColumn("addresses", "totalin", {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  });
  await sq.queryInterface.changeColumn("addresses", "totalout", {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  });
  await sq.queryInterface.changeColumn("addresses", "firstseen", {
    type: DataTypes.DATE,
    allowNull: false
  });

  // There are 8 blocks in production with addresses that are shorter than 10 characters. Right-pad them with zeroes
  // to be the correct length.
  await sq.queryInterface.bulkUpdate("blocks", {
    address: sql`LPAD(address, 10, '0')`
  }, sql`LENGTH(address) < 10`);
  await sq.queryInterface.changeColumn("blocks", "address", {
    type: DataTypes.CHAR(10), // change from VARCHAR to CHAR.
    allowNull: false
  });

  await sq.queryInterface.changeColumn("names", "name", {
    type: DataTypes.STRING(64),
    allowNull: false
  });
  await sq.queryInterface.changeColumn("names", "owner", {
    type: DataTypes.CHAR(10),
    allowNull: false
  });
  await sq.queryInterface.changeColumn("names", "original_owner", {
    type: DataTypes.CHAR(10),
    allowNull: false
  });
  await sq.queryInterface.changeColumn("names", "registered", {
    type: DataTypes.DATE,
    allowNull: false
  });
  await sq.queryInterface.changeColumn("names", "unpaid", {
    type: DataTypes.STRING(255),
    allowNull: false
  });

  await sq.queryInterface.changeColumn("transactions", "value", {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  });
  await sq.queryInterface.changeColumn("transactions", "time", {
    type: DataTypes.DATE,
    allowNull: false
  });

  await sq.queryInterface.changeColumn("authlogs", "address", {
    type: DataTypes.CHAR(10),
    allowNull: false
  });
  await sq.queryInterface.changeColumn("authlogs", "time", {
    type: DataTypes.DATE,
    allowNull: false
  });
};

const down: MigrationFn<Sequelize> = async ({ context: sq }) => {
  await sq.queryInterface.changeColumn("addresses", "address", {
    type: DataTypes.STRING(10),
    allowNull: true
  });
  await sq.queryInterface.changeColumn("blocks", "address", {
    type: DataTypes.STRING(10),
    allowNull: false
  });
};

export default { up, down };
