var crypto = require('crypto'),
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

Utils.sendError = function (req, res, error) {
	if (error instanceof errors.KristError) {
		var out = {
			ok: false,
			error: error.errorString
		};

		if (error.message) {
			out.message = message;
		}

		if (error.info) {
			for (var key in error.info) {
				if (error.info.hasOwnProperty(key)) {
					out[key] = error.info[key];
				}
			}
		}

		res.status(req.query.cc !== 'undefined' ? 200 : error.statusCode).json(out);
	} else {
		res.status(500).json({
			ok: false,
			error: 'server_error'
		});

		console.log('[Error]'.red + ' Uncaught error.');
		console.log(error.stack);
	}
};

Utils.sanitiseLimit = function(limit, def, max) {
	def = def || 50;
	max = max || 1000;

	return typeof limit !== 'undefined' ? Math.min(parseInt(limit) === 0 ? def : parseInt(limit), max) : def;
};

Utils.sanitiseOffset = function(offset) {
	return typeof offset !== 'undefined' ? parseInt(offset) : null;
};

module.exports = Utils;