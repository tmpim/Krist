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

import chalkT from "chalk-template";
import { Request } from "express";
import promClient from "prom-client";
import { Address } from "../../database/index.js";
import { criticalLog } from "../../utils/criticalLog.js";
import { getLogDetails, makeV2Address, sha256 } from "../../utils/index.js";
import { logAuth } from "../authLog.js";
import { getAddress } from "./index.js";

const promAddressesVerifiedCounter = new promClient.Counter({
  name: "krist_addresses_verified_total",
  help: "Total number of addresses verified since the Krist server started.",
  labelNames: ["type"]
});

promAddressesVerifiedCounter.inc({ type: "attempt" }, 0);
promAddressesVerifiedCounter.inc({ type: "failed" }, 0);
promAddressesVerifiedCounter.inc({ type: "authed" }, 0);

export interface VerifyResponse {
  authed: boolean;
  address: Address;
}

export async function verifyAddress(
  req: Request,
  privatekey: string
): Promise<VerifyResponse> {
  const { path, logDetails } = getLogDetails(req);

  const kristAddress = makeV2Address(privatekey);

  console.log(chalkT`{cyan [Auth]} ({bold ${path}}) Auth attempt on address {bold ${kristAddress}} ${logDetails}`);
  promAddressesVerifiedCounter.inc({ type: "attempt" });

  const hash = sha256(kristAddress + privatekey);
  const address = await getAddress(kristAddress);
  if (!address) { // Unseen address, create it
    const newAddress = await Address.create({
      address: kristAddress,
      firstseen: new Date(),
      balance: 0, totalin: 0, totalout: 0,
      privatekey: hash
    });

    logAuth(req, kristAddress, "auth").catch(console.error);
    promAddressesVerifiedCounter.inc({ type: "authed" });
    return { authed: true, address: newAddress };
  }

  if (address.privatekey) { // Address exists, auth if the privatekey is equal
    const authed = !address.locked && address.privatekey === hash;

    if (authed) {
      logAuth(req, kristAddress, "auth").catch(console.error);
    } else {
      const reason = address.locked
        ? `(locked, alert: ${address.alert ?? "none"})`
        : "(incorrect privatekey hash)";
      console.log(chalkT`{red [Auth]} ({bold ${path}}) Auth failed on address `
        + chalkT`{bold ${kristAddress}} for reason {bold ${reason}} `
        + chalkT`(failed match: {bold ${privatekey}}) `
        + chalkT`${logDetails}`);
      criticalLog(`authFailed-${kristAddress}`, req, `Auth failed on address **${kristAddress}**. Reason: ${reason}`,
        false);
    }

    promAddressesVerifiedCounter.inc({ type: authed ? "authed" : "failed" });
    return { authed, address };
  } else { // Address doesn't yet have a privatekey, claim it as the first
    const updatedAddress = await address.update({ privatekey: hash });

    logAuth(req, kristAddress, "auth").catch(console.error);
    promAddressesVerifiedCounter.inc({ type: "authed" });
    return { authed: true, address: updatedAddress };
  }
}
