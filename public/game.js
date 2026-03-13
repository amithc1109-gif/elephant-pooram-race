const socket=io();

const role=localStorage.getItem("role")||"spectator";
const playerName=localStorage.getItem("playerName");
const team=localStorage.getItem("team");
const paapaan=localStorage.getItem("paapaan");

let players=[];
let canRun=false;

/* join */

socket.emit("join",{
name:playerName,
team:team,
paapaan:paapaan,
role:role
});

/* spectator UI */

if(role==="spectator"){

document.getElementById("runBtn").style.display="none";

}

/* players update */

socket.on("players",(data)=>{

players=data;

draw();

/* populate betting */

if(role==="spectator"){

let select=document.getElementById("betChoice");

if(!select)return;

select.innerHTML="<option>Select Elephant</option>";

players.forEach(p=>{

let opt=document.createElement("option");

opt.value=p.name;
opt.text=p.name;

select.appendChild(opt);

});

}

});

/* position updates */

socket.on("positions",(data)=>{

players=data;

draw();

});

/* countdown */

socket.on("countdown",()=>{

let c=3;

let timer=setInterval(()=>{

document.getElementById("winner").innerHTML=c;

c--;

if(c<0){

clearInterval(timer);

document.getElementById("winner").innerHTML="GO!";

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

/* betting */

function placeBet(){

let select=document.getElementById("betChoice");

let bet=select.value;

if(!bet){

alert("Select elephant");

return;

}

/* each spectator stores own bet */

localStorage.setItem("myBet",bet);

alert("Your bet: "+bet);

}

/* results */

socket.on("top3",(list)=>{

showResults(list);

launchFireworks();

});

function showResults(list){

let html="<h2>🏆 Race Results</h2>";

html+=`🥇 ${list[0].name} - ${list[0].paapaan}<br>`;
html+=`🥈 ${list[1].name} - ${list[1].paapaan}<br>`;
html+=`🥉 ${list[2].name} - ${list[2].paapaan}<br>`;

let bet=localStorage.getItem("myBet");

if(bet){

if(bet===list[0].name){

html+="<br><b style='color:green'>🎉 You WON your bet!</b>";

}else{

html+="<br><b style='color:red'>❌ You lost your bet</b>";

}

}

document.getElementById("winner").innerHTML=html;

}

/* draw track */

function draw(){

let html="";

players.forEach((p,i)=>{

let you="";

if(p.name===playerName){
you=" ⭐ YOU";
}

html+=`

<div class="lane">

<div class="start"></div>
<div class="finish"></div>

<b>Lane ${i+1}</b><br>

<span>${p.name}${you}</span><br>
<small>Paapaan: ${p.paapaan}</small>

<div class="elephant" style="left:${p.position}px;">🐘</div>

</div>

`;

});

document.getElementById("track").innerHTML=html;

}

/* fireworks */

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