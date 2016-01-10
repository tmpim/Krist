var express	= require('express'),
	net		= require('net'),
	fs		= require('fs'),
	path 	= require('path');

module.exports = function (config, database) {
	var serverSock = '';

	if (typeof config.server_sock === 'undefined') {
		console.error('[Config]'.red + ' Missing config option: server_sock');

		return null;
	} else {
		serverSock = config.server_sock;
	}

	var app = express();

	console.log('[Webserver]'.blue + ' Starting on socket ' + serverSock.blue);

	process.on('uncaughtException', function(error) {
		if (error.code == 'EADDRINUSE') {
			console.warn('[Webserver]'.yellow + ' Address already in use. Checking if it is actually in use.');
			
			var clientSocket = new net.Socket();
			clientSocket.on('error', function(e) {
				if (e.code == 'ECONNREFUSED') {
					fs.unlinkSync(serverSock);

					app.listen(serverSock, function() {
						console.log('[Webserver]'.green + ' Server started successfully on socket ' + serverSock.blue);
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

	app.listen(serverSock, function() {
		console.log('[Webserver]'.green + ' Server started successfully on socket ' + serverSock.blue);
	});

	// Set global headers
	app.all('*', function(req, res, next) {
		res.header('Content-Type', 'application/json');
		res.header('X-Robots-Tag', 'none');
		next();
	});

	app.get('/', function(req, res) {
		res.send('hi');
	});

	// Load all API endpoints
	console.log('[Webserver]'.blue + ' Loading API endpoints');

	try {
		var endpointPath = path.join(__dirname, '../api/endpoints');

		fs.readdirSync(endpointPath).forEach(function(file) {
			if (path.extname(file).toLowerCase() !== '.js') {
				return;
			}

			try {
				require('./../api/endpoints/' + file)(app);
			} catch (error) {
				console.log('[Webserver]'.red + ' Error loading API endpoint `' + file + '`: ');
				console.log('[Webserver]'.red + ' ' + error.toString());				
			}
		});
	} catch (error) {
		console.log('[Webserver]'.red + ' Error finding API endpoints: ');
		console.log('[Webserver]'.red + ' ' + error.toString());				
	}

	// 404 response
	app.use(function(req, res) {
		res.json({
			ok: false,
			error: 'not_found'
		});
	});

	return app;
}