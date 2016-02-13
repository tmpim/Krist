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
config.DATABASE_USER    = 'example';
// The password used to authenticate against the database
config.databasePass    = 'example';
// The dialect used to connect, one of: mysql, postgres, mariadb or mssql. (sqlite not supported, fuck you Taras!)
config.databaseDialect = 'mysql';

/*
 * REDIS SETUP
 */

// The hostname of the redis server
config.redisHost = '127.0.0.1';
// The port used to connect to redis
config.redisPort = 6379;
// String to prefix to all redis keys
config.redisPrefix = 'krist';

/*
 * WEBSERVER SETUP
 */

// The sock file for your server. Proxy this to nginx.
config.serverSock = '/var/krist/krist.sock';

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
config.walletVersion = 13;

// The maximum length of a submitted nonce
config.nonceMaxSize = 24;

// The cost to buy a domain name
config.nameCost = 500;

// The growth factor for the work
config.workGrowthFactor = 0.9999;

// The max amount of webhooks per domain name
config.maxWebsocketsPerHost = 6;

// Lefthand label for badges
config.badgeLabelLeft = 'krist';

// Righthand label for badges
config.badgeLabelRight = 'verified';

// Colour used as badge
config.badgeColour = 'green';

// A list of verified servers for /badge
config.badgeVerifiedServers = [
	'example'
];

// Temporary while developing
config.websocketsEnabled = true;

module.exports = config;