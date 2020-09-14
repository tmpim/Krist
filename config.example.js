var config = {};

/*
 * DATABASE SETUP
 */
// For more information see: http://sequelize.readthedocs.org/en/latest/api/sequelize/

// The hostname of your database server.
config.databaseHost    = 'localhost';
// The name of the database
config.databaseDB      = 'example';
// The user used to authenticate against the database
config.databaseUser    = 'example';
// The password used to authenticate against the database
config.databasePass    = 'example';
// The dialect used to connect, one of: mysql, postgres, mariadb or mssql.
config.databaseDialect = 'mysql';

/*
 * WEBSERVER SETUP
 */

// The portfor your server. Proxy this to nginx.
config.serverSock = '8000';

// Configuration of the rate limiter. See: https://github.com/nfriedly/express-rate-limit
config.rateLimitSettings = {
	windowMs: 60000,
	delayAfter: 240,
	delayMs: 5,
	max: 320,
	message: 'Rate limit hit. Please try again later.'
};

// The URL at which websockets should be connected from
config.websocketURL = 'wss://krist.ceriat.net';

/*
 * KRIST SPECIFIC
 */

// The latest version of KristWallet
config.walletVersion = 16;

// The maximum length of a submitted nonce
config.nonceMaxSize = 24;

// The cost to buy a domain name
config.nameCost = 500;

// The minimum work
config.minWork = 100;

// The maximum work
config.maxWork = 100000;

// The growth factor for the work
config.workFactor = 0.025;

// How long it should take to mine a block in seconds
config.secondsPerblock = 60;

module.exports = config;
