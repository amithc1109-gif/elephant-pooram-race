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

    console.log("User connected:", socket.id);

    socket.on("join", (data) => {

        const { name, paapaan, role } = data;

        /* ADMIN */
        if (role === "admin") {
            admin = socket.id;
            socket.emit("admin");

            // send players so admin can see track
            socket.emit("players", players);
            return;
        }

        /* SPECTATOR */
        if (role === "spectator") {
            socket.emit("players", players);
            return;
        }

        /* PLAYER */

        if (!name) return;

        // prevent duplicate names
        let exists = players.find(p => p.name === name);
        if (exists) {
            socket.emit("nameTaken");
            return;
        }

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

        console.log("Race started by admin");

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

        console.log("Race reset");

        raceStarted = false;
        finishOrder = [];

        players.forEach(p => p.position = 0);

        io.emit("positions", players);
    });

    socket.on("disconnect", () => {

        players = players.filter(p => p.id !== socket.id);

        if(socket.id === admin){
            admin = null;
        }

        io.emit("players", players);
    });

});

server.listen(process.env.PORT || 3000, () => {
    console.log("Server running...");
});