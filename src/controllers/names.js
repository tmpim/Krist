var names       = require('./../names.js'),
	errors      = require('./../errors/errors.js'),
	utils       = require('./../utils.js');

function NamesController() {}

NamesController.nameToJSON = function(name) {
	return {
		name: name.name,
		owner: name.owner,
		registered: name.registered,
		updated: name.updated,
		a: name.a
	};
};

module.exports = NamesController;