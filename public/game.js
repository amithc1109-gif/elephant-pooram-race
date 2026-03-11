const socket = io();

let players = [];
let isAdmin = false;

const playerName = localStorage.getItem("playerName");

socket.emit("join", playerName);


/* ADMIN EVENT */

socket.on("admin", () => {

    isAdmin = true;

    document.getElementById("adminBtn").style.display = "inline-block";
    document.getElementById("endBtn").style.display = "inline-block";

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


/* RACE START */

socket.on("raceStarted",()=>{
    document.getElementById("winner").innerHTML = "Race Started!";
});


/* RACE END */

socket.on("raceEnded",()=>{
    document.getElementById("winner").innerHTML = "Race Ended";
});


/* WINNER */

socket.on("winner",(name)=>{
    document.getElementById("winner").innerHTML = name + " WON THE RACE!";
});


/* RUN BUTTON */

function run(){

    socket.emit("move");

}


/* START RACE */

function start(){

    if(isAdmin){
        socket.emit("startRace");
    }

}


/* END RACE */

function endRace(){

    if(isAdmin){
        socket.emit("endRace");
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