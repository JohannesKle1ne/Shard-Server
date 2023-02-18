"use strict";

import express, { Response, Request, Express } from "express";
import { Server, WebSocketServer, WebSocket } from "ws";
import { lineInterpolate } from "geometric";

enum MessageType {
  Unknown,
  MatePosition,
  EnemyPosition,
}

const PORT = process.env.PORT || 3000;
const INDEX = "/index.html";

const stateMapping: StateMapping[] = [];

let lastPosition: Vector = { x: 0, y: 0 };

function getState(client: WebSocket) {
  return stateMapping.find((m) => m.client === client)?.state;
}

function send(client: WebSocket, message: string) {
  const state = getState(client);
  if (state?.handShake) {
    client.send(message);
  }
}

function getMessageType(message: string) {
  let messageObj;
  try {
    messageObj = JSON.parse(message);
  } catch (error) {
    return MessageType.Unknown;
  }
  if (messageObj.type == null) {
    return MessageType.Unknown;
  }
  return messageObj.type;
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

    const type = getMessageType(`${message}`);
    if (type === MessageType.MatePosition) {
      const mPos: MatePosition = JSON.parse(`${message}`);
      lastPosition = { x: mPos.x, y: mPos.y };
    }

    wss.clients.forEach((client) => {
      //send the client the current message
      if (client != ws) {
        send(client, `${message}`);
      }
    });
  });
});

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

setInterval(() => {
  wss.clients.forEach((client) => {
    const [newX, newY] = lineInterpolate([
      [lastPosition.x, lastPosition.y],
      [enemyPosition.x, enemyPosition.y],
    ])(0.98);

    enemyPosition.x = newX;
    enemyPosition.y = newY;
    send(client, JSON.stringify(enemyPosition));
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

interface MatePosition {
  x: number;
  y: number;
  type: MessageType;
}

interface Vector {
  x: number;
  y: number;
}

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
