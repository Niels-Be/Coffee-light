class Channel {

    constructor(id, options) {
        this.id = id;
        this.name = options.name;
        this.password = options.password || "";
        this.ttl = options.ttl || 60;
        this.type = options.type || Channel.TYPE.COFFEE;
        this.requestText = options.requestText || "I want coffee!";
        this.message = options.message || "%u wants %c";
        this.title = options.title || "Coffee!!!";
        this.icon = options.icon || "coffee.png";

        this.subscriptions = 0;
    }

    send(payload, options) {
        coffeLight.emit("sendToChannel", this, payload, options);
    }

    notify(user) {
        return this.send({
            notification: {
                "title": this.title,
                "body": formatMessage(this.message, this, user),
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