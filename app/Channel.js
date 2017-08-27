const uuid = require('uuid/v4');

let activeMessages = {}

class Channel {

    constructor(id, options) {
        this.id = id;
        this.name = options.name;
        this.password = options.password || "";
        this.ttl = options.ttl || 60;
        this.type = options.type || Channel.TYPE.COFFEE;
        this.requestText = options.requestText || ("I want " + options.name);
        this.message = options.message || "%u wants %c";
        this.title = options.title || options.name;
        this.icon = options.icon || (this.type + ".png");
        this.enableReplay = options.enableReplay || true;

        this.subscriptions = options.subscriptions || 0;
    }

    send(payload, options) {
        coffeLight.emit("sendToChannel", this, payload, options);
        return Promise.resolve();
    }

    notify(user, message) {
        console.log("Channel Notify %s%s", this.name, message ? ' with custom message' : '');
        let mid = uuid();
        activeMessages[mid] = true;
        setTimeout(() => delete activeMessages[mid], this.ttl * 1000);
        return this.send({
            data: {
                "type": "notify",
                "messageId": mid,
                "name": "" + user.name,
                "user_id": "" + user.id,
                "channel": "" + this.id,
                "channel_name": "" + this.name,
                "ts": "" + Date.now(),

                "notification_title": this.title,
                "notification_body": formatMessage(message || this.message, this, user),
                "notification_icon": this.icon,
                "notification_click_action": coffeLight.config.externalUrl + "#" + this.name,
                "notification_enable_replay": "" + this.enableReplay,
                "notification_ttl": "" + this.ttl
            }
        }, {
            timeToLive: this.ttl
        });
    }

    replay(user, messageId, action) {
        if (!activeMessages[messageId]) {
            return Promise.reject();
        }
        console.log("Channel Replay %s %s %s", this.name, messageId, action);
        return this.send({
            data: {
                "type": "replay",
                "messageId": messageId,
                "name": "" + user.name,
                "user_id": "" + user.id,
                "channel": "" + this.id,
                "channel_name": "" + this.name,
                "ts": "" + Date.now(),

                "action": action
            }
        }, {
            timeToLive: this.ttl
        });
    }

}

Channel.TYPE = {
    COFFEE: "coffee",
    LUNCH: "lunch",
    KICKER: "kicker"
};


function formatMessage(msg, channel, user) {
    return msg
        .replace("%u", user.name)
        .replace("%c", channel.name)
        .replace("%d", new Date().toString());
}



module.exports = Channel;