const socket = io();

const role = localStorage.getItem("role");
const playerName = localStorage.getItem("playerName");
const team = localStorage.getItem("team");
const pappan = localStorage.getItem("pappan");

let players=[];
let canRun=false;

/* join */

socket.emit("join",{name:playerName,team,pappan,role});

/* spectator betting */

if(role!=="spectator"){
document.getElementById("betSection").style.display="none";
}

/* admin controls */

if(role==="admin"){
runBtn.style.display="none";
adminBtn.style.display="inline-block";
resetBtn.style.display="inline-block";
}

/* players */

socket.on("players",(data)=>{

players=data;

draw();

/* betting options */

if(role==="spectator"){

let bet=document.getElementById("betChoice");

bet.innerHTML="";

players.forEach(p=>{

let opt=document.createElement("option");

opt.value=p.name;
opt.text=p.name;

bet.appendChild(opt);

});

}

});

/* movement */

socket.on("positions",(data)=>{

players=data;

draw();

});

/* countdown */

socket.on("countdown",()=>{

canRun=false;

let c=3;

let timer=setInterval(()=>{

winner.innerHTML=c;

c--;

if(c<0){

clearInterval(timer);

winner.innerHTML="GO!";

canRun=true;

}

},1000);

});

/* run */

function run(){

if(role==="player" && canRun){

socket.emit("move");

}

}

/* admin */

function start(){

socket.emit("startRace");

}

function resetRace(){

socket.emit("resetRace");

}

/* top3 */

socket.on("top3",(list)=>{

let html="<h2>🏆 Results</h2>";

html+=`🥇 ${list[0].name} - ${list[0].pappan}<br>`;
html+=`🥈 ${list[1].name} - ${list[1].pappan}<br>`;
html+=`🥉 ${list[2].name} - ${list[2].pappan}<br>`;

winner.innerHTML=html;

fireworks();

});

/* draw */

function draw(){

let html="";

players.forEach(p=>{

html+=`

<div class="lane">

<div class="start"></div>
<div class="finish"></div>

<span>${p.name}</span><br>
<small>Pappan: ${p.pappan}</small>

<div class="elephant" style="left:${p.position}px;">🐘</div>

</div>

`;

});

track.innerHTML=html;

}

/* fireworks */

function fireworks(){

let canvas=document.getElementById("fireworks");

let ctx=canvas.getContext("2d");

canvas.width=window.innerWidth;
canvas.height=window.innerHeight;

for(let i=0;i<200;i++){

ctx.fillStyle=`hsl(${Math.random()*360},100%,50%)`;

ctx.beginPath();

ctx.arc(Math.random()*canvas.width,Math.random()*canvas.height,5,0,Math.PI*2);

ctx.fill();

}

setTimeout(()=>{

ctx.clearRect(0,0,canvas.width,canvas.height);

},2500);

}