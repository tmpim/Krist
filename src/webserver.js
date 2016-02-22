/**
 * Created by Drew Lemmy, 2016
 *
 * This file is part of Krist.
 *
 * Krist is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Krist is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Krist. If not, see <http://www.gnu.org/licenses/>.
 *
 * For more project information, see <https://github.com/Lemmmy/Krist>.
 */

var	config	    = require('./../config.js'),
	utils       = require('./utils.js'),
	errors      = require('./errors/errors.js'),
	express	    = require('express'),
	http		= require('http'),
	bodyParser  = require('body-parser'),
	swig		= require('swig'),
	rateLimit   = require('express-rate-limit'),
	net		    = require('net'),
	gitlog 		= require('gitlog'),
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

			Webserver.express.use(function(req, res, next) {
				delete req.headers['content-encoding'];
				next();
			});

			Webserver.express.use(express.static('static'));

			Webserver.express.set('views', path.join(__dirname, '../views'));
			Webserver.express.set('view engine', 'swig');
			Webserver.express.engine('.swig', swig.renderFile);

			swig.setDefaults({
				debug: config.debugMode
			});

			Webserver.express.use(bodyParser.urlencoded({ extended: false }));
			Webserver.express.use(bodyParser.json());

			Webserver.express.use(rateLimit(config.rateLimitSettings));

			Webserver.express.all('*', function(req, res, next) {
				res.header('X-Robots-Tag', 'none');
				res.header('Content-Type', 'application/json');
				res.header('Access-Control-Allow-Origin', '*');
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

			Webserver.express.get('/', function(req, res) {
				res.header('Content-Type', 'text/html');

				gitlog({
					repo: path.join(__dirname, '../'),
					number: 5,
					fields: [
						'subject',
						'body',
						'hash',
						'authorName',
						'authorDateRel'
					]
				}, function(error, commits) {
					if (error) {
						console.log(error);

						return res.render('error', {
							protocol: req.protocol
						});
					}

					res.render('index', {
						commits: commits,
						protocol: req.protocol
					});
				});
			});

			Webserver.express.use(function(req, res) {
				if (req.xhr) {
					utils.sendErrorToRes(req, res, new errors.ErrorRouteNotFound());
				} else {
					res.header('Content-Type', 'text/html');

					res.render('error_404', {
						protocol: req.protocol
					});
				}
			});
		});
	});
};