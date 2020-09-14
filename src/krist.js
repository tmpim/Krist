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

function Krist() {}

module.exports = Krist;

const utils      = require("./utils.js");
const config     = require("./../config.js");
const schemas    = require("./schemas.js");
const websockets = require("./websockets.js");
const fs         = require("fs");
const fsp        = fs.promises;
const chalk      = require("chalk");

var addressRegex = /^(?:k[a-z0-9]{9}|[a-f0-9]{10})$/;
var addressListRegex = /^(?:k[a-z0-9]{9}|[a-f0-9]{10})(?:,(?:k[a-z0-9]{9}|[a-f0-9]{10}))*$/;
var nameRegex = /^[a-z0-9]{1,64}$/i;
var aRecordRegex = /^[^\s\.\?\#].[^\s]*$/i;

Krist.nameMetaRegex = /^(?:([a-z0-9-_]{1,32})@)?([a-z0-9]{1,64})\.kst$/i;

Krist.work = 100000;
Krist.freeNonceSubmission = false;

Krist.workOverTime = [];

Krist.init = function() {
  console.log(chalk`{bold [Krist]} Loading...`);

  var requiredConfigOptions = [
    "walletVersion",
    "nameCost",
    "workFactor"
  ];

  requiredConfigOptions.forEach(function(option) {
    if (!config[option]) {
      console.error(chalk`{red [Config]} Missing config option: ${option}`);

      process.exit(1);
    }
  });

  // Check for and make the data dir

  /// WOW dont use deprecated functions lemmmmmym!
  if (!fs.existsSync("data")) {
    fs.mkdirSync("data", 0o775);
  }

  // Check for and make the work file
  if (fs.existsSync("data/work")) {
    fs.access("data/work", fs.W_OK, function(err) {
      if (err) {
        console.log(chalk`{red [Krist]} Cannot access data/work file. Please check the running user/group has write perms.`);
        console.log(chalk`{red [Krist]} ${err}`);
        console.log(chalk`{red [Krist]} Aborting.`);

        process.exit(1);
      }
    });

    fs.readFile("data/work", function(err, contents) {
      if (err) {
        console.log(chalk`{red [Krist]} Critical error reading work file.`);
        console.log(chalk`{red [Krist]} ${err}`);

        return;
      }

      Krist.work = parseInt(contents);

      console.log(chalk`{bold [Krist]} Current work: {green ${Krist.work}}`);
    });
  } else {
    // Write the work file
    this.setWork(Krist.work);
  }

  // Watch for MOTD changes and broadcast them to the websockets
  fs.watchFile("motd.txt", async function() {
    const { motd } = await Krist.getMOTD();

    websockets.broadcastEvent({
      type: "event",
      event: "motd",
      new_motd: motd
    }, ws => {
      return new Promise((resolve, reject) => {
        if (ws.subscriptionLevel.indexOf("motd") >= 0) {
          return resolve();
        }
  
        reject();
      });
    });
  });

  setInterval(function() {
    Krist.workOverTime.push(Krist.getWork());

    if (Krist.workOverTime.length > 1440) {
      Krist.workOverTime.shift();
    }
  }, 60 * 1000);
};

Krist.getWork = function() {
  return Krist.work;
};

Krist.getWorkOverTime = function() {
  return Krist.workOverTime;
};

Krist.setWork = async function(work) {
  Krist.work = work;
  return fsp.writeFile("data/work", work.toString());
};

Krist.getWalletVersion = function() {
  return typeof config.walletVersion === "number" ? config.walletVersion : 13;
};

Krist.getMoneySupply = function() {
  return schemas.address.sum("balance");
};

Krist.getMinWork = function() {
  return config.minWork || 500;
};

Krist.getMaxWork = function() {
  return config.maxWork || 100000;
};

Krist.getWorkFactor = function() {
  return config.workFactor || 0.1;
};

Krist.getSecondsPerBlock = function() {
  return config.secondsPerBlock || 60;
};

Krist.makeV2Address = function(key) {
  var chars = ["", "", "", "", "", "", "", "", ""];
  var prefix = "k";
  var hash = utils.sha256(utils.sha256(key));

  for (var i = 0; i <= 8; i++) {
    chars[i] = hash.substring(0, 2);
    hash = utils.sha256(utils.sha256(hash));
  }

  for (i = 0; i <= 8;) {
    var index = parseInt(hash.substring(2 * i, 2 + (2 * i)), 16) % 9;

    if (chars[index] === "") {
      hash = utils.sha256(hash);
    } else {
      prefix += utils.hexToBase36(parseInt(chars[index], 16));
      chars[index] = "";
      i++;
    }
  }

  return prefix;
};

Krist.isValidKristAddress = function(address) {
  return addressRegex.test(address);
};

Krist.isValidKristAddressList = function(addressList) {
  return addressListRegex.test(addressList);
};

Krist.isValidName = function(name) {
  return nameRegex.test(name) && name.length > 0 && name.length < 65;
};

Krist.isValidARecord = function(ar) {
  return aRecordRegex.test(ar);
};

Krist.getMOTD = async function() {
  try {
    const motd = (await fsp.readFile("motd.txt")).toString();
    const stat = (await fsp.stat("motd.txt"));

    return {
      motd,
      motd_set: stat.mtime
    };
  } catch (error) { // Return a generic MOTD if the file was not found
    console.error(error);
    return "Welcome to Krist!";
  }
};
