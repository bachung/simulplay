const messages = require('./constants').messages;

let MessageTypes;

class Message {
    asJSON() {
        return JSON.stringify(this);
    }

    static parse(jsonObject) {
        if (!jsonObject.type || !MessageTypes[jsonObject.type]) throw new Error("Invalid message");

        return new MessageTypes[jsonObject.type](jsonObject);
    }
}

class RegistrationMessage extends Message {
    constructor({name, room}) {
        super();
        if (name == null
            || room == null
            || typeof name !== "string"
            || typeof room !== "string")
            throw new Error("Invalid registration message");
        this.type = messages.register;
        this.name = name;
        this.room = room;
    }
}

class BroadcastMessage extends Message {
    constructor({sender, room, data}) {
        super();
        if (sender == null
            || room == null
            || data == null)
            throw new Error("Invalid broadcast message");
        this.type = messages.broadcast;
        this.sender = sender;
        this.room = room;
        this.data = data;
    }
}

class SendToMessage extends Message {
    constructor({sender, room, user, data}) {
        super();
        if (sender == null
            || room == null
            || user == null
            || data == null)
            throw new Error("Invalid send message");
        this.type = messages.send;
        this.sender = sender;
        this.room = room;
        this.user = user;
        this.data = data;
    }
}

module.exports.RegistrationMessage = RegistrationMessage;
module.exports.BroadcastMessage = BroadcastMessage;
module.exports.SendToMessage = SendToMessage;
module.exports.Message = Message;

MessageTypes = {
    [messages.register]: RegistrationMessage,
    [messages.broadcast]: BroadcastMessage,
    [messages.send]: SendToMessage,
};