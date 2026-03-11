const socket = io();

let players = [];
let isAdmin = false;
let isPlayer = false;

const playerName = localStorage.getItem("playerName");

/* JOIN GAME */

socket.emit("join", playerName);


/* ADMIN EVENT */

socket.on("admin", () => {

    isAdmin = true;

    document.getElementById("adminBtn").style.display = "inline-block";
    document.getElementById("endBtn").style.display = "inline-block";
    document.getElementById("resetBtn").style.display = "inline-block";

});


/* PLAYER ROLE */

socket.on("player", () => {

    isPlayer = true;

});


/* SPECTATOR ROLE */

socket.on("spectator", () => {

    document.getElementById("runBtn").style.display = "none";

    document.getElementById("winner").innerHTML =
    "👀 Spectator Mode - Watching Race";

});


/* PLAYER LIST */

socket.on("players", (data)=>{

    players = data;

    draw();

    const spec = document.getElementById("spectators");

    if(spec){
        spec.innerHTML = "Players: " + players.length + " / 10";
    }

});


/* POSITION UPDATES */

socket.on("positions",(data)=>{

    players = data;

    draw();

});


/* COUNTDOWN */

socket.on("countdown", () => {

let count = 3;

let interval = setInterval(()=>{

document.getElementById("winner").innerHTML = count;

count--;

if(count < 0){

clearInterval(interval);

document.getElementById("winner").innerHTML = "GO!";

}

},1000);

});


/* RACE START */

socket.on("raceStarted",()=>{

    document.getElementById("winner").innerHTML = "Race Started!";

});


/* RACE END */

socket.on("raceEnded",()=>{

    document.getElementById("winner").innerHTML = "Race Ended";

});


/* RACE RESET */

socket.on("raceReset", ()=>{

    document.getElementById("winner").innerHTML = "Race Reset";

});


/* WINNER */

socket.on("winner",(name)=>{

    document.getElementById("winner").innerHTML = name + " WON THE RACE!";

});


/* RUN BUTTON */

function run(){

    if(isPlayer){

        socket.emit("move");

    }

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


/* RESET RACE */

function resetRace(){

    if(isAdmin){

        socket.emit("resetRace");

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

<div class="elephant" style="left:${p.position}px;">
🐘
</div>

</div>
`;

});

document.getElementById("track").innerHTML = html;

}