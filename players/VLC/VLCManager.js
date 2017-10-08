const spawn = require("child_process").spawn;

const DEFAULT_ARGS = ["--extraintf", "luaintf{intf=simulplay}"];

console.log(DEFAULT_ARGS);

class VLCManager {
  constructor(path, args) {
    this.path = path;
    this.args = args;

    this.paused = true;
    this.currentTime = 0;
    this.file = "";

    this.ignoreNextPauseEvent = false;
    this.ignoreNextSeekEvent = false;

    this.handlers = {
      pause: [],
      seek: [],
      file: [],
      tick: [],
      pause: [],
      resume: []
    };

    this.commandHandlers = new Map();
    this.initCommandHandlers_();
  }

  on(event, handler) {
    if (!(event in this.handlers)) throw new Error("Invalid event handler");
    this.handlers[event].push(handler);
    return this;
  }

  off(event, handler) {
    if (!(event in this.handlers)) throw new Error("Invalid event handler");
    this.handlers[event] = this.handlers[event].filter(handler => handler !== handler);
    return this;
  }

  initCommandHandlers_() {
    this.commandHandlers.set(/^time ([\d.]+)/, this.handleTimeChange_.bind(this));
    this.commandHandlers.set(/^status (.+)/, this.handlePauseToggle_.bind(this));
    this.commandHandlers.set(/^new input (.+)/, this.handleFile_.bind(this));
  }

  handleTimeChange_(command, time) {
    time = parseFloat(time);
    if (Math.abs(time - this.currentTime) > 1.0) {
      this.currentTime = time;
      this.handlers.seek.forEach(fn => fn(time));
    } else {
      this.currentTime = time;
    }
  }

  handlePauseToggle_(command, state) {
    const paused = state !== 'playing';
    if (paused !== this.paused) {
      this.paused = paused;
      this.handlers.pause.forEach(fn => fn(paused));
    }
  }

  handleFile_(command, file) {
    if (this.file !== file) {
      this.file = file;
      this.handlers.file.forEach(fn => fn(file));
    }
  }

  processCommand_(command) {
    for (let entry of this.commandHandlers) {
      const [regex, fn] = entry;
      if (regex.test(command)) {
        fn.apply(this, command.match(regex));
        break;
      }
    }
  }

  start() {
    if (this.running) {
      throw new Error("VLC already running");
    }
    this.running = true;
    this.process = spawn(this.path, DEFAULT_ARGS.concat(this.args));

    this.process.stdout.on('data', data => {
      const commands = data.toString().split("\n");
      for (let command of commands) {
        this.processCommand_(command);
      }
    });

    this.poller = setInterval(() => {
      this.process.stdin.write("status\n");
      this.process.stdin.write("time\n");
    }, 100);
  }

  pause() {
    if (!this.paused) this.togglePause();
  }

  resume() {
    if (this.paused) this.togglePause();
  }

  togglePause() {
    this.paused = !this.paused;
    this.process.stdin.write("pause\n");
  }

  seek(time) {
    console.log("Seeking to", time);
    this.currentTime = time;
    this.process.stdin.write("time " + parseFloat(time) + "\n");
  }

  getTime() {
    return this.currentTime;
  }

  getPauseState() {
    return this.paused;
  }
}

exports.VLC = VLCManager;
