var krist   = require('./../src/krist.js'),
	utils   = require('./../src/utils.js');

module.exports = function(app) {
	app.get('/', function(req, res, next) {
		if (typeof req.query.submitblock !== 'undefined') {
			if (!req.query.address || req.query.address.length != 10 || !(/^(?:k[a-z0-9]{9}|[a-f0-9]{10})/i.exec(req.query.address))) {
				res.status(400).send('Invalid address');

				return;
			}

			if (!req.query.nonce || req.query.nonce.length > 12) {
				res.status(400).send('Nonce is too large'); // idk man

				return;
			}

			krist.getLastBlock().then(function(lastBlock) {
				var last = lastBlock.hash.substr(0, 12);
				var difficulty = krist.getWork();
				var hash = utils.sha256(req.query.address + last + req.query.nonce);

				if (parseInt(hash.substr(0, 12), 16) <= difficulty) {
					krist.submit(hash, req.query.address, req.query.nonce);

					res.send('Block solved');
				} else {
					res.send(req.query.address + last + req.query.nonce);
				}
			});

			return;
		}

		next();
	});

	return app;
}