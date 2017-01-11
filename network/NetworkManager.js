const net = require('net');

function NetworkManager(host, port) {
  this.host = host;
  this.port = port;
  this.socket = null;
}

NetworkManager.prototype.connect = function (name, room) {
  this.name = name;
  this.room = room;
  let manager = this;
  return new Promise(function (resolve, reject) {
    console.log("Connecting on " + manager.host + ":" + manager.port);
    manager.socket = net.connect(manager.port, manager.host, function () {
      manager.socket.write(JSON.stringify({
        type: "register",
        name: name,
        room: room
      }));
      resolve();
    });
    // When do I reject?
  });
};

NetworkManager.prototype.broadcast = function (data) {
  this.socket.send(JSON.stringify({
    type: "broadcast",
    sender: this.name,
    room: this.room,
    data: data
  }));
};

NetworkManager.prototype.sendTo = function (user, data) {
  this.socket.send(JSON.stringify({
    type: "message",
    sender: this.name,
    room: this.room,
    user: user,
    data: data
  }));
};

NetworkManager.prototype.onData = function (handler) {
  this.socket.on('data', function (data) {
    let message = JSON.parse(data);
    handler(message.sender, message.data);
  });
};

NetworkManager.prototype.onDisconnect = function (handler) {
  this.socket.on('disconnect', handler);
};

exports.NetworkManager = NetworkManager;
