const net = require('net');

function NetworkManager(host, port) {
  this.host = host;
  this.port = port;
  this.socket = null;
}

NetworkManager.prototype.connect = function () {
  return new Promise(function (resolve, reject) {
    this.socket = net.connect(this.port, this.host, resolve);
    // When do I reject?
  });
};

NetworkManager.prototype.broadcast = function (data) {
  this.socket.send(JSON.stringify({
    type: "broadcast",
    data: data
  }));
};

NetworkManager.prototype.sendTo = function (user, data) {
  this.socket.send(JSON.stringify({
    type: "message",
    user: user,
    data: data
  }));
};

NetworkManager.prototype.onData = function (handler) {
  this.socket.on('data', handler);
};

NetworkManager.prototype.onDisconnect = function (handler) {
  this.socket.on('disconnect', handler);
};

exports.NetworkManager = NetworkManager;
