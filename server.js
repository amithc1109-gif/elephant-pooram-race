const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

app.get("/players", (req,res)=>{
    res.json(players);
});

let players = [];
let admin = null;
let raceStarted = false;
let finishOrder = [];

let timer = null;
let timeLeft = 60;

const FINISH = 1200;

io.on("connection", (socket) => {

    console.log("Connected:", socket.id);

    socket.on("join", (data) => {

        const { name, paapaan, role } = data;

        /* ADMIN */
        if(role === "admin"){
            admin = socket.id;
            socket.emit("admin");
            socket.emit("players", players);
            return;
        }

        /* SPECTATOR */
        if(role === "spectator"){
            socket.emit("players", players);
            return;
        }

        /* PLAYER */

        if(!name) return;

        // prevent duplicate elephant
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

    /* MOVE */
    socket.on("move", () => {

        if(!raceStarted) return;

        let player = players.find(p => p.id === socket.id);
        if(!player) return;

        player.position += 25;

        if(player.position >= FINISH){
            player.position = FINISH;

            if(!finishOrder.find(p => p.id === player.id)){
                finishOrder.push(player);
            }

            if(finishOrder.length === players.length){
                endRace();
            }
        }

        io.emit("positions", players);
    });

    /* START RACE */
    socket.on("startRace", () => {

        if(socket.id !== admin) return;

        // clear old timer
        if(timer){
            clearInterval(timer);
            timer = null;
        }

        raceStarted = false;
        finishOrder = [];
        timeLeft = 60;

        players.forEach(p => p.position = 0);

        io.emit("positions", players);
        io.emit("countdown");

        setTimeout(()=>{

            raceStarted = true;

            io.emit("timer", timeLeft);

            timer = setInterval(()=>{

                timeLeft--;
                io.emit("timer", timeLeft);

                if(timeLeft <= 0){
                    clearInterval(timer);
                    timer = null;
                    endRace();
                }

            },1000);

        },3000);
    });

    /* RESET */
    socket.on("resetRace", () => {

        if(socket.id !== admin) return;

        if(timer){
            clearInterval(timer);
            timer = null;
        }

        raceStarted = false;
        finishOrder = [];
        timeLeft = 60;

        players.forEach(p=>{
            p.position = 0;
            p.points = 0; // reset points
        });

        io.emit("positions", players);
        io.emit("timer", timeLeft);
        io.emit("leaderboard", []);
    });

    /* REMOVE PLAYER */
    socket.on("removePlayer", (id)=>{
        if(socket.id !== admin) return;

        players = players.filter(p => p.id !== id);
        io.emit("players", players);
    });

    function endRace(){

        raceStarted = false;

        if(timer){
            clearInterval(timer);
            timer = null;
        }

        let sorted = [...players].sort((a,b)=>b.position - a.position);

        sorted.forEach((p,i)=>{
            if(i===0) p.points += 15;
            else if(i===1) p.points += 12;
            else if(i===2) p.points += 10;
            else if(i===3) p.points += 8;
            else if(i===4) p.points += 7;
            else if(i===5) p.points += 6;
            else if(i===6) p.points += 5;
            else if(i===7) p.points += 4;
            else if(i===8) p.points += 2;
            else if(i===9) p.points += 1;
            else p.points += 0;
        });

        io.emit("top3", sorted.slice(0,3));
        io.emit("leaderboard", sorted);
    }

    socket.on("disconnect", ()=>{
        players = players.filter(p => p.id !== socket.id);

        if(socket.id === admin){
            admin = null;
        }

        io.emit("players", players);
    });

});

server.listen(process.env.PORT || 3000, ()=>{
    console.log("Server running...");
});