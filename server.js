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

console.log("Player connected:", socket.id);


/* PLAYER JOIN */

socket.on("join",(data)=>{

const {name,team} = data;

if(players.length < 10){

let player = {
id: socket.id,
name: name,
team: team,
position: 0
};

players.push(player);

/* first player becomes admin */

if(admin === null){
admin = socket.id;
socket.emit("admin");
}

socket.emit("player");

}else{

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

/* normal movement */

player.position += 25;


/* SPECIAL LOGIC
   "കുന്നിൻച്ചരുവിൽ ജനീലിയ" runs backward in the middle */

if(
player.name === "കുന്നിൻച്ചരുവിൽ ജനീലിയ" &&
player.position > 400 &&
player.position < 600
){
player.position -= 40;
}


/* CHECK WINNER */

if(player.position >= 900){

raceStarted = false;

io.emit("winner",{
name: player.name,
team: player.team
});

}

/* update everyone */

io.emit("positions", players);

});


/* START RACE */

socket.on("startRace", () => {

if(socket.id !== admin) return;

/* reset positions */

players.forEach(p=>{
p.position = 0;
});

io.emit("positions", players);

/* countdown */

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

players.forEach(p=>{
p.position = 0;
});

io.emit("positions", players);
io.emit("raceReset");

});


/* END RACE */

socket.on("endRace", () => {

if(socket.id !== admin) return;

raceStarted = false;

io.emit("raceEnded");

});


/* DISCONNECT */

socket.on("disconnect", () => {

console.log("Player disconnected:", socket.id);

players = players.filter(p => p.id !== socket.id);

/* reassign admin if needed */

if(socket.id === admin){

admin = players.length > 0 ? players[0].id : null;

if(admin){
io.to(admin).emit("admin");
}

}

io.emit("players", players);
io.emit("positions", players);

});

});


/* SERVER PORT (for Render hosting) */

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
console.log("Server running on port " + PORT);
});