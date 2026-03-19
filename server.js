socket.on("startRace", () => {

if (socket.id !== admin) return;

/* lock participants for this race */
raceParticipants = [...players];

raceParticipants.forEach(p => p.position = 0);

finishOrder = [];

io.emit("positions", raceParticipants);
io.emit("countdown");

setTimeout(() => {

raceStarted = true;

/* timer */

setTimeout(() => {

endRace();

}, 60000);

}, 3000);

});