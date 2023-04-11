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
const sequelize_1 = require("sequelize");
const sequelize = new sequelize_1.Sequelize("initial_hug", "postgres", "postgres", {
    host: "database-hug.csehfyfmn8dh.eu-north-1.rds.amazonaws.com",
    port: 5432,
    dialect: "postgres",
    logging: false,
    pool: {
        max: 10,
        min: 0,
        idle: 10000,
    },
});
// Test the connection
(() => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield sequelize.authenticate();
        console.log("Connection has been established successfully.");
    }
    catch (error) {
        console.error("Unable to connect to the database:", error);
    }
}))();
const Streak = sequelize.define("Streak", {
    streak: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: false,
    },
}, { freezeTableName: true });
const getHugEntriesFromDB = () => __awaiter(void 0, void 0, void 0, function* () {
    //await Streak.sync({ force: true });
    // Retrieve the entry from the Streak table
    const streak = yield Streak.findOne({
        where: {
            id: 5,
        },
    });
    /*   const jane = await Streak.create({ streak: "[]" });
    console.log(jane.toJSON()); */
    if (streak && "streak" in streak && typeof streak.streak === "string") {
        const hugEntries = JSON.parse(streak.streak);
        return hugEntries;
        //streak.save();
        //const hugEntries:HugEntry[]= streak.streak
        // return;
    }
    //console.log(streak?.toJSON());
});
// Define the port number and index file
const PORT = process.env.PORT || 3001;
const INDEX = "/index.html";
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
/* const fun = async () => {
  const state = await getStreakState();
  console.log(state);
};

fun(); */
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
        const hugEntries = yield getHugEntriesFromDB();
        if (hugEntries != null) {
            return hugEntries;
        }
        else {
            return [];
        }
        /*  try {
          const data = await fs.readFile("./storage.json", { encoding: "utf8" });
          const hugEntries: HugEntry[] = JSON.parse(data);
          return hugEntries;
        } catch (err) {
          console.log(err);
          return [];
        } */
    });
}
function setHugEntries(hugEntries) {
    return __awaiter(this, void 0, void 0, function* () {
        const streak = yield Streak.findOne({
            where: {
                id: 5,
            },
        });
        /*   const jane = await Streak.create({ streak: "[]" });
        console.log(jane.toJSON()); */
        if (streak && "streak" in streak && typeof streak.streak === "string") {
            streak.streak = JSON.stringify(hugEntries);
            yield streak.save();
        }
    });
}
function sendStreak() {
    return __awaiter(this, void 0, void 0, function* () {
        const streak = yield getStreak();
        wss.clients.forEach((c) => c.send(JSON.stringify({ streak })));
    });
}
function sendTotalHugs() {
    return __awaiter(this, void 0, void 0, function* () {
        const hugs = yield getTotalHugs();
        wss.clients.forEach((c) => c.send(JSON.stringify({ hugs })));
    });
}
function sendCurrentTime() {
    return __awaiter(this, void 0, void 0, function* () {
        const newDate = new Date();
        const time = {
            hours: newDate.getHours(),
            day: newDate.getDate(),
            month: newDate.getMonth(),
            year: newDate.getFullYear(),
        };
        wss.clients.forEach((c) => c.send(JSON.stringify(time)));
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
function getTotalHugs() {
    return __awaiter(this, void 0, void 0, function* () {
        const hugEntries = yield getHugEntries();
        return hugEntries.length;
    });
}
function getStreak() {
    return __awaiter(this, void 0, void 0, function* () {
        const getDifference = (hugEntry1, hugEntry2) => {
            const date1 = new Date(hugEntry1.year, hugEntry1.month, hugEntry1.day);
            const date2 = new Date(hugEntry2.year, hugEntry2.month, hugEntry2.day);
            return Math.abs(date2.getTime() - date1.getTime());
        };
        const hugEntries = yield getHugEntries();
        if (hugEntries.length > 0) {
            hugEntries.reverse();
            let interrupted = false;
            let newest = hugEntries[0];
            let oldest = hugEntries[0];
            hugEntries.reduce((first, second) => {
                const diffTime = getDifference(first, second);
                const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
                console.log(diffHours);
                if (diffHours <= 24 && !interrupted) {
                    console.log(second);
                    oldest = second;
                }
                else {
                    interrupted = true;
                }
                return second;
            });
            console.log(oldest);
            console.log(newest);
            const diffTime = getDifference(newest, oldest);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return diffDays + 1;
        }
        return 0;
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
        yield setHugEntries(hugEntries);
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
            //const state = await getStreakState();
            /*     if (state === StreakState.Failed) {
              await resetStreak();
            }
            if (state === StreakState.Missing) {
              
            } */
            yield increaseHugStreak();
            sendSuccessfulHugging();
            sendStreak();
            sendTotalHugs();
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
    //const state = await getStreakState();
    /*   if (state === StreakState.Failed) {
      resetStreak();
    } */
    sendStreak();
    sendTotalHugs();
    sendCurrentTime();
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
