/*
 * Copyright 2016 - 2022 Drew Edwards, tmpim
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

import { SafeString } from "handlebars";
import { marked } from "marked";
import sanitizeHtml from "sanitize-html";

import { getCommits } from "../../utils/git";
import { whatsNew } from "../../utils/whatsNew";

import { PUBLIC_URL } from "../../utils/constants";

marked.setOptions({
  baseUrl: PUBLIC_URL
});

export default (): Router => {
  const router = Router();

  router.get("/", async (req, res) => {
    let commits;
    try {
      commits = await getCommits();
    } catch (err) {
      console.error("Error fetching git log:", err);
    }

    res.header("Content-Type", "text/html");
    res.render("home", {
      commits,
      whatsNew,

      helpers: {
        // Render markdown (sanitised by sanitize-html)
        marked(data: any) {
          return new SafeString(sanitizeHtml(marked(data)));
        }
      }
    });
  });

  return router;
};
