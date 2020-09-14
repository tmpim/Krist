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

errors.ErrorInvalidParameter = function(parameter, message) {
  errors.KristError.call(this);
  this.message = message;
  this.errorString = "invalid_parameter";
  this.statusCode = 400;
  this.parameter = parameter;

  this.info = {
    parameter: parameter
  };
};

util.inherits(errors.ErrorInvalidParameter, errors.KristError);

errors.ErrorMissingParameter = function(parameter, message) {
  errors.KristError.call(this);
  this.message = message;
  this.errorString = "missing_parameter";
  this.statusCode = 400;
  this.parameter = parameter;

  this.info = {
    parameter: parameter
  };
};

util.inherits(errors.ErrorMissingParameter, errors.KristError);
