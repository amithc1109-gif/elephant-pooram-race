const socket = io();

const role = localStorage.getItem("role");
const playerName = localStorage.getItem("playerName");
const paapaan = localStorage.getItem("paapaan");

let players = [];
let canRun = false;
let myBet = null;

/* 🚫 iOS DOUBLE TAP ZOOM FIX */
let lastTouchEnd = 0;

document.addEventListener('touchend', function (event) {
let now = (new Date()).getTime();
if (now - lastTouchEnd <= 300) {
event.preventDefault();
}
lastTouchEnd = now;
}, false);


window.onload = () => {

    let betSection = document.getElementById("betSection");

    if(role === "spectator"){
        betSection.style.display = "block";
    } else {
        betSection.style.display = "none";
    }

};

/* ================= JOIN (FIXED) ================= */

if(role === "admin"){
    socket.emit("join", { role: "admin" });
}
else if(role === "spectator"){
        let spectatorName = localStorage.getItem("spectatorName");

    socket.emit("join", {
        role: "spectator",
        name: spectatorName
    });
}
else{
    socket.emit("join", {
        name: playerName,
        paapaan: paapaan,
        role: "player"
    });
}

/* ================= ADMIN ================= */

socket.on("admin", ()=>{
    document.getElementById("adminControls").style.display = "block";
    document.getElementById("runBtn").style.display = "none";
});

/* ================= PLAYERS ================= */

socket.on("players",(data)=>{

    console.log("PLAYERS:", data); // 🔥 DEBUG

    players = data;

    draw();

    if(role === "spectator"){
        let bet = document.getElementById("betChoice");
        if(!bet) return;

        bet.innerHTML = "";

        data.forEach(p=>{
            let o = document.createElement("option");
            o.value = p.name;
            o.text = p.name;
            bet.appendChild(o);
        });
    }
});

/* ================= POSITIONS ================= */

socket.on("positions",(data)=>{
    players = data;
    draw();
});

/* ================= RUN ================= */

function run(){
    if(role === "player" && canRun){
        socket.emit("move");
    }
}

/* ================= ADMIN ACTIONS ================= */

function startRace(){
    socket.emit("startRace", { role: "admin" });
}

function resetRace(){
    socket.emit("resetRace", { role: "admin" });
}

/* ================= TIMER ================= */

socket.on("timer",(t)=>{
    let el = document.getElementById("timer");
    if(el) el.innerHTML = "⏱ " + t + "s";
});

/* ================= COUNTDOWN ================= */

socket.on("countdown",()=>{

    
    canRun = false;
    
    let el = document.getElementById("winner");
    if(!el) return; // 🔥 PREVENT CRASH

    let c = 3;

    let i = setInterval(()=>{
        document.getElementById("winner").innerHTML = c;
        c--;

        if(c < 0){
            clearInterval(i);
            document.getElementById("winner").innerHTML = "GO!";
            canRun = true;
        }

    },1000);
});

/* ================= LEADERBOARD ================= */

socket.on("leaderboard",(list)=>{

let betSection = document.getElementById("betSection");
if(betSection){
    betSection.style.display = "none"; // 🔥 hide after race
}
    
/* SORT SAFETY (IMPORTANT) */
list.sort((a,b)=>b.points - a.points);

let html = "<h2>🏆 Results & Leaderboard</h2>";

    list.forEach((p,i)=>{

        let medal = "";

        if(i === 0) medal = "🥇";
        else if(i === 1) medal = "🥈";
        else if(i === 2) medal = "🥉";
        else medal = (i+1) + ".";

        html += `
        <div style="margin:5px 0;">
            ${medal} ${p.name} - ${p.paapaan || ""} → ${p.points} pts
        </div>
        `;
    });
html += "</div>";

let lb = document.getElementById("leaderboard");
if(lb) lb.innerHTML = html;

/* BET RESULT (ONLY SPECTATOR) */
if(role==="spectator" && myBet){

if(myBet === list[0]?.name){
msg="🎉 You WON your bet!";
}else{
msg="❌ You lost your bet";
}

 let resultDiv = document.getElementById("betResult");
        if(resultDiv){
            resultDiv.innerHTML = `<h3>${msg}</h3>`;
        }

}

});
/* ================= BET ================= */

function placeBet(){

    if(role !== "spectator") return;

    let val = document.getElementById("betChoice");
    if(!val) return;

    myBet = val.value;

 socket.emit("placeBet", {
        choice: myBet

    });

    alert("Bet locked: " + myBet);
}

/* ================= LIVE BET TABLE ================= */

socket.on("bets", (bets) => {

    let container = document.getElementById("betSection");
    if(!container) return;

    let grouped = {};

    bets.forEach(b => {
        if(!grouped[b.choice]){
            grouped[b.choice] = [];
        }
        grouped[b.choice].push(b.name);
    });

    let html = "<h3>🎯 Live Bets</h3>";
    html += `
    <table style="width:100%; border-collapse: collapse;">
        <tr style="font-weight:bold;">
            <td>Elephant</td>
            <td>Paapaan</td>
            <td>Bets</td>
        </tr>
    `;

    players.forEach(p => {

        let count = grouped[p.name]?.length || 0;

        html += `
        <tr>
            <td>${p.name}</td>
            <td>${p.paapaan || "-"}</td>
            <td>${count}</td>
        </tr>
        `;
    });

    html += "</table>";

    container.innerHTML = html;
});


/* ================= DRAW (CRITICAL FIX) ================= */

function draw(){

    let track = document.getElementById("track");
    if(!track) return;

    if(players.length === 0){
        track.innerHTML = "<p>No players joined yet...</p>";
        return;
    }

    let html = "";

    players.forEach((p,i)=>{

        let isMe = (p.name === playerName);

        html += `
        <div class="lane">

            <div class="start"></div>
            <div class="finish"></div>

            <div class="lane-info">
                Lane ${i+1} ${isMe ? "⭐ YOU":""}<br>
                ${p.name}<br>
                ${p.paapaan || ""}
            </div>

            <div class="elephant" style="left:${p.position}px; transform: scaleX(-1);">
                🐘
            </div>

${role==="admin" ? `
<div class="remove-container">
    <button class="remove-btn" onclick="removePlayer('${p.id}')">❌</button>
</div>
` : ""}

        </div>
        `;
    });

    track.innerHTML = html;

/* 🎯 SMART CAMERA FOLLOW (SMOOTH + STABLE) */

let me = players.find(p => p.name === playerName);

if(me){

    let cam = document.getElementById("camera");
    if(!cam) return;

    let laneIndex = players.findIndex(p => p.name === playerName);
    let laneHeight = 80; // MUST match your CSS .lane height

    // 🎯 Target positions
    let targetLeft = me.position - (cam.clientWidth / 2);
    let targetTop = (laneIndex * laneHeight) - (cam.clientHeight / 2);

    // Prevent negative scroll
    targetLeft = Math.max(0, targetLeft);
    targetTop = Math.max(0, targetTop);

    // 🔥 Smooth but NOT jumpy (important fix)
    cam.scrollLeft += (targetLeft - cam.scrollLeft) * 0.2;
    cam.scrollTop += (targetTop - cam.scrollTop) * 0.2;
}
}

/* ================= BET WINNERS ================= */

socket.on("betResults", (winners) => {

    let html = "<h3>🏆 Bet Winners</h3>";

    if(winners.length === 0){
        html += "No one guessed correctly ❌";
    } else {
        winners.forEach(w => {
            html += `<div>🎉 ${w.name}</div>`;
        });
    }

    let container = document.getElementById("betWinners");
    if(container){
        container.innerHTML = html;
    }
});
/* ================= REMOVE PLAYER ================= */

function removePlayer(id){
    socket.emit("removePlayer", {
        id: id,
        role: "admin"
    });
}