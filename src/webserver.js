var	config	    = require('./../config.js'),
	utils       = require('./utils.js'),
	errors      = require('./errors/errors.js'),
	express	    = require('express'),
	http		= require('http'),
	bodyParser  = require('body-parser'),
	rateLimit   = require('express-rate-limit'),
	net		    = require('net'),
	fs		    = require('fs'),
	path 	    = require('path');

function Webserver() {}

module.exports = Webserver;

Webserver.getExpress = function() {
	return Webserver.express;
};

Webserver.init = function() {
	return new Promise(function(resolve, reject) {
		if (typeof config.serverSock === 'undefined') {
			console.error('[Config]'.red + ' Missing config option: serverSock');

			return null;
		}

		Webserver.express = express();
		Webserver.ws = require('express-ws')(Webserver.express);

		console.log('[Webserver]'.cyan + ' Starting on socket ' + config.serverSock.bold);

		fs.unlink(config.serverSock, function() {
			Webserver.express.listen(config.serverSock, function() {
				console.log('[Webserver]'.green + ' Started');
				resolve();
			});

			Webserver.express.enable('trust proxy');
			Webserver.express.disable('x-powered-by');
			Webserver.express.disable('etag');
			Webserver.express.use(express.static('static'));
			Webserver.express.use(bodyParser.urlencoded({ extended: false }));
			Webserver.express.use(bodyParser.json());
			Webserver.express.use(rateLimit(config.rateLimitSettings));

			Webserver.express.all('*', function(req, res, next) {
				res.header('X-Robots-Tag', 'none');
				res.header('Content-Type', 'application/json');
				next();
			});

			Webserver.express.all('/', function(req, res, next) {
				res.header('Content-Type', 'text/plain');
				next();
			});

			console.log('[Webserver]'.cyan + ' Loading routes');

			try {
				var routePath = path.join(__dirname, 'routes');

				fs.readdirSync(routePath).forEach(function(file) {
					if (path.extname(file).toLowerCase() !== '.js') {
						return;
					}

					try {
						require('./routes/' + file)(Webserver.express);
					} catch (error) {
						console.log('[Webserver]'.red + ' Error loading route `' + file + '`: ');
						console.log(error.stack);
					}
				});
			} catch (error) {
				console.log('[Webserver]'.red + ' Error finding routes: ');
				console.log(error.stack);
			}

			Webserver.express.all('/', function(req, res) {
				res.header('Content-Type', 'text/html');

				fs.readFile(config.debugMode ? 'static/index_debug.html' : 'static/index_main.html', function(err, contents) {
					if (err) {
						return res.send("<h1>oops!!!!!!!!!!!!</h1>");
					}

					res.send(contents);
				});
			});

			Webserver.express.use(function(req, res) {
				utils.sendErrorToRes(req, res, new errors.ErrorRouteNotFound());
			});
		});
	});
};