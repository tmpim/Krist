var EndpointHandler = require('../endpoint_handler.js');

function RacistEels() {
	var racistEels = {};

	racistEels.prototype = EndpointHandler();

	racistEels.handle = function(app, req, res, val) {
		res.send("FUCKERY" + val);
	};

	racistEels.setup = function(app) {
		app.get('/racisteels/:question', function(req, res) {
			racistEels.handle(app, req, res, req.params.question);
		});
	};

	return racistEels;
}

module.exports = RacistEels; // Lem stared here for a total of 46 minutes.