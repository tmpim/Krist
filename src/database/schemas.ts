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

import type { CreationOptional, InferAttributes, InferCreationAttributes } from "@sequelize/core";
import { DataTypes, Model } from "@sequelize/core";
import { Attribute, AutoIncrement, Default, Index, PrimaryKey, Table, Unique } from "@sequelize/core/decorators-legacy";
import type { AuthLogType } from "../krist/authLog.js";

import { NONCE_MAX_SIZE } from "../utils/vars.js";

// =============================================================================
// Address
// =============================================================================

@Table({ timestamps: false, tableName: "addresses" })
export class Address extends Model<InferAttributes<Address>, InferCreationAttributes<Address>> {
  @Attribute(DataTypes.INTEGER)
  @AutoIncrement
  @PrimaryKey
  declare id: CreationOptional<number>;

  @Attribute(DataTypes.STRING(10))
  @Unique
  declare address: string;

  @Attribute(DataTypes.INTEGER.UNSIGNED)
  declare balance: number;
  @Attribute(DataTypes.INTEGER.UNSIGNED)
  declare totalin: number;
  @Attribute(DataTypes.INTEGER.UNSIGNED)
  declare totalout: number;

  @Attribute(DataTypes.DATE)
  declare firstseen: Date;

  @Attribute(DataTypes.STRING(64))
  declare privatekey?: string | null;
  @Attribute(DataTypes.STRING(1024))
  declare alert?: string | null;
  @Attribute(DataTypes.BOOLEAN)
  @Default(false)
  declare locked: CreationOptional<boolean>;
}

// =============================================================================
// Block
// =============================================================================
@Table({ timestamps: false, tableName: "blocks" })
export class Block extends Model {
  @Attribute(DataTypes.INTEGER)
  @AutoIncrement
  @PrimaryKey
  declare id: number;

  @Index
  @Attribute(DataTypes.STRING(10))
  declare address: string;

  @Attribute(DataTypes.INTEGER.UNSIGNED)
  declare value: number;

  @Attribute(DataTypes.STRING(64))
  @Unique
  declare hash: string;
  @Attribute(DataTypes.STRING(NONCE_MAX_SIZE * 2))
  declare nonce: string;
  @Attribute(DataTypes.INTEGER.UNSIGNED)
  declare difficulty: number;

  @Attribute(DataTypes.DATE)
  declare time: Date;

  @Attribute(DataTypes.STRING(255))
  declare useragent?: string | null;
  @Attribute(DataTypes.STRING(255))
  declare library_agent?: string | null;
  @Attribute(DataTypes.STRING(255))
  declare origin?: string | null;
}

// =============================================================================
// Name
// =============================================================================
@Table({ timestamps: false, tableName: "names" })
export class Name extends Model<InferAttributes<Name>, InferCreationAttributes<Name>> {
  @Attribute(DataTypes.INTEGER)
  @AutoIncrement
  @PrimaryKey
  declare id: CreationOptional<number>;

  @Attribute(DataTypes.STRING(64))
  @Unique
  declare name: string;
  @Attribute(DataTypes.STRING(10))
  @Index
  declare owner: string;
  @Attribute(DataTypes.STRING(10))
  @Index
  declare original_owner?: string | null;

  @Attribute(DataTypes.DATE)
  declare registered: Date;
  @Attribute(DataTypes.DATE)
  declare updated: Date | null;
  @Attribute(DataTypes.DATE)
  declare transferred: Date | null;

  @Attribute(DataTypes.STRING(255))
  declare a?: string | null;

  @Index
  @Attribute(DataTypes.INTEGER.UNSIGNED)
  declare unpaid: number;
}

// =============================================================================
// Transaction
// =============================================================================
@Table({ timestamps: false, tableName: "transactions" })
export class Transaction extends Model<InferAttributes<Transaction>, InferCreationAttributes<Transaction>> {
  @Attribute(DataTypes.INTEGER)
  @AutoIncrement
  @PrimaryKey
  declare id: CreationOptional<number>;

  @Index
  @Attribute(DataTypes.STRING(10))
  declare from: string | null;
  @Index
  @Attribute(DataTypes.STRING(10))
  declare to: string | null;

  @Attribute(DataTypes.INTEGER.UNSIGNED)
  declare value: number;

  @Attribute(DataTypes.DATE)
  declare time: Date;

  @Index
  @Attribute(DataTypes.STRING(128))
  declare name?: string | null;

  // This index is used not to actually search the metadata, but to optimize searching for it when it is NOT NULL
  @Index
  @Attribute(DataTypes.STRING(512))
  declare op?: string | null;

  @Attribute(DataTypes.STRING(255))
  declare origin?: string | null;
  @Attribute(DataTypes.STRING(255))
  declare useragent?: string | null;
  @Attribute(DataTypes.STRING(255))
  declare library_agent?: string | null;

  @Index
  @Index({ name: "transactions_sent_metaname_sent_name" })
  @Attribute(DataTypes.STRING(32))
  declare sent_metaname?: string | null;
  @Index
  @Index({ name: "transactions_sent_metaname_sent_name" })
  @Attribute(DataTypes.STRING(64))
  declare sent_name?: string | null;
}

// =============================================================================
// Auth Log
// =============================================================================
@Table({ timestamps: false, tableName: "authlogs" })
export class AuthLog extends Model<InferAttributes<AuthLog>, InferCreationAttributes<AuthLog>> {
  @Attribute(DataTypes.INTEGER)
  @AutoIncrement
  @PrimaryKey
  declare id: CreationOptional<number>;

  @Index
  @Index({ name: "authlogs_address_ip" })
  @Attribute(DataTypes.STRING(10))
  declare address: string;

  @Index
  @Index({ name: "authlogs_address_ip" })
  @Attribute(DataTypes.STRING(47))
  declare ip: string | null;

  @Index
  @Attribute(DataTypes.DATE)
  declare time: Date;

  @Attribute(DataTypes.ENUM("auth", "mining"))
  declare type: AuthLogType;

  @Attribute(DataTypes.STRING(255))
  declare origin?: string;
  @Attribute(DataTypes.STRING(255))
  declare useragent?: string;
  @Attribute(DataTypes.STRING(255))
  declare library_agent?: string;
}

export const SCHEMAS = [Address, Block, Name, Transaction, AuthLog];
