const express = require("express")
const http = require('http')
const app = express();
const socketIo = require("socket.io");
const indexRouter = require("./routes")
const path  = require("path")
const server = http.createServer(app)
const io = socketIo(server)

let waitingusers = [];
let rooms = {}

io.on('connection', function(socket){

   socket.on('joinroom', function(){
     if(waitingusers.length > 0){
      const partner = waitingusers.shift();
      const roomname =`${socket.id}-${partner.id}`
      socket.join(roomname)
      partner.join(roomname)

      io.to(roomname).emit("joined" , roomname);
     }else{
      waitingusers.push(socket)
     }
 });

     socket.on('signalingMessage', function(data){
      socket.broadcast.to(data.room).emit("signalingMessage", data.message)
     })

     socket.on('message', function(data){
      socket.broadcast.to(data.room).emit("message", data.message);

      socket.on('startVideoCall', function({ room }){
         socket.broadcast.to(room).emit("incomingCall");
      }) 

      socket.on("acceptCall", function({ room }){
        socket.broadcast.to(room).emit("callAccpeted")
      })

      socket.on("rejectCall", function({ room }){
        socket.broadcast.to(room).emit("callRejected")
      })

     socket.on('disconnect', function(){
     const index =  waitingusers.findIndex(waitinguser => waitinguser.id === socket.id);
     waitingusers.splice(index, 1)
     })




   })

  
})

app.set("view engine", "ejs")
app.use(express.json())
app.use(express.urlencoded({ extended:true}))
app.use(express.static(path.join(__dirname,"public")))

app.use("/", indexRouter)


server.listen(3000)