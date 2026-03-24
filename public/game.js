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
    socket.emit("join", { role: "spectator" });
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
alert("🎉 You WON your bet!");
}else{
alert("❌ You lost your bet");
}

}

});
/* ================= BET ================= */

function placeBet(){

    if(role !== "spectator") return;

    let val = document.getElementById("betChoice");
    if(!val) return;

    myBet = val.value;

    alert("Bet locked: " + myBet);
}

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

/* 📱 CAMERA FOLLOW (FULL FIX: X + Y) */

/* 📱 CAMERA FOLLOW (FULL FIX: X + Y) */

let me = players.find(p => p.name === playerName);

if(me){

    let cam = document.getElementById("camera");
    if(!cam) return;

    // 👉 Find my lane index
    let laneIndex = players.findIndex(p => p.name === playerName);

    // 👉 IMPORTANT: Match this with your CSS lane height
    let laneHeight = 110; // adjust if needed

    // 👉 Center camera on player
    let left = me.position - (cam.clientWidth / 2);
    let top = (laneIndex * laneHeight) - (cam.clientHeight / 2);

    // 👉 Prevent negative scroll
    left = Math.max(0, left);
    top = Math.max(0, top);

    cam.scrollTo({
        left: left,
        top: top,
        behavior: "smooth"
    });
}
}
/* ================= REMOVE PLAYER ================= */

function removePlayer(id){
    socket.emit("removePlayer", {
        id: id,
        role: "admin"
    });
}