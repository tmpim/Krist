// File is named zz_homepage to ensure it runs after all the legacy API routes
// (this is a code smell, but will **hopefully** be refactored away later)

const path          = require("path");
const gitlog        = require("gitlog");
const { Octokit }   = require("@octokit/rest");
const { getRedis }  = require("../redis");
const { promisify } = require("util");

const octokit = process.env.GITHUB_TOKEN ? new Octokit({
  auth: process.env.GITHUB_TOKEN,
  userAgent: "https://github.com/tmpim/Krist"
}) : null;
const messageTypeRe = /^(\w+): (.+)/;

async function getCommits() {
  commits = (await promisify(gitlog)({
    repo: path.join(__dirname, "../"),
    number: 5,
    fields: [
      "subject", "body", "hash",
      "authorName", "authorEmail", "authorDateRel"
    ]
  }));
  await formatCommits(commits);
  return commits;
}

async function formatCommits() {
  for (const commit of commits) {
    if (!commit.subject) continue;
    
    const [, type, rest] = messageTypeRe.exec(commit.subject) || [];
    if (type) {
      commit.type = type;
      commit.subject = rest;
      commit.avatar = await getAvatar(commit);
    }
  }
}

async function getAvatar(commit) {
  if (!process.env.GITHUB_TOKEN || !octokit || !commit.authorEmail) return;

  const redis = getRedis();
  const key = "gh-avatar:" + commit.authorEmail;

  const existing = await redis.get(key);
  if (existing) return existing === "null" ? null : existing;

  const { data } = await octokit.search.users({
    q: `${commit.authorEmail} in:email`,
    per_page: 1
  });
  if (!data || data.total_count === 0) {
    await redis.set(key, "null");
    await redis.expire(key, 1800);
    return;
  }

  const url = "https://github.com/" + encodeURIComponent(data.items[0].login) + ".png?size=16";
  await redis.set(key, url);
  await redis.expire(key, 1800);
  return url;
}

module.exports = function(app) {
  app.get("/", async function(req, res) {
    let commits;
    try {
      commits = await getCommits();
    } catch (err) {
      console.error("Error fetching git log:", err);
    }

    res.header("Content-Type", "text/html");
    res.render("home", { commits });
  });
};
