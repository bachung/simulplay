const spawn = require("child_process").spawn;

const DEFAULT_ARGS = ["--extraintf", "rc"];



/**
 * Creates an instance of a Manager to manage VLC
 *
 * @constructor
 * @this {Manager}
 * @param  {string} path path to VLC executable
 * @param  {Array.string} args additional command line arguments
 */
function Manager(path, args) {
  this.path = path;
  this.args = args;

  this.paused = true;
  this.currentTime = 0;
  this.running = false;

  this.ignoreNextPauseEvent = false;
  this.ignoreNextSeekEvent = false;
};

Manager.prototype.start = function () {
  if (this.running) return;
  this.running = true;
  this.process = spawn(this.path, DEFAULT_ARGS.concat(this.args));

  let manager = this;
  this.process.stdout.on('data', function (data) {
    let commands = data.toString().split("\n");
    for (let i = 0; i < commands.length; i++) {
      manager.processCommand(commands[i]);
    }

  });


  this.listener = setInterval(function() {
    if (manager.process != undefined) {
      manager.process.stdin.write("status\n");
      manager.process.stdin.write("get_time\n")
    }
  }, 100);
};

Manager.prototype.processCommand = function (command) {
  let time = /^\d+/;
  let state = /^\( state (.+) \)/;
  if (time.test(command)) {
    let t = parseInt(command);
    this.currentTime = t;
  } else if (state.test(command)) {
    let paused = command.match(state)[1] != "playing";
    if (paused != this.paused) {
      this.paused = paused;
    }
  }
};

Manager.prototype.onPauseToggle = function (handler) {
  this.pauseHandler = handler;
  return this;
};

Manager.prototype.onSeek = function (handler) {
  this.seekHandler = handler;
  return this;
};

Manager.prototype.onFileLoad = function (handler) {
  this.fileLoadHandler = handler;
  return this;
};
