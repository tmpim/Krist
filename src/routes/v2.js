var krist   = require('./../krist.js'),
	utils   = require('./../utils.js'),
	errors  = require('./../errors/errors.js');

module.exports = function(app) {
	app.get('/', function(req, res, next) {
		if (req.query.v2) {
			return res.send(krist.makeV2Address(req.query.v2));
		}

		next();
	});

	/**
	 * @api {post} /v2 Get v2 address from a private key
	 * @apiName MakeV2Address
	 * @apiGroup MiscellaneousGroup
	 * @apiVersion 2.0.0
	 *
	 * @apiParam (BodyParameter) {String} privatekey The private key to turn into an address
	 *
	 * @apiSuccess {String} address The address from the private key
	 *
	 * @apiSuccessExample {json} Success
	 * HTTP/1.1 200 OK
	 * {
	 *     "ok": true,
	 *     "address": "kre3w0i79j"
     * }
	 */
	app.post('/v2', function(req, res) {
		if (!req.body.privatekey) {
			return utils.sendError(res, new errors.ErrorMissingParameter('privatekey'));
		}

		res.json({
			ok: true,
			address: krist.makeV2Address(req.body.privatekey)
		});
	});

	return app;
};