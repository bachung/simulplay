const net = require('net');
const constants = require('../shared/constants');
const messages = require('../shared/messages');

module.exports.NetworkManager = class {
  constructor(host, port) {
    this.host = host;
    this.port = port;
    this.socket = null;
  }

  async connect(name, room) {
    if (this.name || this.room) return;
    this.name = name;
    this.room = room;

    await new Promise((resolve, reject) => {
      this.socket = net.connect(this.port, this.host, resolve);
      this.socket.on('error', reject);
    });

    this.socket.write((new messages.RegistrationMessage({name, room})).asJSON());
    console.log("Connected");
  }

  broadcast(data) {
    if (!this.socket) throw new Error("Socket not initialized");
    this.socket.write((new messages.BroadcastMessage({
      sender: this.name,
      room: this.room,
      data: data
    })).asJSON());
  }

  sendTo(user, data) {
    if (!this.socket) throw new Error("Socket not initialized");
    this.socket.write((new messages.SendToMessage({
      sender: this.name,
      room: this.room,
      user: user,
      data: data
    })).asJSON());
  }

  on(event, handler) {
    if (event === 'data') {
      let newHandler = data => {
        console.log("Data", data)
        console.log("Message", data.toString());
        const message = JSON.parse(data.toString());
        handler(message.sender, message.data);
      };
      this.socket.on(event, newHandler);
    } else {
      this.socket.on(event, handler);
    }
  }
};

// function NetworkManager(host, port) {
//   this.host = host;
//   this.port = port;
//   this.socket = null;
// }

// NetworkManager.prototype.connect = function (name, room) {
//   this.name = name;
//   this.room = room;
//   let manager = this;
//   return new Promise(function (resolve, reject) {
//     console.log("Connecting on " + manager.host + ":" + manager.port);
//     manager.socket = net.connect(manager.port, manager.host, function () {
//       manager.socket.write(JSON.stringify({
//         type: "register",
//         name: name,
//         room: room
//       }));
//       resolve();
//     });
//     // When do I reject?
//   });
// };

// NetworkManager.prototype.broadcast = function (data) {
//   this.socket.write(JSON.stringify({
//     type: "broadcast",
//     sender: this.name,
//     room: this.room,
//     data: data
//   }));
// };

// NetworkManager.prototype.sendTo = function (user, data) {
//   this.socket.write(JSON.stringify({
//     type: "message",
//     sender: this.name,
//     room: this.room,
//     user: user,
//     data: data
//   }));
// };

// NetworkManager.prototype.onData = function (handler) {
//   this.socket.on('data', function (data) {
//     console.log(data.toString());
//     let message = JSON.parse(data.toString());
//     handler(message.sender, message.data);
//   });
// };

// NetworkManager.prototype.onDisconnect = function (handler) {
//   this.socket.on('disconnect', handler);
// };

// exports.NetworkManager = NetworkManager;
