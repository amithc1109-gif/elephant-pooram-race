const socket = io();

let players=[];
let isPlayer=false;
let isAdmin=false;

let scoreV=0;
let scoreK=0;

const playerName=localStorage.getItem("playerName");
const team=localStorage.getItem("team");

socket.emit("join",{name:playerName,team});


/* ADMIN */

socket.on("admin",()=>{

isAdmin=true;

adminBtn.style.display="inline-block";
resetBtn.style.display="inline-block";

});


/* PLAYER ROLE */

socket.on("player",()=>{

isPlayer=true;

});


/* PLAYER LIST */

socket.on("players",(data)=>{

players=data;
draw();

});


/* POSITION UPDATE */

socket.on("positions",(data)=>{

players=data;
draw();

});


/* COUNTDOWN */

socket.on("countdown",()=>{

let c=3;

let interval=setInterval(()=>{

winner.innerHTML=c;

c--;

if(c<0){

clearInterval(interval);

winner.innerHTML="GO!";

/* start sound */

let start=document.getElementById("startSound");

if(start){
start.currentTime=0;
start.play();
}

}

},1000);

});


/* WINNER */

socket.on("winner",(data)=>{

winner.innerHTML=data.name+" WON!";

/* scoreboard */

if(data.team==="vadakkekara"){
scoreV++;
document.getElementById("scoreV").innerText=scoreV;
}else{
scoreK++;
document.getElementById("scoreK").innerText=scoreK;
}

/* win sound */

let win=document.getElementById("winSound");

if(win){
win.currentTime=0;
win.play();
}

/* fireworks */

launchFireworks();

});


/* RESET */

socket.on("raceReset",()=>{

winner.innerHTML="Race Reset";

});


/* RUN */

function run(){

if(isPlayer){
socket.emit("move");
}

}


/* START */

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

let html="";

players.forEach(p=>{

let pos=p.position;

/* special backward behaviour */

if(
p.name==="കുന്നിൻച്ചരുവിൽ ജനീലിയ" &&
pos>400 &&
pos<600
){
pos-=60;
}

html+=`

<div class="lane">

<div class="start"></div>
<div class="finish"></div>

<span>${p.name}</span>

<div class="elephant" style="left:${pos}px;">🐘</div>

</div>

`;

});

track.innerHTML=html;

}


/* FIREWORKS */

function launchFireworks(){

let canvas=document.getElementById("fireworks");

let ctx=canvas.getContext("2d");

canvas.width=window.innerWidth;
canvas.height=window.innerHeight;

let particles=[];

for(let i=0;i<120;i++){

particles.push({
x:canvas.width/2,
y:canvas.height/2,
vx:(Math.random()-0.5)*10,
vy:(Math.random()-0.5)*10,
color:"hsl("+Math.random()*360+",100%,50%)"
});

}

let frame=0;

let interval=setInterval(()=>{

ctx.clearRect(0,0,canvas.width,canvas.height);

particles.forEach(p=>{

p.x+=p.vx;
p.y+=p.vy;

ctx.fillStyle=p.color;

ctx.beginPath();
ctx.arc(p.x,p.y,4,0,Math.PI*2);
ctx.fill();

});

frame++;

if(frame>40){

clearInterval(interval);
ctx.clearRect(0,0,canvas.width,canvas.height);

}

},30);

}