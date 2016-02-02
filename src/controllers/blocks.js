var blocks  = require('./../blocks.js'),
	errors  = require('./../errors/errors.js');

function BlocksController() {}

BlocksController.getBlocks = function(limit, offset, asc) {
	return new Promise(function(resolve, reject) {
		if ((limit && isNaN(limit)) || (limit && limit <= 0)) {
			return reject(new errors.ErrorInvalidParameter('limit'));
		}

		if ((offset && isNaN(offset)) || (offset && offset <= 0)) {
			return reject(new errors.ErrorInvalidParameter('offset'));
		}

		blocks.getBlocks(limit, offset, asc).then(resolve).catch(reject);
	});
};

BlocksController.getBlocksByOrder = function(order, limit, offset) {
	return new Promise(function(resolve, reject) {
		if ((limit && isNaN(limit)) || (limit && limit <= 0)) {
			return reject(new errors.ErrorInvalidParameter('limit'));
		}

		if ((offset && isNaN(offset)) || (offset && offset <= 0)) {
			return reject(new errors.ErrorInvalidParameter('offset'));
		}

		blocks.getBlocksByOrder(order, limit, offset).then(resolve).catch(reject);
	});
};

BlocksController.getBlock = function(height) {
	return new Promise(function(resolve, reject) {
		if (isNaN(height)) {
			return reject(new errors.ErrorInvalidParameter('height'));
		}

		height = Math.max(parseInt(height), 0);

		blocks.getBlock(height).then(function(result) {
			if (!result) {
				return reject(new errors.ErrorBlockNotFound());
			}

			resolve(result);
		}).catch(reject);
	});
};

BlocksController.blockToJSON = function(block) {
	return {
		height: block.id,
		address: block.address,
		hash: block.hash,
		short_hash: block.hash.substring(0, 12),
		value: block.value,
		time: block.time
	};
};

module.exports = BlocksController;