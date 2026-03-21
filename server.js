const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

let players = [];
let admin = null;
let raceStarted = false;
let finishOrder = [];

const FINISH = 1200;

io.on("connection", (socket) => {

    socket.on("join", (data) => {

        const { name, paapaan, role } = data;

        /* ADMIN */

        if (role === "admin") {
            admin = socket.id;
            socket.emit("admin");
            return;
        }

        /* SPECTATOR */

        if (role === "spectator") {
            socket.emit("players", players);
            return;
        }

        /* PLAYER */

        players.push({
            id: socket.id,
            name,
            paapaan,
            position: 0
        });

        io.emit("players", players);
    });

    /* MOVE */

    socket.on("move", () => {

        if (!raceStarted) return;

        let player = players.find(p => p.id === socket.id);
        if (!player) return;

        player.position += 25;

        if (player.position >= FINISH) {

            player.position = FINISH;

            if (!finishOrder.find(p => p.id === player.id)) {
                finishOrder.push(player);
            }

            if (finishOrder.length === 3) {
                raceStarted = false;
                io.emit("top3", finishOrder);
            }
        }

        io.emit("positions", players);
    });

    /* START */

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
        finishOrder = [];

        players.forEach(p => p.position = 0);

        io.emit("positions", players);
    });

});

server.listen(process.env.PORT || 3000);