const chai = require("chai");
module.exports = {
  api: () => chai.request("http://localhost:8080")
};
