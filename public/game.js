const socket = io();

const role = localStorage.getItem("role");
const playerName = localStorage.getItem("playerName");
const paapaan = localStorage.getItem("paapaan");

let players = [];
let canRun = false;

/* JOIN */
socket.emit("join", {
    name: playerName,
    paapaan: paapaan,
    role: role
});

/* ADMIN UI */
socket.on("admin", () => {
    document.getElementById("adminControls").style.display = "block";
    document.getElementById("runBtn").style.display = "none";
});

/* PLAYERS */
socket.on("players", (data) => {
    players = data;
    draw();

    let betSelect = document.getElementById("betChoice");

    if(betSelect){
        betSelect.innerHTML = "";

        data.forEach(p=>{
            let opt = document.createElement("option");
            opt.value = p.name;
            opt.text = p.name;
            betSelect.appendChild(opt);
        });
    }
});

/* POSITIONS */
socket.on("positions", (data) => {
    players = data;
    draw();
});

/* RUN */
function run() {
    if (role === "player" && canRun) {
        socket.emit("move");
    }
}

/* ADMIN */
function startRace() {
    socket.emit("startRace");
}

function resetRace() {
    socket.emit("resetRace");
}

/* COUNTDOWN */
socket.on("countdown", () => {

    let c = 3;

    let timer = setInterval(() => {

        document.getElementById("winner").innerHTML = c;

        c--;

        if (c < 0) {
            clearInterval(timer);
            document.getElementById("winner").innerHTML = "GO!";
            canRun = true;
        }

    }, 1000);
});

/* RESULTS */
socket.on("top3", (list) => {

    document.getElementById("winner").innerHTML = `
    <h2>🏆 Results</h2>
    🥇 ${list[0].name} - ${list[0].paapaan}<br>
    🥈 ${list[1].name} - ${list[1].paapaan}<br>
    🥉 ${list[2].name} - ${list[2].paapaan}
    `;

    launchFireworks();
});

/* DRAW */
function draw() {

    let html = "";

    players.forEach((p, i) => {

        html += `
        <div class="lane">

            <div class="start"></div>
            <div class="finish"></div>

            <div class="lane-info">
                Lane ${i + 1}<br>
                ${p.name}<br>
                <small>${p.paapaan || ""}</small>
            </div>

            <div class="elephant" style="left:${p.position}px;">
                🐘
            </div>

        </div>
        `;
    });

    document.getElementById("track").innerHTML = html;
}

/* FIREWORKS */
function launchFireworks() {

    let canvas = document.getElementById("fireworks");
    let ctx = canvas.getContext("2d");

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    for (let i = 0; i < 200; i++) {

        ctx.fillStyle = `hsl(${Math.random()*360},100%,50%)`;

        ctx.beginPath();
        ctx.arc(Math.random()*canvas.width, Math.random()*canvas.height, 4, 0, Math.PI*2);
        ctx.fill();
    }

    setTimeout(() => {
        ctx.clearRect(0,0,canvas.width,canvas.height);
    },2000);
}