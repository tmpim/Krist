var utils   = require('./utils.js'),
	schemas = require('./schemas.js'),
	fs      = require('fs');

function Krist() {}

Krist.work = 18750; // work as of the writing of this line. this is used purely for backup.

Krist.init = function() {
	// Check for and make the data dir
	if (!fs.existsSync('data')) {
		fs.mkdirSync('data', 775);
	}

	// Check for and make the work file
	if (fs.existsSync('data/work')) {
		fs.access('data/work', fs.W_OK, function(err) {
			if (err) {
				console.log('[Krist]'.red + ' Cannot access data/work file. Please check the running user/group has write perms.');
				console.log('[Krist]'.red + ' ' + err);
				console.log('[Krist]'.red + ' Aborting.');

				process.exit(1);
			}
		});

		fs.readFile('data/work', function(err, contents) {
			if (err) {
				console.log('[Krist]'.red + ' Critical error reading work file.');
				console.log('[Krist]'.red + ' ' + err);

				return;
			}

			Krist.work = parseInt(contents);
		});
	} else {
		fs.writeFile('data/work', Krist.work, function(err) {
			console.log('[Krist]'.red + ' Critical error writing work file.');
			console.log('[Krist]'.red + ' ' + err);
		});
	}
};

Krist.getWork = function() {
	return Krist.work;
};

Krist.setWork = function(work) {
	Krist.work = work;

	fs.writeFile('data/work', work, function(err) {
		console.log('[Krist]'.red + ' Critical error writing work file.');
		console.log('[Krist]'.red + ' ' + err);
	});
};

Krist.getLastBlock = function() {
	return schemas.block.findOne({order: 'id DESC'});
};

Krist.getAddress = function(address) {
	return schemas.address.findOne({where: {address: address}});
};

Krist.getNames = function(limit, offset) {
	return schemas.name.findAll({order: 'name', limit: limit !== 'undefined' ? parseInt(limit) : null, offset: offset !== 'undefined' ? parseInt(offset) : null});
};

Krist.makeV2Address = function(key) {
	var blocks = ['', '', '', '', '', '', '', '', ''];
	var v2 = 'k';
	var circles = utils.sha256(utils.sha256(key));

	for (var i = 0; i <= 8; i++) {
		blocks[i] = circles.substring(0, 2);
		circles = utils.sha256(utils.sha256(circles));
	}

	for (i = 0; i <= 8;) {
		var dean = parseInt(circles.substring(2 * i, 2 + (2 * i)), 16) % 9;

		if (blocks[dean] === "") {
			circles = utils.sha256(circles);
		} else {
			v2+=utils.hexToBase64(parseInt(blocks[dean], 16));
			blocks[dean] = "";
			i++;
		}
	}

	return v2;
};

module.exports = Krist;
