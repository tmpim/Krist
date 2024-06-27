import { DataTypes, Sequelize } from "@sequelize/core";
import type { MigrationFn } from "umzug";

const up: MigrationFn<Sequelize> = async ({ context: sq }) => {
  // Add request_id to transactions
  await sq.queryInterface.addColumn("transactions", "request_id", {
    type: DataTypes.UUID,
    allowNull: true
  });
  await sq.queryInterface.addIndex("transactions", ["request_id"], { unique: true });
};

const down: MigrationFn<Sequelize> = async ({ context: sq }) => {
  await sq.queryInterface.removeColumn("transactions", "request_id");
};

export default { up, down };
