const socket = io();

let players=[];
let isPlayer=false;
let isAdmin=false;

let scoreV=0;
let scoreK=0;

const name=localStorage.getItem("playerName");
const team=localStorage.getItem("team");

socket.emit("join",{name,team});


socket.on("admin",()=>{

isAdmin=true;
adminBtn.style.display="inline-block";
resetBtn.style.display="inline-block";

});


socket.on("player",()=>{

isPlayer=true;

});


socket.on("players",(data)=>{

players=data;
draw();

});


socket.on("positions",(data)=>{

players=data;
draw();

});


socket.on("countdown",()=>{

let c=3;

let int=setInterval(()=>{

winner.innerHTML=c;

c--;

if(c<0){

clearInterval(int);
winner.innerHTML="GO!";

document.getElementById("chenda").play();

}

},1000);

});


socket.on("winner",(data)=>{

winner.innerHTML=data.name+" WON!";

if(data.team==="vadakkekara"){

scoreV++;

scoreVEl.innerText=scoreV;

}else{

scoreK++;
scoreKEl.innerText=scoreK;

}

launchFireworks();

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


function resetRace(){

if(isAdmin){

socket.emit("resetRace");

}

}


function draw(){

let html="";

players.forEach(p=>{

let pos=p.position;

if(p.name==="കുന്നിൻച്ചരുവിൽ ജനീലിയ" && pos>400 && pos<600){

pos-=60;

}

html+=`

<div class="lane">

<div class="start"></div>
<div class="finish"></div>

<span>${p.name}</span>

<img class="elephant" src="elephant.png" style="left:${pos}px">

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

for(let i=0;i<100;i++){

ctx.fillStyle="hsl("+Math.random()*360+",100%,50%)";

ctx.beginPath();

ctx.arc(
Math.random()*canvas.width,
Math.random()*canvas.height,
5,
0,
Math.PI*2
);

ctx.fill();

}

setTimeout(()=>{

ctx.clearRect(0,0,canvas.width,canvas.height);

},2000);

}