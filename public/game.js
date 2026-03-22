const socket = io();

const role = localStorage.getItem("role");
const playerName = localStorage.getItem("playerName");
const paapaan = localStorage.getItem("paapaan");

let players = [];
let canRun = false;
let myBet = null;
let boosts = [];

/* ================= JOIN ================= */

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

/* ================= ADMIN UI ================= */

socket.on("admin", ()=>{
    let adminDiv = document.getElementById("adminControls");
    let runBtn = document.getElementById("runBtn");

    if(adminDiv) adminDiv.style.display = "block";
    if(runBtn) runBtn.style.display = "none";
});

/* ================= PLAYERS ================= */

socket.on("players",(data)=>{

    console.log("PLAYERS:", data);

    players = data;

    if(!players || players.length === 0){
        let track = document.getElementById("track");
        if(track) track.innerHTML = "<h3>No players joined yet</h3>";
        return;
    }

    draw();

    /* BETTING DROPDOWN */
    if(role === "spectator"){
        let bet = document.getElementById("betChoice");
        if(!bet) return;

        bet.innerHTML = "";

        data.forEach(p=>{
            let o = document.createElement("option");
            o.value = p.id;       // ✅ FIXED (ID based)
            o.text = p.name;
            bet.appendChild(o);
        });
    }
});

/* ================= BOOSTS ================= */

socket.on("boosts",(data)=>{
    boosts = data;
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

/* ================= ADMIN ================= */

function startRace(){ socket.emit("startRace"); }
function resetRace(){ socket.emit("resetRace"); }

/* ================= TIMER ================= */

socket.on("timer",(t)=>{
    let timerDiv = document.getElementById("timer");
    if(!timerDiv) return;

    if(t < 0) t = 0;
    timerDiv.innerHTML = "⏱ " + t + "s";
});

/* ================= COUNTDOWN ================= */

socket.on("countdown",()=>{

    canRun = false;

    let c=3;

    let i=setInterval(()=>{

        let win = document.getElementById("winner");
        if(win) win.innerHTML = c;

        c--;

        if(c < 0){
            clearInterval(i);

            if(win) win.innerHTML = "GO!";
            canRun = true;
        }

    },1000);
});

/* ================= BOOST TAKEN ================= */

socket.on("boostTaken",(playerId)=>{
    boosts = boosts.map(b=>{
        if(b.playerId === playerId) b.used = true;
        return b;
    });

    draw(); // ✅ IMPORTANT
});

/* ================= RESULTS ================= */

socket.on("top3",(list)=>{

    let win = document.getElementById("winner");
    if(!win) return;

    win.innerHTML = `
    🥇 ${list[0]?.name || ""}<br>
    🥈 ${list[1]?.name || ""}<br>
    🥉 ${list[2]?.name || ""}
    `;
});

/* ================= LEADERBOARD ================= */

socket.on("leaderboard",(list)=>{

    let html = "<h3>Leaderboard</h3>";

    list.forEach((p,i)=>{
        html += `${i+1}. ${p.name} - ${p.points} pts<br>`;
    });

    let board = document.getElementById("leaderboard");
    if(board) board.innerHTML = html;

    /* ✅ BET FIX (ID BASED) */
    if(role==="spectator" && myBet){

        let winnerId = list[0].id;

        if(myBet === winnerId){
            setTimeout(()=> alert("🎉 You WON your bet!"), 200);
        } else{
            setTimeout(()=> alert("❌ You lost your bet"), 200);
        }
    }
});

/* ================= BET ================= */

function placeBet(){

    if(role !== "spectator") return;

    let val = document.getElementById("betChoice");
    if(!val) return;

    myBet = val.value;   // ✅ ID stored

    val.disabled = true;

    alert("Bet locked!");
}

/* ================= DRAW ================= */

function draw(){

    let track = document.getElementById("track");
    if(!track) return;

    let html="";

    players.forEach((p,i)=>{

        let isMe = (p.name === playerName);

        let boost = boosts.find(b => b.playerId === p.id && !b.used);

        html += `
        <div class="lane">

            <div class="start"></div>
            <div class="finish"></div>

            <div class="lane-info">
                Lane ${i+1} ${isMe ? "⭐ YOU":""}<br>
                ${p.name}<br>
                ${p.paapaan || ""}
            </div>

            <div class="elephant" style="left:${p.position}px;">
                🐘
            </div>

            ${boost ? `
            <div class="boost" style="left:${boost.position}px;">🥥</div>
            ` : ""}

            ${role==="admin" ? `
            <button class="remove-btn" onclick="removePlayer('${p.id}')">❌</button>
            ` : ""}

        </div>
        `;
    });

    track.innerHTML = html;

    /* 📱 AUTO CAMERA FOLLOW */
    let me = players.find(p=>p.name === playerName);

    if(me){
        let cam = document.getElementById("camera");

        if(cam){
            let target = me.position - cam.clientWidth / 2;

            cam.scrollLeft += (target - cam.scrollLeft) * 0.1;
        }
    }
}

/* ================= REMOVE PLAYER ================= */

function removePlayer(id){
    socket.emit("removePlayer", id);
}