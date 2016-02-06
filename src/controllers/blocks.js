var config	= require('./../../config.js'),
	blocks  = require('./../blocks.js'),
	krist   = require('./../krist.js'),
	utils   = require('./../utils.js'),
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

BlocksController.submitBlock = function(address, nonce) {
	return new Promise(function(resolve, reject) {
		if (!address) {
			return reject(new errors.ErrorMissingParameter('address'));
		}

		if (!krist.isValidKristAddress(address)) {
			return reject(new errors.ErrorInvalidParameter('address'));
		}

		if (!nonce) {
			return reject(new errors.ErrorMissingParameter('nonce'));
		}

		if (nonce.length < 1 || nonce.length > config.nonce_maxSize) {
			return reject(new errors.ErrorInvalidParameter('nonce'));
		}

		blocks.getLastBlock().then(function(lastBlock) {
			var last = lastBlock.hash.substr(0, 12);
			var difficulty = krist.getWork();
			var hash = utils.sha256(address + last + nonce);

			if (parseInt(hash.substr(0, 12), 16) <= difficulty) {
				blocks.submit(hash, address, nonce).then(resolve).catch(reject);
			} else {
				return reject(new errors.ErrorSolutionIncorrect());
			}
		}).catch(reject);
	});
};

module.exports = BlocksController;