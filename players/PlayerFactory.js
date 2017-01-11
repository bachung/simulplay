const VLC = require("./VLC/VLCManager");

function build(player, path, args) {
  switch (player) {
    case "VLC":
      return new VLC.VLCManager(path, args);
    default:
      return null;
  }
}

exports.build = build;
