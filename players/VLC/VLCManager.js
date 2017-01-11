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



/**
 * start - starts the process and adds the event handlers
 * to the process
 */
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
  }, 16);
};


/**
 * anonymous function - description
 *
 * @param  {type} command description
 * @return {type}         description
 */
Manager.prototype.processCommand = function (command) {
  let time = /^\d+/;
  let state = /^\( state (.+) \)/;
  if (time.test(command)) {
    let t = parseInt(command);
    if (Math.abs(t - this.currentTime) > 1) {
      this.onSeek(t);
    }
    this.currentTime = t;
    if (t != this.currentTime) {
      if (this.tickHandler !== undefined) {
        this.tickHandler(t);
      }
    }
  } else if (state.test(command)) {
    let paused = command.match(state)[1] != "playing";
    if (paused != this.paused) {
      this.paused = paused;
      if (this.onPauseToggle !== undefined) {
        this.pauseHandler(paused);
      }
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

Manager.prototype.onTick = function (handler) {
  this.tickHandler = handler;
  return this;
}

Manager.prototype.pause = function () {
  if (!this.paused) {
    this.togglePause();
  }
};

Manager.prototype.resume = function () {
  if (this.paused) {
    this.togglePause();
  }
};

Manager.prototype.togglePause = function () {
  this.paused = !this.paused;
  this.process.stdin.write("pause\n");
};

Manager.prototype.seek = function (time) {
  this.currentTime = time;
  this.process.stdin.write("seek " + time + "\n");
};

exports.VLC = Manager;
