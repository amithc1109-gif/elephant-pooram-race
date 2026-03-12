const socket = io();

/* ROLE */

const role = localStorage.getItem("role");

/* PLAYER INFO */

const playerName = localStorage.getItem("playerName");
const team = localStorage.getItem("team");

let players = [];

let isAdmin = false;
let isPlayer = false;

/* SCORE */

let scoreV = 0;
let scoreK = 0;


/* ROLE UI */

if(role === "spectator"){
document.getElementById("runBtn").style.display = "none";
}

if(role === "admin"){
isAdmin = true;

document.getElementById("adminBtn").style.display = "inline-block";
document.getElementById("resetBtn").style.display = "inline-block";
}


/* JOIN SERVER */

socket.emit("join",{
name:playerName,
team:team,
role:role
});


/* PLAYER LIST */

socket.on("players",(data)=>{

players = data;

draw();

});


/* POSITION UPDATE */

socket.on("positions",(data)=>{

players = data;

draw();

});


/* COUNTDOWN */

socket.on("countdown",()=>{

let c = 3;

let interval = setInterval(()=>{

document.getElementById("winner").innerHTML = c;

c--;

if(c < 0){

clearInterval(interval);

document.getElementById("winner").innerHTML = "GO!";

/* play start sound */

let startSound = document.getElementById("startSound");

if(startSound){
startSound.currentTime = 0;
startSound.play();
}

}

},1000);

});


/* WINNER */

socket.on("winner",(data)=>{

document.getElementById("winner").innerHTML = data.name + " WON!";


/* SCOREBOARD */

if(data.team === "vadakkekara"){

scoreV++;

document.getElementById("scoreV").innerText = scoreV;

}else{

scoreK++;

document.getElementById("scoreK").innerText = scoreK;

}


/* WIN SOUND */

let winSound = document.getElementById("winSound");

if(winSound){
winSound.currentTime = 0;
winSound.play();
}


/* FIREWORKS */

launchFireworks();

});


/* RESET */

socket.on("raceReset",()=>{

document.getElementById("winner").innerHTML = "Race Reset";

});


/* RUN BUTTON */

function run(){

if(role === "player"){
socket.emit("move");
}

}


/* START RACE */

function start(){

if(isAdmin){
socket.emit("startRace");
}

}


/* RESET */

function resetRace(){

if(isAdmin){
socket.emit("resetRace");
}

}


/* DRAW TRACK */

function draw(){

let html = "";

players.forEach(p=>{

let pos = p.position;

/* SPECIAL ELEPHANT */

if(
p.name === "കുന്നിൻച്ചരുവിൽ ജനീലിയ" &&
pos > 400 &&
pos < 600
){
pos -= 60;
}

html += `

<div class="lane">

<div class="start"></div>
<div class="finish"></div>

<span>${p.name}</span>

<div class="elephant" style="left:${pos}px;">🐘</div>

</div>

`;

});

document.getElementById("track").innerHTML = html;

}


/* FIREWORKS */

function launchFireworks(){

let canvas = document.getElementById("fireworks");

let ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let particles = [];

for(let i=0;i<120;i++){

particles.push({
x:canvas.width/2,
y:canvas.height/2,
vx:(Math.random()-0.5)*10,
vy:(Math.random()-0.5)*10,
color:"hsl("+Math.random()*360+",100%,50%)"
});

}

let frame = 0;

let interval = setInterval(()=>{

ctx.clearRect(0,0,canvas.width,canvas.height);

particles.forEach(p=>{

p.x += p.vx;
p.y += p.vy;

ctx.fillStyle = p.color;

ctx.beginPath();
ctx.arc(p.x,p.y,4,0,Math.PI*2);
ctx.fill();

});

frame++;

if(frame > 40){

clearInterval(interval);
ctx.clearRect(0,0,canvas.width,canvas.height);

}

},30);

}