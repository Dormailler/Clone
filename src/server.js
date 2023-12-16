import http from "http";
// import WebSocket from "ws";
import SocketIo from "socket.io"
import express from "express";

const app = express();

app.set("view engine", "pug");
app.set("views", __dirname + "/views");
app.use("/public", express.static(__dirname + "/public"));
app.get("/", (_, res) => res.render("home"));
app.get("/*", (_, res) => res.redirect("/"));

const handleListen = () => console.log(`Listening on http://localhost:3000`);

const httpserver = http.createServer(app);
const wsServer = SocketIo(httpserver);

wsServer.on("connection", socket => {
  socket.onAny((event)=>{  // 이벤트 추적
    console.log(`Socket Event:${event}`); 
  });
  socket.on("enter_room", (roomName,done) =>{
    socket.join(roomName);
    done();
    socket.to(roomName).emit("welcome");
  })
})

// const wss = new WebSocket.Server({ server });
// const sockets = [];

// wss.on("connection", (socket) => {
//   sockets.push(socket);
//   socket["nickname"] = "Anon"
//   console.log("Connected to Browser ✅");
//   socket.on("close", () => console.log("Disconnected from the Browser ❌"));
//   socket.on("message", (msg) => {
//     const message = JSON.parse(msg.toString());
//     switch(message.type){
//       case "new_message":
//         sockets.forEach((aSocket) =>{
//           aSocket.send(`${socket.nickname}: ${message.payload}`);
//         });
//         break
//       case "nickname":
//         socket["nickname"] = message.payload;
//     }
//   });
// });

httpserver.listen(3000, handleListen);