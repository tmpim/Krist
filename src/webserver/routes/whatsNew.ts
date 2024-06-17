/*
 * Copyright 2016 - 2024 Drew Edwards, tmpim
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
 * For more project information, see <https://github.com/tmpim/krist>.
 */

import { Router } from "express";
import { getCommits } from "../../utils/git.js";
import { whatsNew } from "../../utils/whatsNew.js";

export default (): Router => {
  const router = Router();

  /**
   * @api {get} /whatsnew Get recent changes to the Krist project
   * @apiName GetWhatsNew
   * @apiGroup MiscellaneousGroup
   * @apiVersion 3.0.0
   *
   * @apiSuccess {Object[]} commits The 10 most recent Git commits
   * @apiSuccess {String} [commits.type] The
   *   [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/)
   *   type of this commit, if available. Usually `fix` or `feat`.
   * @apiSuccess {String} commits.subject The subject message of this commit
   * @apiSuccess {String} commits.body The full commit message, including the
   *   type and subject
   * @apiSuccess {String} commits.hash The hash of this commit
   * @apiSuccess {String} commits.authorName The name of the author of this
   *   commit
   * @apiSuccess {String} commits.authorEmail The e-mail of the author of this
   *   commit
   * @apiSuccess {String} commits.authorDate The date this commit was authored
   * @apiSuccess {String} commits.authorDateRel The date this commit was
   *   authored, as a string relative to the current time (e.g. `6 days ago`)
   * @apiSuccess {String} [commits.avatar] The URL of the author's avatar on
   *   GitHub, if available.
   *
   * @apiSuccessExample {json} Success
   * {
   *  	"ok": true,
   *  	"commits": [
   *  		{
   *  			"type": "feat",
   *  			"subject": "add names.transferred to lookup API",
   *  			"body": "feat: add names.transferred to lookup API\n",
   *  			"hash": "dc64fb2ee7750f063f2c5e0d0fffc11571f3549a",
   *  			"authorName": "Drew Edwards",
   *  			"authorEmail": "name@example.com",
   *  			"authorDate": "2022-04-07T23:11:06.000Z",
   *  			"authorDateRel": "6 days ago",
   *  			"avatar": null
   *  		},
   *  		...
   *  	],
   *  	"whatsNew": [
   *  		{
   *  			"commitHash": "5fed5626e6ce0e24c6a4a3c574ce73d5a6cca69e",
   *  			"date": "2022-04-07T23:24:01+01:00",
   *  			"new": true,
   *  			"body": "Names have a new `transferred` field that returns when they were last transferred to a new owner."
   *  		},
   *  		...
   *  	]
   *  }
   */
  router.get("/whatsnew", async (req, res) => {
    const commits = await getCommits();

    res.json({
      ok: true,
      commits,
      whatsNew
    });
  });

  return router;
};
