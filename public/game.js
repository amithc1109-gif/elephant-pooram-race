const socket = io();

let players = [];
let isAdmin = false;

/* get player name */
const playerName = localStorage.getItem("playerName");

/* join game */
socket.emit("join", playerName);


/* ADMIN EVENT */
socket.on("admin", () => {
    isAdmin = true;

    const btn = document.getElementById("adminBtn");

    if(btn){
        btn.style.display = "inline-block";
    }
});


/* PLAYER LIST */
socket.on("players", (data)=>{
    players = data;
    draw();
});


/* POSITION UPDATES */
socket.on("positions",(data)=>{
    players = data;
    draw();
});


/* RACE STARTED */
socket.on("raceStarted",()=>{
    document.getElementById("winner").innerHTML = "Race Started!";
});


/* WINNER */
socket.on("winner",(name)=>{
    document.getElementById("winner").innerHTML = name + " WON THE RACE!";
});


/* RUN BUTTON */
function run(){
    socket.emit("move");
}


/* ADMIN START */
function start(){
    if(isAdmin){
        socket.emit("startRace");
    }
}


/* DRAW TRACK */
function draw(){

let html = "";

players.forEach(p=>{

html += `
<div class="lane">

<div class="start"></div>
<div class="finish"></div>

<span>${p.name}</span>

<div class="elephant" style="transform: translateX(${p.position}px);">
🐘
</div>

</div>
`;

});

document.getElementById("track").innerHTML = html;

}