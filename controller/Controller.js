const net = require('../network/NetworkManager');
const config = require('../config');

// Change this later if supporting more than VLC
const playerType = "VLC";
const path = "/Applications/VLC.app/Contents/MacOS/VLC";

const host = config.host;
const port = config.port;

const name = config.name;
const room = config.room;

const playerFactory = require('../players/PlayerFactory');

let player = playerFactory.build(playerType, path, []);

console.log("Using name", name, "and room", room);

const netManager = new net.NetworkManager(host, port);

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
  netManager.on('data', function (sender, data) {
    let pauseRegex = /^(paused|playing) (\d+)/;
    let seekRegex = /^seek (\d+)/;
    let infoResponseRegex = /^info (paused|playing) (\d+)/;
    console.log(receivedInfo);
    if (pauseRegex.test(data)) {
      let e = data.match(pauseRegex);
      onPauseMessage(e[1] == "paused", parseInt(e[2]));
    } else if (seekRegex.test(data)) {
      let e = data.match(seekRegex);
      onSeekMessage(parseInt(e[1]));
    } else if ("info" == data) {
      onInfoMessage(sender);
    } else if (infoResponseRegex.test(sender)) {
      if (!receivedInfo) {
        let e = data.match(infoResponseRegex);
        onPauseMessage(e[1] == "paused", parseInt(e[2]));
        receivedInfo = true;
      }
    }
  });
  netManager.on('disconnect', function () {

  });
  netManager.broadcast("info");
}).catch(console.log);

player.on('pause', function (paused) {
  let message = paused ? "paused" : "playing";
  netManager.broadcast(message + " " + player.getTime());
}).on('seek', function (time) {
  netManager.broadcast("seek " + time);
});

player.start();
