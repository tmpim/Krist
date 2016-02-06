var config		= require('./config.js'),
	package     = require('./package.json'),

	colours		= require('colors'),
	yesno       = require('yesno'),
	fs          = require('fs'),
	Progress    = require('progress'),
	sqlite3     = require('sqlite3'),

	database	= require('./src/database.js');

var progress = null;
var schemas = null;
var db = null;

function connect() {
	console.log('Connecting to DB...');

	database.init().then(function() {
		schemas = require('./src/schemas.js');
		db = new sqlite3.Database('data.db');

		confirmBegin();
	});
}

function confirmBegin() {
	console.log('');
	console.log('======[WARNING]======'.red.bold);
	console.log('This script will delete any existing Krist data in your database.');
	console.log('');
	console.log('The following tables will be ' + 'deleted'.red + ': ')
	console.log('');

	for (var schema in schemas) {
		if (schemas.hasOwnProperty(schema)) {
			console.log(' - ' + schemas[schema].getTableName().toString().bold);
		}
	}

	console.log('');

	yesno.ask('Continue? [Y/n]', true, function(ok) {
		if (ok) {
			console.log('Checking prerequisites');

			fs.stat('data.db', function(err, stat) {
				if (err) {
					console.log('Error:'.red + ' data.db does not exist or have read permissions. Exiting.');

					process.exit();
				}

				begin();
			});
		} else {
			console.log('Exiting.');

			process.exit();
		}
	});
}

function begin() {
	console.log('Cleaning up old database');

	database.getSequelize().truncate().then(function() {
		convertAddresses().then(function() {
			db.get('SELECT COUNT(*) as count FROM blocks', function (err, result) {
				convertBlocks(2500, result.count).then(function() {
					convertNames().then(function() {
						db.get('SELECT COUNT(*) as count FROM transactions', function (err, res) {
							convertTransactions(2500, res.count).then(function() {
								console.log('Done.');

								process.exit();
							});
						});
					});
				});
			});
		});
	});
}

function convertAddresses() {
	return new Promise(function(resolve, reject) {

		db.all("SELECT * FROM 'addresses'", function(err, rows) {
			if (err) {
				reject(err);
				return;
			}

			progress = new Progress('Addresses [:bar] :percent :etas', {
				total: rows.length,
				complete: '='.green.bold,
				incomplete: '-'.red
			});

			rows.forEach(function(row) {
				schemas.address.create({
					id: row.id,
					address: row.address,
					balance: row.balance,
					totalin: row.totalin,
					totalout: row.totalout,
					firstseen: new Date(row.firstseen * 1000)
				}).then(function() {
					progress.tick();

					if (progress.complete) {
						resolve();
					}
				}).catch(reject);
			});
		});
	});
}

function convertBlocks(limit, count) {
	return new Promise(function(resolve, reject) {
		progress = new Progress('Blocks [:bar] :percent :etas', {
			total: count,
			complete: '='.green.bold,
			incomplete: '-'.red
		});

		function convertBlocksPart(limit, offset, count) {
			db.all("SELECT * FROM blocks LIMIT " + limit + " OFFSET " + offset, function (err, rows) {
				if (err) {
					reject(err);
					return;
				}

				var raws = []; // what the hell was i thinking when i wrote this? whatever

				rows.forEach(function (row) {
					if (row.nonce == Number.POSITIVE_INFINITY || row.nonce == Number.NEGATIVE_INFINITY) {
						row.nonce = 0;
					}

					raws.push({
						value: row.value,
						hash: row.hash,
						address: row.address,
						nonce: row.nonce,
						time: new Date(row.time * 1000),
						difficulty: row.difficulty
					});
				})

				schemas.block.bulkCreate(raws).then(function () {
					if (offset + limit > count) {
						progress.tick(limit);

						if (progress.complete) {
							resolve();
						}
					} else {
						progress.tick(limit);

						convertBlocksPart(limit, offset + limit, count);
					}
				}).catch(reject);
			});
		}

		convertBlocksPart(limit, 0, count);
	});
}

function convertNames() {
	return new Promise(function(resolve, reject) {
		db.all("SELECT * FROM 'names'", function (err, rows) {
			if (err) {
				reject(err);
				return;
			}

			progress = new Progress('Names [:bar] :percent :etas', {
				total: rows.length,
				complete: '='.green.bold,
				incomplete: '-'.red
			});

			rows.forEach(function(row) {

				schemas.block.findOne({
					where: {
						id: row.registered
					}
				}).then(function (r1) {
					schemas.block.findOne({
						where: {
							id: row.updated
						}
					}).then(function (r2) {
						schemas.name.create({
							id: row.id,
							name: row.name,
							owner: row.owner,
							registered: r1.time,
							updated: r2.time,
							a: row.a,
							unpaid: row.unpaid
						}).then(function() {
							progress.tick();

							if (progress.complete) {
								resolve();
							}
						}).catch(reject);
					}).catch(reject);
				}).catch(reject);
			});
		});
	});
}


function convertTransactions(limit, count) {
	return new Promise(function(resolve, reject) {
		progress = new Progress('Transactions [:bar] :percent :etas', {
			total: count,
			complete: '='.green.bold,
			incomplete: '-'.red
		});

		function convertTransactionsPart(limit, offset, count) {
			db.all("SELECT * FROM transactions LIMIT " + limit + " OFFSET " + offset, function (err, rows) {
				if (err) {
					reject(err);
					return;
				}

				var raws = [];

				rows.forEach(function (row) {
					raws.push({
						from: row.from,
						to: row.to,
						value: row.value,
						time: new Date(row.time * 1000),
						name: row.name,
						op: row.op
					});
				})

				schemas.transaction.bulkCreate(raws).then(function () {
					if (offset + limit > count) {
						progress.tick(limit);

						if (progress.complete) {
							resolve();
						}
					} else {
						progress.tick(limit);

						convertTransactionsPart(limit, offset + limit, count);
					}
				}).catch(reject);
			});
		}

		convertTransactionsPart(limit, 0, count);
	});
}

connect();