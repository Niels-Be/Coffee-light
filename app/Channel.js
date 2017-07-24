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

        this.subscriptions = options.subscriptions || 0;
    }

    send(payload, options) {
        coffeLight.emit("sendToChannel", this, payload, options);
    }

    notify(user, message) {
        console.log("Channel Notify %s%s", this.name, message ? ' with custom message' : '');
        return this.send({
            notification: {
                "title": this.title,
                "body": formatMessage(message || this.message, this, user),
                "icon": this.icon,
                "click_action": coffeLight.config.externalUrl + "#" + this.name
            },
            data: {
                "name": user.name,
                "channel": "" + this.id,
                "ts": "" + Date.now()
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