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

import { ReqSearchQuery, SearchQueryMatch } from ".";
import { ErrorInvalidParameter, ErrorMissingParameter } from "../../../errors";

import {
  isValidKristAddress, stripNameSuffix, isValidName
} from "../../../utils";

export function parseQuery(query: string): SearchQueryMatch {
  const matchAddress = isValidKristAddress(query);

  const strippedName = stripNameSuffix(query);
  const matchName = !!strippedName && isValidName(strippedName, true);

  const cleanId = parseInt(query.replace(/[^\w]/g, ""));
  const hasId = !isNaN(cleanId);
  const matchBlock = hasId;
  const matchTransaction = hasId;

  return {
    originalQuery: query,

    matchAddress,
    matchName,
    matchBlock,
    matchTransaction,

    strippedName,
    hasID: hasId,
    ...(hasId ? { cleanID: cleanId } : {})
  };
}

export function validateQuery(req: ReqSearchQuery): string {
  const query = req.query.q;
  if (!query) throw new ErrorMissingParameter("q");
  if (typeof query !== "string") throw new ErrorInvalidParameter("q");

  const trimmedQuery = query.trim();
  if (trimmedQuery.length > 256) throw new ErrorInvalidParameter("q");

  return trimmedQuery;
}
