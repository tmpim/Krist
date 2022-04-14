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

import chalk from "chalk";

import { KristError } from "./KristError";

export interface ErrorResponse {
  ok: false;
  error: string;
  message?: string;
}

export function errorToJson(err: unknown): ErrorResponse {
  if (err instanceof KristError) {
    return {
      ok: false,
      error: err.errorString,
      message: err.message,
      ...(err.info || {})
    };
  } else if (err instanceof Error
    && err.name === "SequelizeUniqueConstraintError") {
    console.error(chalk`{red [Error]} Uncaught validation error.`);
    console.error(err.stack);
    console.error((err as any).errors);

    return {
      ok: false,
      error: "server_error"
    };
  } else {
    console.error(chalk`{red [Error]} Uncaught error:`, err);
    if (err instanceof Error) console.error(err.stack);

    return {
      ok: false,
      error: "server_error"
    };
  }
}
