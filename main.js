var config		= require('./config.js'),
	database	= require('./src/database.js'),
	webserver	= require('./src/webserver.js')(config);

database.init(config);