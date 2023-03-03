"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = __importDefault(require("express"));
var ws_1 = require("ws");
var MessageType;
(function (MessageType) {
    MessageType[MessageType["Unknown"] = 0] = "Unknown";
    MessageType[MessageType["PlayerPosition"] = 1] = "PlayerPosition";
    MessageType[MessageType["PlayerStartPosition"] = 2] = "PlayerStartPosition";
    MessageType[MessageType["BulletPosition"] = 3] = "BulletPosition";
})(MessageType || (MessageType = {}));
var PORT = process.env.PORT || 3000;
var INDEX = "/index.html";
var stateMapping = [];
function getState(client) {
    var mapping = stateMapping.find(function (m) { return m.client === client; });
    if (mapping)
        return mapping.state;
}
function send(client, message) {
    var state = getState(client);
    if (state && state.handShake) {
        console.log("Sent: " + message);
        client.send(message);
    }
}
function getMessageType(message) {
    var messageObj;
    try {
        messageObj = JSON.parse(message);
    }
    catch (error) {
        return MessageType.Unknown;
    }
    if (messageObj.type == null) {
        return MessageType.Unknown;
    }
    return messageObj.type;
}
var server = (0, express_1.default)()
    .use(function (req, res) {
    return res.sendFile(INDEX, { root: __dirname });
})
    .listen(PORT, function () { return console.log("Listening on ".concat(PORT)); });
var wss = new ws_1.Server({ server: server });
wss.on("connection", function (ws) {
    console.log("Client connected");
    stateMapping.push({ client: ws, state: new ClientState() });
    ws.on("close", function () { return console.log("Client disconnected"); });
    ws.on("message", function (message) {
        //for each websocket client
        var messageString = "".concat(message);
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
            var state = getState(ws);
            if (state) {
                state.handShake = true;
                state.id = parseInt(messageString);
            }
            setTimeout(function () {
                send(ws, "Welcome");
                wss.clients.forEach(function (client) {
                    if (client != ws) {
                        var state_1 = getState(client);
                        if (state_1) {
                            var _a = state_1.lastPosition, x = _a.x, y = _a.y;
                            var pos = {
                                clientId: state_1.id,
                                x: x,
                                y: y,
                                type: MessageType.PlayerPosition,
                                sprite: "right",
                            };
                            send(ws, JSON.stringify(pos));
                        }
                    }
                });
            }, 500);
        }
        var type = getMessageType("".concat(message));
        if (type === MessageType.PlayerPosition) {
            var mPos = JSON.parse("".concat(message));
            var state = getState(ws);
            if (state) {
                state.lastPosition = { x: mPos.x, y: mPos.y };
            }
        }
        wss.clients.forEach(function (client) {
            //send the client the current message
            if (client != ws) {
                send(client, "".concat(message));
            }
        });
    });
});
var startPositions = [
    { x: 50, y: 330 },
    { x: 300, y: 330 },
];
function getRandomStartPosition() {
    return startPositions[getRandom(2)];
}
function getRandom(max) {
    return Math.floor(Math.random() * max);
}
function isNumeric(str) {
    if (typeof str != "string")
        return false; // we only process strings!
    return !isNaN(parseInt(str)); // ...and ensure strings of whitespace fail
}
var ClientState = /** @class */ (function () {
    function ClientState() {
        this.handShake = false;
        this.lastPosition = { x: 0, y: 0 };
        this.id = -1;
    }
    return ClientState;
}());
