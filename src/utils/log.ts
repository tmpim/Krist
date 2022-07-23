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

import chalk from "chalk";
import { Request } from "express";

import { sanitiseUserAgent, sanitiseOrigin } from "./validation";

export interface ReqDetails {
  origin?: string;
  userAgent?: string;
  libraryAgent?: string;
}

export interface LogDetails extends ReqDetails {
  ip: string;
  path: "WS" | string;
  logDetails: string;
}

export function getReqDetails(req?: Request): ReqDetails {
  if (!req) return { userAgent: undefined, origin: undefined };

  const userAgent = sanitiseUserAgent(req.header("User-Agent"));
  const libraryAgent = sanitiseUserAgent(req.header("Library-Agent"));
  const origin = sanitiseOrigin(req.header("Origin"));
  return { userAgent, libraryAgent, origin };
}

export function getLogDetails(req: Request): LogDetails {
  const ip = req.ip;
  const { userAgent, libraryAgent, origin } = getReqDetails(req);
  const path = req.path && req.path.startsWith("/.websocket//") ? "WS" : req.path;
  const logDetails = chalk`(ip: {bold ${ip}} origin: {bold ${origin}} useragent: {bold ${userAgent}} library agent: {bold ${libraryAgent}})`;

  return { ip, origin, userAgent, libraryAgent, path, logDetails };
}
