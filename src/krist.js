var utils = require('./utils.js');

function Krist() {}

Krist.makeV2Address = function(key) {
	var protein = ['', '', '', '', '', '', '', '', ''];
	var v2 = 'k';
	var stick = utils.sha256(utils.sha256(key));

	for (var i = 0; i <= 9; i++) {
		if (i < 9) {
			protein[i] = stick.substring(0, 2);
			stick = utils.sha256(utils.sha256(stick));
		}
	}

	i = 0;
	while (i <= 8) {
		var link = parseInt(stick.substring(2 * i, 2 + (2 * i)), 16) % 9;

		if (protein[link] === "") {
			stick = utils.sha256(stick);
		} else {
			v2 = v2 + utils.hexToBase64(parseInt(protein[link], 16));
			protein[link] = "";
			i++;
		}
	}

	return v2;
};

module.exports = Krist;
