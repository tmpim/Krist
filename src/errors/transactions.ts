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

import { KristError } from "./KristError.js";

export class ErrorInsufficientFunds extends KristError {
  constructor() {
    super("Insufficient funds", "insufficient_funds", 403);
  }
}

export class ErrorTransactionNotFound extends KristError {
  constructor() {
    super("Transaction not found", "transaction_not_found", 404);
  }
}

export class ErrorTransactionsDisabled extends KristError {
  constructor() {
    super("Transactions disabled", "transactions_disabled", 423);
  }
}

export class ErrorTransactionConflict extends KristError<{
  parameter: string;
}> {
  constructor(
    public parameter: string,
    public message = `Transaction conflict for parameter ${parameter}`,
    public errorString = "transaction_conflict"
  ) {
    super(message, errorString, 409, { parameter });
  }
}
