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

import promClient from "prom-client";
import { wsManager } from "./index.js";

// =============================================================================
// COUNTERS
// =============================================================================
export const promWebsocketConnectionsTotal = new promClient.Counter({
  name: "krist_websocket_connections_total",
  help: "Total number of new websocket connections since the Krist server started.",
  labelNames: ["type"]
});
promWebsocketConnectionsTotal.inc({ type: "incomplete" }, 0);
promWebsocketConnectionsTotal.inc({ type: "guest" }, 0);
promWebsocketConnectionsTotal.inc({ type: "authed" }, 0);

export const promWebsocketTokensTotal = new promClient.Counter({
  name: "krist_websocket_tokens_total",
  help: "Total number of websocket tokens created since the Krist server started.",
  labelNames: ["type"]
});
promWebsocketTokensTotal.inc({ type: "guest" }, 0);
promWebsocketTokensTotal.inc({ type: "authed" }, 0);

export const promWebsocketMessagesTotal = new promClient.Counter({
  name: "krist_websocket_incoming_messages_total",
  help: "Total number of incoming websocket messages since the Krist server started.",
  labelNames: ["type"]
});

export const promWebsocketEventBroadcastsTotal = new promClient.Counter({
  name: "krist_websocket_event_broadcasts_total",
  help: "Total number of websocket event broadcasts sent out since the Krist server started.",
  labelNames: ["event"]
});

export const promWebsocketKeepalivesTotal = new promClient.Counter({
  name: "krist_websocket_keepalives_total",
  help: "Total number of websocket keepalives sent out since the Krist server started.",
  labelNames: ["type"]
});
promWebsocketTokensTotal.inc({ type: "guest" }, 0);
promWebsocketTokensTotal.inc({ type: "authed" }, 0);

// =============================================================================
// GAUGES
// =============================================================================
new promClient.Gauge({
  name: "krist_websocket_connections_current",
  help: "Current number of active websocket connections.",
  labelNames: ["type"],
  collect() {
    if (!wsManager) throw new Error("No wsManager!!");
    const s = wsManager.sockets;
    this.set({ type: "guest" }, s.filter(w => w.isGuest).length);
    this.set({ type: "authed" }, s.filter(w => !w.isGuest).length);
  }
});

new promClient.Gauge({
  name: "krist_websocket_tokens_pending_current",
  help: "Current number of pending websocket tokens.",
  collect() {
    this.set(Object.keys(wsManager.pendingTokens).length);
  }
});
