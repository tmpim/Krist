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

import path from "path";
import { gitlogPromise as gitlog } from "gitlog";
import { Octokit } from "@octokit/rest";

import { redis, rKey } from "../database/redis";

import { GITHUB_TOKEN } from "./constants";

const MESSAGE_TYPE_RE = /^(\w+): (.+)/;
const EXCLUDE_COMMITS_RE = /block|submi/gi;

const octokit = GITHUB_TOKEN ? new Octokit({
  auth: GITHUB_TOKEN,
  userAgent: "https://github.com/tmpim/Krist"
}) : null;

export type CommitBase = Record<"hash" | "subject" | "authorName"
  | "authorDate" | "authorEmail" | "authorDateRel" | "body", string>;
export interface FormattedCommit extends CommitBase {
  type?: string;
  avatar?: string;
}

export async function getCommits(): Promise<FormattedCommit[]> {
  const commits = await gitlog({
    repo: path.join(__dirname, "../../"),
    number: 20,
    fields: [
      "subject", "body", "hash",
      "authorName", "authorEmail", "authorDate", "authorDateRel"
    ]
  });

  return formatCommits(commits);
}

async function formatCommits(commits: CommitBase[]): Promise<FormattedCommit[]> {
  const newCommits = [];

  for (const baseCommit of commits) {
    const commit: FormattedCommit = { ...baseCommit };

    if (
      !commit.subject
      || EXCLUDE_COMMITS_RE.test(commit.subject)
      || (commit.body && EXCLUDE_COMMITS_RE.test(commit.body))
    ) {
      continue;
    }

    const [, type, rest] = MESSAGE_TYPE_RE.exec(commit.subject) || [];
    if (type) {
      commit.type = type;
      commit.subject = rest;
    }

    commit.avatar = await getAvatar(commit);

    newCommits.push({
      type: commit.type,
      subject: commit.subject,
      body: commit.body,
      hash: commit.hash,
      authorName: commit.authorName,
      authorEmail: commit.authorEmail,
      // Git dates are not strict ISO-8601 by default
      authorDate: new Date(commit.authorDate).toISOString(),
      authorDateRel: commit.authorDateRel,
      avatar: commit.avatar,
    });
  }

  return newCommits.slice(0, 10);
}

async function getAvatar(commit: FormattedCommit): Promise<string | undefined> {
  if (!process.env.GITHUB_TOKEN || !octokit || !commit.authorEmail) return;

  const key = rKey("gh-avatar:" + commit.authorEmail);

  const existing = await redis.get(key);
  if (existing) return existing === "null" ? undefined : existing;

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
