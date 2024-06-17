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

import crypto from "crypto";
import { promisify } from "util";

const secureBytes = promisify(crypto.randomBytes);

export function sha256(...inputs: (Uint8Array | string)[]): string {
  const hash = crypto.createHash("sha256");
  for (const input of inputs) {
    hash.update(input instanceof Uint8Array ? input : input.toString());
  }
  return hash.digest("hex");
}

export function doubleSha256(input: string): string {
  return sha256(sha256(input));
}

export function hexToBase36(input: number): string {
  const byte = 48 + Math.floor(input / 7);
  return String.fromCharCode(byte + 39 > 122 ? 101 : byte > 57 ? byte + 39 : byte);
}

export function makeV2Address(key: string, addressPrefix = "k"): string {
  const chars = ["", "", "", "", "", "", "", "", ""];
  let chain = addressPrefix;
  let hash = doubleSha256(key);

  for (let i = 0; i <= 8; i++) {
    chars[i] = hash.substring(0, 2);
    hash = doubleSha256(hash);
  }

  for (let i = 0; i <= 8;) {
    const index = parseInt(hash.substring(2 * i, 2 + (2 * i)), 16) % 9;

    if (chars[index] === "") {
      hash = sha256(hash);
    } else {
      chain += hexToBase36(parseInt(chars[index], 16));
      chars[index] = "";
      i++;
    }
  }

  return chain;
}

export async function generateWebSocketToken(): Promise<string> {
  // NOTE: These used to be UUIDs, so we use 18 bytes here to maintain
  //       compatibility with anything that may expect exactly 36 characters.
  return (await secureBytes(18)).toString("hex");
}
