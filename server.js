const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

/* ================= GLOBAL STATE ================= */

let players = [];   // ✅ FIX: declared BEFORE API
let raceStarted = false;
let finishOrder = [];

let timer = null;
let timeLeft = 60;

let boosts = [];

const FINISH = 1200;

/* ================= API (FOR TEAM PAGE) ================= */

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

    /* ================= MOVE ================= */

    socket.on("move", () => {

        if(!raceStarted) return;

        let player = players.find(p => p.id === socket.id);
        if(!player) return;

        player.position += 25;

        /* 🥥 BOOST LOGIC */
        let boost = boosts.find(b => b.playerId === player.id && !b.used);

        if(boost && player.position >= boost.position){
            player.position += 100;
            boost.used = true;

            io.emit("boostTaken", player.id);
        }

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

    socket.on("startRace", (data) => {

        if(data?.role !== "admin") return;

        console.log("Race started by admin");

        if(timer){
            clearInterval(timer);
            timer = null;
        }

        raceStarted = false;
        finishOrder = [];
        timeLeft = 60;

        players.forEach(p => p.position = 0);

        /* 🥥 GENERATE BOOSTS */
        boosts = players.map(p => ({
            playerId: p.id,
            position: Math.floor(Math.random() * 800) + 200,
            used: false
        }));

        io.emit("boosts", boosts);
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

    /* ================= RESET RACE ================= */

    socket.on("resetRace", (data) => {

        if(data?.role !== "admin") return;

        console.log("Race reset by admin");

        if(timer){
            clearInterval(timer);
            timer = null;
        }

        raceStarted = false;
        finishOrder = [];
        timeLeft = 60;
        boosts = [];

        players.forEach(p=>{
            p.position = 0;
            p.points = 0;
        });

        io.emit("positions", players);
        io.emit("timer", timeLeft);
        io.emit("leaderboard", []);
        io.emit("boosts", boosts);
    });

    /* ================= REMOVE PLAYER ================= */

    socket.on("removePlayer", (id, data)=>{

        if(data?.role !== "admin") return;

        players = players.filter(p => p.id !== id);

        io.emit("players", players);
    });

    /* ================= END RACE ================= */

    function endRace(){

        raceStarted = false;

        if(timer){
            clearInterval(timer);
            timer = null;
        }

        let sorted = [...players].sort((a,b)=>b.position - a.position);

        /* 🏆 POINT SYSTEM */
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
        });

        io.emit("top3", sorted.slice(0,3));
        io.emit("leaderboard", sorted);
    }

    /* ================= DISCONNECT ================= */

    socket.on("disconnect", ()=>{

        players = players.filter(p => p.id !== socket.id);

        io.emit("players", players);
    });

});

/* ================= SERVER ================= */

server.listen(process.env.PORT || 3000, ()=>{
    console.log("Server running...");
});