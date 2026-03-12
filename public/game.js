const socket = io();

let players = [];
let isAdmin = false;
let isPlayer = false;

const playerName = localStorage.getItem("playerName");

socket.emit("join", playerName);


/* ADMIN */

socket.on("admin", ()=>{

isAdmin=true;

adminBtn.style.display="inline-block";
endBtn.style.display="inline-block";
resetBtn.style.display="inline-block";

});


/* PLAYER ROLE */

socket.on("player", ()=>{

isPlayer=true;

});


/* SPECTATOR */

socket.on("spectator", ()=>{

runBtn.style.display="none";

winner.innerHTML="👀 Spectator Mode";

});


/* PLAYER LIST */

socket.on("players",(data)=>{

players=data;

draw();

});


/* POSITIONS */

socket.on("positions",(data)=>{

players=data;

draw();

});


/* COUNTDOWN */

socket.on("countdown", ()=>{

let c=3;

let interval=setInterval(()=>{

winner.innerHTML=c;

c--;

if(c<0){

clearInterval(interval);

winner.innerHTML="GO!";

}

},1000);

});


socket.on("raceStarted", ()=>{

winner.innerHTML="Race Started!";

});


socket.on("winner",(name)=>{

winner.innerHTML=name+" WON THE RACE!";

});


socket.on("raceReset", ()=>{

winner.innerHTML="Race Reset";

});


function run(){

if(isPlayer){

socket.emit("move");

}

}


function start(){

if(isAdmin){

socket.emit("startRace");

}

}


function endRace(){

if(isAdmin){

socket.emit("endRace");

}

}


function resetRace(){

if(isAdmin){

socket.emit("resetRace");

}

}


function draw(){

let html="";

players.forEach(p=>{

let position=p.position;

if(p.name==="കുന്നിൻച്ചരുവിൽ ജനീലിയ" && position>400 && position<600){

position-=50;   // runs backward in middle

}

html+=`

<div class="lane">

<div class="start"></div>

<div class="finish"></div>

<span>${p.name}</span>

<div class="elephant" style="left:${position}px;">🐘</div>

</div>

`;

});

track.innerHTML=html;

}