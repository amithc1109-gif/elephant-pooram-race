const socket = io();

const role = localStorage.getItem("role");
const playerName = localStorage.getItem("playerName");
const paapaan = localStorage.getItem("paapaan");

let players = [];
let canRun = false;
let myBet = null;

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

/* ================= RESULTS ================= */

socket.on("top3",(list)=>{
    document.getElementById("winner").innerHTML = `
        🥇 ${list[0]?.name || ""}
        <br>🥈 ${list[1]?.name || ""}
        <br>🥉 ${list[2]?.name || ""}
    `;
});

/* ================= LEADERBOARD ================= */

socket.on("leaderboard",(list)=>{

    let html = "<h3>Leaderboard</h3>";

    list.forEach((p,i)=>{
        html += `${i+1}. ${p.name} - ${p.points} pts<br>`;
    });

    let lb = document.getElementById("leaderboard");
    if(lb) lb.innerHTML = html;

    if(role==="spectator" && myBet){
        if(myBet === list[0]?.name){
            alert("🎉 You WON your bet!");
        } else{
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

            ${role==="admin" ? `<button onclick="removePlayer('${p.id}')">❌</button>` : ""}

        </div>
        `;
    });

    track.innerHTML = html;

    /* 📱 CAMERA FOLLOW */
    let me = players.find(p=>p.name === playerName);
    if(me){
        document.getElementById("camera").scrollLeft = me.position - 100;
    }
}

/* ================= REMOVE PLAYER ================= */

function removePlayer(id){
    socket.emit("removePlayer", id);
}