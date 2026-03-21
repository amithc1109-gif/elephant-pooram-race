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
let admin = null;

const FINISH = 1500;

app.get("/players", (req, res) => {
    res.json(players);
});

io.on("connection", (socket) => {

    console.log("User connected");

    /* JOIN */

    socket.on("join", (data) => {

        const { name, team, paapaan, role } = data;

        /* ADMIN */

        if (role === "admin") {
            admin = socket.id;
            socket.emit("admin");
            socket.emit("players", players);
            socket.emit("positions", players);
            return;
        }

        /* SPECTATOR */

        if (role === "spectator") {
            socket.emit("spectator");
            socket.emit("players", players);
            socket.emit("positions", players);
            return;
        }

        /* REJOIN (refresh fix) */

        let existing = players.find(p => p.name === name);

        if (existing) {
            existing.id = socket.id;
            socket.emit("rejoined");
            io.emit("players", players);
            io.emit("positions", players);
            return;
        }

        /* NEW PLAYER */

        let player = {
            id: socket.id,
            name: name,
            team: team,
            paapaan: paapaan || "Unknown",
            position: 0
        };

        players.push(player);

        io.emit("players", players);
        io.emit("positions", players);
    });

    /* MOVE */

    socket.on("move", () => {

        if (!raceStarted) return;

        let player = players.find(p => p.id === socket.id);

        if (!player) return;

        player.position += 25;

        /* funny elephant */

        if (
            player.name === "കുന്നിൻച്ചരുവിൽ ജനീലിയ" &&
            player.position > 600 &&
            player.position < 800
        ) {
            player.position -= 40;
        }

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

    /* START RACE (ADMIN ONLY) */

    socket.on("startRace", () => {

        if (socket.id !== admin) return;

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

        if (socket.id !== admin) return;

        raceStarted = false;

        players.forEach(p => p.position = 0);
        finishOrder = [];

        io.emit("positions", players);
    });

    /* DISCONNECT */

    socket.on("disconnect", () => {

        players = players.filter(p => p.id !== socket.id);

        if (socket.id === admin) {
            admin = null;
        }

        io.emit("players", players);
    });

});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log("Server running on port " + PORT);
});