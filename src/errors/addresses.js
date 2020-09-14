/**
 * Created by Drew Lemmy, 2016
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
 * For more project information, see <https://github.com/Lemmmy/Krist>.
 */

const util   = require("util");
const errors = require("./errors.js");

errors.ErrorAddressNotFound = function(message) {
  errors.KristError.call(this);
  this.message = message;
  this.statusCode = 404;
  this.errorString = "address_not_found";
};

util.inherits(errors.ErrorAddressNotFound, errors.KristError);

errors.ErrorAuthFailed = function(message) {
  errors.KristError.call(this);
  this.message = message;
  this.statusCode = 401;
  this.errorString = "auth_failed";
};

util.inherits(errors.ErrorAuthFailed, errors.KristError);
