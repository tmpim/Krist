var krist   = require('./../src/krist.js'),
	moment  = require('moment');

module.exports = function(app) {
	app.get('/', function(req, res, next) {
		if (typeof req.query.lastblock !== 'undefined') {
			krist.getLastBlock().then(function(block) {
				res.send(block.hash.substring(0, 12));
			});

			return;
		}

		if (typeof req.query.getbaseblockvalue !== 'undefined') {
			krist.getLastBlock().then(function(block) {
				res.send(krist.getBaseBlockValue(block.id).toString());
			});

			return;
		}

		if (req.query.getblockvalue) {
			krist.getBlock(Math.max(parseInt(req.query.getblockvalue), 0)).then(function(block) {
				if (!block) {
					res.send('50');

					return;
				}

				res.send(block.value.toString());
			});

			return;
		}

		next();
	});

	app.get('/blocks', function(req, res) {
		if ((req.query.limit && isNaN(req.query.limit)) || (req.query.limit && (req.query.limit <= 0))) {
			res.status(400).json({
				ok: false,
				error: 'invalid_limit'
			});

			return;
		}

		if ((req.query.offset && isNaN(req.query.offset)) || (req.query.offset && req.query.offset <= 0)) {
			res.status(400).json({
				ok: false,
				error: 'invalid_offset'
			});

			return;
		}

		krist.getBlocks(req.query.limit, req.query.offset, typeof req.query.asc !== 'undefined').then(function(blocks) {
			var out = [];

			blocks.forEach(function (block) {
				out.push({
					height: block.id,
					hash: block.hash,
					short_hash: block.hash.substring(0, 12),
					value: block.value,
					time: moment(block.time).format('YYYY-MM-DD HH:mm:ss').toString(),
					time_unix: moment(block.time).unix()
				});
			});

			res.json({
				ok: true,
				count: out.length,
				blocks: out
			});
		});
	});

	app.get('/blocks/lowest', function(req, res) {
		if ((req.query.limit && isNaN(req.query.limit)) || (req.query.limit && (req.query.limit <= 0))) {
			res.status(400).json({
				ok: false,
				error: 'invalid_limit'
			});

			return;
		}

		krist.getBlocksByOrder('hash ASC', req.query.limit).then(function(blocks) {
			var out = [];

			blocks.forEach(function (block) {
				if (block.hash === null) return;
				if (block.height === 1) return;

				out.push({
					height: block.id,
					hash: block.hash,
					short_hash: block.hash.substring(0, 12),
					value: block.value,
					time: moment(block.time).format('YYYY-MM-DD HH:mm:ss').toString(),
					time_unix: moment(block.time).unix()
				});
			});

			res.json({
				ok: true,
				count: out.length,
				blocks: out
			});
		});
	});

	app.get('/block/last', function(req, res) {
		krist.getLastBlock().then(function(block) {
			res.json({
				ok: true,
				height: block.id,
				hash: block.hash,
				short_hash: block.hash.substring(0, 12),
				value: block.value,
				time: moment(block.time).format('YYYY-MM-DD HH:mm:ss').toString(),
				time_unix: moment(block.time).unix()
			});
		});
	});

	app.get('/block/value', function(req, res) {
		krist.getLastBlock().then(function(block) {
			res.json({
				ok: true,
				base_value: krist.getBaseBlockValue(block.id)
			})
		});
	});

	app.get('/block/:block', function(req, res) {
		krist.getBlock(Math.max(parseInt(req.params.block), 0)).then(function(block) {
			if (!block) {
				res.status(404).json({
					ok: false,
					error: 'not_found'
				});

				return;
			}

			res.json({
				ok: true,
				height: block.id,
				hash: block.hash,
				short_hash: block.hash.substring(0, 12),
				value: block.value,
				time: moment(block.time).format('YYYY-MM-DD HH:mm:ss').toString(),
				time_unix: moment(block.time).unix()
			})
		});
	});

	return app;
}