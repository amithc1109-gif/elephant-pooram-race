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

        let player = {
            id: socket.id,
            name: name,
            position: 0
        };

        players.push(player);

        // first player becomes admin
        if(admin === null){
            admin = socket.id;
            socket.emit("admin");
        }

        io.emit("players", players);
    });


    socket.on("move", () => {

        if(!raceStarted) return;

        let player = players.find(p => p.id === socket.id);

        if(player){

            player.position += 20;

            if(player.position >= 900){

                raceStarted = false;

                io.emit("winner", player.name);
            }

            io.emit("positions", players);
        }

    });


    socket.on("startRace", () => {

        if(socket.id !== admin) return;

        raceStarted = true;

        players.forEach(p => p.position = 0);

        io.emit("raceStarted");
    });


socket.on("resetRace", () => {

    if(socket.id !== admin) return;

    raceStarted = false;

    players.forEach(p => p.position = 0);

    io.emit("positions", players);

    io.emit("raceReset");

});


    socket.on("disconnect", () => {

        players = players.filter(p => p.id !== socket.id);

        if(socket.id === admin){
            admin = players.length > 0 ? players[0].id : null;
        }

        io.emit("players", players);

    });

});


const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log("Server running on port " + PORT);
});