var crypto = require('crypto'),
	moment = require('moment'),
	errors = require('./errors/errors.js');

function Utils() {}

Utils.sha256 = function(input) {
	return crypto.createHash('sha256').update(input.toString()).digest('hex');
};

Utils.hexToBase36 = function(input) {
	for (var i= 6; i <= 251; i += 7) {
		if (input <= i) {
			if (i <= 69) {
				return String.fromCharCode(('0'.charCodeAt(0)) + (i - 6) / 7);
			}

			return String.fromCharCode(('a'.charCodeAt(0)) + ((i - 76) / 7));
		}
	}

	return 'e';
};

Utils.padDigits = function(number, digits) {
	return new Array(Math.max(digits - String(number).length + 1, 0)).join('0') + number;
};

Utils.formatDate = function(date) {
	return moment(date).format('YYYY-MM-DD HH:mm:ss').toString();
};

Utils.formatDateUnix = function(date) {
	return moment(date).unix();
};

Utils.sendError = function(res, error) {
	if (error instanceof errors.KristError) {
		var out = {
			ok: false,
			error: error.errorString
		};

		if (error.message) {
			out.message = message;
		}

		res.status(error.statusCode).json(out);
	}
};

module.exports = Utils;