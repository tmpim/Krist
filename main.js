var config		= require('./config.js'),
	package     = require('./package.json'),

	colors		= require('colors'), // *colours

	database	= require('./src/database.js');

console.log('Starting ' + package.name.bold + ' ' + package.version.blue);

database.init().then(function() {
	require('./src/krist.js').init();
	require('./src/webserver.js').init();
});

/*
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('data.db');

db.serialize(function() {
	Address.sync().then(function() {
		Block.sync().then(function() {
			Name.sync().then(function() {
				Transaction.sync().then(function () {
					convertAddresses();

					convertNames();

					db.get('SELECT COUNT(*) as count FROM blocks', function (err, result) {
						convertBlocks(2500, 0, result.count);
					});

					db.get('SELECT COUNT(*) as count FROM transactions', function (err, result) {
						convertTransactions(2500, 0, result.count);
					});
				});
			});
		});
	});
});

function convertAddresses() {
	console.log("Beginning address convert");

	db.each("SELECT * FROM 'addresses'", function(err, row) {
		Address.create({
			id: row.id,
			address: row.address,
			balance: row.balance,
			totalin: row.totalin,
			totalout: row.totalout,
			firstseen: new Date(row.firstseen * 1000)
		});
	});
}

function convertBlocks(limit, offset, count) {
	console.log("Beginning block convert " + offset + " + " + limit + " of " + count);

	db.all("SELECT * FROM blocks LIMIT " + limit + " OFFSET " + offset, function(err, rows) {
		console.log("Second stage block convert " + offset + " + " + limit + " of " + count);

		var raws = [];

		rows.forEach(function(row) {
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

		Block.bulkCreate(raws).then(function() {
			console.log("Done block convert " + offset + " + " + limit + " of " + count);

			if (offset + limit > count) {
				console.log("Done all");
			} else {
				convertBlocks(limit, offset + limit, count);
			}
		})
	});
}

function convertNames() {
	console.log("Beginning names convert");

	db.each("SELECT * FROM 'names'", function(err, row) {
		Block.findOne({ where: { id: row.registered } }).then(function(r1) {
			Block.findOne({ where: { id: row.updated } }).then(function(r2) {
				Name.create({
					id: row.id,
					name: row.name,
					owner: row.owner,
					registered: r1.time,
					updated: r2.time,
					a: row.a,
					unpaid: row.unpaid
				});
			});
		});
	});
}

function convertTransactions(limit, offset, count) {
	console.log("Beginning transaction convert " + offset + " + " + limit + " of " + count);

	db.all("SELECT * FROM transactions LIMIT " + limit + " OFFSET " + offset, function(err, rows) {
		console.log("Second stage transaction convert " + offset + " + " + limit + " of " + count);

		var raws = [];

		rows.forEach(function(row) {
			raws.push({
				from: row.from,
				to: row.to,
				value: row.value,
				time: new Date(row.time * 1000),
				name: row.name,
				op: row.op
			});
		})

		Transaction.bulkCreate(raws).then(function() {
			console.log("Done transaction convert " + offset + " + " + limit + " of " + count);

			if (offset + limit > count) {
				console.log("Done all");
			} else {
				convertTransactions(limit, offset + limit, count);
			}
		})
	});
}*/