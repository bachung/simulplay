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