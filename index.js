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
    MessageType[MessageType["PlayerDestroy"] = 4] = "PlayerDestroy";
    MessageType[MessageType["BulletDestroy"] = 5] = "BulletDestroy";
    MessageType[MessageType["BulletCollision"] = 6] = "BulletCollision";
    MessageType[MessageType["Color"] = 7] = "Color";
    MessageType[MessageType["BoxPosition"] = 8] = "BoxPosition";
})(MessageType || (MessageType = {}));
var PORT = process.env.PORT || 3000;
var INDEX = "/index.html";
var stateMapping = [];
var colors = ["blue", "green", "red"];
var colorIndex = 0;
var getColor = function () {
    colorIndex = (colorIndex + 1) % colors.length;
    return colors[colorIndex];
};
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
setInterval(function () {
    wss.clients.forEach(function (c) {
        var state = getState(c);
        if (state === null || state === void 0 ? void 0 : state.handShake) {
            send(c, JSON.stringify({
                type: MessageType.BoxPosition,
                position: 600,
                index: 0,
            }));
        }
    });
}, 6000);
setInterval(function () {
    wss.clients.forEach(function (c) {
        var state = getState(c);
        if (state === null || state === void 0 ? void 0 : state.handShake) {
            send(c, JSON.stringify({
                type: MessageType.BoxPosition,
                position: 550,
                index: 1,
            }));
        }
    });
}, 10000);
setInterval(function () {
    wss.clients.forEach(function (c) {
        var state = getState(c);
        if (state === null || state === void 0 ? void 0 : state.handShake) {
            send(c, JSON.stringify({
                type: MessageType.BoxPosition,
                position: 420,
                index: 2,
            }));
        }
    });
}, 6000);
wss.on("connection", function (ws) {
    console.log("Client connected");
    stateMapping.push({ client: ws, state: new ClientState() });
    ws.on("close", function () { return console.log("Client disconnected"); });
    ws.on("message", function (message) {
        //for each websocket client
        var messageString = "".concat(message);
        console.log("Received: " + messageString);
        if (isNumeric(messageString)) {
            var state_1 = getState(ws);
            if (state_1) {
                state_1.handShake = true;
                state_1.id = parseInt(messageString);
                state_1.color = getColor();
                setTimeout(function () {
                    send(ws, JSON.stringify({
                        clientId: state_1.id,
                        type: MessageType.Color,
                        color: state_1.color,
                    }));
                    wss.clients.forEach(function (client) {
                        if (client != ws) {
                            var state_2 = getState(client);
                            if (state_2) {
                                var _a = state_2.lastPosition, x = _a.x, y = _a.y;
                                var pos = {
                                    clientId: state_2.id,
                                    x: x,
                                    y: y,
                                    type: MessageType.PlayerPosition,
                                    sprite: state_2.lastSprite,
                                };
                                send(ws, JSON.stringify(pos));
                            }
                        }
                    });
                }, 500);
            }
        }
        var type = getMessageType("".concat(message));
        if (type === MessageType.PlayerPosition) {
            var mPos = JSON.parse("".concat(message));
            var state = getState(ws);
            if (state) {
                state.lastPosition = { x: mPos.x, y: mPos.y };
                state.lastSprite = mPos.sprite;
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
/* let index = 0;
setInterval(() => {
  wss.clients.forEach((client) => {
    const position = path[index];
    send(client, JSON.stringify(position));
    index = (index + 1) % path.length;
  });
}, 100); */
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
        this.lastSprite = "blueright1";
        this.id = -1;
        this.color = "blue";
    }
    return ClientState;
}());
