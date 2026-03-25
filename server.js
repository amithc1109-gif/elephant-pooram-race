const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

/* ================= GLOBAL STATE ================= */

let players = [];
let raceStarted = false;
let finishOrder = [];
let admin = null;
let timer = null;
let timeLeft = 60;
let bets = [];

const FINISH = 1200;

/* ================= API ================= */

app.get("/players", (req, res) => {
    res.json(players);
});

/* ================= SOCKET ================= */

io.on("connection", (socket) => {

    console.log("Connected:", socket.id);

    /* ================= JOIN ================= */

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

    /* ================= BET ================= */

    socket.on("placeBet", (data) => {

        if(data.role !== "spectator") return;

        // 🔒 prevent betting after race starts
        if(raceStarted) return;

        // ❌ prevent duplicate bet
        let exists = bets.find(b => b.id === socket.id);
        if(exists) return;

        bets.push({
            id: socket.id,
            name: data.name || "Spectator",
            choice: data.choice
        });

        io.emit("bets", bets);
    });

    /* ================= MOVE ================= */

    socket.on("move", () => {

        if(!raceStarted) return;

        let player = players.find(p => p.id === socket.id);
        if(!player) return;

        if(player.position >= FINISH) return;

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

    /* ================= START RACE ================= */

    socket.on("startRace", () => {

        if(socket.id !== admin) return;

        bets = []; // reset bets

        if(timer){
            clearInterval(timer);
            timer = null;
        }

        raceStarted = false;
        finishOrder = [];
        timeLeft = 60;

        players.forEach(p => p.position = 0);

        io.emit("positions", players);
        io.emit("timer", timeLeft);
        io.emit("countdown");

        setTimeout(()=>{

            raceStarted = true;

            timer = setInterval(()=>{

                if(timeLeft <= 0){
                    clearInterval(timer);
                    timer = null;
                    endRace();
                    return;
                }

                timeLeft--;
                io.emit("timer", timeLeft);

            },1000);

        },3000);
    });

    /* ================= RESET RACE ================= */

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
        });

        io.emit("positions", players);
        io.emit("timer", timeLeft);
        io.emit("leaderboard", []);
    });

    /* ================= REMOVE PLAYER ================= */

    socket.on("removePlayer", (data)=>{

        if(!data || data.role !== "admin") return;

        players = players.filter(p => p.id !== data.id);

        io.emit("players", players);
    });

    /* ================= END RACE ================= */

    function endRace(){

        raceStarted = false;

        if(timer){
            clearInterval(timer);
            timer = null;
        }

        let finishedPlayers = [...finishOrder];

        let notFinished = players.filter(p => 
            !finishOrder.find(f => f.id === p.id)
        );

        /* 🏆 POINT SYSTEM */
        finishedPlayers.forEach((p,i)=>{
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
        });

        // not finished → 0 pts
        notFinished.forEach(p => p.points += 0);

        let finalList = [...finishedPlayers, ...notFinished];

        io.emit("top3", finishedPlayers.slice(0,3));
        io.emit("leaderboard", finalList);

        /* 🎯 BET RESULTS */
        let winner = finalList[0]?.name;
        let winners = bets.filter(b => b.choice === winner);

        io.emit("betResults", winners);
    }

    /* ================= DISCONNECT ================= */

    socket.on("disconnect", ()=>{

        players = players.filter(p => p.id !== socket.id);

        // remove bet if spectator leaves
        bets = bets.filter(b => b.id !== socket.id);

        if(socket.id === admin){
            admin = null;
        }

        io.emit("players", players);
        io.emit("bets", bets);
    });

});

/* ================= SERVER ================= */

server.listen(process.env.PORT || 3000, ()=>{
    console.log("Server running...");
});