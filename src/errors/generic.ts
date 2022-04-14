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

import { KristError } from "./KristError";

export class ErrorInvalidParameter extends KristError<{
  parameter: string;
  message?: string;
}> {
  constructor(
    public parameter: string,
    public message = `Invalid parameter ${parameter}`,
    public errorString = "invalid_parameter"
  ) {
    super(message, errorString, 400, { parameter });
  }
}

export class ErrorMissingParameter extends ErrorInvalidParameter {
  constructor(
    public parameter: string,
    public message = `Missing parameter ${parameter}`,
    public errorString = "missing_parameter"
  ) {
    super(parameter, message, errorString);
  }
}
