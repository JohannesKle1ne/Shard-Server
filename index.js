// Set strict mode to catch more errors
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Import required packages
const express_1 = __importDefault(require("express"));
const ws_1 = require("ws");
const fs_1 = require("fs");
// Define the port number and index file
const PORT = process.env.PORT || 3001;
const INDEX = "/index.html";
const oridHug = false;
const ohannesHug = false;
let stateMapping = [];
var StreakState;
(function (StreakState) {
    StreakState[StreakState["Missing"] = 0] = "Missing";
    StreakState[StreakState["Completed"] = 1] = "Completed";
    StreakState[StreakState["Failed"] = 2] = "Failed";
})(StreakState || (StreakState = {}));
class ClientState {
    constructor(name) {
        this.name = name;
        this.hugging = false;
    }
}
const fun = () => __awaiter(void 0, void 0, void 0, function* () {
    const state = yield getStreakState();
    console.log(state);
});
fun();
// Get the state for a specific client
function getState(client) {
    const mapping = stateMapping.find((m) => m.client === client);
    if (mapping)
        return mapping.state;
}
// Remove the state for a specific client
function removeState(client) {
    stateMapping = stateMapping.filter((m) => m.client !== client);
}
function bothHugging() {
    if (stateMapping.length < 2)
        return false;
    return stateMapping.every((s) => s.state.hugging);
}
function getHugEntries() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const data = yield fs_1.promises.readFile("./storage.json", { encoding: "utf8" });
            const hugEntries = JSON.parse(data);
            return hugEntries;
        }
        catch (err) {
            console.log(err);
            return [];
        }
    });
}
function sendStreak() {
    return __awaiter(this, void 0, void 0, function* () {
        const streak = yield getStreak();
        wss.clients.forEach((c) => c.send(streak));
    });
}
function getStreakState() {
    return __awaiter(this, void 0, void 0, function* () {
        const hugEntries = yield getHugEntries();
        const lastEntry = hugEntries[hugEntries.length - 1];
        const now = getDayMonthYear();
        if (lastEntry == null)
            return StreakState.Missing;
        const date1 = new Date(lastEntry.year, lastEntry.month, lastEntry.day);
        const date2 = new Date(now.year, now.month, now.day);
        const diffTime = Math.abs(date2.getTime() - date1.getTime());
        const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
        console.log(diffHours + " hours");
        if (diffHours < 24) {
            return StreakState.Completed;
        }
        if (diffHours === 24) {
            return StreakState.Missing;
        }
        if (diffHours > 24) {
            return StreakState.Failed;
        }
    });
}
function resetStreak() {
    return __awaiter(this, void 0, void 0, function* () {
        fs_1.promises.writeFile("./storage.json", JSON.stringify([]));
    });
}
function getStreak() {
    return __awaiter(this, void 0, void 0, function* () {
        const hugEntries = yield getHugEntries();
        return hugEntries.length;
    });
}
function getDayMonthYear() {
    const newDate = new Date();
    return {
        day: newDate.getDate(),
        month: newDate.getMonth(),
        year: newDate.getFullYear(),
    };
}
function increaseHugStreak() {
    return __awaiter(this, void 0, void 0, function* () {
        const hugEntries = yield getHugEntries();
        hugEntries.push(getDayMonthYear());
        fs_1.promises.writeFile("./storage.json", JSON.stringify(hugEntries));
    });
}
function sendSuccessfulHugging() {
    wss.clients.forEach((c) => c.send("SuccessfulHugging"));
}
function setHugTimer(state) {
    return __awaiter(this, void 0, void 0, function* () {
        state.hugging = true;
        if (bothHugging()) {
            console.log("Both hugging!");
            const state = yield getStreakState();
            if (state === StreakState.Failed) {
                yield resetStreak();
            }
            if (state === StreakState.Missing) {
                yield increaseHugStreak();
            }
            sendSuccessfulHugging();
            sendStreak();
        }
        setTimeout(() => {
            state.hugging = false;
        }, 1000);
    });
}
const server = (0, express_1.default)()
    .use((req, res) => res.sendFile(INDEX, { root: __dirname }))
    .listen(PORT, () => {
    console.log(`Listening on ${PORT}`);
});
const wss = new ws_1.Server({ server });
wss.on("connection", (ws, req) => __awaiter(void 0, void 0, void 0, function* () {
    /*   const ip = req.socket.remoteAddress;
  
    const lookup = geoip.lookup("201.201.215.193");
    console.log(lookup);
  
    console.log("Client connected with: " + ip); */
    if (wss.clients.size == 1) {
        const newState = new ClientState("Orid");
        stateMapping.push({ client: ws, state: newState });
        ws.send(newState.name);
    }
    if (wss.clients.size == 2) {
        const other = [...wss.clients].find((c) => c != ws);
        if (other) {
            const state = getState(other);
            if (state != null) {
                if (state.name == "Orid") {
                    const newState = new ClientState("Ohannes");
                    stateMapping.push({ client: ws, state: newState });
                    ws.send(newState.name);
                }
                if (state.name == "Ohannes") {
                    const newState = new ClientState("Orid");
                    stateMapping.push({ client: ws, state: newState });
                    ws.send(newState.name);
                }
            }
        }
    }
    const state = yield getStreakState();
    if (state === StreakState.Failed) {
        resetStreak();
    }
    sendStreak();
    if (wss.clients.size > 2) {
        ws.close();
    }
    ws.on("close", () => {
        removeState(ws);
    });
    ws.on("message", (message) => {
        const messageString = `${message}`;
        console.log("Received: " + messageString);
        wss.clients.forEach((client) => {
            if (client != ws) {
                client.send(`${message}`);
            }
        });
        if (messageString == "Hug") {
            const state = getState(ws);
            if (state) {
                setHugTimer(state);
            }
        }
    });
}));
