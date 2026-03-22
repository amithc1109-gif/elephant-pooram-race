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
let timer = null;

const FINISH = 1200;
const RACE_TIME = 60;

io.on("connection", (socket) => {

    socket.on("join", (data) => {

        const { name, paapaan, role } = data;

        if(role === "admin"){
            admin = socket.id;
            socket.emit("admin");
            socket.emit("players", players);
            return;
        }

        if(role === "spectator"){
            socket.emit("players", players);
            return;
        }

        // 🚫 BLOCK DUPLICATE ELEPHANT
        let exists = players.find(p => p.name === name);
        if(exists){
            socket.emit("nameTaken");
            return;
        }

        players.push({
            id: socket.id,
            name,
            paapaan,
            position: 0,
            points: 0
        });

        io.emit("players", players);
    });

    socket.on("move", () => {

        if(!raceStarted) return;

        let player = players.find(p => p.id === socket.id);
        if(!player) return;

        player.position += 25;

        if(player.position >= FINISH){

            player.position = FINISH;

            if(!finishOrder.find(p=>p.id === player.id)){
                finishOrder.push(player);
            }

            if(finishOrder.length === players.length){
                endRace();
            }
        }

        io.emit("positions", players);
    });

    socket.on("startRace", () => {

        if(socket.id !== admin) return;

        players.forEach(p => p.position = 0);
        finishOrder = [];

        io.emit("positions", players);
        io.emit("countdown");

        setTimeout(()=>{
            raceStarted = true;

            let timeLeft = RACE_TIME;

            io.emit("timer", timeLeft);

            timer = setInterval(()=>{
                timeLeft--;
                io.emit("timer", timeLeft);

                if(timeLeft <= 0){
                    clearInterval(timer);
                    endRace();
                }

            },1000);

        },3000);
    });

    function endRace(){

        raceStarted = false;
        clearInterval(timer);

        // 🏆 SORT
        let sorted = [...players].sort((a,b)=>b.position - a.position);

        // 🎯 POINTS
        sorted.forEach((p,i)=>{
            if(i===0) p.points += 20;
            else if(i===1) p.points += 15;
            else if(i===2) p.points += 10;
            else p.points += 5;
        });

        io.emit("top3", sorted.slice(0,3));
        io.emit("leaderboard", sorted);
    }

    socket.on("removePlayer", (id)=>{
        if(socket.id !== admin) return;

        players = players.filter(p=>p.id !== id);
        io.emit("players", players);
    });

    socket.on("disconnect", ()=>{
        players = players.filter(p=>p.id !== socket.id);
        io.emit("players", players);
    });

});

server.listen(process.env.PORT || 3000);