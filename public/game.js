const socket = io();

/* USER INFO */

const role = localStorage.getItem("role") || "spectator";
const playerName = localStorage.getItem("playerName");
const team = localStorage.getItem("team");
const paapaan = localStorage.getItem("paapaan");

let players = [];
let canRun = false;

/* JOIN */

socket.emit("join", {
    name: playerName,
    team: team,
    paapaan: paapaan,
    role: role
});

/* UI SETUP */

if (role === "spectator") {
    document.getElementById("runBtn").style.display = "none";
}

if (role !== "spectator") {
    let betUI = document.getElementById("betSection");
    if (betUI) betUI.style.display = "none";
}

/* ADMIN */

socket.on("admin", () => {
    document.getElementById("runBtn").style.display = "none";
    document.getElementById("adminControls").style.display = "block";
});

/* PLAYERS */

socket.on("players", (data) => {

    players = data;

    draw();

    /* populate betting dropdown */

    if (role === "spectator") {

        let select = document.getElementById("betChoice");

        if (!select) return;

        select.innerHTML = "<option value=''>Select Elephant</option>";

        players.forEach(p => {

            let opt = document.createElement("option");

            opt.value = p.name;
            opt.text = p.name;

            select.appendChild(opt);

        });

    }

});

/* POSITIONS */

socket.on("positions", (data) => {

    players = data;

    draw();

});

/* COUNTDOWN */

socket.on("countdown", () => {

    let c = 3;

    let interval = setInterval(() => {

        document.getElementById("winner").innerHTML = c;

        c--;

        if (c < 0) {

            clearInterval(interval);

            document.getElementById("winner").innerHTML = "GO!";

            startTimer();

            canRun = true;

        }

    }, 1000);

});

/* TIMER */

function startTimer() {

    let time = 60;

    let timer = setInterval(() => {

        document.getElementById("timer").innerHTML = "⏱ " + time + "s";

        time--;

        if (time < 0) {
            clearInterval(timer);
        }

    }, 1000);

}

/* RUN */

function run() {

    if (role === "player" && canRun) {
        socket.emit("move");
    }

}

/* ADMIN CONTROLS */

function start() {
    socket.emit("startRace");
}

function resetRace() {
    socket.emit("resetRace");
}

/* REMOVE PLAYER (ADMIN) */

function removePlayer(name) {
    socket.emit("removePlayer", name);
}

/* BETTING */

function placeBet() {

    let select = document.getElementById("betChoice");

    let bet = select.value;

    if (!bet) {
        alert("Select elephant");
        return;
    }

    /* each spectator has own bet */

    localStorage.setItem("myBet", bet);

    alert("Your bet: " + bet);

}

/* RACE END */

socket.on("raceEnded", (data) => {

    let { finishOrder, leaderboard } = data;

    showResults(finishOrder, leaderboard);

    launchFireworks();

    /* stop running */

    canRun = false;

});

/* SHOW RESULTS */

function showResults(order, leaderboard) {

    let html = "<h2>🏆 Race Results</h2>";

    order.forEach((p, i) => {
        html += `${i + 1}. ${p.name} - ${p.paapaan}<br>`;
    });

    /* show leaderboard */

    html += "<h3>📊 Leaderboard</h3>";

    Object.keys(leaderboard).forEach(name => {
        html += `${name} : ${leaderboard[name]} pts<br>`;
    });

    /* ONLY spectators see bet result */

    if (role === "spectator") {

        let bet = localStorage.getItem("myBet");

        if (bet) {

            if (bet === order[0]?.name) {
                html += "<br><b style='color:green'>🎉 You WON your bet!</b>";
            } else {
                html += "<br><b style='color:red'>❌ You lost your bet</b>";
            }

        }

    }

    document.getElementById("winner").innerHTML = html;

}

/* DRAW TRACK */

function draw() {

    let html = "";

    players.forEach((p, index) => {

        let you = "";

        if (p.name === playerName) {
            you = " ⭐ YOU";
        }

        html += `
        <div class="lane">

            <div class="start"></div>
            <div class="finish"></div>

            <b>Lane ${index + 1}</b><br>

            <span>${p.name}${you}</span><br>
            <small>Paapaan: ${p.paapaan}</small><br>

            ${role === "admin" ? `<button onclick="removePlayer('${p.name}')">❌ Remove</button>` : ""}

            <div class="elephant" style="left:${p.position}px;">🐘</div>

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

        ctx.fillStyle = `hsl(${Math.random() * 360},100%,50%)`;

        ctx.beginPath();

        ctx.arc(
            Math.random() * canvas.width,
            Math.random() * canvas.height,
            5,
            0,
            Math.PI * 2
        );

        ctx.fill();

    }

    setTimeout(() => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }, 2500);

}