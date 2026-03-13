const socket=io();

const role=localStorage.getItem("role");
const playerName=localStorage.getItem("playerName");
const team=localStorage.getItem("team");
const pappan=localStorage.getItem("pappan");

let players=[];
let canRun=false;

let existingBet = localStorage.getItem("bet");

if(existingBet){

setTimeout(()=>{

let betSelect=document.getElementById("betChoice");

if(betSelect){

betSelect.value=existingBet;
betSelect.disabled=true;

}

let betBtn=document.querySelector("#betSection button");

if(betBtn) betBtn.disabled=true;

},500);

}

/* JOIN */

socket.emit("join",{name:playerName,team,pappan,role});

/* UI */

if(role==="admin"){
runBtn.style.display="none";
adminBtn.style.display="inline-block";
resetBtn.style.display="inline-block";
}

if(role==="spectator"){
runBtn.style.display="none";
}

/* betting only spectators */

if(role!=="spectator"){
document.getElementById("betSection").style.display="none";
}

/* PLAYERS */

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

/* POSITIONS */

socket.on("positions",(data)=>{

players=data;

draw();

});

/* COUNTDOWN */

socket.on("countdown",()=>{

canRun=false;

let c=3;

let interval=setInterval(()=>{

winner.innerHTML=c;

c--;

if(c<0){

clearInterval(interval);

winner.innerHTML="GO!";

canRun=true;

}

},1000);

});

/* RUN */

function run(){

if(role==="player" && canRun){

socket.emit("move");

}

}

/* ADMIN */

function start(){
socket.emit("startRace");
}

function resetRace(){
socket.emit("resetRace");
}

/* TOP 3 */

socket.on("top3",(list)=>{

showResults(list);

launchFireworks();

});

/* SHOW RESULTS */

function showResults(list){

let html="<h2>🏆 Race Results</h2>";

html+=`🥇 ${list[0].name} - ${list[0].pappan}<br>`;
html+=`🥈 ${list[1].name} - ${list[1].pappan}<br>`;
html+=`🥉 ${list[2].name} - ${list[2].pappan}<br>`;

let bet=localStorage.getItem("bet");

if(bet){

if(bet===list[0].name){

html+="<br><b style='color:lime;font-size:22px'>🎉 You WON your bet!</b>";

}else{

html+="<br><b style='color:red;font-size:22px'>❌ You lost your bet</b>";

}

}

document.getElementById("winner").innerHTML=html;

}

/* DRAW TRACK */

function draw(){

let html="";

players.forEach((p,index)=>{

let pos=p.position;

let you="";

if(p.name===playerName){
you=" ⭐ YOU";
}

html+=`

<div class="lane">

<div class="start"></div>
<div class="finish"></div>

<b>Lane ${index+1}</b><br>

<span>${p.name}${you}</span><br>
<small>Pappan: ${p.pappan}</small>

<div class="elephant" style="left:${pos}px;">🐘</div>

</div>

`;

});

track.innerHTML=html;

}

/* BET */

function placeBet(){

let choice=document.getElementById("betChoice").value;

if(!choice){
alert("Select an elephant first");
return;
}

/* lock bet */

localStorage.setItem("bet",choice);

document.getElementById("betChoice").disabled=true;
document.querySelector("#betSection button").disabled=true;

alert("Bet placed for "+choice);

}

/* FIREWORKS */

function launchFireworks(){

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