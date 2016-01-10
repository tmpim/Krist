var mongoose		= require('mongoose'),
	autoIncrement	= require('mongoose-auto-increment'),
	fs				= require('fs'),
	path 			= require('path');

var schemas = {};

// Load all schemas
console.log('[DB]'.blue + ' Loading all schemas');

try {
	var schemasPath = path.join(__dirname, 'schemas');

	fs.readdirSync(schemasPath).forEach(function(file) {
		try {
			schemas[file.replace(/\.[^/.]+$/, "").capitalizeFirst()] = require('./schemas/' + file);
		} catch (error) {
			console.log('[DB]'.red + ' Error loading schema `' + file + '`: ');
			console.log('[DB]'.red + ' ' + error.toString());				
		}
	});
} catch (error) {
	console.log('[DB]'.red + ' Error finding schemas: ');
	console.log('[DB]'.red + ' ' + error.toString());				
}

module.exports = schemas;