const net = require('net');
const port = require('../config').port;
const messages = require('../shared/messages');

const rooms = {};

function socketOnRegister(data, socket) {
  const {name, room} = data;
  if (rooms[room] === undefined) {
    rooms[room] = {};

  }
  rooms[room][name] = {
    socket: socket,
    name: name,
    room: room
  };
  console.log(name + " registered to room " + room);
}

function socketOnData(message) {
  const {sender, room} = message;
  console.log("Received data:\n" + JSON.stringify(message));

  if (message instanceof messages.BroadcastMessage) {
    if (rooms[room] !== undefined && rooms[room][sender] !== undefined) {
      for (let user in rooms[room]) {
        if (rooms[room][user].name !== sender) {
          rooms[room][user].socket.write(JSON.stringify(message));
        }
      }
    }
  } else if (message instanceof messages.SendToMessage) {
    if (rooms[room] !== undefined && rooms[room][sender] !== undefined) {
      rooms[room][message.user].socket.write(JSON.stringify(message));
    }
  }
}

const server = net.createServer(function (socket) {
  socket.on('data', function (data) {
    const message = messages.Message.parse(JSON.parse(data));
    if (data instanceof messages.RegistrationMessage) {
      socketOnRegister(message, socket);
    } else {
      socketOnData(message);
    }
  });
});

server.listen(port, function () {
  console.log("Server bound on port " + port);
});
