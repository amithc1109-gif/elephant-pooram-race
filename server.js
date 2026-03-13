const express=require("express");
const http=require("http");
const {Server}=require("socket.io");

const app=express();
const server=http.createServer(app);
const io=new Server(server);

app.use(express.static("public"));

let players=[];
let raceStarted=false;
let finishOrder=[];

const FINISH=1500;

/* API FOR TEAM PAGE */

app.get("/players",(req,res)=>{
res.json(players);
});

io.on("connection",(socket)=>{

/* JOIN */

socket.on("join",(data)=>{

const {name,team,paapaan,role}=data;

/* ADMIN */

if(role==="admin"){
socket.emit("admin");
return;
}

/* SPECTATOR */

if(role==="spectator"){
socket.emit("spectator");
return;
}

/* PREVENT DUPLICATE ELEPHANT */

let exists=players.find(p=>p.name===name);

if(exists){
socket.emit("nameTaken");
return;
}

/* ADD PLAYER */

let player={
id:socket.id,
name,
team,
paapaan,
position:0
};

players.push(player);

io.emit("players",players);
io.emit("positions",players);

});

/* MOVE */

socket.on("move",()=>{

if(!raceStarted) return;

let player=players.find(p=>p.id===socket.id);

if(!player) return;

player.position+=25;

/* SPECIAL ELEPHANT */

if(
player.name==="കുന്നിൻച്ചരുവിൽ ജനീലിയ" &&
player.position>600 &&
player.position<800
){
player.position-=40;
}

/* FINISH */

if(player.position>=FINISH){

player.position=FINISH;

if(!finishOrder.find(p=>p.id===player.id)){
finishOrder.push(player);
}

/* TOP 3 */

if(finishOrder.length===3){

raceStarted=false;

io.emit("top3",finishOrder.slice(0,3));

}

}

io.emit("positions",players);

});

/* START */

socket.on("startRace",()=>{

players.forEach(p=>p.position=0);

finishOrder=[];

io.emit("positions",players);

io.emit("countdown");

setTimeout(()=>{

raceStarted=true;

},3000);

});

/* RESET */

socket.on("resetRace",()=>{

raceStarted=false;

players.forEach(p=>p.position=0);

finishOrder=[];

io.emit("positions",players);

});

});

server.listen(process.env.PORT||3000);