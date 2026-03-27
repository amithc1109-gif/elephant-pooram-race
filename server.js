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
let timeLeft = 120;
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

        socket.spectatorName = name || "Spectator";

        socket.emit("players", players);
        socket.emit("bets", bets);
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

    if(!data || !data.choice) return;
    if(raceStarted) return;

    const choice = data.choice.trim(); // ✅ elephant name
    const name = (data.name || "Spectator").trim();

    let existing = bets.find(b => b.id === socket.id);

    if(existing){
        existing.choice = choice;
        existing.name = name;
    } else {
        bets.push({
            id: socket.id,
            name: name,
            choice: choice
        });
    }

    console.log("✅ Bets Stored:", bets);

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

        if(timer){
            clearInterval(timer);
            timer = null;
        }

        raceStarted = false;
        finishOrder = [];
        timeLeft = 120;

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
        io.emit("bets", bets); 
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
        timeLeft = 120;

        players.forEach(p=>{
            p.position = 0;
        });

        bets = [];
        io.emit("positions", players);
        io.emit("timer", timeLeft);
        io.emit("leaderboard", []);
        io.emit("raceReset"); // ✅ NEW EVENT
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

let sorted = [];

// 🥇 First: those who finished (correct order)
finishOrder.forEach(p => sorted.push(p));

// 🥈 Then: remaining players sorted by position
let remaining = players
    .filter(p => !finishOrder.find(f => f.id === p.id))
    .sort((a,b) => b.position - a.position);

sorted = [...sorted, ...remaining];

    sorted.forEach((p,i)=>{
    // Only award points to finishers
    if(!finishOrder.find(f => f.id === p.id)) return;

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

    io.emit("leaderboard", sorted);

    /* 🔥 MATCH USING ELEPHANT NAME */

/* 🔥 DETERMINE WINNER CORRECTLY */

let winnerElephant;

if(finishOrder.length > 0){
    winnerElephant = finishOrder[0].name.trim();
} else {
    let topPlayer = [...players].sort((a,b)=>b.position - a.position)[0];
    winnerElephant = topPlayer?.name?.trim();
}

const normalize = (str) => str?.trim();

let winners = bets.filter(b => 
    normalize(b.choice) === normalize(winnerElephant)
);

console.log("🏆 Winning Elephant:", winnerElephant);
console.log("🎯 Bet Winners:", winners);

io.emit("betResults", winners);
    bets = [];
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