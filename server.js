const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

let players = [];
let raceStarted = false;
let finishOrder = [];

const FINISH = 1500;

/* API so team page can see taken elephants */

app.get("/players", (req, res) => {
  res.json(players);
});

io.on("connection", (socket) => {

/* JOIN */

socket.on("join", (data) => {

const { name, team, paapaan, role } = data;

/* ADMIN */

if (role === "admin") {
socket.emit("admin");
return;
}

/* SPECTATOR */

if (role === "spectator") {

socket.emit("spectator");

/* allow spectators to watch immediately */

socket.emit("players", players);
socket.emit("positions", players);

return;
}

/* PLAYER REJOIN (page refresh) */

let existing = players.find(p => p.name === name);

if (existing) {

existing.id = socket.id;

socket.emit("rejoin");

io.emit("players", players);
io.emit("positions", players);

return;
}

/* ADD PLAYER */

let player = {
id: socket.id,
name: name,
team: team,
paapaan: paapaan,
position: 0
};

players.push(player);

socket.emit("playerJoined");

io.emit("players", players);
io.emit("positions", players);

});

/* MOVE */

socket.on("move", () => {

if (!raceStarted) return;

let player = players.find(p => p.id === socket.id);

if (!player) return;

player.position += 25;

/* special elephant behaviour */

if (
player.name === "കുന്നിൻച്ചരുവിൽ ജനീലിയ" &&
player.position > 600 &&
player.position < 800
) {
player.position -= 40;
}

/* finish */

if (player.position >= FINISH) {

player.position = FINISH;

if (!finishOrder.find(p => p.id === player.id)) {
finishOrder.push(player);
}

if (finishOrder.length === 3) {

raceStarted = false;

io.emit("top3", finishOrder.slice(0, 3));

}

}

io.emit("positions", players);

});

/* START RACE */

socket.on("startRace", () => {

players.forEach(p => p.position = 0);

finishOrder = [];

io.emit("positions", players);

io.emit("countdown");

setTimeout(() => {

raceStarted = true;

}, 3000);

});

/* RESET */

socket.on("resetRace", () => {

raceStarted = false;

players.forEach(p => p.position = 0);

finishOrder = [];

io.emit("positions", players);

});

});

server.listen(process.env.PORT || 3000);