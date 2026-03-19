const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

let players = [];
let admin = null;

let raceStarted = false;
let finishOrder = [];
let leaderboard = {};

const FINISH = 1500;
const RACE_TIME = 60000; // 1 minute

app.get("/players", (req, res) => {
  res.json(players);
});

io.on("connection", (socket) => {

  /* JOIN */

  socket.on("join", (data) => {

    const { name, team, paapaan, role } = data;

    if (role === "admin") {
      admin = socket.id;
      socket.emit("admin");
      socket.emit("players", players);
      return;
    }

    if (role === "spectator") {
      socket.emit("spectator");
      socket.emit("players", players);
      socket.emit("positions", players);
      return;
    }

    /* REJOIN */

    let existing = players.find(p => p.name === name);

    if (existing) {
      existing.id = socket.id;
      socket.emit("rejoined");
      io.emit("players", players);
      io.emit("positions", players);
      return;
    }

    /* NEW PLAYER */

    let player = {
      id: socket.id,
      name,
      team,
      paapaan,
      position: 0
    };

    players.push(player);

    if (!leaderboard[name]) {
      leaderboard[name] = 0;
    }

    io.emit("players", players);
    io.emit("positions", players);
  });

  /* MOVE */

  socket.on("move", () => {

    if (!raceStarted) return;

    let player = players.find(p => p.id === socket.id);
    if (!player) return;

    player.position += 25;

    if (player.position >= FINISH) {
      player.position = FINISH;

      if (!finishOrder.find(p => p.id === player.id)) {
        finishOrder.push(player);
      }
    }

    io.emit("positions", players);
  });

  /* START */

  socket.on("startRace", () => {

    if (socket.id !== admin) return;

    players.forEach(p => p.position = 0);
    finishOrder = [];

    io.emit("positions", players);
    io.emit("countdown");

    setTimeout(() => {

      raceStarted = true;

      /* TIMER START */
      setTimeout(() => {

        raceStarted = false;

        calculatePoints();

        io.emit("raceEnded", {
          finishOrder,
          leaderboard
        });

      }, RACE_TIME);

    }, 3000);
  });

  /* CALCULATE POINTS */

  function calculatePoints() {

    let points = [10,9,8,7,6,5,4,3,2,1];

    finishOrder.forEach((p, index) => {

      if (points[index]) {
        leaderboard[p.name] += points[index];
      }

    });

  }

  /* REMOVE PLAYER */

  socket.on("removePlayer", (name) => {

    if (socket.id !== admin) return;

    players = players.filter(p => p.name !== name);

    io.emit("players", players);
    io.emit("positions", players);
  });

  /* RESET */

  socket.on("resetRace", () => {

    if (socket.id !== admin) return;

    raceStarted = false;

    players.forEach(p => p.position = 0);
    finishOrder = [];

    io.emit("positions", players);
  });

});

server.listen(process.env.PORT || 3000);