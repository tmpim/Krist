var krist               = require('./../src/krist.js'),
	utils               = require('./../src/utils.js'),
	addressesController = require('./../src/controllers/addresses.js'),
	blocksController    = require('./../src/controllers/blocks.js'),
	blocks              = require('./../src/blocks.js'),
	errors              = require('./../src/errors/errors.js');

module.exports = function(app) {
	app.get('/', function(req, res, next) {
		if (typeof req.query.submitblock !== 'undefined') {
			if (!req.query.address || !krist.isValidKristAddress(req.query.address)) {
				return res.status(400).send('Invalid address');
			}

			if (!req.query.nonce || req.query.nonce.length > 12) {
				return res.status(400).send('Nonce is too large');
			}

			blocks.getLastBlock().then(function(lastBlock) {
				var last = lastBlock.hash.substr(0, 12);
				var difficulty = krist.getWork();
				var hash = utils.sha256(req.query.address + last + req.query.nonce);

				if (parseInt(hash.substr(0, 12), 16) <= difficulty) {
					blocks.submit(hash, req.query.address, req.query.nonce).then(function() {
						res.send('Block solved');
					}).catch(function() {
						res.send('Solution rejected');
					})
				} else {
					res.send(req.query.address + last + req.query.nonce);
				}
			});

			return;
		}

		next();
	});

	app.post('/submit', function(req, res) {
		blocksController.submitBlock(req.body.address, req.body.nonce).then(function(result) {
			res.json({
				ok: true,
				success: true,
				work: result.work,
				address: addressesController.addressToJSON(result.address),
				block: blocksController.blockToJSON(result.block)
			});
		}).catch(function(error) {
			if (error instanceof errors.ErrorSolutionIncorrect) {
				res.json({
					ok: true,
					success: false
				});
			} else {
				utils.sendError(res, error);
			}
		});
	});

	return app;
};
