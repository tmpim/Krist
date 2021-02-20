/**
 * Created by Drew Lemmy, 2016-2021
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

const addresses = require("./../addresses.js");
const krist     = require("./../krist.js");
const errors    = require("./../errors/errors.js");

function AddressesController() {}

AddressesController.getAddresses = async function(limit, offset) {
  if ((limit && isNaN(limit)) || (limit && limit <= 0))
    throw new errors.ErrorInvalidParameter("limit");

  if ((offset && isNaN(offset)) || (offset && offset < 0))
    throw new errors.ErrorInvalidParameter("offset");

  return addresses.getAddresses(limit, offset);
};

AddressesController.getRich = async function(limit, offset) {
  if ((limit && isNaN(limit)) || (limit && limit <= 0))
    throw new errors.ErrorInvalidParameter("limit");

  if ((offset && isNaN(offset)) || (offset && offset < 0))
    throw new errors.ErrorInvalidParameter("offset");

  return addresses.getRich(limit, offset);
};

AddressesController.getAddress = async function(address) {
    if (!krist.isValidKristAddress(address))
      throw new errors.ErrorInvalidParameter("address");

    const result = addresses.getAddress(address);
    if (!result)
      throw new errors.ErrorAddressNotFound();

    return result;
};

AddressesController.getAlert = async function(privatekey) {
  const address = krist.makeV2Address(privatekey);

  const result = await addresses.getAddress(address);
  if (!result)
   throw new errors.ErrorAddressNotFound();

  return result.alert;
};

AddressesController.addressToJSON = function(address) {
  return addresses.addressToJSON(address);
};

module.exports = AddressesController;
