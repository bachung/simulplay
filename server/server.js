const net = require('net');
const port = 12345;

let rooms = {};


function socketOnRegister(data, socket) {
  let name = data.name;
  let room = data.room;
  if (rooms[room] === undefined) {
    rooms[room] = {};
    socket.write(JSON.stringify({
      type: "message",
      sender: "server",
      room: room,
      data: "info paused 0",
    }));
  }
  rooms[room][name] = {
    socket: socket,
    name: name,
    room: room
  };
  console.log(name + " registered to room " + room);
}

function socketOnData(data) {
  let name = data.sender;
  let room = data.room;
  console.log("Received data:\n" + JSON.stringify(data));
  if (data.type == "broadcast") {
    if (rooms[room] !== undefined && rooms[room][name] !== undefined) {
      for (let u in rooms[room]) {
        if (rooms[room][u].name != name) {
          rooms[room][u].socket.write(JSON.stringify(data));
        }
      }
    }
  } else if (data.type = "message") {
    if (rooms[room] !== undefined && rooms[room][name] !== undefined) {
      rooms[room][data.user].socket.write(JSON.stringify(data));
    }
  }
}

let server = net.createServer(function (socket) {
  socket.on('data', function (data) {
    let json = JSON.parse(data);
    if (json.type == "register") {
      socketOnRegister(json, socket);
    } else {
      socketOnData(json);
    }
  });
});

server.listen(port, function () {
  console.log("Server bound on port " + port);
});
