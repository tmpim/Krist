const util   = require("util");
const errors = require("./errors.js");

errors.ErrorNameNotFound = function(message) {
  errors.KristError.call(this);
  this.message = message;
  this.statusCode = 404;
  this.errorString = "name_not_found";
};

util.inherits(errors.ErrorNameNotFound, errors.KristError);

errors.ErrorNameTaken = function(message) {
  errors.KristError.call(this);
  this.message = message;
  this.statusCode = 409;
  this.errorString = "name_taken";
};

util.inherits(errors.ErrorNameTaken, errors.KristError);

errors.ErrorNotNameOwner = function(message) {
  errors.KristError.call(this);
  this.message = message;
  this.statusCode = 403;
  this.errorString = "not_name_owner";
};

util.inherits(errors.ErrorNotNameOwner, errors.KristError);
