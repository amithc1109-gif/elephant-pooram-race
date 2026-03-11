const socket = io();

let players = [];

/* get player name from previous page */
const playerName = localStorage.getItem("playerName");

/* send join request again when page loads */
socket.emit("join", playerName);


socket.on("players", (data)=>{
players = data;
draw();
});


socket.on("positions",(data)=>{
players = data;
draw();
});


socket.on("raceStarted",()=>{
document.getElementById("winner").innerHTML="";
});


socket.on("winner",(name)=>{
document.getElementById("winner").innerHTML = name + " WON THE RACE!";
});


function run(){
socket.emit("move");
}


function start(){
socket.emit("startRace");
}


function draw(){

let html="";

players.forEach(p=>{

html+=`
<div class="lane">

<div class="start"></div>
<div class="finish"></div>

<span>${p.name}</span>

<div class="elephant" style="transform:translateX(${p.position}px)">
🐘
</div>

</div>
`;

});

document.getElementById("track").innerHTML=html;

}