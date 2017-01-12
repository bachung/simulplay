const net = require('../network/NetworkManager');

// Change this later if supporting more than VLC
const playerType = "VLC";
const path = "/Applications/VLC.app/Contents/MacOS/VLC";

const host = "gablescode.net";
const port = 12345;

const name = "bachung4";
const room = "test";

const playerFactory = require('../players/PlayerFactory');

let player = playerFactory.build(playerType, path, []);
let netManager = new net.NetworkManager(host, port);

function onPauseMessage(paused, time) {
  player.seek(time);
  if (paused) {
    player.pause();
  } else {
    player.resume();
  }
}

function onSeekMessage(time) {
  player.seek(time);s
}


netManager.connect(name, room).then(function () {
  netManager.onData(function (sender, data) {
    let pauseRegex = /^(pause) (\d+)/;
    let seekRegex = /^seek (\d+)/;
    if (pauseRegex.test(data)) {
      let e = data.match(pauseRegex);
      onPauseMessage(e[1] == "paused", parseInt(e[2]));
    } else if (seekRegex.test(data)) {
      let e = data.match(seekRegex);
      onSeekMessage(parseInt(e[1]));
    }
  });
  netManager.onDisconnect(function () {

  });
});

player.onPauseToggle(function (paused) {
  let message = paused ? "paused" : "playing";
  netManager.broadcast(message + " " + player.getTime());
}).onSeek(function (time) {
  netManager.broadcast("seek " + time);
});

player.start();
