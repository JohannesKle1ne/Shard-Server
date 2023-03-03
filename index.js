"use strict";

const express = require("express");
const { Server } = require("ws");

const PORT = process.env.PORT || 3000;
const INDEX = "/index.html";

const server = express()
  .use((req, res) => res.sendFile(INDEX, { root: __dirname }))
  .listen(PORT, () => console.log(`Listening on ${PORT}`));

const wss = new Server({ server });

wss.on("connection", (ws) => {
  console.log("Client connected");
  ws.on("close", () => console.log("Client disconnected"));
  ws.on("message", (message) => {
    //for each websocket client
    wss.clients.forEach((client) => {
      //send the client the current message
      client.send(`${message}`);
    });
  });
});

setInterval(() => {
  wss.clients.forEach((client) => {
    client.send(new Date().toTimeString());
  });
}, 1000);

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
