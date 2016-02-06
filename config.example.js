var config = {};

/*
 * DATABASE SETUP
 */
// For more information see: http://sequelize.readthedocs.org/en/latest/api/sequelize/

// The hostname of your database server.
config.database_host    = 'localhost';
// The name of the database
config.database_db      = 'example';
// The user used to authenticate against the database
config.DATABASE_USER    = 'example';
// The password used to authenticate against the database
config.database_pass    = 'example';
// The dialect used to connect, one of: mysql, postgres, mariadb or mssql. (sqlite not supported, fuck you Taras!)
config.database_dialect = 'mysql';

/*
 * WEBSERVER SETUP
 */

// The socket file for your server. Proxy this to nginx.
config.server_sock = '/var/krist/krist.sock';

// Configuration of the rate limiter. See: https://github.com/nfriedly/express-rate-limit
config.rateLimit_configuration = {
	windowMs: 60000,
	delayAfter: 240,
	delayMs: 5,
	max: 320,
	message: 'Rate limit hit. Please try again later.'
};

/*
 * KRIST SPECIFIC
 */

// The latest version of kristwallet
config.wallet_version = 13;

// The maximum length of a submitted nonce
config.nonce_maxSize = 24;

// The cost to buy a domain name
config.name_cost = 500;

// The growth factor for the work
config.work_growthFactor = 0.9999;

// The max amount of webhooks per domain name
config.webhooks_maxPerHost = 6;

// Lefthand label for badges
config.badge_labelLeft = 'krist';

// Righthand label for badges
config.badge_labelRight = 'verified';

// Colour used as badge
config.badge_colour = 'green';

// A list of verified servers for /badge
config.badge_verifiedServers = [
	'example'
];

module.exports = config;