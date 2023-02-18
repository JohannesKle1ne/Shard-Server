"use strict";

import express, { Response, Request, Express } from "express";
import { Server, WebSocketServer, WebSocket } from "ws";

const PORT = process.env.PORT || 3000;
const INDEX = "/index.html";

const stateMapping: StateMapping[] = [];

function getState(client: WebSocket) {
  return stateMapping.find((m) => m.client === client)?.state;
}

function send(client: WebSocket, message: string) {
  const state = getState(client);
  if (state?.handShake) {
    client.send(message);
  }
}

const server = express()
  .use((req: Request, res: Response) =>
    res.sendFile(INDEX, { root: __dirname })
  )
  .listen(PORT, () => console.log(`Listening on ${PORT}`));

const wss: WebSocketServer = new Server({ server });

wss.on("connection", (ws: WebSocket) => {
  console.log("Client connected");
  stateMapping.push({ client: ws, state: new ClientState() });
  ws.on("close", () => console.log("Client disconnected"));
  ws.on("message", (message) => {
    //for each websocket client
    console.log(`${message}`);
    if (`${message}` === "Hello!") {
      const state = getState(ws);
      if (state) {
        state.handShake = true;
      }
    }
    wss.clients.forEach((client) => {
      //send the client the current message
      if (client != ws) {
        send(client, `${message}`);
      }
    });
  });
});

setInterval(() => {
  wss.clients.forEach((client) => {
    const { x, y } = enemyPath[pathIndex];
    enemyPosition.x = x;
    enemyPosition.y = y;
    send(client, JSON.stringify(enemyPosition));
    pathIndex = (pathIndex + 1) % enemyPath.length;
  });
}, 100);

class ClientState {
  handShake: boolean = false;
}

interface StateMapping {
  client: WebSocket;
  state: ClientState;
}

interface EnemyPosition {
  x: number;
  y: number;
  enemyId: number;
  type: MessageType;
}

enum MessageType {
  Unknown,
  MatePosition,
  EnemyPosition,
}

const enemyPath = [
  { x: 50, y: 50 },
  { x: 75, y: 50 },
  { x: 100, y: 50 },
  { x: 100, y: 75 },
  { x: 100, y: 100 },
  { x: 75, y: 100 },
  { x: 50, y: 100 },
  { x: 50, y: 75 },
];
let pathIndex = 0;

const enemyPosition: EnemyPosition = {
  x: 20,
  y: 20,
  enemyId: 1,
  type: MessageType.EnemyPosition,
};

/* const { WebSocketServer } = require("ws");

const wss = new WebSocketServer({ port: 8080 });

wss.on("listening", function open() {
  console.log(`Server listenting on ws://localhost:8080`);
});

wss.on("connection", function connection(ws) {
  ws.on("error", console.error);

  ws.on("message", (message) => {
    //for each websocket client
    wss.clients.forEach((client) => {
      //send the client the current message
      client.send(`${message}`);
    });
  });

  ws.send("something");
}); */
