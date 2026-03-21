const socket = io();

const role = localStorage.getItem("role") || "spectator";
const playerName = localStorage.getItem("playerName");
const paapaan = localStorage.getItem("paapaan");

let players = [];
let canRun = false;
let raceFinished = false;

/* JOIN */

socket.emit("join",{
name:playerName,
paapaan:paapaan,
role:role
});

/* hide bet */

if(role !== "spectator"){
document.getElementById("betSection").style.display="none";
}

/* PLAYERS */

socket.on("players",(data)=>{
players = data;
draw();
});

/* POSITIONS */

socket.on("positions",(data)=>{

if(raceFinished) return; // 🔥 prevent overwrite

players = data;

draw();

cameraFollow();

});

/* CAMERA FOLLOW */

function cameraFollow(){

let me = players.find(p=>p.name===playerName);

if(!me) return;

let camera = document.getElementById("camera");
let track = document.getElementById("track");

let offset = me.position - (camera.clientWidth/2);

if(offset < 0) offset = 0;

track.style.left = -offset + "px";

}

/* RUN */

function run(){
if(role==="player" && canRun){
socket.emit("move");
}
}

/* COUNTDOWN */

socket.on("countdown",()=>{

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

/* TOP 3 */

socket.on("top3",(list)=>{

raceFinished = true;

showResults(list);

launchFireworks();

});

/* RESULTS */

function showResults(list){

let html=`
<h2>🏆 Results</h2>

🥇 ${list[0].name} - ${list[0].paapaan}<br>
🥈 ${list[1].name} - ${list[1].paapaan}<br>
🥉 ${list[2].name} - ${list[2].paapaan}<br>
`;

if(role==="spectator"){

let bet=localStorage.getItem("myBet");

if(bet){

if(bet===list[0].name){
html+="<br>🎉 You WON!";
}else{
html+="<br>❌ You lost";
}

}

}

winner.innerHTML=html;

}

/* DRAW */

function draw(){

let html="";

players.forEach((p,i)=>{

let you = p.name===playerName ? "⭐" : "";

html+=`
<div class="lane">

<div class="start"></div>
<div class="finish"></div>

<b>Lane ${i+1}</b> ${you}<br>

<small>${p.name} - ${p.paapaan}</small>

<img class="elephant" src="elephant.png" style="left:${p.position}px;">

</div>
`;

});

track.innerHTML=html;

}

/* BET */

function placeBet(){

let val=document.getElementById("betChoice").value;

if(!val){
alert("Select elephant");
return;
}

localStorage.setItem("myBet",val);

alert("Bet placed!");

}

/* FIREWORKS */

function launchFireworks(){

let canvas=document.getElementById("fireworks");
let ctx=canvas.getContext("2d");

canvas.width=window.innerWidth;
canvas.height=window.innerHeight;

for(let i=0;i<150;i++){

ctx.fillStyle=`hsl(${Math.random()*360},100%,50%)`;

ctx.beginPath();

ctx.arc(Math.random()*canvas.width,Math.random()*canvas.height,4,0,Math.PI*2);

ctx.fill();

}

setTimeout(()=>{
ctx.clearRect(0,0,canvas.width,canvas.height);
},2000);

}