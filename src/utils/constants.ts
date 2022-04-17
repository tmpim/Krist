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

// =============================================================================
// Environment
// =============================================================================
export const TEST = process.env.NODE_ENV === "test";
export const TEST_DEBUG = !!process.env.TEST_DEBUG;

// =============================================================================
// Database
// =============================================================================
export const MAIN_DB_NAME = process.env.DB_NAME as string | undefined || "krist";
export const MAIN_DB_USER = process.env.DB_USER as string | undefined || "krist";
export const MAIN_DB_PASS = process.env.DB_PASS as string;
export const MAIN_DB_HOST = process.env.DB_HOST as string | undefined || "127.0.0.1";

export const TEST_DB_NAME = process.env.TEST_DB_NAME as string | undefined || "test_krist";
export const TEST_DB_USER = process.env.TEST_DB_USER as string | undefined || "test_krist";
export const TEST_DB_PASS = process.env.TEST_DB_PASS as string;
export const TEST_DB_HOST = process.env.TEST_DB_HOST as string | undefined || "127.0.0.1";

export const DB_NAME = TEST ? TEST_DB_NAME : MAIN_DB_NAME;
export const DB_USER = TEST ? TEST_DB_USER : MAIN_DB_USER;
export const DB_PASS = TEST ? TEST_DB_PASS : MAIN_DB_PASS;
export const DB_HOST = TEST ? TEST_DB_HOST : MAIN_DB_HOST;
export const DB_PORT = parseInt(process.env.DB_PORT ?? "3306");

export const REDIS_HOST = process.env.REDIS_HOST as string | undefined || "127.0.0.1";
export const REDIS_PORT = parseInt(process.env.REDIS_PORT as string | undefined || "6379");
export const REDIS_PASS = process.env.REDIS_PASS as string | undefined;
export const REDIS_PREFIX = TEST
  ? (process.env.TEST_REDIS_PREFIX || "test_krist:")
  : (process.env.REDIS_PREFIX || "krist:");

// =============================================================================
// Webserver
// =============================================================================
export const WEB_LISTEN = parseInt(process.env.WEB_LISTEN as string | undefined || "8080");
export const PUBLIC_URL = process.env.PUBLIC_URL || "localhost:8080";
export const FORCE_INSECURE = process.env.FORCE_INSECURE === "true";

export const USE_PROMETHEUS = process.env.USE_PROMETHEUS === "true";
export const PROMETHEUS_PASSWORD = process.env.PROMETHEUS_PASSWORD as string | undefined;

export const WS_IPC_PATH = process.env.WS_IPC_PATH as string | undefined;

export const GITHUB_TOKEN = process.env.GITHUB_TOKEN as string | undefined;

export const CRITICAL_LOG_URL = process.env.CRITICAL_LOG_URL as string | undefined;

// =============================================================================
// Krist
// =============================================================================
export const WALLET_VERSION = 16;
export const NONCE_MAX_SIZE = 24;
export const NAME_COST = 500;
export const MIN_WORK = 1;
export const MAX_WORK = 100000;
export const WORK_FACTOR = 0.025;
export const SECONDS_PER_BLOCK = 300;

export const LAST_BLOCK = "2022-12-31";
