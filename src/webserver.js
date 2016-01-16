var	config	= require('./../config.js'),
	express	= require('express'),
	net		= require('net'),
	fs		= require('fs'),
	path 	= require('path');

function Webserver() {}

module.exports = Webserver;

Webserver.getExpress = function() {
	return Webserver.express;
};

Webserver.init = function() {
	var serverSock = '';

	if (typeof config.server_sock === 'undefined') {
		console.error('[Config]'.red + ' Missing config option: server_sock');

		return null;
	} else {
		serverSock = config.server_sock;
	}

	Webserver.express = express();

	console.log('[Webserver]'.cyan + ' Starting on socket ' + serverSock.bold);

	process.on('uncaughtException', function(error) {
		if (error.code == 'EADDRINUSE') {
			console.warn('[Webserver]'.yellow + ' Address already in use. Checking if it is actually in use.');

			var clientSocket = new net.Socket();
			clientSocket.on('error', function(e) {
				if (e.code == 'ECONNREFUSED') {
					fs.unlinkSync(serverSock);

					Webserver.express.listen(serverSock, function() {
						console.log('[Webserver]'.green + ' Server started successfully on socket ' + serverSock.bold);
					});
				}
			});

			clientSocket.connect({path: serverSock}, function() {
				console.error('[Webserver]'.red + ' Address already in use. Exiting.');
				process.exit();
			});
		} else {
			console.error('[Webserver]'.red + ' Error: ' + error);
		}
	});

	Webserver.express.listen(serverSock, function() {
		console.log('[Webserver]'.green + ' Server started successfully on socket ' + serverSock.bold);
	});

	Webserver.express.use(express.static('static'));

	Webserver.express.all('*', function(req, res, next) {
		res.header('X-Robots-Tag', 'none');
		next();
	});

	console.log('[Webserver]'.cyan + ' Loading route');

	try {
		var routePath = path.join(__dirname, '../routes');

		fs.readdirSync(routePath).forEach(function(file) {
			if (path.extname(file).toLowerCase() !== '.js') {
				return;
			}

			try {
				require('./../routes/' + file)(Webserver.express);
			} catch (error) {
				console.log('[Webserver]'.red + ' Error loading route `' + file + '`: ');
				console.log('[Webserver]'.red + ' ' + error.toString());
			}
		});
	} catch (error) {
		console.log('[Webserver]'.red + ' Error finding routes: ');
		console.log('[Webserver]'.red + ' ' + error.toString());
	}

	Webserver.express.use(function(req, res) {
		res.json({
			ok: false,
			error: 'not_found'
		});
	});
};