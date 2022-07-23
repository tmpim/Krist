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

import { Table, Model, Column, Index } from "sequelize-typescript";
import { DataTypes } from "sequelize";

import { NONCE_MAX_SIZE } from "../utils/constants";
import { AuthLogType } from "../krist/authLog";

// =============================================================================
// Address
// =============================================================================
@Table({ timestamps: false, tableName: "addresses" })
export class Address extends Model {
  @Column({ autoIncrement: true, primaryKey: true })
    id!: number;

  @Column({ type: DataTypes.STRING(10), unique: true })
    address!: string;

  @Column(DataTypes.INTEGER.UNSIGNED)
    balance!: number;
  @Column(DataTypes.INTEGER.UNSIGNED)
    totalin!: number;
  @Column(DataTypes.INTEGER.UNSIGNED)
    totalout!: number;

  @Column firstseen!: Date;

  @Column(DataTypes.STRING(64))
    privatekey?: string | null;
  @Column(DataTypes.STRING(1024))
    alert?: string | null;
  @Column locked!: boolean;
}

// =============================================================================
// Block
// =============================================================================
@Table({ timestamps: false, tableName: "blocks" })
export class Block extends Model {
  @Column({ autoIncrement: true, primaryKey: true })
    id!: number;

  @Index
  @Column({ type: DataTypes.STRING(10) })
    address!: string;

  @Column(DataTypes.INTEGER.UNSIGNED)
    value!: number;

  @Column({ type: DataTypes.STRING(64), unique: true })
    hash!: string;
  @Column({ type: DataTypes.STRING(NONCE_MAX_SIZE * 2) })
    nonce!: string;
  @Column(DataTypes.INTEGER.UNSIGNED)
    difficulty!: number;

  @Column time!: Date;

  @Column({ type: DataTypes.STRING(255) })
    useragent?: string | null;
  @Column({ type: DataTypes.STRING(255) })
    library_agent?: string | null;
  @Column({ type: DataTypes.STRING(255) })
    origin?: string | null;
}

// =============================================================================
// Name
// =============================================================================
@Table({ timestamps: false, tableName: "names" })
export class Name extends Model {
  @Column({ autoIncrement: true, primaryKey: true })
    id!: number;

  @Column({ type: DataTypes.STRING(64), unique: true })
    name!: string;

  @Index
  @Column(DataTypes.STRING(10))
    owner!: string;

  @Index
  @Column(DataTypes.STRING(10))
    original_owner?: string | null;

  @Column registered!: Date;
  @Column updated!: Date;
  @Column transferred!: Date;

  @Column({ type: DataTypes.STRING(64) })
    a?: string;

  @Index
  @Column(DataTypes.INTEGER.UNSIGNED)
    unpaid!: number;
}

// =============================================================================
// Transaction
// =============================================================================
@Table({ timestamps: false, tableName: "transactions" })
export class Transaction extends Model {
  @Column({ autoIncrement: true, primaryKey: true })
    id!: number;

  @Index
  @Column({ type: DataTypes.STRING(10) })
    from!: string;
  @Index
  @Column({ type: DataTypes.STRING(10) })
    to!: string;

  @Column(DataTypes.INTEGER.UNSIGNED)
    value!: number;

  @Column time!: Date;

  @Index
  @Column({ type: DataTypes.STRING(128) })
    name?: string;

  // This index is used not to actually search the metadata, but to optimize
  // searching for it when it is NOT NULL
  @Index
  @Column({ type: DataTypes.STRING(512) })
    op?: string | null;

  @Column({ type: DataTypes.STRING(255) })
    origin?: string | null;
  @Column({ type: DataTypes.STRING(255) })
    useragent?: string | null;
  @Column({ type: DataTypes.STRING(255) })
    library_agent?: string | null;

  @Index
  @Index("transactions_sent_metaname_sent_name")
  @Column({ type: DataTypes.STRING(32) })
    sent_metaname?: string | null;
  @Index
  @Index("transactions_sent_metaname_sent_name")
  @Column({ type: DataTypes.STRING(64) })
    sent_name?: string | null;
}

// =============================================================================
// Auth Log
// =============================================================================
@Table({ timestamps: false, tableName: "authlogs" })
export class AuthLog extends Model {
  @Column({ autoIncrement: true, primaryKey: true })
    id!: number;

  @Index
  @Index("authlogs_address_ip")
  @Column({ type: DataTypes.STRING(10) })
    address!: string;

  @Index
  @Index("authlogs_address_ip")
  @Column({ type: DataTypes.STRING(47) })
    ip!: string;

  @Index
  @Column time!: Date;

  @Column({ type: DataTypes.ENUM("auth", "mining") })
    type!: AuthLogType;

  @Column({ type: DataTypes.STRING(255) })
    origin?: string | null;
  @Column({ type: DataTypes.STRING(255) })
    useragent?: string | null;
  @Column({ type: DataTypes.STRING(255) })
    library_agent?: string | null;
}

export const SCHEMAS = [Address, Block, Name, Transaction, AuthLog];
