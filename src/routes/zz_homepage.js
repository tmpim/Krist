// File is named zz_homepage to ensure it runs after all the legacy API routes
// (this is a code smell, but will hopefully be refactored away later)

const path          = require("path");
const gitlog        = require("gitlog");
const { promisify } = require("util");

module.exports = function(app) {
  app.get("/", async function(req, res) {
    let commits;
    try {
      commits = (await promisify(gitlog)({
        repo: path.join(__dirname, "../"),
        number: 10,
        fields: [
          "subject",
          "body",
          "hash",
          "authorName",
          "authorDateRel"
        ]
      }));
    } catch (err) {
      console.error("Error fetching git log:", err);
    }

    res.header("Content-Type", "text/html");
    res.render("home", { commits });
  });
};
