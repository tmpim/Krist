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

export function lut<T extends number | string>(data: T[]): Record<T, true> {
  const out: any = {};
  for (const v of data) out[v] = true;
  return out;
}

export function ulut<T extends number | string>(data?: T[]): Record<T, true> | undefined {
  if (!data || data.length === 0) return;
  return lut(data);
}

export function nlut<T extends number | string>(data: T[]): Record<T, 1> {
  const out: any = {};
  for (const v of data) out[v] = 1;
  return out;
}

export function unlut<T extends number | string>(data?: T[]): Record<T, 1> | undefined {
  if (!data || data.length === 0) return;
  return nlut(data);
}
