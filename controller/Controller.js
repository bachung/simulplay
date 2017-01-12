const net = require('../network/NetworkManager');

// Change this later if supporting more than VLC
const playerType = "VLC";
const path = "/Applications/VLC.app/Contents/MacOS/VLC";

const host = "gablescode.net";
const port = 12345;

const name = "bachung6";
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
  player.seek(time);
}

function onInfoMessage(sender) {
  netManager.sendTo(sender, "info " + (player.paused ? "paused" : "playing")
    + " " + player.getTime());
}


netManager.connect(name, room).then(function () {
  let receivedInfo = false;
  netManager.onData(function (sender, data) {
    let pauseRegex = /^(paused|playing) (\d+)/;
    let seekRegex = /^seek (\d+)/;
    let infoRegex = /^info/;
    let infoResponseRegex = /^info (paused|playing) (\d+)/;
    if (pauseRegex.test(data)) {
      let e = data.match(pauseRegex);
      onPauseMessage(e[1] == "paused", parseInt(e[2]));
    } else if (seekRegex.test(data)) {
      let e = data.match(seekRegex);
      onSeekMessage(parseInt(e[1]));
    } else if (infoRegex.test(data)) {
      onInfoMessage(sender);
    } else if (infoResponseRegex.test(sender)) {
      if (!receivedInfo) {
        let e = data.match(infoResponseRegex);
        onPauseMessage(e[1] == "paused", parseInt(e[2]));
        receivedInfo = true;
      }
    }
  });
  netManager.onDisconnect(function () {

  });
  netManager.broadcast("info");
});

player.onPauseToggle(function (paused) {
  let message = paused ? "paused" : "playing";
  netManager.broadcast(message + " " + player.getTime());
}).onSeek(function (time) {
  netManager.broadcast("seek " + time);
});

player.start();
