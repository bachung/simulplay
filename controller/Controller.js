const net = require('../network/NetworkManager');
const config = require('../config');
const clientMessages = require('./clientMessages');


// Change this later if supporting more than VLC
const player = "VLC";
const path = "/Applications/VLC.app/Contents/MacOS/VLC";

const host = config.host;
const port = config.port;

const name = config.name;
const room = config.room;

const playerFactory = require('../players/PlayerFactory');


class Controller {
  constructor({player, path}) {
    this.networkManager = null;
    this.player = playerFactory.build(player, path, []);
    this.receiveInfo = false;
  }

  async connect({host = config.host, port = config.port, name = config.name, room = config.room}) {
    try {
      this.networkManager = new net.NetworkManager(host, port);
      await this.networkManager.connect(name, room);

      this.networkManager.on('data', (sender, data) => {
        data = clientMessages.ClientMessage.parse(data);
        const player = this.player;
        if (data instanceof clientMessages.InfoRequest) {
          this.networkManager.sendTo(sender, new clientMessages.InfoResponse({
            paused: player.getPauseState(),
            time: player.getTime()
          }));
        } else if (data instanceof clientMessages.InfoResponse) {
          if (this.receiveInfo) {
            this.receiveInfo = false;
            this.player.seek(data.time);
            if (data.paused) {
              player.pause();
            } else {
              player.resume();
            }
          }
        } else if (data instanceof clientMessages.PauseCommand) {
          if (data.paused) {
            player.pause();
          } else {
            player.resume();
          }
          player.seek(data.time);
        } else if (data instanceof clientMessages.SeekCommand) {
          player.seek(data.time);
        }
      });

      this.networkManager.on('diconnect', console.log);

      this.player.on('pause', paused => {
        this.networkManager.broadcast(new clientMessages.PauseCommand({paused, time: this.player.getTime()}));
      }).on('seek', time => {
        this.networkManager.broadcast(new clientMessages.SeekCommand({time}));
      }).on('file', () => {
        this.receiveInfo = true;
        this.networkManager.broadcast(new clientMessages.InfoRequest());
        setTimeout(() => this.receiveInfo = false, 2000);
      });

      this.player.start();
    } catch (e) {
      console.error(e);
    }
  }
}

const controller = new Controller({player, path});
controller.connect({}).catch(console.error);