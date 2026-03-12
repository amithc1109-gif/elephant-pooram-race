const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

let players = [];
let raceStarted = false;

io.on("connection",(socket)=>{

console.log("Connected:",socket.id);


/* JOIN */

socket.on("join",(data)=>{

const {name,team,role} = data;


/* ADMIN */

if(role === "admin"){

socket.emit("admin");
return;

}


/* SPECTATOR */

if(role === "spectator"){

socket.emit("spectator");
return;

}


/* PLAYER */

if(role === "player"){

let player = {
id: socket.id,
name: name,
team: team,
position: 0
};

players.push(player);

socket.emit("player");

}

io.emit("players",players);
io.emit("positions",players);

});


/* MOVE */

socket.on("move",()=>{

if(!raceStarted) return;

let player = players.find(p => p.id === socket.id);

if(!player) return;

player.position += 25;


/* SPECIAL ELEPHANT */

if(
player.name === "കുന്നിൻച്ചരുവിൽ ജനീലിയ" &&
player.position > 400 &&
player.position < 600
){
player.position -= 40;
}


/* WINNER */

if(player.position >= 900){

raceStarted = false;

io.emit("winner",{
name: player.name,
team: player.team
});

}

io.emit("positions",players);

});


/* START RACE */

socket.on("startRace",()=>{

players.forEach(p=>{
p.position = 0;
});

io.emit("positions",players);

io.emit("countdown");

setTimeout(()=>{

raceStarted = true;

io.emit("raceStarted");

},3000);

});


/* RESET RACE */

socket.on("resetRace",()=>{

raceStarted = false;

players.forEach(p=>{
p.position = 0;
});

io.emit("positions",players);

io.emit("raceReset");

});


/* DISCONNECT */

socket.on("disconnect",()=>{

players = players.filter(p => p.id !== socket.id);

io.emit("players",players);
io.emit("positions",players);

});

});


const PORT = process.env.PORT || 3000;

server.listen(PORT,()=>{

console.log("Server running on",PORT);

});