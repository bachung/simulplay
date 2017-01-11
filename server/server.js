const net = require('net');

let rooms = {};


function socketOnRegister(data, socket) {
  let name = data.name;
  let room = data.room;
  if (rooms[room] === undefined) {
    rooms[room] = {};
  }
  rooms[room][name] = {
    socket: socket,
    name: name,
    room: room
  };
}

function socketOnData(data) {
  let name = data.sender;
  let room = data.room;
  if (data.type == "broadcast") {
    if (rooms[room] !== undefined && rooms[room][name] !== undefined) {
      for (let u in rooms[room]) {
        if (u.name != name) {
          u.socket.write(data);
        }
      }
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

server.listen(12345);
