var crc32 = require('crc-32');

var EndpointHandler = require('../endpoint_handler.js');

function RacistEels() {
	var racistEels = {};

	racistEels.prototype = EndpointHandler();

	racistEels.handle = function(app, req, res, val) {
		var positive = [
			'Yes.',
			'Certainly.',
			'Of course!',
			'Without a doubt.',
			'Most likely.'
		];

		var negative = [
			'No.',
			'Probably not.',
			'No way!',
			'Nay!',
			'Nope.'
		];

		var questionWords = [
			'is',
			'can',
			'are',
			'has',
			'have',
			'could',
			'would',
			'should',
			'am',
			'do',
			'did',
			'will',
			'were'
		];

		// are you prepared for a clusterfuck of oneliners?

		if ((val = val.toLowerCase()).trim().substr(-1) === '?') {
			if (questionWords.indexOf(val.split(' ')[0]) >= 0) {
				if (crc32.str(val.replace(/[^a-z0-9]/gi, '')) % 2 == 0) {
					res.send(positive[Math.floor(Math.random()*positive.length)]);
				} else {
					res.send(negative[Math.floor(Math.random()*negative.length)]);
				}
			} else {
				res.send('We don\'t know.');
			}
		} else {
			res.send('Ask us a yes/no question. Disclaimer: we are partially human aided.');
		}
	};

	racistEels.setup = function(app) {
		app.get('/racisteels/:question', function(req, res) {
			racistEels.handle(app, req, res, req.params.question);
		});
	};

	return racistEels;
}

module.exports = RacistEels; // Lem stared here for a total of 46 minutes.