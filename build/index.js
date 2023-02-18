"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = __importDefault(require("express"));
var ws_1 = require("ws");
var PORT = process.env.PORT || 3000;
var INDEX = "/index.html";
var server = (0, express_1.default)()
    .use(function (req, res) {
    return res.sendFile(INDEX, { root: __dirname });
})
    .listen(PORT, function () { return console.log("Listening on ".concat(PORT)); });
var wss = new ws_1.Server({ server: server });
wss.on("connection", function (ws) {
    console.log("Client connected");
    ws.on("close", function () { return console.log("Client disconnected"); });
    ws.on("message", function (message) {
        //for each websocket client
        wss.clients.forEach(function (client) {
            //send the client the current message
            client.send("".concat(message));
        });
    });
});
