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

io.on("connection", (socket) => {

    console.log("Player connected");

    socket.on("join", (name) => {

        if(players.length >= 10) return;

        players.push({
            id: socket.id,
            name: name,
            position: 0
        });

        io.emit("players", players);
    });

 socket.on("join", (name) => {

    if(players.length >= 10) return;

    let player = {
        id: socket.id,
        name: name,
        position: 0
    };

    players.push(player);

    if(admin === null){
        admin = socket.id;
        socket.emit("admin");
    }

    io.emit("players", players);
});

socket.on("startRace", () => {

    if(socket.id !== admin) return;

    raceStarted = true;

    players.forEach(p => p.position = 0);

    io.emit("raceStarted");

});

});

socket.on("endRace", () => {

    if(socket.id !== admin) return;

    raceStarted = false;

    io.emit("raceEnded");

});

server.listen(3000, () => {
    console.log("Server running on port 3000");
});
