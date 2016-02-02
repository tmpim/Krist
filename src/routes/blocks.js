var krist            = require('./../krist.js'),
	blocksController = require('./../controllers/blocks.js'),
	blocks           = require('./../blocks.js'),
	utils            = require('./../utils.js'),
	moment           = require('moment');

module.exports = function(app) {
	app.get('/', function(req, res, next) {
		if (typeof req.query.lastblock !== 'undefined') {
			blocks.getLastBlock().then(function(block) {
				res.send(block.hash.substring(0, 12));
			});

			return;
		}

		if (typeof req.query.getbaseblockvalue !== 'undefined') {
			blocks.getLastBlock().then(function(block) {
				res.send(blocks.getBaseBlockValue(block.id).toString());
			});

			return;
		}

		if (req.query.getblockvalue) {
			blocks.getBlock(Math.max(parseInt(req.query.getblockvalue), 0)).then(function(block) {
				if (!block) {
					return res.send('50');
				}

				res.send(block.value.toString());
			});

			return;
		}

		if (typeof req.query.blocks !== 'undefined') {
			if (typeof req.query.low !== 'undefined') {
				blocks.getBlocksByOrder('hash ASC', 18).then(function(results) {
					var out = "";

					results.forEach(function (block) {
						if (block.hash === null) return;
						if (block.id === 1) return;

						out += moment(block.time).format('MMM DD').toString();
						out += utils.padDigits(block.id, 6);
						out += block.hash.substring(0, 20);
					});

					res.send(out);
				});
			} else {
				blocks.getBlocks(18).then(function(results) {
					var out = "";

					var k = false;

					results.forEach(function (block) {
						if (block.hash === null) return;
						if (block.id === 1) return;

						if (!k) {
							out += utils.padDigits(results[0].id, 8);
							out += moment(results[0].time).format('YYYY-MM-DD').toString();

							k  = true;
						}

						out += moment(block.time).format('HH:MM:ss').toString();
						out += block.address.substring(0, 10);
						out += block.hash.substring(0, 12);
					});

					res.send(out);
				});
			}

			return;
		}

		next();
	});

	app.get('/blocks', function(req, res) {
		blocksController.getBlocks(req.query.limit, req.query.offset, true).then(function(results) {
			var out = [];

			results.forEach(function(block) {
				if (block.hash === null) return;
				if (block.id === 1) return;

				out.push(blocksController.blockToJSON(block));
			});

			res.json({
				ok: true,
				count: out.length,
				blocks: out
			});
		}).catch(function(error) {
			utils.sendError(res, error);
		});
	});

	app.get('/blocks/lowest', function(req, res) {
		blocksController.getBlocksByOrder('hash ASC', req.query.limit, req.query.offset, true).then(function(results) {
			var out = [];

			results.forEach(function(block) {
				if (block.hash === null) return;
				if (block.id === 1) return;

				out.push(blocksController.blockToJSON(block));
			});

			res.json({
				ok: true,
				count: out.length,
				blocks: out
			});
		}).catch(function(error) {
			utils.sendError(res, error);
		});
	});

	app.get('/block/last', function(req, res) {
		blocksController.getBlocks(req.query.limit, req.query.offset, true).then(function(results) {
			var out = [];

			results.forEach(function(block) {
				if (block.hash === null) return;
				if (block.id === 1) return;

				out.push(blocksController.blockToJSON(block));
			});

			res.json({
				ok: true,
				count: out.length,
				blocks: out
			});
		}).catch(function(error) {
			utils.sendError(res, error);
		});
	});

	app.get('/block/basevalue', function(req, res) {
		blocks.getLastBlock().then(function(block) {
			res.json({
				ok: true,
				base_value: blocks.getBaseBlockValue(block.id)
			})
		});
	});

	app.get('/block/value', function(req, res) {
		blocks.getBlockValue().then(function(value) {
			res.json({
				ok: true,
				value: value
			})
		});
	});

	app.get('/block/:height', function(req, res) {
		blocksController.getBlock(req.params.height).then(function(block) {
			res.json({
				ok: true,
				block: blocksController.blockToJSON(block)
			});
		}).catch(function(error) {
			utils.sendError(res, error);
		});
	});

	return app;
};