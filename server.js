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


    /* PLAYER JOIN */

    socket.on("join", (name) => {

        if(players.length < 10){

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

            socket.emit("player");

        } else {

            socket.emit("spectator");

        }

        io.emit("players", players);
        io.emit("positions", players);

    });


    /* PLAYER MOVE */

    socket.on("move", () => {

        if(!raceStarted) return;

        let player = players.find(p => p.id === socket.id);

        if(!player) return;

        player.position += 25;

        if(player.position >= 900){

            raceStarted = false;

            io.emit("winner", player.name);

        }

        io.emit("positions", players);

    });


    /* START RACE */

    socket.on("startRace", () => {

        if(socket.id !== admin) return;

        players.forEach(p => p.position = 0);

        io.emit("positions", players);

        io.emit("countdown");

        setTimeout(()=>{

            raceStarted = true;

            io.emit("raceStarted");

        },3000);

    });


    /* RESET RACE */

    socket.on("resetRace", () => {

        if(socket.id !== admin) return;

        raceStarted = false;

        players.forEach(p => p.position = 0);

        io.emit("positions", players);

        io.emit("raceReset");

    });


    /* END RACE */

    socket.on("endRace", () => {

        if(socket.id !== admin) return;

        raceStarted = false;

        io.emit("raceEnded");

    });


    /* PLAYER DISCONNECT */

    socket.on("disconnect", () => {

        players = players.filter(p => p.id !== socket.id);

        if(socket.id === admin){
            admin = players.length > 0 ? players[0].id : null;
        }

        io.emit("players", players);
        io.emit("positions", players);

    });

});


const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log("Server running on port " + PORT);
});