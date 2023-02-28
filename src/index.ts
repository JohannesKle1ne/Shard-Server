"use strict";

import express, { Response, Request, Express } from "express";
import { Server, WebSocketServer, WebSocket } from "ws";
import { lineInterpolate } from "geometric";

enum MessageType {
  Unknown,
  PlayerPosition,
  PlayerStartPosition,
  BulletPosition,
}

const PORT = process.env.PORT || 3000;
const INDEX = "/index.html";

const stateMapping: StateMapping[] = [];

function getState(client: WebSocket) {
  return stateMapping.find((m) => m.client === client)?.state;
}

function send(client: WebSocket, message: string) {
  const state = getState(client);
  if (state?.handShake) {
    console.log("Sent: " + message);
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
    const messageString = `${message}`;
    console.log("Received: " + messageString);
    /* if (isNumeric(messageString)) {
      const state = getState(ws);
      if (state) {
        state.handShake = true;
      }
      setTimeout(() => {
        send(
          ws,
          `${JSON.stringify({
            clientId: parseInt(messageString),
            ...getRandomStartPosition(),
            type: MessageType.PlayerStartPosition,
          })}`
        );
      }, 1000);
    } */

    if (isNumeric(messageString)) {
      const state = getState(ws);
      if (state) {
        state.handShake = true;
        state.id = parseInt(messageString);
      }
      setTimeout(() => {
        send(ws, `Welcome`);
        wss.clients.forEach((client) => {
          if (client != ws) {
            const state = getState(client);
            if (state) {
              const { x, y } = state.lastPosition;
              const pos: MatePosition = {
                clientId: state.id,
                x,
                y,
                type: MessageType.PlayerPosition,
                sprite: "right",
              };
              send(ws, JSON.stringify(pos));
            }
          }
        });
      }, 500);
    }

    const type = getMessageType(`${message}`);
    if (type === MessageType.PlayerPosition) {
      const mPos: MatePosition = JSON.parse(`${message}`);
      const state = getState(ws);
      if (state) {
        state.lastPosition = { x: mPos.x, y: mPos.y };
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

const startPositions = [
  { x: 50, y: 330 },
  { x: 300, y: 330 },
];

function getRandomStartPosition() {
  return startPositions[getRandom(2)];
}

function getRandom(max: number) {
  return Math.floor(Math.random() * max);
}

function isNumeric(str: string) {
  if (typeof str != "string") return false; // we only process strings!
  return !isNaN(parseInt(str)); // ...and ensure strings of whitespace fail
}

class ClientState {
  handShake: boolean = false;
  lastPosition: Vector = { x: 0, y: 0 };
  id: number = -1;
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
  clientId: number;
  x: number;
  y: number;
  type: MessageType;
  sprite: string;
}

interface Vector {
  x: number;
  y: number;
}
