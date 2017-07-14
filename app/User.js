class User {
    constructor(id, options) {
        this.id = id;
        this.name = options.name;
        this.tokens = new Set(options.tokens || []);
        this.subscriptions = new Set(options.subscriptions || []);

        if (options.token)
            this.addToken(options.token);
    }

    addToken(token) {
        if (!this.tokens.has(token)) {
            this.tokens.add(token);
            this.subscriptions
                .map(s => coffeLight.getChannel(s))
                .forEach(c => coffeLight.emit("subscribeToChannel", this, c));
        }
    }

    revokeToken(token) {
        this.tokens.delete(token);
    }

    subscribe(channel) {
        channel.subscriptions++;
        this.subscriptions.add(channel.id);
        coffeLight.emit("subscribeToChannel", this, channel);
    }

    unsubscribe(channel) {
        channel.subscriptions--;
        this.subscriptions.delete(channel.id);
        coffeLight.emit("unsubscribeFromChannel", this, channel);
    }

    send(payload, options) {
        coffeLight.emit("sendToDevice", this, payload, options);
    }

    toJSON() {
        let res = Object.assign({}, this);
        res.tokens = [...this.tokens];
        res.subscriptions = [...this.subscriptions];
        return res;
    }
}

module.exports = User;