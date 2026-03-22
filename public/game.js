const socket = io();

const role = localStorage.getItem("role");
const playerName = localStorage.getItem("playerName");

let players = [];
let canRun = false;
let myBet = null;

/* JOIN */
socket.emit("join", {
    name: playerName,
    paapaan: localStorage.getItem("paapaan"),
    role
});

/* ADMIN */
socket.on("admin", ()=>{
    document.getElementById("adminControls").style.display = "block";
});

/* PLAYERS */
socket.on("players",(data)=>{
    players = data;
    draw();

    let bet = document.getElementById("betChoice");

    if(role === "spectator" && bet){
        bet.innerHTML = "";
        data.forEach(p=>{
            let o = document.createElement("option");
            o.value = p.name;
            o.text = p.name;
            bet.appendChild(o);
        });
    }
});

/* MOVE */
function run(){
    if(role==="player" && canRun){
        socket.emit("move");
    }
}

/* ADMIN */
function startRace(){ socket.emit("startRace"); }
function resetRace(){ socket.emit("resetRace"); }

/* TIMER */
socket.on("timer",(t)=>{
    document.getElementById("timer").innerHTML = "⏱ "+t+"s";
});

/* COUNTDOWN */
socket.on("countdown",()=>{
    let c=3;
    let i=setInterval(()=>{
        winner.innerHTML=c;
        c--;
        if(c<0){
            clearInterval(i);
            winner.innerHTML="GO!";
            canRun=true;
        }
    },1000);
});

/* RESULTS */
socket.on("top3",(list)=>{
    winner.innerHTML = `
    🥇 ${list[0].name}<br>
    🥈 ${list[1].name}<br>
    🥉 ${list[2].name}
    `;
});

/* LEADERBOARD */
socket.on("leaderboard",(list)=>{
    let html="<h3>Leaderboard</h3>";
    list.forEach((p,i)=>{
        html += `${i+1}. ${p.name} - ${p.points} pts<br>`;
    });
    document.getElementById("leaderboard").innerHTML = html;

    // 🎯 BET RESULT
    if(role==="spectator" && myBet){
        if(myBet === list[0].name){
            alert("🎉 You WON your bet!");
        } else{
            alert("❌ You lost your bet");
        }
    }
});

/* BET */
function placeBet(){
    if(role!=="spectator") return;

    myBet = document.getElementById("betChoice").value;
    alert("Bet locked: "+myBet);
}

/* DRAW */
function draw(){

    let html="";

    players.forEach((p,i)=>{

        let isMe = (p.name === playerName);

        html+=`
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

            ${role==="admin" ? `<button onclick="remove('${p.id}')">❌</button>`:""}

        </div>
        `;
    });

    let track = document.getElementById("track");
    track.innerHTML = html;

    // 📱 AUTO CAMERA
    let me = players.find(p=>p.name===playerName);
    if(me){
        document.getElementById("camera").scrollLeft = me.position - 100;
    }
}

/* ADMIN REMOVE */
function remove(id){
    socket.emit("removePlayer",id);
}