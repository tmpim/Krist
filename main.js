var config		= require('./config.js'),
	utils 		= require('./utils.js'),
	database	= require('./database.js'),
	webserver	= require('./webserver.js')(config);

database.init(config);