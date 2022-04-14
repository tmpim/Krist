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

export const ADDRESS_RE = /^(?:k[a-z0-9]{9}|[a-f0-9]{10})$/;
export const ADDRESS_RE_V2 = /^k[a-z0-9]{9}$/;
export const ADDRESS_LIST_RE = /^(?:k[a-z0-9]{9}|[a-f0-9]{10})(?:,(?:k[a-z0-9]{9}|[a-f0-9]{10}))*$/;
export const NAME_RE = /^[a-z0-9]{1,64}$/;
export const NAME_FETCH_RE = /^(?:xn--)?[a-z0-9]{1,64}$/i;
export const NAME_A_RECORD_RE = /^[^\s.?#].[^\s]*$/i;
export const NAME_META_RE = /^(?:([a-z0-9-_]{1,32})@)?([a-z0-9]{1,64})\.kst$/i;
export const METANAME_METADATA_RE = /^(?:([a-z0-9-_]{1,32})@)?([a-z0-9]{1,64})\.kst/i;

export function isValidKristAddress(address: string, v2Only?: boolean): boolean {
  return v2Only ? ADDRESS_RE_V2.test(address) : ADDRESS_RE.test(address);
}

export function isValidKristAddressList(addressList: string): boolean {
  return ADDRESS_LIST_RE.test(addressList);
}

export function isValidName(name: string, fetching?: boolean): boolean {
  const re = fetching ? NAME_FETCH_RE : NAME_RE;
  name = name.toLowerCase();
  return re.test(name) && name.length > 0 && name.length < 65;
}

export function isValidARecord(a: string): boolean {
  return !!a && a.length > 0 && a.length <= 255 && NAME_A_RECORD_RE.test(a);
}

export function stripNameSuffix(name: string): string {
  if (!name) return "";

  // TODO: Support custom name suffixes (see KristWeb v2 code for safe RegExp
  //       compilation and memoization)
  return name.replace(/\.kst$/i, "");
}
