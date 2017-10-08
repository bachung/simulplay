const constants = require('../shared/constants');

let messages;

class ClientMessage {
    static parse(data) {
        console.log("Parsing " + data);
        return new messages[data.type](data);
    }
}

class InfoRequest extends ClientMessage {
    constructor() {
        super();
        this.type = constants.clientMessages.infoRequest;
    }
}

class InfoResponse extends ClientMessage {
    constructor({paused, time}) {
        super();
        this.type = constants.clientMessages.infoResponse;
        this.paused = paused;
        this.time = time;
    }
}

class SeekCommand extends ClientMessage {
    constructor({time}) {
        super();
        this.type = constants.clientMessages.seek;
        this.time = time;
    }
}

class PauseCommand extends ClientMessage {
    constructor({paused, time}) {
        super();
        this.type = constants.clientMessages.pause;
        this.paused = paused;
        this.time = time;
    }
}

messages = {
    [constants.clientMessages.infoResponse]: InfoResponse,
    [constants.clientMessages.infoRequest]: InfoRequest,
    [constants.clientMessages.seek]: SeekCommand,
    [constants.clientMessages.pause]: PauseCommand
};

module.exports.ClientMessage = ClientMessage;
module.exports.InfoRequest = InfoRequest;
module.exports.InfoResponse = InfoResponse;
module.exports.SeekCommand = SeekCommand;
module.exports.PauseCommand = PauseCommand;