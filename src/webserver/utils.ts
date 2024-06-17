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

import { Request, Response } from "express";
import { PaginatedResult } from "../database/index.js";

export type ReqQuery<T> = Request<any, any, any, T>;
export type PaginatedQuery<T = unknown> = ReqQuery<{
  limit?: string;
  offset?: string;
} & T>;

export function returnPaginatedResult<RowT, ExtraT>(
  res: Response,
  name: string,
  mapper?: (row: RowT) => any,
  data?: PaginatedResult<RowT>,
  extra?: ExtraT
): void {
  res.json({
    ok: true,
    count: data?.rows.length ?? 0,
    total: data?.count ?? 0,
    [name]: (mapper ? data?.rows.map(mapper) : data?.rows) ?? [],
    ...extra
  });
}
